/* eslint-disable @typescript-eslint/no-explicit-any */
import { Actor, HttpAgent } from '@dfinity/agent';
import { sha224 } from '@dfinity/rosetta-client/lib/hash';
import fetch from 'cross-fetch';

export { address_to_hex } from '@dfinity/rosetta-client';
import { Principal } from '@dfinity/principal';
import {
  ICP_HOST,
  DIDJS_ID,
  IC_ROCKS_HOST,
  ICP_TESTNET_HOST,
} from './constants';
import { default as IDL_EXT } from './candid/ext.did';
import { default as DIDJS } from './candid/didjs.did';
import { idlFactory as TOKEN_FACTORY } from './candid/token_factory.did';
import { idlFactory as TOKEN } from './candid/token.did';
import { idlFactory as PAIR } from './candid/pair.did';
import { idlFactory as PAIR_FACTORY } from './candid/pair_factory.did';

import { Identity } from '@dfinity/agent';
import { address_to_hex } from '@dfinity/rosetta-client';
import { IDL } from '@dfinity/candid';
import NNS_CANISTERS from './candid/nns';

class CanisterActor extends Actor {
  [x: string]: (...args: unknown[]) => Promise<unknown>;
}

const getSubAccountArray = (s) => {
  return Array(28)
    .fill(0)
    .concat(to32bits(s ? s : 0));
};
const to32bits = (num) => {
  const b = new ArrayBuffer(4);
  new DataView(b).setUint32(0, num);
  return Array.from(new Uint8Array(b));
};

export const SUB_ACCOUNT_ZERO = Buffer.alloc(32);
export const ACCOUNT_DOMAIN_SEPERATOR = Buffer.from('\x0Aaccount-id');

export const principal_id_to_address_buffer = (pid) => {
  return sha224([
    ACCOUNT_DOMAIN_SEPERATOR,
    pid.toUint8Array(),
    SUB_ACCOUNT_ZERO,
  ]);
};

export const getTokenImageExt = (canisterId: string, tokenid: string) =>
  `https://${canisterId}.raw.ic0.app/?tokenid=${tokenid}`;

export const getTokenThumbnailImageExt = (
  canisterId: string,
  tokenid: string
) => `https://${canisterId}.raw.ic0.app/?type=thumbnail&tokenid=${tokenid}`;

export const getNFTsFromCanisterExt = async (
  canisterId: string,
  accountId: string
) => {
  const agent = await Promise.resolve(
    new HttpAgent({
      host: ICP_HOST,
      fetch,
    })
  ).then(async (ag) => {
    await ag.fetchRootKey();
    return ag;
  });

  const API = Actor.createActor(IDL_EXT, {
    agent: agent,
    canisterId: canisterId,
  });

  let tokens: any;

  try {
    tokens = await API.tokens_ext(accountId);
  } catch (error) {
    console.log(error);
    tokens = null;
  }

  const tokensOK = tokens?.ok || [];

  return tokensOK.map((token) => {
    const tokenIndex = parseInt(token[0]);
    const info = { seller: '', price: BigInt(0).toString(), locked: [] };
    let forSale = false;
    if (token[1][0] !== undefined) {
      info.seller = token[1][0]?.seller.toText();
      info.price = BigInt(token[1][0]?.price).toString();
      info.locked = token[1][0]?.locked;
      forSale = true;
    }

    const metadata = token[2];
    const tokenIdentifier = getTokenIdentifier(canisterId, tokenIndex);
    return {
      metadata,
      info,
      tokenIndex,
      tokenIdentifier,
      forSale,
    };
  });
};

export const principal_to_address = (principal) =>
  address_to_hex(principal_id_to_address_buffer(principal));

export const getTokenIdentifier = (
  canisterId: string,
  index: number
): string => {
  const padding = Buffer.from('\x0Atid');
  const array = new Uint8Array([
    ...padding,
    ...Principal.fromText(canisterId).toUint8Array(),
    ...to32bits(index),
  ]);
  return Principal.fromUint8Array(array).toText();
};

