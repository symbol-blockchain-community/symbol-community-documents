# 8.鎖定

區塊鏈有兩種鎖定交易：哈希鎖定交易和秘密鎖定交易。

## 8.1 哈希鎖 Hash Lock

哈希鎖定交易可以讓交易在稍後公布。交易會以哈希值的形式存儲在每個節點的部分快取中，直到交易被公布。交易被鎖定，在 API 節點上不進行處理，直到它被所有共同簽署者簽署。它不會鎖定帳戶所擁有的代幣，但交易發起者需要支付10 XYM的押金。當哈希鎖定交易完全簽署時，被鎖定的資金將退還給發起交易的帳戶。哈希鎖定交易的最大有效期為約48小時，如果交易在此期限內未完成，則10 XYM押金將會丟失。

### 創建聚合綁定交易。

```js
bob = sym.Account.generateNewAccount(networkType);

tx1 = sym.TransferTransaction.create(
  undefined,
  bob.address, //Send to Bob
  [
    //1XYM
    new sym.Mosaic(
      new sym.NamespaceId("symbol.xym"),
      sym.UInt64.fromUint(1000000),
    ),
  ],
  sym.EmptyMessage, //mptyMessage
  networkType,
);

tx2 = sym.TransferTransaction.create(
  undefined,
  alice.address, //Send to Alice
  [],
  sym.PlainMessage.create("thank you!"), //Message
  networkType,
);

aggregateArray = [
  tx1.toAggregate(alice.publicAccount), //Sent from Alice
  tx2.toAggregate(bob.publicAccount), //Sent from  Bob
];

//Aggregate Bonded Transaction
aggregateTx = sym.AggregateTransaction.createBonded(
  sym.Deadline.create(epochAdjustment),
  aggregateArray,
  networkType,
  [],
).setMaxFeeForAggregate(100, 1);

//Signature
signedAggregateTx = alice.sign(aggregateTx, generationHash);
```

當兩筆交易 tx1 和 tx2 排列在 AggregateArray 中時，指定發送方賬戶的公鑰。 參考賬戶章節通過API提前獲取公鑰。 在區塊批准期間，按此順序驗證排列的交易的完整性。

例如，可以在交易1中從 Alice 發送一個 NFT 給 Bob，然後在交易2中從 Bob 發送給 Carol，但如果更改彙總交易的順序為交易2、交易1，將導致錯誤。此外，如果彙總交易中有任何不一致的交易，整個彙總交易將失敗，並且不會被批准進入區塊鏈。

### 哈希鎖交易的創建、簽署和公告

```js
//Creation of Hash Lock TX
hashLockTx = sym.HashLockTransaction.create(
  sym.Deadline.create(epochAdjustment),
  new sym.Mosaic(
    new sym.NamespaceId("symbol.xym"),
    sym.UInt64.fromUint(10 * 1000000),
  ), //10xym by default
  sym.UInt64.fromUint(480), // Lock expiry date
  signedAggregateTx, // Register this hash value
  networkType,
).setMaxFee(100);

//Signature
signedLockTx = alice.sign(hashLockTx, generationHash);

//Announcing Hash Lock TX
await txRepo.announce(signedLockTx).toPromise();
```

### 聚合綁定交易的公告

與例如檢查後 Explorer，向網絡宣布保稅交易。

```js
await txRepo.announceAggregateBonded(signedAggregateTx).toPromise();
```

### 聯署

從指定賬戶 (Bob) 共同簽署鎖定的交易。

```js
txInfo = await txRepo
  .getTransaction(signedAggregateTx.hash, sym.TransactionGroup.Partial)
  .toPromise();
cosignatureTx = sym.CosignatureTransaction.create(txInfo);
signedCosTx = bob.signCosignatureTransaction(cosignatureTx);
await txRepo.announceAggregateBondedCosignature(signedCosTx).toPromise();
```

### 參考資料

哈希鎖交易可以由任何人創建和公佈，而不僅僅是最初創建和簽署交易的帳戶。 但要確保聚合交易包括該賬戶是簽名者的交易。 沒有馬賽克傳輸和沒有消息的虛擬交易是有效的。

## 8.2 秘密鎖・秘密證明

秘密鎖定交易是指事先建立一個共同的密碼，並將指定的代幣鎖定起來。如果接收者能夠在鎖定到期日期之前證明自己擁有密碼，那麼他們就可以接收到被鎖定的代幣。

