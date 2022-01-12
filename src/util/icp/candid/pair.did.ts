export const idlFactory = ({ IDL }) => {
  const CumulativePrice = IDL.Record({
    timestamp: IDL.Nat32,
    price0: IDL.Nat,
    price1: IDL.Nat,
  });
  const Reserves = IDL.Record({
    block_timestamp_last: IDL.Nat32,
    reserve0: IDL.Nat,
    reserve1: IDL.Nat,
  });
  const RollingTotal = IDL.Record({
    token0_volume: IDL.Nat,
    transaction_fees: IDL.Nat,
    token1_volume: IDL.Nat,
  });
  const PairStats = IDL.Record({
    token1_reserve: IDL.Nat,
    token0_price: IDL.Float64,
    average_apy: IDL.Float64,
    token0_reserve: IDL.Nat,
    token1_price: IDL.Float64,
    token0: IDL.Principal,
    token1: IDL.Principal,
    protocol_fee_enabled: IDL.Bool,
    total_supply: IDL.Nat,
    rolling_total: RollingTotal,
  });
  const TransactionNotification = IDL.Record({
    token_id: IDL.Principal,
    from: IDL.Principal,
    amount: IDL.Nat,
  });
  return IDL.Service({
    burn: IDL.Func([], [IDL.Tuple(IDL.Nat, IDL.Nat)], []),
    get_cumulative_price: IDL.Func([], [CumulativePrice], ['query']),
    get_current_price: IDL.Func([], [IDL.Float64, IDL.Float64], ['query']),
    get_reserves: IDL.Func([], [Reserves], ['query']),
    get_supply: IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
    get_token0: IDL.Func([], [IDL.Principal], ['query']),
    get_token1: IDL.Func([], [IDL.Principal], ['query']),
    get_total_supply: IDL.Func([], [IDL.Nat], ['query']),
    get_transit: IDL.Func([], [IDL.Tuple(IDL.Nat, IDL.Nat)], ['query']),
    mint: IDL.Func([], [], []),
    refund_transfer: IDL.Func([], [IDL.Tuple(IDL.Nat, IDL.Nat)], []),
    set_fee_to: IDL.Func([IDL.Principal], [], []),
    skim: IDL.Func([IDL.Principal], [], []),
    stats: IDL.Func([], [PairStats], ['query']),
    swap: IDL.Func([], [IDL.Tuple(IDL.Nat, IDL.Nat)], []),
    sync: IDL.Func([], [], []),
    top_up: IDL.Func([], [IDL.Nat64], []),
    transaction_notification: IDL.Func([TransactionNotification], [], []),
    transfer_from: IDL.Func([IDL.Principal, IDL.Principal, IDL.Nat], [], []),
  });
};
export const init = ({ IDL }) => {
  return [IDL.Principal, IDL.Principal];
};