export const transferNFTsExt = async (
  canisterId: string,
  fromIdentity: Identity,
  toAccountId: string,
  tokenIndex: string
) => {
  const agent = await Promise.resolve(
    new HttpAgent({
      host: ICP_HOST,
      fetch,
      identity: fromIdentity,
    })
  ).then(async (ag) => {
    await ag.fetchRootKey();
    return ag;
  });

  const API = Actor.createActor(IDL_EXT, {
    agent: agent,
    canisterId: canisterId,
  });

  let status: any;
  const token = getTokenIdentifier(canisterId, parseInt(tokenIndex));
  const memo = new Array(32).fill(0);

  try {
    status = await API.transfer({
      to: { address: toAccountId },
      from: { address: principal_to_address(fromIdentity.getPrincipal()) },
      token,
      amount: BigInt(1),
      memo,
      notify: false,
      subaccount: [],
    });
  } catch (error) {
    console.log(error, JSON.stringify(error));
    status = null;
  }

  if (status?.err?.Other === 'This token is currently listed for sale!') {
    status = 'TOKEN_LISTED_FOR_SALE';
  } else if (
    status?.err?.Unauthorized ===
    principal_to_address(fromIdentity.getPrincipal())
  ) {
    status = 'UNAUTHORISED';
  } else if (status.ok === BigInt(1)) {
    status = 'SUCCESS';
  }
  return status;
};

// Price in xx ICP and unlist == true or price is zero to unlist
export const listNFTsExt = async (
  canisterId: string,
  identity: Identity,
  tokenIndex: string,
  price: number,
  unlist?: boolean
) => {
  const agent = await Promise.resolve(
    new HttpAgent({
      host: ICP_HOST,
      fetch,
      identity,
    })
  ).then(async (ag) => {
    await ag.fetchRootKey();
    return ag;
  });

  const API = Actor.createActor(IDL_EXT, {
    agent: agent,
    canisterId: canisterId,
  });

  let status: any;
  const token = getTokenIdentifier(canisterId, parseInt(tokenIndex));

  try {
    status = await API.list({
      token,
      price: price === 0 || unlist ? [] : [Math.floor(price * 100000000)],
      from_subaccount: [getSubAccountArray(0)],
    });
  } catch (error) {
    console.log(error, JSON.stringify(error));
    status = null;
  }

  if (status?.err?.Other === 'Not authorized') {
    status = 'UNAUTHORISED';
  } else if (status.ok === null) {
    status = 'SUCCESS';
  }
  return status;
};

export const isHex = (str) => {
  return Boolean(str.match(/^[0-9a-f]+$/i));
};

export const validateAddress = (a) => {
  return isHex(a) && a.length === 64;
};

export const validatePrincipal = (p) => {
  try {
    return p === Principal.fromText(p).toText();
  } catch (e) {
    return false;
  }
};

export const principalTextoAddress = (p: string) => {
  return principal_to_address(Principal.fromText(p));
};

export const candidToJs = async (candid: string) => {
  const agent = await Promise.resolve(
    new HttpAgent({
      host: ICP_HOST,
      fetch,
    })
  ).then(async (ag) => {
    await ag.fetchRootKey();
    return ag;
  });

  const API = Actor.createActor(DIDJS, {
    agent,
    canisterId: DIDJS_ID,
  });
  const js: any = await API.did_to_js(candid);
  if (js === []) {
    return undefined;
  }
  return js[0];
};

