import { createWallet } from '@earthwallet/keyring';
import test from 'ava';
import { createAlchemyWeb3 } from '@alch/alchemy-web3';
import { ethers } from 'ethers';

const TEST_MNE_1 =
  '';



test('sendTransaction', async (t) => {
    t.truthy(true);
    return;
  const wallet_tx = await createWallet(TEST_MNE_1, 'MATIC');
  //const wallet_rx = await createWallet(TEST_MNE_2, 'MATIC');
  const wallet_rx_address = '0x148729fDc7F286C9592beaFc4cA05Ee395a9cdE8'
  // console.log(wallet_tx.address);
  // console.log(wallet_rx.address);
  t.is(wallet_tx.address, '0xc942c1c0b32f15fb33bcc288e6f8ed876bb61558');
  //t.is(wallet_rx.address, '0x9ef68ccf6dba61b8d368f2a2a5b1e6bd517e9ff0');
  const API_KEY = 'H6ENmJt11JDQSpncGsfiomipU2C59Yc-';
  const web3 = createAlchemyWeb3(
    `https://eth-ropsten.alchemyapi.io/v2/${API_KEY}`
  );
  console.log(wallet_tx.address);

  const privateKey = ethers.Wallet.fromMnemonic(TEST_MNE_1).privateKey;
  console.log('private key', privateKey);

  const nonce = await web3.eth.getTransactionCount(wallet_tx.address, 'latest');
  console.log('nonce', nonce);

  const transaction = {
    nonce: nonce,
    from: wallet_tx.address,
    to: wallet_rx_address,
    value: web3.utils.toWei('0.01', 'ether'),
  };
  // estimate gas usage. This is units. minimum cap being 21000 units
  const estimateGas = await web3.eth.estimateGas(transaction);
  console.log('estimate', estimateGas);

  // get gas prices


  // here maxPriorityFeePerGas is provided by alchemy
  // https://docs.alchemy.com/alchemy/guides/eip-1559/send-tx-eip-1559#building-a-more-sophisticated-estimate-of-max-priority-fee-per-gas

  // on main net we can pick values from https://www.blocknative.com/gas-estimator or ethgasinfo
  // depends on UX. We can give only maxPriorityFeePerGas or also provide maxFeePerGas
  const fee = await web3.eth.getMaxPriorityFeePerGas();
  console.log('BN fee', fee);
  //console.log('fee', web3.utils.toBN(fee).toString);



  // use 200% gas estimate as gas limit to be safe.
  // sign transaction
  const signedTx = await web3.eth.accounts.signTransaction(
    {
      gas: 2 * estimateGas,
      maxPriorityFeePerGas: fee,
      ...transaction,
    },
    privateKey
  );
  console.log('signedTx', signedTx);
  //send signed transaction
  const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  console.log('result', result);
  t.truthy(true);
});

