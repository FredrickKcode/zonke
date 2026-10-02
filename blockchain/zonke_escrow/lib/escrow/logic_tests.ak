//// Tests for the escrow state machine (lib/escrow/logic.ak).

////
//// Positive tests evaluate to True. Negative tests are marked `fail`.
////
//// The two `canary_*` tests at the bottom document the assumption that a
//// `fail` test passes both when the body evaluates to False and when it
//// errors. If a canary fails on your Aiken version, the negative tests
//// need adjusting (e.g. `!check(...)`), not the validator.
////
//// Timeline used by every fixture (POSIX ms):
////   accept_deadline 1_000 | work_deadline 2_000 | dispute_window 300
////   -> developer dispute allowed while hi <= 2_300, client refund when lo > 2_300
//// review_window 500 | Delivered review_deadline 3_000
//// Disputed resolve_deadline 4_000
////
//// The minimum-ADA requirement is enforced by the ledger, not by the
//// validator, so it is (deliberately) not unit-tested here.

use aiken/interval.{Interval, after, before, between}

use cardano/address.{Address, Inline, Script, VerificationKey}

use cardano/assets.{Value, add, from_lovelace}

use cardano/transaction.{
  InlineDatum, Input, NoDatum, Output, OutputReference, Transaction, placeholder,
}

use escrow/logic

use escrow/types.{
  Accept, Accepted, Approve, Cancel, Claim, Deliver, Delivered, Dispute,
  Disputed, EscrowDatum, Funded, Redeemer, Refund, Resolve, Status,
  TimeoutFallback,
}

// ---------------------------------------------------------------- fixtures

const client_key =
  #"c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1"

const developer_key =
  #"d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2"

const arbiter_key =
  #"a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3"

const stranger_key =
  #"e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4"

const script_hash =
  #"5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c"

const tx_id =
  #"0000000000000000000000000000000000000000000000000000000000000000"

const payment_ref =
  #"abababababababababababababababababababababababababababababababab"

const policy =
  #"70707070707070707070707070707070707070707070707070707070"

const token =
  #"746f6b656e"

const total = 10_000_000

fn client_addr() -> Address {
  Address {
    payment_credential: VerificationKey(client_key),
    stake_credential: None,
  }
}

fn developer_addr() -> Address {
  Address {
    payment_credential: VerificationKey(developer_key),
    stake_credential: None,
  }
}

fn stranger_addr() -> Address {
  Address {
    payment_credential: VerificationKey(stranger_key),
    stake_credential: None,
  }
}

fn script_addr() -> Address {
  Address {
    payment_credential: Script(script_hash),
    stake_credential: None,
  }
}

/// Same script hash, different stake part: a different ADDRESS, same script.

fn script_addr_other_stake() -> Address {
  Address {
    payment_credential: Script(script_hash),
    stake_credential: Some(Inline(VerificationKey(stranger_key))),
  }
}

fn own_ref() -> OutputReference {
  OutputReference {
    transaction_id: tx_id,
    output_index: 0,
  }
}

fn datum_with(status: Status) -> EscrowDatum {
  EscrowDatum {
    payment_ref: payment_ref,
    client: client_addr(),
    developer: developer_addr(),
    accept_deadline: 1_000,
    work_deadline: 2_000,
    review_window: 500,
    dispute_window: 300,
    status: status,
  }
}

fn funded() -> EscrowDatum {
  datum_with(Funded)
}

fn accepted() -> EscrowDatum {
  datum_with(Accepted)
}

fn delivered_at(review_deadline: Int) -> EscrowDatum {
  datum_with(Delivered { review_deadline: review_deadline })
}

fn delivered() -> EscrowDatum {
  delivered_at(3_000)
}

fn disputed_at(resolve_deadline: Int) -> EscrowDatum {
  datum_with(Disputed { resolve_deadline: resolve_deadline })
}

fn disputed() -> EscrowDatum {
  disputed_at(4_000)
}

fn ada(lovelace: Int) -> Value {
  from_lovelace(lovelace)
}

fn with_token(value: Value) -> Value {
  add(value, policy, token, 5)
}

fn locked_input_at(
  address: Address,
  datum: EscrowDatum,
  value: Value,
  index: Int,
) -> Input {
  Input {
    output_reference: OutputReference {
      transaction_id: tx_id,
      output_index: index,
    },
    output: Output {
      address: address,
      value: value,
      datum: InlineDatum(datum),
      reference_script: None,
    },
  }
}

