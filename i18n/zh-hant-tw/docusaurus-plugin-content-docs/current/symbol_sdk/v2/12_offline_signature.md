# 12.離線簽名

《鎖定》章節介紹了具有哈希值規範的鎖定交易以及收集多個簽名（線上簽名）的聚合交易。  
本章講解離線簽名，即提前收集簽名並向節點公佈交易。

## 程序

Alice 創建並簽署交易。 然後 Bob 簽名並返回給 Alice。 最後，Alice 將交易組合起來並向網絡公佈。

## 12.1 交易創建

```js
bob = sym.Account.generateNewAccount(networkType);

innerTx1 = sym.TransferTransaction.create(
  undefined,
  bob.address,
  [],
  sym.PlainMessage.create("tx1"),
  networkType,
);

innerTx2 = sym.TransferTransaction.create(
  undefined,
  alice.address,
  [],
  sym.PlainMessage.create("tx2"),
  networkType,
);

aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [
    innerTx1.toAggregate(alice.publicAccount),
    innerTx2.toAggregate(bob.publicAccount),
  ],
  networkType,
  [],
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

簽署並輸出簽名哈希和簽名有效載荷(Payload)。將簽名有效載荷(Payload)傳遞給Bob以提示他進行簽署。

## 12.2 由 Bob 進行的共同簽名

使用從 Alice 收到的 簽名（有效載荷payload） 恢復交易。

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

為了確保，請驗證交易（有效載荷payload）是否已由Alice簽署。

```js
Buffer = require("/node_modules/buffer").Buffer;
res = tx.signer.verifySignature(
  tx.getSigningBytes(
    [...Buffer.from(signedPayload, "hex")],
    [...Buffer.from(generationHash, "hex")],
  ),
  tx.signature,
);
console.log(res);
```

###### 市例演示

```js
> true
```

經驗證，有效載荷(payload) 由簽名者 Alice 簽名，然後 Bob 共同簽名。

```js
bobSignedTx = sym.CosignatureTransaction.signTransactionPayload(
  bob,
  signedPayload,
  generationHash,
);
bobSignedTxSignature = bobSignedTx.signature;
bobSignedTxSignerPublicKey = bobSignedTx.signerPublicKey;
```

Bob使用signatureCosignatureTransaction進行簽署，輸出bobSignedTxSignature、bobSignedTxSignerPublicKey，然後將這些返回給Alice。
如果 Bob 可以創建所有簽名，那麼 Bob 也可以發佈公告而無需將其返回給 Alice。

## 12.3 Alice 的公告

Alice 從 Bob 那裡收到 bobSignedTxSignature 和 bobSignedTxSignerPublicKey。同時，她預先準備了一個自己創建的 signedPayload。

```js
signedHash = sym.Transaction.createTransactionHash(
  signedPayload,
  Buffer.from(generationHash, "hex"),
);
cosignSignedTxs = [
  new sym.CosignatureSignedTransaction(
    signedHash,
    bobSignedTxSignature,
    bobSignedTxSignerPublicKey,
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
  recreatedTx.networkType,
);

await txRepo.announce(signedTx).toPromise();
```

後面添加一系列簽名會有點困難，因為它直接操作 有效載荷(Payload)（大小值）。
如果可以使用 Alice 的私鑰再次對交易進行簽名，則可以生成 cosignSignedTxs，然後生成一個共簽交易，如下所示。

```js
resignedTx = recreatedTx.signTransactionGivenSignatures(
  alice,
  cosignSignedTxs,
  generationHash,
);
await txRepo.announce(resignedTx).toPromise();
```

## 12.4 使用提示

### 超越市場

與保稅交易不同，哈希鎖無需支付費用（10XYM）。
如果有效載荷(Payload)可以共享，賣方可以為所有可能的潛在買方創建有效負載並等待談判開始。
（應使用排除控制，例如將僅一個現有的收據NFT混合到聚合事務中，以便不會單獨執行多個事務）。
無需為這些談判建立專門的市場。
用戶可以將社交網絡時間線作為市場，也可以根據需要在任何時間、任何空間開發一次性市場。

請注意偽造的哈希簽名請求，因為簽名是離線交換的（請始終從可驗證的有效載荷生成並簽署哈希）。
