//// Zonke escrow: holds a client's ADA for a developer and releases it
//// according to the on-chain state machine in lib/escrow/logic.ak.
////
//// The arbiter is a validator PARAMETER (not stored in the datum), so it is
//// fixed by the script hash / address. Rotating the arbiter creates a new
//// address; existing escrows keep the arbiter they were locked under.

use cardano/address.{Credential}
use cardano/transaction.{OutputReference, Transaction}
use escrow/logic
use escrow/types.{EscrowDatum, Redeemer}

validator zonke_escrow(arbiter: Credential) {
  spend(
    datum: Option<EscrowDatum>,
    redeemer: Redeemer,
    own_ref: OutputReference,
    self: Transaction,
  ) {
    logic.validate(arbiter, datum, redeemer, own_ref, self)
  }

  else(_) {
    fail
  }
}
