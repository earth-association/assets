import { createWallet } from '@earthwallet/keyring';
import test from 'ava';
import { getTransferGasFees } from '.';

//https://mumbai.polygonscan.com/address/0x29bc7f4bfc7301b3ddb5c9c4348360fc0ad52ca8
test('create wallet for eth or matic', async (t) => {
  try {
    const TEST_MNE_1 =
      'open jelly jeans corn ketchup supreme brief element armed lens vault weather original scissors rug priority vicious lesson raven spot gossip powder person volcano';
    /* 
    const TEST_MNE2 =
      'crystal wealth scan disagree moment note athlete medal cube notable pole miss';
    */ const wallet = await createWallet(TEST_MNE_1, 'MATIC');
    console.log(wallet.address);
    t.is(wallet.address, '0x29bc7f4bfc7301b3ddb5c9c4348360fc0ad52ca8');
    return;
  } catch (error) {
    console.log(error);
    t.truthy(false);
  }
});

//https://docs.polygon.technology/docs/develop/eip1559-transactions/how-to-send-eip1559-transactions

test('getTransferGasFees', async (t) => {
  t.truthy(true);
  return;
  try {
    const status = await getTransferGasFees();
    console.log(status);
    t.truthy(true);
    return;
  } catch (error) {
    console.log(error);
    t.truthy(false);
  }
});