export async function fetchJsFromCanisterId(
  canisterId: string
): Promise<undefined | string> {
  let candid_source: any;

  if (canisterId in NNS_CANISTERS) {
    return null;
  } else {
    const agent = await Promise.resolve(
      new HttpAgent({
        host: ICP_HOST,
        fetch,
      })
    ).then(async (ag) => {
      await ag.fetchRootKey();
      return ag;
    });

    const common_interface: IDL.InterfaceFactory = ({ IDL }) =>
      IDL.Service({
        __get_candid_interface_tmp_hack: IDL.Func([], [IDL.Text], ['query']),
      });
    const actor: CanisterActor = Actor.createActor(common_interface, {
      agent,
      canisterId,
    });
    candid_source = await actor.__get_candid_interface_tmp_hack();
  }

  const js: any = await candidToJs(candid_source);
  return js;
}

export async function fetchJsFromCanisterIdWithIcRocks(
  canisterId: string
): Promise<undefined | string> {
  const requestOptions = {
    method: 'GET',
    redirect: 'follow',
  };

  const data = await fetch(
    IC_ROCKS_HOST + `api/canisters/${canisterId}`,
    requestOptions as RequestInit
  ).then((response) => response.json());

  let candidString = data?.module?.candid;

  if (candidString === '') {
    candidString = await fetch(
      IC_ROCKS_HOST + `/data/interfaces/${data?.principal?.name}.did`,
      requestOptions as RequestInit
    ).then((response) => response.text());
  }
  const js: string = await candidToJs(candidString);

  return js;
}

export const canisterAgentApi = async (
  canisterId: string,
  methodName: string,
  args?: any,
  fromIdentity?: Identity
) => {
  let agent;
  if (fromIdentity === null) {
    agent = await Promise.resolve(
      new HttpAgent({
        host: ICP_HOST,
        fetch,
      })
    ).then(async (ag) => {
      await ag.fetchRootKey();
      return ag;
    });
  } else {
    agent = await Promise.resolve(
      new HttpAgent({
        host: ICP_HOST,
        fetch,
        identity: fromIdentity,
      })
    ).then(async (ag) => {
      await ag.fetchRootKey();
      return ag;
    });
  }

  let candid: any;

  if (!(canisterId in NNS_CANISTERS)) {
    const js = await fetchJsFromCanisterId(canisterId);
    const dataUri =
      'data:text/javascript;charset=utf-8,' + encodeURIComponent(js);
    candid = await eval('import("' + dataUri + '")');
  } else {
    candid = await import(`./candid/${NNS_CANISTERS[canisterId]}.did`);
  }

  const API = Actor.createActor(candid?.default || candid?.idlFactory, {
    agent,
    canisterId: canisterId,
  });
  let response: any;
  try {
    if (args === undefined) {
      response = await API[methodName]();
    } else {
      response = await API[methodName](args);
    }
    return response;
  } catch (error) {
    if (
      error?.message == 'Wrong number of message arguments' &&
      Array.isArray(args)
    ) {
      response = await API[methodName](...args);
      return response;
    } else {
      console.log(error);
      return { type: 'error', message: error?.message };
    }
  }
};

export const decodeTokenId = (tid: string) => {
  const toHexString = (byteArray) => {
    return Array.from(byteArray, function (byte: any) {
      return ('0' + (byte & 0xff).toString(16)).slice(-2);
    }).join('');
  };
  const from32bits = (ba) => {
    let value;
    for (let i = 0; i < 4; i++) {
      value = (value << 8) | ba[i];
    }
    return value;
  };
  const p = [...Principal.fromText(tid).toUint8Array()];
  const padding = p.splice(0, 4);
  if (toHexString(padding) !== toHexString(Buffer.from('\x0Atid'))) {
    return {
      index: 0,
      canister: tid,
      token: getTokenIdentifier(tid, 0),
    };
  } else {
    return {
      index: from32bits(p.splice(-4)),
      // @ts-ignore
      canister: Principal.fromUint8Array(p as Uint8Array).toText(),
      token: tid,
    };
  }
};