本節介紹 Alice 如何鎖定 1XYM，Bob 如何解鎖交易以接收資金。

首先，創建一個 Bob 帳戶與 Alice 進行交互。
Bob需要公佈交易才能解鎖交易，請向水龍頭索取10XYM。

```js
bob = sym.Account.generateNewAccount(networkType);
console.log(bob.address);

//FAUCET URL outlet
console.log(
  "https://testnet.symbol.tools/?recipient=" +
    bob.address.plain() +
    "&amount=10",
);
```

### 秘密鎖

創建用於鎖定和解鎖的通用通行證。

```js
sha3_256 = require("/node_modules/js-sha3").sha3_256;

random = sym.Crypto.randomBytes(20);
hash = sha3_256.create();
secret = hash.update(random).hex(); //Lock keyword
proof = random.toString("hex"); //Unlock keyword
console.log("secret:" + secret);
console.log("proof:" + proof);
```

###### 市例演示

```js
> secret:f260bfb53478f163ee61ee3e5fb7cfcaf7f0b663bc9dd4c537b958d4ce00e240
  proof:7944496ac0f572173c2549baf9ac18f893aab6d0
```

創建、簽署和宣布交易

```js
lockTx = sym.SecretLockTransaction.create(
  sym.Deadline.create(epochAdjustment),
  new sym.Mosaic(
    new sym.NamespaceId("symbol.xym"),
    sym.UInt64.fromUint(1000000), //1XYM
  ), //Mosaic to lock
  sym.UInt64.fromUint(480), //Locking period (number of blocks)
  sym.LockHashAlgorithm.Op_Sha3_256, //Algorithm used for lock keyword generation
  secret, //Lock keyword
  bob.address, //Forwarding address to unlock:Bob
  networkType,
).setMaxFee(100);

signedLockTx = alice.sign(lockTx, generationHash);
await txRepo.announce(signedLockTx).toPromise();
```

鎖定哈希算法如下

```js
{0: 'Op_Sha3_256', 1: 'Op_Hash_160', 2: 'Op_Hash_256'}
```

鎖定時，解鎖目的地由Bob指定，因此即使Bob以外的賬戶解鎖交易，也無法更改目的地賬戶（Bob）。

最長鎖定期為 365 天（以天為單位計算區塊數）。

檢查已批准的交易。

```js
slRepo = repo.createSecretLockRepository();
res = await slRepo.search({ secret: secret }).toPromise();
console.log(res.data[0]);
```

###### 市例演示

```js
> SecretLockInfo
    amount: UInt64 {lower: 1000000, higher: 0}
    compositeHash: "770F65CB0CC0CA17370DE961B2AA5B48B8D86D6DB422171AB00DF34D19DEE2F1"
    endHeight: UInt64 {lower: 323495, higher: 0}
    hashAlgorithm: 0
    mosaicId: MosaicId {id: Id}
    ownerAddress: Address {address: 'TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ', networkType: 152}
    recipientAddress: Address {address: 'TBTWKXCNROT65CJHEBPL7F6DRHX7UKSUPD7EUGA', networkType: 152}
    recordId: "6260A1D3205E94BEA3D9E3E9"
    secret: "F260BFB53478F163EE61EE3E5FB7CFCAF7F0B663BC9DD4C537B958D4CE00E240"
    status: 0
    version: 1
```

這表明鎖定交易的 Alice 被記錄在 ownerAddress 中，而 Bob 被記錄在 recipientAddress 中。
有關秘密的信息被公佈，Bob 將相應的證明通知網絡。

### 秘密證明

使用秘密證明解鎖交易。 Bob一定是提前拿到了秘密證明。

```js
proofTx = sym.SecretProofTransaction.create(
  sym.Deadline.create(epochAdjustment),
  sym.LockHashAlgorithm.Op_Sha3_256, //Algorithm used for lock keyword generation
  secret, //Lock keyword
  bob.address, //Deactivated accounts (receiving accounts)
  proof, //Unlock keyword
  networkType,
).setMaxFee(100);

signedProofTx = bob.sign(proofTx, generationHash);
await txRepo.announce(signedProofTx).toPromise();
```

確認審批結果。

```js
txInfo = await txRepo
  .getTransaction(signedProofTx.hash, sym.TransactionGroup.Confirmed)
  .toPromise();
console.log(txInfo);
```

