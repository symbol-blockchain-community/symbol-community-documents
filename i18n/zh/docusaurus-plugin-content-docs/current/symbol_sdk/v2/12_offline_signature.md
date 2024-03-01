# 12.离线签名

《锁定》章节介绍了具有哈希值规范的锁定交易以及收集多个签名（线上签名）的聚合交易。
本章讲解离线签名，即提前收集签名并向节点公布交易。

## 程序

创建并签署交易。然后 Bob 签名并返回给 Alice。最后，Alice 将交易组合起来并向网络公布。

## 12.1 交易创建

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

###### 市例演示

```js
>580100000000000039A6555133357524A8F4A832E1E596BDBA39297BC94CD1D0728572EE14F66AA71ACF5088DB6F0D1031FF65F2BBA7DA9EE3A8ECF242C2A0FE41B6A00A2EF4B9020E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26000000000198414100AF000000000000D4641CD902000000306771D758886F1529F9B61664B0450ED138B27CC5E3AE579C16D550EDEE5791B00000000000000054000000000000000E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26000000000198544198A1BE13194C0D18897DD88FE3BC4860B8EEF79C6BC8C8720400000000000000007478310000000054000000000000003C4ADF83264FF73B4EC1DD05B490723A8CFFAE1ABBD4D4190AC4CAC1E6505A5900000000019854419850BF0FD1A45FCEE211B57D0FE2B6421EB81979814F629204000000000000000074783200000000
```

签署并输出签名哈希和签名有效载荷(Payload)。将签名有效载荷(Payload)传递给Bob以提示他进行签署。

## 12.2 由 Bob 进行的共同签名

使用从 Alice 收到的 签名（有效载荷payload） 恢复交易。

```js
tx = sym.TransactionMapping.createFromPayload(signedPayload);
console.log(tx);
```

###### 市例演示

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

为了确保，请验证交易（有效载荷payload）是否已由Alice签署。

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

###### 市例演示

```js
> true
```

经验证，有效载荷(payload) 由签名者 Alice 签名，然后 Bob 共同签名。

```js
bobSignedTx = sym.CosignatureTransaction.signTransactionPayload(
  bob,
  signedPayload,
  generationHash
);
bobSignedTxSignature = bobSignedTx.signature;
bobSignedTxSignerPublicKey = bobSignedTx.signerPublicKey;
```

Bob使用signatureCosignatureTransaction进行签署，输出bobSignedTxSignature、bobSignedTxSignerPublicKey，然后将这些返回给Alice。
如果 Bob 可以创建所有签名，那么 Bob 也可以发布公告而无需将其返回给 Alice。

## 12.3 Alice 的公告

Alice 从 Bob 那里收到 bobSignedTxSignature 和 bobSignedTxSignerPublicKey。同时，她预先准备了一个自己创建的 signedPayload。

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

后面添加一系列签名会有点困难，因为它直接操作 有效载荷(Payload)（大小值）。
如果可以使用 Alice 的私钥再次对交易进行签名，则可以生成 cosignSignedTxs，然后生成一个共签交易，如下所示。

```js
resignedTx = recreatedTx.signTransactionGivenSignatures(
  alice,
  cosignSignedTxs,
  generationHash
);
await txRepo.announce(resignedTx).toPromise();
```

## 12.4 使用提示

### 超越市场

与保税交易不同，哈希锁无需支付费用（10XYM）。 
如果有效载荷(Payload)可以共享，卖方可以为所有可能的潜在买方创建有效负载并等待谈判开始。
（应使用排除控制，例如将仅一个现有的收据NFT混合到聚合事务中，以便不会单独执行多个事务）。
无需为这些谈判建立专门的市场。
用户可以将社交网络时间线作为市场，也可以根据需要在任何时间、任何空间开发一次性市场。

请注意伪造的哈希签名请求，因为签名是离线交换的（请始终从可验证的有效载荷生成并签署哈希）。
