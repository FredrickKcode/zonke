//// Escrow state machine. Kept as a plain function so that tests can call it
//// directly; the validator in validators/zonke_escrow.ak only delegates here.

use aiken/collection/list
use cardano/address.{Address, Credential, VerificationKey}
use cardano/assets.{lovelace_of}
use cardano/transaction.{InlineDatum, OutputReference, Transaction, find_input}
use escrow/types.{
  Accept, Accepted, Approve, Cancel, Claim, Deliver, Delivered, Dispute,
  Disputed, EscrowDatum, Funded, Redeemer, Refund, Resolve, Status,
  TimeoutFallback,
}
use escrow/util

/// Approve is allowed from Accepted and Delivered only.
fn is_open(status: Status) -> Bool {
  when status is {
    Accepted -> True
    Delivered { .. } -> True
    _ -> False
  }
}

pub fn validate(
  arbiter: Credential,
  datum: Option<EscrowDatum>,
  redeemer: Redeemer,
  own_ref: OutputReference,
  self: Transaction,
) -> Bool {
  expect Some(datum) = datum
  expect Some(own_input) = find_input(self.inputs, own_ref)
  let locked = own_input.output
  let script = locked.address.payment_credential

  // Both party credentials must be key hashes (fail closed otherwise).
  expect VerificationKey(client_key) = datum.client.payment_credential
  expect VerificationKey(developer_key) = datum.developer.payment_credential

  let signed_by_client = list.has(self.extra_signatories, client_key)
  let signed_by_developer = list.has(self.extra_signatories, developer_key)

  // Inputs are counted by payment credential so that a different stake part
  // cannot be used to slip a second escrow into the same transaction.
  let script_inputs =
    list.count(
      self.inputs,
      fn(input) { input.output.address.payment_credential == script },
    )
  let script_outputs = util.script_outputs(self.outputs, script)
  let leaves_nothing = list.is_empty(script_outputs)

  // The whole locked value (native assets included) reaches `recipient`.
  let pays_all_to =
    fn(recipient: Address) {
      util.covers(util.paid_to(self.outputs, recipient), locked.value)
    }

  // Exactly one output back to the same address, same value, same inline
  // datum except for the intended change.
  let continues_as =
    fn(next: EscrowDatum) {
      when script_outputs is {
        [continuing] ->
          and {
            continuing.address == locked.address,
            util.same_value(continuing.value, locked.value),
            continuing.datum == InlineDatum(next),
          }
        _ -> False
      }
    }

  and {
    // Self-escrow is rejected.
    datum.client != datum.developer,
    // Exactly one input from this script.
    script_inputs == 1,
    when redeemer is {
      Accept ->
        when datum.status is {
          Funded ->
            and {
              signed_by_developer,
              util.upper_bound(self.validity_range) <= datum.accept_deadline,
              continues_as(EscrowDatum { ..datum, status: Accepted }),
            }
          _ -> False
        }

      Cancel ->
        when datum.status is {
          Funded ->
            and {
              signed_by_client,
              leaves_nothing,
              pays_all_to(datum.client),
            }
          _ -> False
        }

      Deliver ->
        when datum.status is {
          Accepted -> {
            let hi = util.upper_bound(self.validity_range)
            and {
              signed_by_developer,
              hi <= datum.work_deadline,
              continues_as(
                EscrowDatum {
                  ..datum,
                  status: Delivered { review_deadline: hi + datum.review_window },
                },
              ),
            }
          }
          _ -> False
        }

      Approve ->
        and {
          signed_by_client,
          is_open(datum.status),
          leaves_nothing,
          pays_all_to(datum.developer),
        }

      Claim ->
        when datum.status is {
          Delivered { review_deadline } ->
            and {
              signed_by_developer,
              util.lower_bound(self.validity_range) > review_deadline,
              leaves_nothing,
              pays_all_to(datum.developer),
            }
          _ -> False
        }

      Refund ->
        when datum.status is {
          Accepted ->
            and {
              signed_by_client,
              util.lower_bound(self.validity_range) > datum.work_deadline + datum.dispute_window,
              leaves_nothing,
              pays_all_to(datum.client),
            }
          _ -> False
        }

      Dispute ->
        when datum.status is {
          Accepted -> {
            let hi = util.upper_bound(self.validity_range)
            // The client may dispute at any time; the developer only inside
            // the dispute window that follows the work deadline.
            let allowed =
              signed_by_client || ( signed_by_developer && hi <= datum.work_deadline + datum.dispute_window )
            and {
              allowed,
              continues_as(
                EscrowDatum {
                  ..datum,
                  status: Disputed { resolve_deadline: hi + datum.dispute_window },
                },
              ),
            }
          }
          Delivered { review_deadline } -> {
            let hi = util.upper_bound(self.validity_range)
            and {
              signed_by_client,
              hi <= review_deadline,
              continues_as(
                EscrowDatum {
                  ..datum,
                  status: Disputed { resolve_deadline: hi + datum.dispute_window },
                },
              ),
            }
          }
          _ -> False
        }

      Resolve { client_payout, developer_payout } ->
        when datum.status is {
          Disputed { .. } -> {
            // Version 1: the arbiter must be a key hash. A script-based
            // arbiter is not supported yet and fails closed here.
            expect VerificationKey(arbiter_key) = arbiter
            and {
              list.has(self.extra_signatories, arbiter_key),
              client_payout >= 0,
              developer_payout >= 0,
              client_payout + developer_payout == lovelace_of(locked.value),
              util.only_lovelace(locked.value),
              lovelace_of(util.paid_to(self.outputs, datum.client)) >= client_payout,
              lovelace_of(util.paid_to(self.outputs, datum.developer)) >= developer_payout,
              leaves_nothing,
            }
          }
          _ -> False
        }

      TimeoutFallback ->
        when datum.status is {
          Disputed { resolve_deadline } ->
            and {
              signed_by_client || signed_by_developer,
              util.lower_bound(self.validity_range) > resolve_deadline,
              leaves_nothing,
              pays_all_to(datum.client),
            }
          _ -> False
        }
    },
  }
}
