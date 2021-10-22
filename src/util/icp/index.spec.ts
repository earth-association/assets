import test from 'ava';

import { createWallet } from '@earthwallet/keyring';
import {
  getNFTsFromCanisterExt,
  transferNFTsExt,
  listNFTsExt,
  canisterAgentApi,
} from '.';

test('get tokens for a EXT type canister for a user', async (t) => {
  try {
    const tokens = await getNFTsFromCanisterExt(
      'tde7l-3qaaa-aaaah-qansa-cai',
      '0ba1b7b1643929210dc41a8afbe031bd1b5e81dbc8e3b3b64978f5f743f058c3'
    );

    t.like(tokens[0], {
      info: {
        seller: '',
        price: '0',
        locked: [],
      },
      tokenIndex: 16437,
      tokenIdentifier: 'pewj2-gykor-uwiaa-aaaaa-b4adm-qaqca-aaia2-q',
      forSale: false,
    });
  } catch (error) {
    console.log(error);
    t.truthy(false);
  }
});

test('transfer saleable NFT of a EXT canister should give TOKEN_LISTED_FOR_SALE status', async (t) => {
  try {
    const seedPhrase =
      'open jelly jeans corn ketchup supreme brief element armed lens vault weather original scissors rug priority vicious lesson raven spot gossip powder person volcano';

    const walletObj = await createWallet(seedPhrase, 'ICP');

    const status = await transferNFTsExt(
      'owuqd-dyaaa-aaaah-qapxq-cai',
      walletObj.identity,
      '0ba1b7b1643929210dc41a8afbe031bd1b5e81dbc8e3b3b64978f5f743f058c3',
      '2112'
    );

    t.is(status, 'TOKEN_LISTED_FOR_SALE');
  } catch (error) {
    console.log(error);
    t.truthy(false);
  }
});

test('list not owned NFT of a canister should give UNAUTHORISED status', async (t) => {
  try {
    const seedPhrase =
      'open jelly jeans corn ketchup supreme brief element armed lens vault weather original scissors rug priority vicious lesson raven spot gossip powder person volcano';

    const walletObj = await createWallet(seedPhrase, 'ICP');

    const status = await listNFTsExt(
      'owuqd-dyaaa-aaaah-qapxq-cai',
      walletObj.identity,
      '2112',
      180
    );

    t.is(status, 'UNAUTHORISED');
  } catch (error) {
    console.log(error);
    t.truthy(false);
  }
});

test('call canisterAgentApi and get response', async (t) => {
  const canisterId = '6ldcj-gyaaa-aaaab-qacsa-cai';
  const response: any = await canisterAgentApi(canisterId, 'say', 'hello');
  t.truthy(response === 'hello');
});

test('call m7cke-iikor-uwiaa-aaaaa-cmaaq-qaqca-aaek4-a and get expected response', async (t) => {
  const canisterId = 'ahl3d-xqaaa-aaaaj-qacca-cai';
  const response: any = await canisterAgentApi(
    canisterId,
    'bearer',
    'm7cke-iikor-uwiaa-aaaaa-cmaaq-qaqca-aaek4-a'
  );
  console.log(response);
  t.truthy(
    response.ok ===
      '77bd92d0945ab9f1f7ce92fc00db10994f643c126df4e9f13ffce4a6fe1f2da2'
  );
});
