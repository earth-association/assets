export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ Ok: IDL.Null, Err: IDL.Text });
  return IDL.Service({
    create_pair: IDL.Func(
      [IDL.Principal, IDL.Principal],
      [IDL.Opt(IDL.Principal)],
      []
    ),
    get_all: IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    get_checksum: IDL.Func([], [IDL.Text], ['query']),
    get_controller: IDL.Func([], [IDL.Principal], ['query']),
    get_cycles: IDL.Func([IDL.Opt(IDL.Principal)], [IDL.Opt(IDL.Nat)], []),
    get_default_cap: IDL.Func([], [IDL.Opt(IDL.Nat)], ['query']),
    get_fee_to: IDL.Func([], [IDL.Principal], ['query']),
    get_pair: IDL.Func(
      [IDL.Principal, IDL.Principal],
      [IDL.Opt(IDL.Principal)],
      ['query']
    ),
    length: IDL.Func([], [IDL.Nat64], ['query']),
    set_cap: IDL.Func(
      [IDL.Principal, IDL.Principal, IDL.Opt(IDL.Nat)],
      [Result],
      []
    ),
    set_controller: IDL.Func([IDL.Principal], [], []),
    set_default_cap: IDL.Func([IDL.Opt(IDL.Nat)], [], []),
    set_fee_to: IDL.Func([IDL.Principal], [], []),
    top_up: IDL.Func([], [IDL.Nat64], []),
    upgrade: IDL.Func([], [IDL.Vec(IDL.Principal)], []),
    version: IDL.Func([], [IDL.Text], ['query']),
  });
};
export const init = ({ IDL }) => {
  return [IDL.Principal];
};