fn locked_input(datum: EscrowDatum, value: Value, index: Int) -> Input {
  locked_input_at(script_addr(), datum, value, index)
}

fn script_output(datum: EscrowDatum, value: Value) -> Output {
  Output {
    address: script_addr(),
    value: value,
    datum: InlineDatum(datum),
    reference_script: None,
  }
}

fn plain(address: Address, value: Value) -> Output {
  Output {
    address: address,
    value: value,
    datum: NoDatum,
    reference_script: None,
  }
}

fn build(
  inputs: List<Input>,
  outputs: List<Output>,
  signers: List<ByteArray>,
  range: Interval,
) -> Transaction {
  Transaction {
    ..placeholder,
    inputs: inputs,
    outputs: outputs,
    extra_signatories: signers,
    validity_range: range,
  }
}

fn check(datum: EscrowDatum, redeemer: Redeemer, tx: Transaction) -> Bool {
  logic.validate(
    VerificationKey(arbiter_key),
    Some(datum),
    redeemer,
    own_ref(),
    tx,
  )
}

/// One escrow input, one continuing output holding the full value.

fn continuing(
  datum: EscrowDatum,
  redeemer: Redeemer,
  next: EscrowDatum,
  signers: List<ByteArray>,
  range: Interval,
) -> Bool {
  check(
    datum,
    redeemer,
    build(
      [locked_input(datum, ada(total), 0)],
      [script_output(next, ada(total))],
      signers,
      range,
    ),
  )
}

/// One escrow input, the full value paid to `recipient`, nothing left behind.

fn terminal_to(
  datum: EscrowDatum,
  redeemer: Redeemer,
  recipient: Address,
  signers: List<ByteArray>,
  range: Interval,
) -> Bool {
  check(
    datum,
    redeemer,
    build(
      [locked_input(datum, ada(total), 0)],
      [plain(recipient, ada(total))],
      signers,
      range,
    ),
  )
}

/// Resolve on the standard Disputed escrow with arbitrary payouts/outputs.

fn resolve_with(
  client_payout: Int,
  developer_payout: Int,
  outputs: List<Output>,
  signers: List<ByteArray>,
) -> Bool {
  check(
    disputed(),
    Resolve {
      client_payout: client_payout,
      developer_payout: developer_payout,
    },
    build(
      [locked_input(disputed(), ada(total), 0)],
      outputs,
      signers,
      after(0),
    ),
  )
}

// ------------------------------------------------ positive: every transition

test accept_by_developer() {
  continuing(
    funded(),
    Accept,
    accepted(),
    [developer_key],
    between(0, 1_000),
  )
}

test cancel_by_client_while_funded() {
  terminal_to(
    funded(),
    Cancel,
    client_addr(),
    [client_key],
    after(0),
  )
}

test deliver_sets_review_deadline() {
  // hi = 2_000 -> review_deadline = 2_000 + 500
  continuing(
    accepted(),
    Deliver,
    delivered_at(2_500),
    [developer_key],
    between(0, 2_000),
  )
}

test approve_from_accepted() {
  terminal_to(
    accepted(),
    Approve,
    developer_addr(),
    [client_key],
    after(0),
  )
}

test approve_from_delivered() {
  terminal_to(
    delivered(),
    Approve,
    developer_addr(),
    [client_key],
    after(0),
  )
}

test claim_after_review_deadline() {
  terminal_to(
    delivered(),
    Claim,
    developer_addr(),
    [developer_key],
    after(3_001),
  )
}

test refund_after_work_deadline_plus_window() {
  terminal_to(
    accepted(),
    Refund,
    client_addr(),
    [client_key],
    after(2_301),
  )
}

test client_dispute_from_accepted_has_no_time_limit() {
  // hi = 5_000 is well past work_deadline + dispute_window.
  continuing(
    accepted(),
    Dispute,
    disputed_at(5_300),
    [client_key],
    between(0, 5_000),
  )
}

test developer_dispute_from_accepted_inside_window() {
  // hi = 2_300 = work_deadline + dispute_window (allowed, upper bound is <=).
  continuing(
    accepted(),
    Dispute,
    disputed_at(2_600),
    [developer_key],
    between(0, 2_300),
  )
}

test client_dispute_from_delivered_up_to_review_deadline() {
  continuing(
    delivered(),
    Dispute,
    disputed_at(3_300),
    [client_key],
    between(0, 3_000),
  )
}

