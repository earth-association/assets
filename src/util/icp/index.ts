import { Actor, HttpAgent } from '@dfinity/agent';
import { sha224 } from '@dfinity/rosetta-client/lib/hash';
import fetch from 'cross-fetch';

export { address_to_hex } from '@dfinity/rosetta-client';
import { Principal } from '@dfinity/principal';
import { ICP_HOST } from './constants';
import { default as IDL_EXT } from './candid/ext.did';
import { Identity } from '@dfinity/agent';
import { address_to_hex } from '@dfinity/rosetta-client';

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
  //const fetchWallet = await createWallet(TEST_MNE_1, 'ICP');

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

export const listNFTsExt = async (
  canisterId: string,
  identity: Identity,
  tokenIndex: string,
  price: number
) => {
  //const fetchWallet = await createWallet(TEST_MNE_1, 'ICP');

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
      price: [Math.floor(price * 100000000)],
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