export const createToken = async (token: string) => {
  let response: any;
  const p = 'tjpnz-kfh3h-es2ok-k7wp4-ieiad-qvntd-hd4k3-zxdlf-tg3of-l37zo-7ae';
  try {
    response = await tokenFactoryAPI('create_token', {
      logo: '',
      fee: 1,
      name: token,
      symbol: token,
      decimals: 8,
      totalSupply: 1000000000,
      owner: Principal.fromText(p),
      feeTo: Principal.fromText(p),
    });
  } catch (error) {
    console.log(error);
    response = null;
  }
  //console.log(response, 'create_token');

  return response;
};

export const getAllTokens = async () => {
  let response: any;
  try {
    response = await tokenFactoryAPI('get_all');
  } catch (error) {
    console.log(error);
    response = null;
  }
  //console.log(response, 'get_all');

  return response.map((token) => token.toText());
};
export const getToken = async (token: string) => {
  let response: any;
  try {
    response = await tokenFactoryAPI('get_token', token);
  } catch (error) {
    console.log(error);
    response = null;
  }
  //console.log(response[0]?.toText());
  return response[0]?.toText();
};

export const owner = async (canisterId: string) => {
  let response: any;
  try {
    response = await tokenAPI(canisterId, 'owner');
  } catch (error) {
    console.log(error);
    response = null;
  }
  return response?.toText();
};

export const approve = async (
  identity: any,
  tokenCanisterId: string,
  pairCanisterId: string,
  amount: number
) => {
  const agent = await Promise.resolve(
    new HttpAgent({
      host: ICP_TESTNET_HOST,
      fetch,
      identity,
    })
  ).then(async (ag) => {
    await ag.fetchRootKey();
    return ag;
  });

  const API = Actor.createActor(TOKEN, {
    agent: agent,
    canisterId: tokenCanisterId,
  });

  let response: any;
  try {
    response = await API.approve(Principal.fromText(pairCanisterId), amount);
  } catch (error) {
    console.log(error);
    response = null;
  }

  return response;
};

export const stats = async (canisterId: string) => {
  let response: any;
  try {
    response = await pairAPI(canisterId, 'stats');
  } catch (error) {
    console.log(error);
    response = null;
  }

  console.log(response, 'stats');

  return response;
};

export const get_reserves = async (canisterId: string) => {
  let response: any;
  try {
    response = await pairAPI(canisterId, 'get_reserves');
  } catch (error) {
    console.log(error);
    response = null;
  }

  console.log(response, 'get_reserves');

  return response;
};

export const create_pair = async (pair1: string, pair2: string) => {
  const agent = await Promise.resolve(
    new HttpAgent({
      host: ICP_TESTNET_HOST,
      fetch,
    })
  ).then(async (ag) => {
    await ag.fetchRootKey();
    return ag;
  });

  const API = Actor.createActor(PAIR_FACTORY, {
    agent: agent,
    canisterId: 'q4eej-kyaaa-aaaaa-aaaha-cai',
  });

  let response: any;

  try {
    response = await API.create_pair(
      Principal.fromText(pair1),
      Principal.fromText(pair2)
    );
  } catch (error) {
    console.log(error);
    response = null;
  }

  const p = response[0].toText();
  console.log(p, 'p create_pair');

  return p;
};

export const getMetadata = async (tokenCanisterId: string) => {
  const agent = await Promise.resolve(
    new HttpAgent({
      host: ICP_TESTNET_HOST,
      fetch,
    })
  ).then(async (ag) => {
    await ag.fetchRootKey();
    return ag;
  });

  const API = Actor.createActor(TOKEN, {
    agent: agent,
    canisterId: tokenCanisterId,
  });

  let response: any;

  try {
    response = await API.getMetadata();
  } catch (error) {
    console.log(error);
    response = null;
  }

  // console.log(response, 'getMetadata');
  // console.log(response, 'getMetadata');

  return response;
};