test resolve_split_between_client_and_developer() {
  resolve_with(
    4_000_000,
    6_000_000,
    [
      plain(client_addr(), ada(4_000_000)),
      plain(developer_addr(), ada(6_000_000)),
    ],
    [arbiter_key],
  )
}

test resolve_zero_developer_payout_has_no_developer_output() {
  // 100% to the client, 0% to the developer, no output for the developer.
  resolve_with(
    total,
    0,
    [plain(client_addr(), ada(total))],
    [arbiter_key],
  )
}

test resolve_zero_client_payout_has_no_client_output() {
  // 0% to the client, 100% to the developer, no output for the client.
  resolve_with(
    0,
    total,
    [plain(developer_addr(), ada(total))],
    [arbiter_key],
  )
}

test timeout_fallback_refunds_client_when_signed_by_client() {
  terminal_to(
    disputed(),
    TimeoutFallback,
    client_addr(),
    [client_key],
    after(4_001),
  )
}

test timeout_fallback_refunds_client_when_signed_by_developer() {
  terminal_to(
    disputed(),
    TimeoutFallback,
    client_addr(),
    [developer_key],
    after(4_001),
  )
}

// -------------------------------------- positive: native assets are returned

test approve_returns_native_assets_to_developer() {
  let datum = accepted()

  check(
    datum,
    Approve,
    build(
      [locked_input(datum, with_token(ada(total)), 0)],
      [plain(developer_addr(), with_token(ada(total)))],
      [client_key],
      after(0),
    ),
  )
}

test cancel_returns_native_assets_to_client() {
  let datum = funded()

  check(
    datum,
    Cancel,
    build(
      [locked_input(datum, with_token(ada(total)), 0)],
      [plain(client_addr(), with_token(ada(total)))],
      [client_key],
      after(0),
    ),
  )
}

test timeout_fallback_returns_native_assets_to_client() {
  let datum = disputed()

  check(
    datum,
    TimeoutFallback,
    build(
      [locked_input(datum, with_token(ada(total)), 0)],
      [plain(client_addr(), with_token(ada(total)))],
      [client_key],
      after(4_001),
    ),
  )
}

test continuing_transition_preserves_native_assets() {
  let datum = funded()

  check(
    datum,
    Accept,
    build(
      [locked_input(datum, with_token(ada(total)), 0)],
      [script_output(accepted(), with_token(ada(total)))],
      [developer_key],
      between(0, 1_000),
    ),
  )
}

test cancel_still_possible_with_unsupported_arbiter_parameter() {
  // The arbiter is only consulted by Resolve, so a bad parameter can never
  // trap a client's funds on the other paths.
  let datum = funded()

  logic.validate(
    Script(script_hash),
    Some(datum),
    Cancel,
    own_ref(),
    build(
      [locked_input(datum, ada(total), 0)],
      [plain(client_addr(), ada(total))],
      [client_key],
      after(0),
    ),
  )
}

// ------------------------------------------------ negative 1: wrong signer

test accept_signed_by_client_rejected() fail {
  continuing(
    funded(),
    Accept,
    accepted(),
    [client_key],
    between(0, 1_000),
  )
}

test accept_signed_by_stranger_rejected() fail {
  continuing(
    funded(),
    Accept,
    accepted(),
    [stranger_key],
    between(0, 1_000),
  )
}

test cancel_signed_by_developer_rejected() fail {
  terminal_to(
    funded(),
    Cancel,
    client_addr(),
    [developer_key],
    after(0),
  )
}

test deliver_signed_by_client_rejected() fail {
  continuing(
    accepted(),
    Deliver,
    delivered_at(2_500),
    [client_key],
    between(0, 2_000),
  )
}

test approve_signed_by_developer_rejected() fail {
  terminal_to(
    accepted(),
    Approve,
    developer_addr(),
    [developer_key],
    after(0),
  )
}

test claim_signed_by_client_rejected() fail {
  terminal_to(
    delivered(),
    Claim,
    developer_addr(),
    [client_key],
    after(3_001),
  )
}

test refund_signed_by_developer_rejected() fail {
  terminal_to(
    accepted(),
    Refund,
    client_addr(),
    [developer_key],
    after(2_301),
  )
}

test dispute_signed_by_stranger_rejected() fail {
  continuing(
    accepted(),
    Dispute,
    disputed_at(2_600),
    [stranger_key],
    between(0, 2_300),
  )
}

