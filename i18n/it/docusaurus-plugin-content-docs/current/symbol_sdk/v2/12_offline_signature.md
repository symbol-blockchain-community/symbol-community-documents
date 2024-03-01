# 12.Offline Signatures

The chapter on Locks, explained the Lock transactions with a hash value specification and the Aggregate transaction, which collects multiple signatures (online signatures).  
This chapter explains offline signing, which involves collecting signatures in advance and announcing the transaction to the node.

## Procedure

Alice creates and signs the transaction. Then Bob signs it and returns it to Alice. Finally, Alice combines the transactions and announces them to the network.

## 12.1 Transaction creation

```js
bob = sym.Account.generateNewAccount(networkType);

innerTx1 = sym.TransferTransaction.create(
  undefined,
  bob.address,
  [],
  sym.PlainMessage.create("tx1"),
  networkType
);

innerTx2 = sym.TransferTransaction.create(
  undefined,
  alice.address,
  [],
  sym.PlainMessage.create("tx2"),
  networkType
);

aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [
    innerTx1.toAggregate(alice.publicAccount),
    innerTx2.toAggregate(bob.publicAccount),
  ],
  networkType,
  []
).setMaxFeeForAggregate(100, 1);

signedTx = alice.sign(aggregateTx, generationHash);
signedHash = signedTx.hash;
signedPayload = signedTx.payload;

console.log(signedPayload);
```

###### Sample output

```js
>580100000000000039A6555133357524A8F4A832E1E596BDBA39297BC94CD1D0728572EE14F66AA71ACF5088DB6F0D1031FF65F2BBA7DA9EE3A8ECF242C2A0FE41B6A00A2EF4B9020E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26000000000198414100AF000000000000D4641CD902000000306771D758886F1529F9B61664B0450ED138B27CC5E3AE579C16D550EDEE5791B00000000000000054000000000000000E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26000000000198544198A1BE13194C0D18897DD88FE3BC4860B8EEF79C6BC8C8720400000000000000007478310000000054000000000000003C4ADF83264FF73B4EC1DD05B490723A8CFFAE1ABBD4D4190AC4CAC1E6505A5900000000019854419850BF0FD1A45FCEE211B57D0FE2B6421EB81979814F629204000000000000000074783200000000
```

Sign and output signedHash, signedPayload. Pass signedPayload to Bob to prompt him to sign.

## 12.2 Cosignature by Bob

Restore the transaction with the signedPayload received from Alice.

```js
tx = sym.TransactionMapping.createFromPayload(signedPayload);
console.log(tx);
```

###### Sample outlet

```js
> AggregateTransaction
    cosignatures: []
    deadline: Deadline {adjustedValue: 12197090355}
  > innerTransactions: Array(2)
      0: TransferTransaction {type: 16724, networkType: 152, version: 1, deadline: Deadline, maxFee: UInt64, …}
      1: TransferTransaction {type: 16724, networkType: 152, version: 1, deadline: Deadline, maxFee: UInt64, …}
    maxFee: UInt64 {lower: 44800, higher: 0}
    networkType: 152
    payloadSize: undefined
    signature: "4999A8437DA1C339280ED19BE0814965B73D60A1A6AF2F3856F69FBFF9C7123427757247A231EB89BB8844F37AC6F7559F859E2FDE39B8FA58A57F36DDB3B505"
    signer: PublicAccount
      address: Address {address: 'TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ', networkType: 152}
      publicKey: "D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2"
    transactionInfo: undefined
    type: 16705
    version: 1
```

To make sure, verify whether the transaction (payload) has already been signed by Alice.

```js
Buffer = require("/node_modules/buffer").Buffer;
res = tx.signer.verifySignature(
  tx.getSigningBytes(
    [...Buffer.from(signedPayload, "hex")],
    [...Buffer.from(generationHash, "hex")]
  ),
  tx.signature
);
console.log(res);
```

###### Sample output

```js
> true
```

It has been verified that the payload is signed by the signer Alice, then Bob co-signs.

```js
bobSignedTx = sym.CosignatureTransaction.signTransactionPayload(
  bob,
  signedPayload,
  generationHash
);
bobSignedTxSignature = bobSignedTx.signature;
bobSignedTxSignerPublicKey = bobSignedTx.signerPublicKey;
```

Bob signs with the signatureCosignatureTransaction and outputs bobSignedTxSignature, bobSignedTxSignerPublicKey then returns these to Alice.  
If Bob can create all of the signatures then Bob can also make the announcement without having to return it to Alice.

## 12.3 Announcement by Alice

Alice receives bobSignedTxSignature, bobSignedTxSignerPublicKey from Bob. Also, prepare a signedPayload created by Alice herself in advance.

```js
signedHash = sym.Transaction.createTransactionHash(
  signedPayload,
  Buffer.from(generationHash, "hex")
);
cosignSignedTxs = [
  new sym.CosignatureSignedTransaction(
    signedHash,
    bobSignedTxSignature,
    bobSignedTxSignerPublicKey
  ),
];

recreatedTx = sym.TransactionMapping.createFromPayload(signedPayload);

cosignSignedTxs.forEach((cosignedTx) => {
  signedPayload +=
    cosignedTx.version.toHex() +
    cosignedTx.signerPublicKey +
    cosignedTx.signature;
});

size = `00000000${(signedPayload.length / 2).toString(16)}`;
formatedSize = size.substr(size.length - 8, size.length);
littleEndianSize =
  formatedSize.substr(6, 2) +
  formatedSize.substr(4, 2) +
  formatedSize.substr(2, 2) +
  formatedSize.substr(0, 2);

signedPayload =
  littleEndianSize + signedPayload.substr(8, signedPayload.length - 8);
signedTx = new sym.SignedTransaction(
  signedPayload,
  signedHash,
  alice.publicKey,
  recreatedTx.type,
  recreatedTx.networkType
);

await txRepo.announce(signedTx).toPromise();
```

The latter part of adding a series of signatures would be a little difficult as it directly manipulates the Payload (size value).
If the private key of Alice can be used to sign the transaction again, it is possible to generate cosignSignedTxs and then generate a cosigned transaction as follows.

```js
resignedTx = recreatedTx.signTransactionGivenSignatures(
  alice,
  cosignSignedTxs,
  generationHash
);
await txRepo.announce(resignedTx).toPromise();
```

## 12.4 Tips for use

### Beyond the marketplace

Unlike Bonded Transactions, there is no need to pay fees (10XYM) for hashlocks.  
If the payload can be shared, the seller can create payloads for all possible potential buyers and wait for negotiations to start.
(Exclusion control should be used, e.g. by mixing only one existing receipt NFT into the Aggregate Transaction, so that multiple transactions are not executed separately).
There is no need to build a dedicated marketplace for these negotiations.
Users can use a social networking timeline as a marketplace, or develop a one-time marketplace at any time or in any space as required.

Just be careful of spoofed hash signature requests, as signatures are exchanged offline (always generate and sign a hash from a verifiable payload).
