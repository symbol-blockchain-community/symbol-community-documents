# 8.锁定

区块链有两种锁定交易：哈希锁定交易和秘密锁定交易。  

## 8.1 哈希锁 Hash Lock

哈希锁定交易可以让交易在稍后公布。交易会以哈希值的形式存储在每个节点的部分快取中，直到交易被公布。交易被锁定，在 API 节点上不进行处理，直到它被所有共同签署者签署。它不会锁定帐户所拥有的代币，但交易发起者需要支付10 XYM的押金。当哈希锁定交易完全签署时，被锁定的资金将退还给发起交易的帐户。哈希锁定交易的最大有效期为约48小时，如果交易在此期限内未完成，则10 XYM押金将会丢失。


### 创建聚合绑定交易。

```js
bob = sym.Account.generateNewAccount(networkType);

tx1 = sym.TransferTransaction.create(
    undefined,
    bob.address,  //Send to Bob
    [ //1XYM
      new sym.Mosaic(
        new sym.NamespaceId("symbol.xym"),
        sym.UInt64.fromUint(1000000)
      )
    ],
    sym.EmptyMessage, //mptyMessage
    networkType
);

tx2 = sym.TransferTransaction.create(
    undefined,
    alice.address,  //Send to Alice
    [],
    sym.PlainMessage.create('thank you!'), //Message
    networkType
);

aggregateArray = [
    tx1.toAggregate(alice.publicAccount), //Sent from Alice
    tx2.toAggregate(bob.publicAccount), //Sent from  Bob
]

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


当两笔交易 tx1 和 tx2 排列在 AggregateArray 中时，指定发送方账户的公钥。参考账户章节通过API提前获取公钥。在区块批准期间，按此顺序验证排列的交易的完整性。

例如，可以在交易1中从 Alice 发送一个 NFT 给 Bob，然后在交易2中从 Bob 发送给 Carol，但如果更改汇总交易的顺序为交易2、交易1，将导致错误。此外，如果汇总交易中有任何不一致的交易，整个汇总交易将失败，并且不会被批准进入区块链。

### 哈希锁交易的创建、签署和公告
```js
//Creation of Hash Lock TX
hashLockTx = sym.HashLockTransaction.create(
  sym.Deadline.create(epochAdjustment),
    new sym.Mosaic(new sym.NamespaceId("symbol.xym"),sym.UInt64.fromUint(10 * 1000000)), //10xym by default
    sym.UInt64.fromUint(480), // Lock expiry date
    signedAggregateTx,// Register this hash value
    networkType
).setMaxFee(100);

//Signature
signedLockTx = alice.sign(hashLockTx, generationHash);

//Announcing Hash Lock TX
await txRepo.announce(signedLockTx).toPromise();
```

### 聚合绑定交易的公告

与例如检查后 Explorer，向网络宣布保税交易。
```js
await txRepo.announceAggregateBonded(signedAggregateTx).toPromise();
```


### 联署
从指定账户 (Bob) 共同签署锁定的交易。

```js
txInfo = await txRepo.getTransaction(signedAggregateTx.hash,sym.TransactionGroup.Partial).toPromise();
cosignatureTx = sym.CosignatureTransaction.create(txInfo);
signedCosTx = bob.signCosignatureTransaction(cosignatureTx);
await txRepo.announceAggregateBondedCosignature(signedCosTx).toPromise();
```

### 参考资料
哈希锁交易可以由任何人创建和公布，而不仅仅是最初创建和签署交易的帐户。但要确保聚合交易包括该账户是签名者的交易。没有马赛克传输和没有消息的虚拟交易是有效的。


## 8.2 秘密锁・秘密证明

秘密锁定交易是指事先建立一个共同的密码，并将指定的代币锁定起来。如果接收者能够在锁定到期日期之前证明自己拥有密码，那么他们就可以接收到被锁定的代币。

本节介绍 Alice 如何锁定 1XYM，Bob 如何解锁交易以接收资金。

首先，创建一个 Bob 帐户与 Alice 进行交互。
Bob需要公布交易才能解锁交易，请向水龙头索取10XYM。

```js
bob = sym.Account.generateNewAccount(networkType);
console.log(bob.address);

//FAUCET URL outlet
console.log("https://testnet.symbol.tools/?recipient=" + bob.address.plain() +"&amount=10");
```

### 秘密锁

创建用于锁定和解锁的通用通行证。

```js
sha3_256 = require('/node_modules/js-sha3').sha3_256;