test timeout_fallback_signed_by_stranger_rejected() fail {
  terminal_to(
    disputed(),
    TimeoutFallback,
    client_addr(),
    [stranger_key],
    after(4_001),
  )
}

// ---------------------------------------------- negative 2: wrong status

test accept_from_accepted_rejected() fail {
  continuing(
    accepted(),
    Accept,
    accepted(),
    [developer_key],
    between(0, 1_000),
  )
}

test deliver_from_funded_rejected() fail {
  continuing(
    funded(),
    Deliver,
    delivered_at(2_500),
    [developer_key],
    between(0, 2_000),
  )
}

test approve_from_funded_rejected() fail {
  terminal_to(
    funded(),
    Approve,
    developer_addr(),
    [client_key],
    after(0),
  )
}

test approve_from_disputed_rejected() fail {
  terminal_to(
    disputed(),
    Approve,
    developer_addr(),
    [client_key],
    after(0),
  )
}

test cancel_from_accepted_rejected() fail {
  terminal_to(
    accepted(),
    Cancel,
    client_addr(),
    [client_key],
    after(0),
  )
}

test claim_from_accepted_rejected() fail {
  terminal_to(
    accepted(),
    Claim,
    developer_addr(),
    [developer_key],
    after(3_001),
  )
}

test refund_from_delivered_rejected() fail {
  terminal_to(
    delivered(),
    Refund,
    client_addr(),
    [client_key],
    after(2_301),
  )
}

test developer_dispute_from_delivered_rejected() fail {
  continuing(
    delivered(),
    Dispute,
    disputed_at(2_800),
    [developer_key],
    between(0, 2_500),
  )
}

test dispute_from_funded_rejected() fail {
  continuing(
    funded(),
    Dispute,
    disputed_at(600),
    [client_key],
    between(0, 300),
  )
}

test resolve_from_delivered_rejected() fail {
  check(
    delivered(),
    Resolve {
      client_payout: total,
      developer_payout: 0,
    },
    build(
      [locked_input(delivered(), ada(total), 0)],
      [plain(client_addr(), ada(total))],
      [arbiter_key],
      after(0),
    ),
  )
}

test timeout_fallback_from_delivered_rejected() fail {
  terminal_to(
    delivered(),
    TimeoutFallback,
    client_addr(),
    [client_key],
    after(4_001),
  )
}

// ------------------------------------------ negative 3 and 14-16, 20: time

test accept_after_accept_deadline_rejected() fail {
  continuing(
    funded(),
    Accept,
    accepted(),
    [developer_key],
    between(0, 1_001),
  )
}

test deliver_after_work_deadline_rejected() fail {
  continuing(
    accepted(),
    Deliver,
    delivered_at(2_501),
    [developer_key],
    between(0, 2_001),
  )
}

test claim_at_review_deadline_rejected() fail {
  terminal_to(
    delivered(),
    Claim,
    developer_addr(),
    [developer_key],
    after(3_000),
  )
}

test claim_before_review_deadline_rejected() fail {
  terminal_to(
    delivered(),
    Claim,
    developer_addr(),
    [developer_key],
    after(2_999),
  )
}

test refund_at_end_of_dispute_window_rejected() fail {
  terminal_to(
    accepted(),
    Refund,
    client_addr(),
    [client_key],
    after(2_300),
  )
}

test refund_before_work_deadline_rejected() fail {
  terminal_to(
    accepted(),
    Refund,
    client_addr(),
    [client_key],
    after(1_500),
  )
}

test developer_dispute_after_window_rejected() fail {
  continuing(
    accepted(),
    Dispute,
    disputed_at(2_601),
    [developer_key],
    between(0, 2_301),
  )
}

test client_dispute_after_review_deadline_rejected() fail {
  continuing(
    delivered(),
    Dispute,
    disputed_at(3_301),
    [client_key],
    between(0, 3_001),
  )
}

test timeout_fallback_at_resolve_deadline_rejected() fail {
  terminal_to(
    disputed(),
    TimeoutFallback,
    client_addr(),
    [client_key],
    after(4_000),
  )
}

test timeout_fallback_before_resolve_deadline_rejected() fail {
  terminal_to(
    disputed(),
    TimeoutFallback,
    client_addr(),
    [client_key],
    after(3_500),
  )
}