###### 市例演示

```js
> SecretProofTransaction
  > deadline: Deadline {adjustedValue: 12669305546}
    hashAlgorithm: 0
    maxFee: UInt64 {lower: 20700, higher: 0}
    networkType: 152
    payloadSize: 207
    proof: "A6431E74005585779AD5343E2AC5E9DC4FB1C69E"
    recipientAddress: Address {address: 'TBTWKXCNROT65CJHEBPL7F6DRHX7UKSUPD7EUGA', networkType: 152}
    secret: "4C116F32D986371D6BCC44CE64C970B6567686E79850E4A4112AF869580B7C3C"
    signature: "951F440860E8F24F6F3AB8EC670A3D448B12D75AB954012D9DB70030E31DA00B965003D88B7B94381761234D5A66BE989B5A8009BB234716CA3E5847C33F7005"
    signer: PublicAccount {publicKey: '9DC9AE081DF2E76554084DFBCCF2BC992042AA81E8893F26F8504FCED3692CFB', address: Address}
  > transactionInfo: TransactionInfo
        hash: "85044FF702A6966AB13D05DBE4AC4C3A13520C7381F32540429987C207B2056B"
        height: UInt64 {lower: 323805, higher: 0}
        id: "6260CC7F60EE2B0EA10CCEDA"
        merkleComponentHash: "85044FF702A6966AB13D05DBE4AC4C3A13520C7381F32540429987C207B2056B"
    type: 16978
```

秘密證明交易不包含任何接收到的代幣數量的信息。請在區塊生成時創建的收據中檢查數量。搜索收據地址為 Bob，收據類型為 LockHash_Completed。

```js
receiptRepo = repo.createReceiptRepository();

receiptInfo = await receiptRepo
  .searchReceipts({
    receiptType: sym.ReceiptTypeLockHash_Completed,
    targetAddress: bob.address,
  })
  .toPromise();
console.log(receiptInfo.data);
```

###### 市例演示

```js
> data: Array(1)
  >  0: TransactionStatement
        height: UInt64 {lower: 323805, higher: 0}
     >  receipts: Array(1)
          > 0: BalanceChangeReceipt
                amount: UInt64 {lower: 1000000, higher: 0}
            > mosaicId: MosaicId
                  id: Id {lower: 760461000, higher: 981735131}
              targetAddress: Address {address: 'TBTWKXCNROT65CJHEBPL7F6DRHX7UKSUPD7EUGA', networkType: 152}
              type: 8786
```

收據類型如下：

```js
{4685: 'Mosaic_Rental_Fee', 4942: 'Namespace_Rental_Fee', 8515: 'Harvest_Fee', 8776: 'LockHash_Completed', 8786: 'LockSecret_Completed', 9032: 'LockHash_Expired', 9042: 'LockSecret_Expired', 12616: 'LockHash_Created', 12626: 'LockSecret_Created', 16717: 'Mosaic_Expired', 16718: 'Namespace_Expired', 16974: 'Namespace_Deleted', 20803: 'Inflation', 57667: 'Transaction_Group', 61763: 'Address_Alias_Resolution', 62019: 'Mosaic_Alias_Resolution'}

8786: 'LockSecret_Completed' : LockSecret is completed
9042: 'LockSecret_Expired'　：LockSecret is expired
```

## 8.3 使用提示

### 支付交易費用

一般而言，區塊鏈要求在發送交易時支付交易費用。因此，想要使用區塊鏈的使用者需要事先從交易所獲取該鏈的本地貨幣（例如 Symbol 的本地貨幣 XYM）來支付費用。如果使用者是一家公司，從運營角度來看，這樣的管理方式可能會成為一個問題。使用聚合交易，服務提供商可以代表使用者支付秘密鎖定和交易費用。

### 預定交易

在指定數量的塊後，秘密鎖將退還給創建交易的帳戶。
當服務提供商為 Secret Lock 賬戶收取鎖的費用時，用戶擁有的鎖的代幣數量將在到期日後增加。 另一方面，在截止日期之前宣布秘密證明交易將被視為取消，因為交易已完成並且資金將退還給服務提供商。

### 原子互換

秘密鎖定可以用於與其他鏈進行代幣交換。請注意，其他鏈將其稱為哈希時間鎖定合約（HTLC），不要與 Symbol 的哈希鎖定混淆。
