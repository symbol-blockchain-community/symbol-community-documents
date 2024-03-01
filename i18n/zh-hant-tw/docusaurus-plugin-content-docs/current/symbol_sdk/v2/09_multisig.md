# 9.多重簽名
Symbol帳戶可以轉換為多重簽名。


### 積分

多重簽名賬戶最多可以有 25 個共同簽署人。 一個帳戶最多可以是 25 個多重簽名帳戶的共同簽名者。 多重簽名賬戶可以是分層的，最多由 3 個級別組成。 本章介紹單級多重簽名。

## 9.0 準備一個帳戶
創建本章示例源代碼中使用的帳戶並輸出每個密鑰。
請注意，本章中的 Bob 多簽帳戶將無法使用，如果 Carol 的私鑰遺失。


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

使用測試網時，應該在 bob 和 carol1 帳戶中提供相當於來自水龍頭的網絡費用。

- 水龍頭
    - https://testnet.symbol.tools/

##### 輸出網址(URL)

```js
console.log("https://testnet.symbol.tools/?recipient=" + bob.address.plain() +"&amount=20");
console.log("https://testnet.symbol.tools/?recipient=" + carol1.address.plain() +"&amount=20");
```

## 9.1 多重簽名註冊

Symbol 在設置多重簽名時不需要創建新帳戶。 相反，可以為現有帳戶指定共同簽署人。
創建多重簽名賬戶需要指定為共同簽署人的賬戶的同意簽名（選擇加入）。 聚合交易用於確認這一點。

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

## 9.2 確認

### 多重簽名賬戶的確認
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

這表明 cosignatoryAddresses 被註冊為共同簽名人。此外，minApproval:3 表示執行交易所需的簽名數量為 3。minRemoval:3 表示需要 3 個簽名人才能刪除一個共同簽名人。


### 共同簽名帳戶的確認
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

它表明該帳戶是 multisigAddresses 的聯署人。

## 9.3 多重簽名

從多重簽名帳戶發送馬賽克。

### 使用聚合完成交易進行轉移

在聚合完成交易的情況下，交易是在收集到所有聯署人的簽名之後創建的，然後再向節點公佈。

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

### 使用聚合保稅交易進行轉移

聚合保稅交易可以在不指定共同簽名者的情況下進行公告。它通過聲明將使用哈希鎖定預先存儲該交易來完成，共同簽名者在該交易存儲在網絡上後進一步簽署該交易。

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
當一個節點知道一個綁定交易時，它將是一個部分簽名狀態，並將使用第 8 章“鎖定”中介紹的共同簽名使用多重簽名帳戶進行簽名。 也可以通過支持共同簽名的錢包來確認。


## 9.4 確認多重簽名轉移

檢查多重簽名轉賬交易的結果。

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

- 多重簽名賬戶
    - Bob
        - AggregateTransaction.innerTransactions[0].signer.address
            - TCOMA5VG67TZH4X55HGZOXOFP7S232CYEQMOS7Q
- Creator's 帳戶
    - Carol1
        - AggregateTransaction.signer.address
            - TCV67BMTD2JMDQOJUDQHBFJHQPG4DAKVKST3YJI
- 簽署者帳戶
    - Carol2
        - AggregateTransaction.cosignatures[0].signer.address
            - TB3XP4GQK6XH2SSA2E2U6UWCESNACK566DS4COY
    - Carol3
        - AggregateTransaction.cosignatures[1].signer.address
            - TBAFGZOCB7OHZCCYYV64F2IFZL7SOOXNDHFS5NY

## 9.5 修改多重簽名賬戶最低批准

### 編輯多重簽名配置

為了減少共同簽名者的數量，可以指定要移除的地址，並調整共同簽名者的數量，以確保不超過最小簽名者的數量，然後公告該交易。不需要將要移除的帳戶包括在共同簽名者中。

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

### 更換共同簽名者

要替換共同簽名者，請指定要添加的地址和要刪除的地址。
始終需要新的額外指定帳戶的共同簽名。

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

### 多重身份驗證

私鑰的管理可以分佈在多個終端上。使用多重簽名可以確保在密鑰丟失或受到攻擊的情況下進行安全恢復。如果密鑰丟失，則用戶可以通過共同簽名者訪問資金，如果密鑰被盜，則攻擊者無法在未經共同簽名者批准的情況下轉移資金。

### 帳戶所有權

一個多重簽署帳戶的私鑰被停用，除非在該帳戶上刪除多重簽署，否則將無法再發送馬賽克。如第五章 馬賽克 所述，擁有資產的意思是「有能力隨時放棄」，因此可以說多重簽署帳戶的資產擁有者是共同簽署者。Symbol 允許在多重簽署配置中替換共同簽署者，因此帳戶所有權可以安全地轉移到另一個共同簽署者手中。

### 工作流程

Symbol 允許您配置最多 3 個級別的多重簽名（multi-level multisig）。
使用多級多重簽名帳戶可防止使用被盜的備份密鑰來完成多重簽名，或僅使用批准人和審計員來完成簽名。
這允許將區塊鏈上存在的交易作為滿足某些操作和條件的證據。