test accept_with_unbounded_upper_time_rejected() fail {
  continuing(
    funded(),
    Accept,
    accepted(),
    [developer_key],
    after(0),
  )
}

test refund_with_unbounded_lower_time_rejected() fail {
  terminal_to(
    accepted(),
    Refund,
    client_addr(),
    [client_key],
    before(9_999),
  )
}

// ------------------------- negatives 4-8: altered fields of the continuing datum

test altered_payment_ref_rejected() fail {
  continuing(
    funded(),
    Accept,
    EscrowDatum {
      ..accepted(),
      payment_ref: #"ff",
    },
    [developer_key],
    between(0, 1_000),
  )
}

test altered_client_address_rejected() fail {
  continuing(
    funded(),
    Accept,
    EscrowDatum {
      ..accepted(),
      client: stranger_addr(),
    },
    [developer_key],
    between(0, 1_000),
  )
}

test altered_developer_address_rejected() fail {
  continuing(
    funded(),
    Accept,
    EscrowDatum {
      ..accepted(),
      developer: stranger_addr(),
    },
    [developer_key],
    between(0, 1_000),
  )
}

test altered_work_deadline_rejected() fail {
  continuing(
    funded(),
    Accept,
    EscrowDatum {
      ..accepted(),
      work_deadline: 9_999,
    },
    [developer_key],
    between(0, 1_000),
  )
}

test altered_accept_deadline_rejected() fail {
  continuing(
    funded(),
    Accept,
    EscrowDatum {
      ..accepted(),
      accept_deadline: 9_999,
    },
    [developer_key],
    between(0, 1_000),
  )
}

test altered_review_window_rejected() fail {
  continuing(
    funded(),
    Accept,
    EscrowDatum {
      ..accepted(),
      review_window: 0,
    },
    [developer_key],
    between(0, 1_000),
  )
}

test altered_dispute_window_rejected() fail {
  continuing(
    accepted(),
    Deliver,
    EscrowDatum {
      ..delivered_at(2_500),
      dispute_window: 0,
    },
    [developer_key],
    between(0, 2_000),
  )
}

test accept_producing_wrong_status_rejected() fail {
  continuing(
    funded(),
    Accept,
    delivered_at(2_500),
    [developer_key],
    between(0, 1_000),
  )
}

test deliver_with_wrong_review_deadline_rejected() fail {
  continuing(
    accepted(),
    Deliver,
    delivered_at(2_501),
    [developer_key],
    between(0, 2_000),
  )
}

test dispute_with_wrong_resolve_deadline_rejected() fail {
  continuing(
    accepted(),
    Dispute,
    disputed_at(2_601),
    [developer_key],
    between(0, 2_300),
  )
}

// ------------------------------- negatives 9-10: continuing value and outputs

test reduced_continuing_value_rejected() fail {
  let datum = funded()

  check(
    datum,
    Accept,
    build(
      [locked_input(datum, ada(total), 0)],
      [script_output(accepted(), ada(total - 1))],
      [developer_key],
      between(0, 1_000),
    ),
  )
}

test extra_value_sent_elsewhere_from_continuing_transition_rejected() fail {
  let datum = funded()

  check(
    datum,
    Accept,
    build(
      [locked_input(datum, ada(total), 0)],
      [
        script_output(accepted(), ada(total - 2_000_000)),
        plain(stranger_addr(), ada(2_000_000)),
      ],
      [developer_key],
      between(0, 1_000),
    ),
  )
}

test continuing_transition_dropping_native_assets_rejected() fail {
  let datum = funded()

  check(
    datum,
    Accept,
    build(
      [locked_input(datum, with_token(ada(total)), 0)],
      [script_output(accepted(), ada(total))],
      [developer_key],
      between(0, 1_000),
    ),
  )
}

test no_continuing_output_rejected() fail {
  terminal_to(
    funded(),
    Accept,
    developer_addr(),
    [developer_key],
    between(0, 1_000),
  )
}

test two_continuing_outputs_rejected() fail {
  let datum = funded()

  check(
    datum,
    Accept,
    build(
      [locked_input(datum, ada(total), 0)],
      [
        script_output(accepted(), ada(total / 2)),
        script_output(accepted(), ada(total / 2)),
      ],
      [developer_key],
      between(0, 1_000),
    ),
  )
}