export const get_pair = async (pair1: string, pair2: string) => {
  const agent = await Promise.resolve(
    new HttpAgent({
      host: ICP_TESTNET_HOST,
      fetch,
    })
  ).then(async (ag) => {
    await ag.fetchRootKey();
    return ag;
  });

  const API = Actor.createActor(PAIR_FACTORY, {
    agent: agent,
    canisterId: 'q4eej-kyaaa-aaaaa-aaaha-cai',
  });

  let response: any;

  try {
    response = await API.get_pair(
      Principal.fromText(pair1),
      Principal.fromText(pair2)
    );
  } catch (error) {
    console.log(error);
    response = null;
  }

  return response[0]?.toText();
};

export const get_current_price = async (canisterId: string) => {
  const agent = await Promise.resolve(
    new HttpAgent({
      host: ICP_TESTNET_HOST,
      fetch,
    })
  ).then(async (ag) => {
    await ag.fetchRootKey();
    return ag;
  });

  const API = Actor.createActor(PAIR, {
    agent: agent,
    canisterId,
  });

  let response: any;

  try {
    response = await API.get_current_price();
  } catch (error) {
    console.log(error);
    response = null;
  }

  console.log(response, 'get_current_price');

  console.log(response);
  return response;
};

export const transfer_from = async (
  token: string,
  amount: number,
  identity: any,
  pairCanisterId: string
) => {
  const agent = await Promise.resolve(
    new HttpAgent({
      host: ICP_TESTNET_HOST,
      fetch,
      identity,
    })
  ).then(async (ag) => {
    await ag.fetchRootKey();
    return ag;
  });

  const API = Actor.createActor(PAIR, {
    agent: agent,
    canisterId: pairCanisterId,
  });

  let response: any;

  try {
    response = await API.transfer_from(Principal.fromText(token), amount);
  } catch (error) {
    console.log(error);
    response = null;
  }

  console.log(response, 'transfer_from');
  return response;
};

export const mint = async (identity: any, pairCanisterId: string) => {
  const agent = await Promise.resolve(
    new HttpAgent({
      host: ICP_TESTNET_HOST,
      fetch,
      identity,
    })
  ).then(async (ag) => {
    await ag.fetchRootKey();
    return ag;
  });

  const API = Actor.createActor(PAIR, {
    agent: agent,
    canisterId: pairCanisterId,
  });

  let response: any;
  const get_transit0 = await API.get_transit();
  console.log(get_transit0, '0 mint');
  try {
    response = await API.mint();
  } catch (error) {
    console.log(error);
    response = null;
  }

  const get_history_length = await API.get_history_length();
  //const get_transactions = await API.get_transactions(1, get_history_length);

  const response2 = await API.get_total_supply();
  const get_transit = await API.get_transit();

  //want one of the transit tokens to have 0 balance

  //stop transfer_form for one of tokens
  /*   try {
    await API.mint();
  } catch (error) {
    console.log();
  } */
  //const swap = await API.swap();
  console.log(response, 'mint');
  //console.log(get_transactions, 'get_transactions');

  console.log(get_history_length, 'get_history_length');
  console.log(response2, 'get_total_supply');
  console.log(get_transit, 'get_transit');
  //console.log(swap, 'swap');
  try {
    console.log('swap');

    //const swap = await API.swap();
    //console.log(swap, 'swap');
  } catch (error) {
    console.log(error);
    console.log('swap error');
  }
  return response;
};

