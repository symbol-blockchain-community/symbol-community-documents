# 9. 多重签名
Symbol帐户可以转换为多重签名。


### 积分

多重签名账户最多可以有 25 个共同签署人。一个帐户最多可以是 25 个多重签名帐户的共同签名者。多重签名账户可以是分层的，最多由 3 个级别组成。本章介绍单级多重签名。

## 9.0 准备一个帐户
创建本章示例源代码中使用的帐户并输出每个密钥。
请注意，本章中的 Bob 多签帐户将无法使用，如果 Carol 的私钥遗失。


```js
bob = sym.Account.generateNewAccount(networkType);
carol1 = sym.Account.generateNewAccount(networkType);
carol2 = sym.Account.generateNewAccount(networkType);
carol3 = sym.Account.generateNewAccount(networkType);
carol4 = sym.Account.generateNewAccount(networkType);
carol5 = sym.Account.generateNewAccount(networkType);
console.log(bob.privateKey);
console.log(carol1.privateKey);
console.log(carol2.privateKey);
console.log(carol3.privateKey);
console.log(carol4.privateKey);
console.log(carol5.privateKey);
```

使用测试网时，应该在 bob 和 carol1 帐户中提供相当于来自水龙头的网络费用。

- 水龙头
    - https://testnet.symbol.tools/

##### 输出网址(URL)

```js
console.log("https://testnet.symbol.tools/?recipient=" + bob.address.plain() +"&amount=20");
console.log("https://testnet.symbol.tools/?recipient=" + carol1.address.plain() +"&amount=20");
```

## 9.1 多重签名注册

Symbol 在设置多重签名时不需要创建新帐户。相反，可以为现有帐户指定共同签署人。
创建多重签名账户需要指定为共同签署人的账户的同意签名（选择加入）。聚合交易用于确认这一点。

```js
multisigTx = sym.MultisigAccountModificationTransaction.create(
    undefined, 
    3, //minApproval:Minimum number of signatories required for approval
    3, //minRemoval:Minimum number of signatories required for expulsion
    [
        carol1.address,carol2.address,carol3.address,carol4.address
    ], //Additional target address list
    [],//Reemoved address list
    networkType
);
aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    [//The public key of the multisig account
      multisigTx.toAggregate(bob.publicAccount),
    ],
    networkType,[]
).setMaxFeeForAggregate(100, 4); //Number of co-signatories to the second argument:4
signedTx =  aggregateTx.signTransactionWithCosignatories(
    bob, //Multisig account
    [carol1,carol2,carol3,carol4], //Accounts specified as being added or removed
    generationHash,
);
await txRepo.announce(signedTx).toPromise();
```

## 9.2 确认

### 多重签名账户的确认
```js
msigRepo = repo.createMultisigRepository();
multisigInfo = await msigRepo.getMultisigAccountInfo(bob.address).toPromise();
console.log(multisigInfo);
```
###### 市例演示
```js
> MultisigAccountInfo 
    accountAddress: Address {address: 'TCOMA5VG67TZH4X55HGZOXOFP7S232CYEQMOS7Q', networkType: 152}
  > cosignatoryAddresses: Array(4)
        0: Address {address: 'TBAFGZOCB7OHZCCYYV64F2IFZL7SOOXNDHFS5NY', networkType: 152}
        1: Address {address: 'TB3XP4GQK6XH2SSA2E2U6UWCESNACK566DS4COY', networkType: 152}
        2: Address {address: 'TCV67BMTD2JMDQOJUDQHBFJHQPG4DAKVKST3YJI', networkType: 152}
	3: Address {address: 'TDWGG6ZWCGS5AHFTF5FDB347HIMII57PK46AIDA', networkType: 152}
    minApproval: 3
    minRemoval: 3
    multisigAddresses: []
```

这表明 cosignatoryAddresses 被注册为共同签名人。此外，minApproval:3 表示执行交易所需的签名数量为 3。 minRemoval:3 表示需要 3 个签名人才能删除一个共同签名人。


### 共同签名帐户的确认
```js
msigRepo = repo.createMultisigRepository();
multisigInfo = await msigRepo.getMultisigAccountInfo(carol1.address).toPromise();
console.log(multisigInfo);
```
###### 市例演示
```
> MultisigAccountInfo
    accountAddress: Address {address: 'TCV67BMTD2JMDQOJUDQHBFJHQPG4DAKVKST3YJI', networkType: 152}
    cosignatoryAddresses: []
    minApproval: 0
    minRemoval: 0
  > multisigAddresses: Array(1)
        0: Address {address: 'TCOMA5VG67TZH4X55HGZOXOFP7S232CYEQMOS7Q', networkType: 152}
```

它表明该帐户是 multisigAddresses 的联署人。

## 9.3 多重签名

从多重签名帐户发送马赛克。

### 使用聚合完成交易进行转移

在聚合完成交易的情况下，交易是在收集到所有联署人的签名之后创建的，然后再向节点公布。