test continuing_output_at_other_stake_address_rejected() fail {
  let datum = funded()

  check(
    datum,
    Accept,
    build(
      [locked_input(datum, ada(total), 0)],
      [
        Output {
          address: script_addr_other_stake(),
          value: ada(total),
          datum: InlineDatum(accepted()),
          reference_script: None,
        },
      ],
      [developer_key],
      between(0, 1_000),
    ),
  )
}

test continuing_output_without_inline_datum_rejected() fail {
  let datum = funded()

  check(
    datum,
    Accept,
    build(
      [locked_input(datum, ada(total), 0)],
      [
        Output {
          address: script_addr(),
          value: ada(total),
          datum: NoDatum,
          reference_script: None,
        },
      ],
      [developer_key],
      between(0, 1_000),
    ),
  )
}

// ----------------- negatives 10-11: terminal payouts (value / address checks)

test approve_payout_to_wrong_address_rejected() fail {
  terminal_to(
    accepted(),
    Approve,
    stranger_addr(),
    [client_key],
    after(0),
  )
}

test refund_payout_to_developer_instead_of_client_rejected() fail {
  terminal_to(
    accepted(),
    Refund,
    developer_addr(),
    [client_key],
    after(2_301),
  )
}

test approve_partial_payout_with_remainder_elsewhere_rejected() fail {
  let datum = accepted()

  check(
    datum,
    Approve,
    build(
      [locked_input(datum, ada(total), 0)],
      [
        plain(developer_addr(), ada(total - 1_000_000)),
        plain(stranger_addr(), ada(1_000_000)),
      ],
      [client_key],
      after(0),
    ),
  )
}

test approve_dropping_native_assets_rejected() fail {
  let datum = accepted()

  check(
    datum,
    Approve,
    build(
      [locked_input(datum, with_token(ada(total)), 0)],
      [plain(developer_addr(), ada(total))],
      [client_key],
      after(0),
    ),
  )
}

test refund_dropping_native_assets_rejected() fail {
  let datum = accepted()

  check(
    datum,
    Refund,
    build(
      [locked_input(datum, with_token(ada(total)), 0)],
      [plain(client_addr(), ada(total))],
      [client_key],
      after(2_301),
    ),
  )
}

// ------------- negatives 12-13: several script inputs, second release attempt

test approve_with_two_script_inputs_rejected() fail {
  let datum = accepted()

  check(
    datum,
    Approve,
    build(
      [
        locked_input(datum, ada(total), 0),
        locked_input(datum, ada(total), 1),
      ],
      [plain(developer_addr(), ada(total * 2))],
      [client_key],
      after(0),
    ),
  )
}

test second_script_input_with_other_stake_part_rejected() fail {
  let datum = accepted()

  check(
    datum,
    Approve,
    build(
      [
        locked_input(datum, ada(total), 0),
        locked_input_at(
          script_addr_other_stake(),
          datum,
          ada(total),
          1,
        ),
      ],
      [plain(developer_addr(), ada(total * 2))],
      [client_key],
      after(0),
    ),
  )
}

test approve_leaving_escrow_output_behind_rejected() fail {
  // A released escrow must not leave a live script output that could be
  // released a second time.
  let datum = accepted()

  check(
    datum,
    Approve,
    build(
      [locked_input(datum, ada(total), 0)],
      [
        plain(developer_addr(), ada(total)),
        script_output(datum, ada(2_000_000)),
      ],
      [client_key],
      after(0),
    ),
  )
}

test claim_leaving_escrow_output_behind_rejected() fail {
  let datum = delivered()

  check(
    datum,
    Claim,
    build(
      [locked_input(datum, ada(total), 0)],
      [
        plain(developer_addr(), ada(total)),
        script_output(datum, ada(2_000_000)),
      ],
      [developer_key],
      after(3_001),
    ),
  )
}

test escrow_input_not_present_rejected() fail {
  // The referenced escrow input is absent from the transaction.
  check(
    accepted(),
    Approve,
    build(
      [locked_input(accepted(), ada(total), 5)],
      [plain(developer_addr(), ada(total))],
      [client_key],
      after(0),
    ),
  )
}

test missing_datum_rejected() fail {
  logic.validate(
    VerificationKey(arbiter_key),
    None,
    Approve,
    own_ref(),
    build(
      [locked_input(accepted(), ada(total), 0)],
      [plain(developer_addr(), ada(total))],
      [client_key],
      after(0),
    ),
  )
}

// ------------------------------------------------------- negatives: resolve

