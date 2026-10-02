
//// Helpers for the escrow validator: validity-range bounds and value maths.

use aiken/collection/list
use aiken/interval.{Finite, Interval}
use cardano/address.{Address, Credential}
use cardano/assets.{
  Value, flatten, is_zero, merge, negate, quantity_of, without_lovelace, zero,
}
use cardano/transaction.{Output}

/// Lower bound of the validity range. Fails (fail closed) unless it is finite.
pub fn lower_bound(range: Interval) -> Int {
  expect Finite(time) = range.lower_bound.bound_type
  time
}

/// Upper bound of the validity range. Fails (fail closed) unless it is finite.
pub fn upper_bound(range: Interval) -> Int {
  expect Finite(time) = range.upper_bound.bound_type
  time
}

/// All outputs locked by the given script credential (any stake part).
pub fn script_outputs(
  outputs: List<Output>,
  script: Credential,
) -> List<Output> {
  list.filter(
    outputs,
    fn(output) { output.address.payment_credential == script },
  )
}

/// Sum of the values of all outputs sent to exactly this address.
pub fn paid_to(outputs: List<Output>, address: Address) -> Value {
  list.foldl(
    outputs,
    zero,
    fn(output, total) {
      if output.address == address {
        merge(total, output.value)
      } else {
        total
      }
    },
  )
}

/// True when `paid` holds at least every asset quantity
/// that `required` holds.
pub fn covers(paid: Value, required: Value) -> Bool {
  list.all(
    flatten(required),
    fn(asset) {
      let (policy, name, quantity) = asset
      quantity_of(paid, policy, name) >= quantity
    },
  )
}

/// Exact value equality, independent of internal ordering.
pub fn same_value(left: Value, right: Value) -> Bool {
  is_zero(merge(left, negate(right)))
}

/// True when the value holds nothing but lovelace.
pub fn only_lovelace(value: Value) -> Bool {
  is_zero(without_lovelace(value))
}