random = sym.Crypto.randomBytes(20);
hash = sha3_256.create();
secret = hash.update(random).hex(); //Lock keyword
proof = random.toString('hex'); //Unlock keyword
console.log("secret:" + secret);
console.log("proof:" + proof);
```

###### 市例演示
```js
> secret:f260bfb53478f163ee61ee3e5fb7cfcaf7f0b663bc9dd4c537b958d4ce00e240
  proof:7944496ac0f572173c2549baf9ac18f893aab6d0
```

创建、签署和宣布交易
```js
lockTx = sym.SecretLockTransaction.create(
    sym.Deadline.create(epochAdjustment),
    new sym.Mosaic(
      new sym.NamespaceId("symbol.xym"),
      sym.UInt64.fromUint(1000000) //1XYM
    ), //Mosaic to lock
    sym.UInt64.fromUint(480), //Locking period (number of blocks)
    sym.LockHashAlgorithm.Op_Sha3_256, //Algorithm used for lock keyword generation
    secret, //Lock keyword
    bob.address, //Forwarding address to unlock:Bob
    networkType
).setMaxFee(100);

signedLockTx = alice.sign(lockTx,generationHash);
await txRepo.announce(signedLockTx).toPromise();
```

锁定哈希算法如下
```js
{0: 'Op_Sha3_256', 1: 'Op_Hash_160', 2: 'Op_Hash_256'}
```

锁定时，解锁目的地由Bob指定，因此即使Bob以外的账户解锁交易，也无法更改目的地账户（Bob）。

最长锁定期为 365 天（以天为单位计算区块数）。

检查已批准的交易。
```js
slRepo = repo.createSecretLockRepository();
res = await slRepo.search({secret:secret}).toPromise();
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
这表明锁定交易的 Alice 被记录在 ownerAddress 中，而 Bob 被记录在 recipientAddress 中。
有关秘密的信息被公布，Bob 将相应的证明通知网络。


### 秘密证明

使用秘密证明解锁交易。 Bob一定是提前拿到了秘密证明。


```js
proofTx = sym.SecretProofTransaction.create(
    sym.Deadline.create(epochAdjustment),
    sym.LockHashAlgorithm.Op_Sha3_256, //Algorithm used for lock keyword generation
    secret, //Lock keyword
    bob.address, //Deactivated accounts (receiving accounts)
    proof, //Unlock keyword
    networkType
).setMaxFee(100);

signedProofTx = bob.sign(proofTx,generationHash);
await txRepo.announce(signedProofTx).toPromise();
```

确认审批结果。
```js
txInfo = await txRepo.getTransaction(signedProofTx.hash,sym.TransactionGroup.Confirmed).toPromise();
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

秘密证明交易不包含任何接收到的代币数量的信息。请在区块生成时创建的收据中检查数量。搜索收据地址为 Bob，收据类型为 LockHash_Completed。


```js
receiptRepo = repo.createReceiptRepository();

receiptInfo = await receiptRepo.searchReceipts({
    receiptType:sym.ReceiptTypeLockHash_Completed,
    targetAddress:bob.address
}).toPromise();
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

收据类型如下：

```js
{4685: 'Mosaic_Rental_Fee', 4942: 'Namespace_Rental_Fee', 8515: 'Harvest_Fee', 8776: 'LockHash_Completed', 8786: 'LockSecret_Completed', 9032: 'LockHash_Expired', 9042: 'LockSecret_Expired', 12616: 'LockHash_Created', 12626: 'LockSecret_Created', 16717: 'Mosaic_Expired', 16718: 'Namespace_Expired', 16974: 'Namespace_Deleted', 20803: 'Inflation', 57667: 'Transaction_Group', 61763: 'Address_Alias_Resolution', 62019: 'Mosaic_Alias_Resolution'}

8786: 'LockSecret_Completed' : LockSecret is completed
9042: 'LockSecret_Expired'　：LockSecret is expired
```

## 8.3 使用提示


### 支付交易费用

一般而言，区块链要求在发送交易时支付交易费用。因此，想要使用区块链的使用者需要事先从交易所获取该链的本地货币（例如 Symbol 的本地货币 XYM）来支付费用。如果使用者是一家公司，从运营角度来看，这样的管理方式可能会成为一个问题。使用聚合交易，服务提供商可以代表使用者支付秘密锁定和交易费用。

### 预定交易

在指定数量的块后，秘密锁将退还给创建交易的帐户。
当服务提供商为 Secret Lock 账户收取锁的费用时，用户拥有的锁的代币数量将在到期日后增加。另一方面，在截止日期之前宣布秘密证明交易将被视为取消，因为交易已完成并且资金将退还给服务提供商。

### 原子互换
秘密锁定可以用于与其他链进行代币交换。请注意，其他链将其称为哈希时间锁定合约（HTLC），不要与 Symbol 的哈希锁定混淆。