test resolve_signed_by_client_instead_of_arbiter_rejected() fail {
  resolve_with(
    4_000_000,
    6_000_000,
    [
      plain(client_addr(), ada(4_000_000)),
      plain(developer_addr(), ada(6_000_000)),
    ],
    [client_key],
  )
}

test resolve_signed_by_stranger_rejected() fail {
  resolve_with(
    4_000_000,
    6_000_000,
    [
      plain(client_addr(), ada(4_000_000)),
      plain(developer_addr(), ada(6_000_000)),
    ],
    [stranger_key],
  )
}

test resolve_with_script_arbiter_fails_closed() fail {
  logic.validate(
    Script(script_hash),
    Some(disputed()),
    Resolve {
      client_payout: total,
      developer_payout: 0,
    },
    own_ref(),
    build(
      [locked_input(disputed(), ada(total), 0)],
      [plain(client_addr(), ada(total))],
      [arbiter_key],
      after(0),
    ),
  )
}

test resolve_payouts_below_locked_value_rejected() fail {
  resolve_with(
    4_000_000,
    5_000_000,
    [
      plain(client_addr(), ada(4_000_000)),
      plain(developer_addr(), ada(5_000_000)),
    ],
    [arbiter_key],
  )
}

test resolve_payouts_above_locked_value_rejected() fail {
  resolve_with(
    5_000_000,
    6_000_000,
    [
      plain(client_addr(), ada(5_000_000)),
      plain(developer_addr(), ada(6_000_000)),
    ],
    [arbiter_key],
  )
}

test resolve_negative_payout_rejected() fail {
  resolve_with(
    -1_000_000,
    total + 1_000_000,
    [plain(developer_addr(), ada(total + 1_000_000))],
    [arbiter_key],
  )
}

test resolve_payout_not_actually_sent_rejected() fail {
  // Redeemer claims 6 ADA for the developer but only 5 ADA is sent.
  resolve_with(
    4_000_000,
    6_000_000,
    [
      plain(client_addr(), ada(4_000_000)),
      plain(developer_addr(), ada(5_000_000)),
    ],
    [arbiter_key],
  )
}

test resolve_payout_to_wrong_address_rejected() fail {
  resolve_with(
    4_000_000,
    6_000_000,
    [
      plain(client_addr(), ada(4_000_000)),
      plain(stranger_addr(), ada(6_000_000)),
    ],
    [arbiter_key],
  )
}

test resolve_client_share_to_wrong_address_rejected() fail {
  resolve_with(
    total,
    0,
    [plain(stranger_addr(), ada(total))],
    [arbiter_key],
  )
}

test resolve_with_native_assets_rejected() fail {
  check(
    disputed(),
    Resolve {
      client_payout: 4_000_000,
      developer_payout: 6_000_000,
    },
    build(
      [locked_input(disputed(), with_token(ada(total)), 0)],
      [
        plain(client_addr(), with_token(ada(4_000_000))),
        plain(developer_addr(), ada(6_000_000)),
      ],
      [arbiter_key],
      after(0),
    ),
  )
}

test resolve_leaving_escrow_output_behind_rejected() fail {
  resolve_with(
    4_000_000,
    6_000_000,
    [
      plain(client_addr(), ada(4_000_000)),
      plain(developer_addr(), ada(6_000_000)),
      script_output(disputed(), ada(2_000_000)),
    ],
    [arbiter_key],
  )
}

// ------------------------------------------- negatives: party credential checks

test self_escrow_rejected() fail {
  let datum = EscrowDatum {
    ..funded(),
    developer: client_addr(),
  }

  terminal_to(
    datum,
    Cancel,
    client_addr(),
    [client_key],
    after(0),
  )
}

test client_with_script_credential_rejected() fail {
  let datum = EscrowDatum {
    ..funded(),
    client: script_addr(),
  }

  terminal_to(
    datum,
    Cancel,
    script_addr(),
    [client_key],
    after(0),
  )
}

test developer_with_script_credential_rejected() fail {
  let datum = EscrowDatum {
    ..accepted(),
    developer: script_addr(),
  }

  terminal_to(
    datum,
    Approve,
    script_addr(),
    [client_key],
    after(0),
  )
}

// --------------------------------------------------------------- canaries

fn none_int() -> Option<Int> {
  None
}

test canary_fail_test_passes_when_body_is_false() fail {
  none_int() == Some(1)
}

test canary_fail_test_passes_when_body_errors() fail {
  expect Some(_) = none_int()
  True
}