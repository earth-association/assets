export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    create_pair: IDL.Func(
      [IDL.Principal, IDL.Principal],
      [IDL.Opt(IDL.Principal)],
      []
    ),
    get_all: IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    get_checksum: IDL.Func([], [IDL.Text], ['query']),
    get_cycles: IDL.Func([IDL.Opt(IDL.Principal)], [IDL.Opt(IDL.Nat)], []),
    get_fee_to: IDL.Func([], [IDL.Principal], ['query']),
    get_fee_to_setter: IDL.Func([], [IDL.Principal], ['query']),
    get_pair: IDL.Func(
      [IDL.Principal, IDL.Principal],
      [IDL.Opt(IDL.Principal)],
      ['query']
    ),
    length: IDL.Func([], [IDL.Nat64], ['query']),
    set_admin: IDL.Func([IDL.Principal], [], []),
    set_fee_to: IDL.Func([IDL.Principal], [], []),
    set_fee_to_setter: IDL.Func([IDL.Principal], [], []),
    top_up: IDL.Func([], [IDL.Nat64], []),
    upgrade: IDL.Func([], [IDL.Vec(IDL.Principal)], []),
    version: IDL.Func([], [IDL.Text], ['query']),
  });
};
export const init = () => {
  return [];
};