```js
tx = sym.TransferTransaction.create(
    undefined,
    alice.address, 
    [new sym.Mosaic(new sym.NamespaceId("symbol.xym"),sym.UInt64.fromUint(1000000))],
    sym.PlainMessage.create('test'),
    networkType
);
aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
     [//The public key of the multisig account
       tx.toAggregate(bob.publicAccount)
     ],
    networkType,[],
).setMaxFeeForAggregate(100, 2); //Number of co-signatories to the second argument:2
signedTx =  aggregateTx.signTransactionWithCosignatories(
    carol1, //Transaction creator
    [carol2,carol3],　//Cosignatories
    generationHash,
);
await txRepo.announce(signedTx).toPromise();
```

### 使用聚合保税交易进行转移

聚合保税交易可以在不指定共同签名者的情况下进行公告。它通过声明将使用哈希锁定预先存储该交易来完成，共同签名者在该交易存储在网络上后进一步签署该交易。

```js
tx = sym.TransferTransaction.create(
    undefined,
    alice.address, //Transfer to Alice
    [new sym.Mosaic(new sym.NamespaceId("symbol.xym"),sym.UInt64.fromUint(1000000))], //1XYM
    sym.PlainMessage.create('test'),
    networkType
);
aggregateTx = sym.AggregateTransaction.createBonded(
    sym.Deadline.create(epochAdjustment),
     [ //The public key of the multisig account
       tx.toAggregate(bob.publicAccount)
     ],
    networkType,[],
).setMaxFeeForAggregate(100, 0); //Number of co-signatories to the second argument:0
signedAggregateTx = carol1.sign(aggregateTx, generationHash);
hashLockTx = sym.HashLockTransaction.create(
  sym.Deadline.create(epochAdjustment),
	new sym.Mosaic(new sym.NamespaceId("symbol.xym"),sym.UInt64.fromUint(10 * 1000000)), //Fixed value:10XYM
	sym.UInt64.fromUint(480),
	signedAggregateTx,
	networkType
).setMaxFee(100);
signedLockTx = carol1.sign(hashLockTx, generationHash);
//Announce Hashlock TX
await txRepo.announce(signedLockTx).toPromise();
```

```js
//Announces bonded TX after confirming approval of hashlocks
await txRepo.announceAggregateBonded(signedAggregateTx).toPromise();
```
当一个节点知道一个绑定交易时，它将是一个部分签名状态，并将使用第 8 章“锁定”中介绍的共同签名使用多重签名帐户进行签名。也可以通过支持共同签名的钱包来确认。


## 9.4 确认多重签名转移

检查多重签名转账交易的结果。

```js
txInfo = await txRepo.getTransaction(signedTx.hash,sym.TransactionGroup.Confirmed).toPromise();
console.log(txInfo);
```
###### 市例演示
```js
> AggregateTransaction
  > cosignatures: Array(2)
        0: AggregateTransactionCosignature
            signature: "554F3C7017C32FD4FE67C1E5E35DD21D395D44742B43BD1EF99BC8E9576845CDC087B923C69DB2D86680279253F2C8A450F97CC7D3BCD6E86FE4E70135D44B06"
            signer: PublicAccount
                address: Address {address: 'TB3XP4GQK6XH2SSA2E2U6UWCESNACK566DS4COY', networkType: 152}
                publicKey: "A1BA266B56B21DC997D637BCC539CCFFA563ABCB34EAA52CF90005429F5CB39C"
        1: AggregateTransactionCosignature
            signature: "AD753E23D3D3A4150092C13A410D5AB373B871CA74D1A723798332D70AD4598EC656F580CB281DB3EB5B9A7A1826BAAA6E060EEA3CC5F93644136E9B52006C05"
            signer: PublicAccount
                address: Address {address: 'TBAFGZOCB7OHZCCYYV64F2IFZL7SOOXNDHFS5NY', networkType: 152}
                publicKey: "B00721EDD76B24E3DDCA13555F86FC4BDA89D413625465B1BD7F347F74B82FF0"
    deadline: Deadline {adjustedValue: 12619660047}
  > innerTransactions: Array(1)
      > 0: TransferTransaction
            deadline: Deadline {adjustedValue: 12619660047}
            maxFee: UInt64 {lower: 48000, higher: 0}
            message: PlainMessage {type: 0, payload: 'test'}
            mosaics: [Mosaic]
            networkType: 152
            payloadSize: undefined
            recipientAddress: Address {address: 'TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ', networkType: 152}
            signature: "670EA8CFA4E35604DEE20877A6FC95C2786D748A8449CE7EEA7CB941FE5EC181175B0D6A08AF9E99955640C872DAD0AA68A37065C866EE1B651C3CE28BA95404"
            signer: PublicAccount
                address: Address {address: 'TCOMA5VG67TZH4X55HGZOXOFP7S232CYEQMOS7Q', networkType: 152}
                publicKey: "4667BC99B68B6CA0878CD499CE89CDEB7AAE2EE8EB96E0E8656386DECF0AD657"
            transactionInfo: AggregateTransactionInfo {height: UInt64, index: 0, id: '62600A8C0A21EB5CD28679A4', hash: undefined, merkleComponentHash: undefined, …}
            type: 16724
    maxFee: UInt64 {lower: 48000, higher: 0}
    networkType: 152
    payloadSize: 480
    signature: "670EA8CFA4E35604DEE20877A6FC95C2786D748A8449CE7EEA7CB941FE5EC181175B0D6A08AF9E99955640C872DAD0AA68A37065C866EE1B651C3CE28BA95404"
  > signer: PublicAccount
        address: Address {address: 'TCV67BMTD2JMDQOJUDQHBFJHQPG4DAKVKST3YJI', networkType: 152}
        publicKey: "FF9595FDCD983F46FF9AE0F7D86D94E9B164E385BD125202CF16528F53298656"
  > transactionInfo: 
        hash: "AA99F8F4000F989E6F135228829DB66AEB3B3C4B1F06BA77D373D042EAA4C8DA"
        height: UInt64 {lower: 322376, higher: 0}
        id: "62600A8C0A21EB5CD28679A3"
        merkleComponentHash: "1FD6340BCFEEA138CC6305137566B0B1E98DEDE70E79CC933665FE93E10E0E3E"
    type: 16705
```

