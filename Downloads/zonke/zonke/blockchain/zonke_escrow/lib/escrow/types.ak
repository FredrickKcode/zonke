//// Types for the Zonke escrow validator.
////
//// IMPORTANT: constructor ORDER defines the on-chain Data constructor index.
//// The off-chain code must use exactly these indices (see the CIP-57 blueprint).

use cardano/address.{Address}

/// Lifecycle state of one escrow. Deadlines are POSIX milliseconds.
pub type Status {
  Funded
  Accepted
  Delivered { review_deadline: Int }
  Disputed { resolve_deadline: Int }
}

/// Inline datum carried by the escrow UTxO.
///
/// There is deliberately no `amount` field: the locked value is enforced
/// directly from the script input/output values. The arbiter is NOT stored
/// here, it is a parameter of the validator.
pub type EscrowDatum {
  /// 32-byte hash of the backend payment intent (opaque to the chain).
  payment_ref: ByteArray,
  /// Client payout address. Payment credential must be a key hash.
  client: Address,
  /// Developer payout address. Payment credential must be a key hash.
  developer: Address,
  accept_deadline: Int,
  work_deadline: Int,
  /// Duration (ms) the client has to review after delivery.
  review_window: Int,
  /// Duration (ms) used for dispute timing and the resolve deadline.
  dispute_window: Int,
  status: Status,
}

/// Spending actions. Indices: Accept 0, Cancel 1, Deliver 2, Approve 3,
/// Claim 4, Refund 5, Dispute 6, Resolve 7, TimeoutFallback 8.
pub type Redeemer {
  Accept
  Cancel
  Deliver
  Approve
  Claim
  Refund
  Dispute
  Resolve { client_payout: Int, developer_payout: Int }
  TimeoutFallback
}