export const swap = async (
  identity: any,
  pairCanisterId: string,
  tokenCanisterId?: string,
  amount?: number
) => {
  let response: any;

  //approve
  //transfer_from
  const get_history_length = await pairAPI(
    pairCanisterId,
    'get_history_length'
  );
  const get_reserves = await pairAPI(pairCanisterId, 'get_reserves');

  console.log(get_history_length, get_reserves, 'get_history_length 0');
  const get_transactions = await pairAPI(pairCanisterId, 'get_transactions', [
    1,
    get_history_length,
  ]);
  const get_transitx = await pairAPI(pairCanisterId, 'get_transit');

  const _approve = await approve(
    identity,
    tokenCanisterId,
    pairCanisterId,
    amount
  );
  const get_transity = await pairAPI(pairCanisterId, 'get_transit');

  const _transfer_from = await transfer_from(
    tokenCanisterId,
    amount,
    identity,
    pairCanisterId
  );
  const get_transitz = await pairAPI(pairCanisterId, 'get_transit');
  console.log('get_transitz', get_transitx, get_transity, get_transitz);

  console.log('_approve', _approve);
  console.log('_transfer_from', _transfer_from);
  console.log('get_transactions', get_transactions);

  //const get_transactions = await API.get_transactions(1, get_history_length);
  const get_transit = await pairAPI(pairCanisterId, 'get_transit');
  console.log(get_transit, tokenCanisterId, amount, 'get_transit 0');
  //console.log(swap, 'swap');
  try {
    response = await pairAPI(pairCanisterId, 'swap', undefined, identity);
  } catch (error) {
    console.log(error);
    console.log('swap error');
  }
  const get_transit1 = await pairAPI(pairCanisterId, 'get_transit');
  console.log(get_transit1, 'get_transit 1');
  console.log(response, 'swap response');
  return response;
};

export const tokenAPI = async (
  canisterId: string,
  methodName: string,
  args?: any,
  fromIdentity?: Identity
) => infiniteSwapAPI('TOKEN', canisterId, methodName, args, fromIdentity);
export const pairAPI = async (
  canisterId: string,
  methodName: string,
  args?: any,
  fromIdentity?: Identity
) => infiniteSwapAPI('PAIR', canisterId, methodName, args, fromIdentity);
export const pairFactoryAPI = async (
  methodName: string,
  args?: any,
  fromIdentity?: Identity
) =>
  infiniteSwapAPI(
    'PAIR_FACTORY',
    'q4eej-kyaaa-aaaaa-aaaha-cai',
    methodName,
    args,
    fromIdentity
  );
export const tokenFactoryAPI = async (
  methodName: string,
  args?: any,
  fromIdentity?: Identity
) =>
  infiniteSwapAPI(
    'TOKEN_FACTORY',
    'q3fc5-haaaa-aaaaa-aaahq-cai',
    methodName,
    args,
    fromIdentity
  );
export const infiniteSwapAPI = async (
  canisterType: string,
  canisterId: string,
  methodName: string,
  args?: any,
  fromIdentity?: Identity
) => {
  let agent;
  if (fromIdentity === null) {
    agent = await Promise.resolve(
      new HttpAgent({
        host: ICP_TESTNET_HOST,
        fetch,
      })
    ).then(async (ag) => {
      await ag.fetchRootKey();
      return ag;
    });
  } else {
    agent = await Promise.resolve(
      new HttpAgent({
        host: ICP_TESTNET_HOST,
        fetch,
        identity: fromIdentity,
      })
    ).then(async (ag) => {
      await ag.fetchRootKey();
      return ag;
    });
  }

  let DID;
  switch (canisterType) {
    case 'TOKEN':
      DID = TOKEN;
      break;
    case 'PAIR':
      DID = PAIR;
      break;
    case 'TOKEN_FACTORY':
      DID = TOKEN_FACTORY;
      break;
    case 'PAIR_FACTORY':
      DID = PAIR_FACTORY;
      break;
    default:
      DID = TOKEN_FACTORY;
      break;
  }
  const API = Actor.createActor(DID, {
    agent: agent,
    canisterId,
  });
  let response: any;

  try {
    if (args === undefined) {
      response = await API[methodName]();
    } else {
      response = await API[methodName](args);
    }
    return response;
  } catch (error) {
    console.log(error);
    if (
      error?.message == 'Wrong number of message arguments' &&
      Array.isArray(args)
    ) {
      try {
        response = await API[methodName](...args);
        return response;
      } catch (error) {
        console.log(error);
        console.log('Executing without array Error', methodName);
      }
    } else {
      console.log(error);
      return { type: 'error', message: error?.message };
    }
  }
};