- 多重签名账户
    - Bob
        - AggregateTransaction.innerTransactions[0].signer.address
            - TCOMA5VG67TZH4X55HGZOXOFP7S232CYEQMOS7Q
- Creator's 帐户
    - Carol1
        - AggregateTransaction.signer.address
            - TCV67BMTD2JMDQOJUDQHBFJHQPG4DAKVKST3YJI
- 签署者帐户
    - Carol2
        - AggregateTransaction.cosignatures[0].signer.address
            - TB3XP4GQK6XH2SSA2E2U6UWCESNACK566DS4COY
    - Carol3
        - AggregateTransaction.cosignatures[1].signer.address
            - TBAFGZOCB7OHZCCYYV64F2IFZL7SOOXNDHFS5NY

## 9.5 修改多重签名账户最低批准

### 编辑多重签名配置

为了减少共同签名者的数量，可以指定要移除的地址，并调整共同签名者的数量，以确保不超过最小签名者的数量，然后公告该交易。不需要将要移除的帐户包括在共同签名者中。

```js
multisigTx = sym.MultisigAccountModificationTransaction.create(
    undefined, 
    -1, //Minimum incremental number of signatories required for approval
    -1, //Minimum incremental number of signatories required for remove
    [], //Additional target address
    [carol3.address],//Address to removing
    networkType
);
aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    [ //Specify the public key of the multisig account which configuration you want to change
      multisigTx.toAggregate(bob.publicAccount),
    ],
    networkType,[]    
).setMaxFeeForAggregate(100, 1); //Number of co-signatories to the second argument:1
signedTx =  aggregateTx.signTransactionWithCosignatories(
    carol1,
    [carol2],
    generationHash,
);
await txRepo.announce(signedTx).toPromise();
```

### 更换共同签名者

要替换共同签名者，请指定要添加的地址和要删除的地址。
始终需要新的额外指定帐户的共同签名。

```js
multisigTx = sym.MultisigAccountModificationTransaction.create(
    undefined, 
    0, //Minimum incremental number of signatories required for approval
    0, //Minimum incremental number of signatories required for remove
    [carol5.address], //Additional target address
    [carol4.address], //Address to removing
    networkType
);
aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    [ //Specify the public key of the multisig account which configuration you want to change
      multisigTx.toAggregate(bob.publicAccount),
    ],
    networkType,[]    
).setMaxFeeForAggregate(100, 2); //Number of co-signatories to the second argument:
signedTx =  aggregateTx.signTransactionWithCosignatories(
    carol1, //Transaction creator
    [carol2,carol5], //Cosignatory + Consent account
    generationHash,
);
await txRepo.announce(signedTx).toPromise();
```

## 9.6 使用提示

### 多重身份验证

私钥的管理可以分布在多个终端上。使用多重签名可以确保在密钥丢失或受到攻击的情况下进行安全恢复。如果密钥丢失，则用户可以通过共同签名者访问资金，如果密钥被盗，则攻击者无法在未经共同签名者批准的情况下转移资金。

### 帐户所有权

一个多重签署帐户的私钥被停用，除非在该帐户上删除多重签署，否则将无法再发送马赛克。如第五章 马赛克 所述，拥有资产的意思是「有能力随时放弃」，因此可以说多重签署帐户的资产拥有者是共同签署者。 Symbol 允许在多重签署配置中替换共同签署者，因此帐户所有权可以安全地转移到另一个共同签署者手中。

### 工作流程

Symbol 允许您配置最多 3 个级别的多重签名（multi-level multisig）。
使用多级多重签名帐户可防止使用被盗的备份密钥来完成多重签名，或仅使用批准人和审计员来完成签名。
这允许将区块链上存在的交易作为满足某些操作和条件的证据。
