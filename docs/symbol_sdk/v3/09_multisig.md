---
sidebar_position: 9
---

# 9.マルチシグ化
アカウントのマルチシグ化について説明します。


### 注意事項

一つのマルチシグアカウントに登録できる連署者の数は25個です。
一つのアカウントは最大25個のマルチシグの連署者になれます。
マルチシグは最大3階層まで構成できます。
本書では1階層のマルチシグのみ解説します。

## 9.0 アカウントの準備
この章のサンプルソースコードで使用するアカウントを作成し、それぞれの秘密鍵を出力しておきます。
本章でマルチシグ化したアカウントBobは、Carolの秘密鍵を紛失すると使えなくなってしまうのでご注意ください。

#### v2

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

#### v3

```js
bobKey = new symbolSdk.symbol.KeyPair(symbolSdk.PrivateKey.random());
bobAddress = facade.network.publicKeyToAddress(bobKey.publicKey);
carol1Key = new symbolSdk.symbol.KeyPair(symbolSdk.PrivateKey.random());
carol1Address = facade.network.publicKeyToAddress(carol1Key.publicKey);
carol2Key = new symbolSdk.symbol.KeyPair(symbolSdk.PrivateKey.random());
carol2Address = facade.network.publicKeyToAddress(carol2Key.publicKey);
carol3Key = new symbolSdk.symbol.KeyPair(symbolSdk.PrivateKey.random());
carol3Address = facade.network.publicKeyToAddress(carol3Key.publicKey);
carol4Key = new symbolSdk.symbol.KeyPair(symbolSdk.PrivateKey.random());
carol4Address = facade.network.publicKeyToAddress(carol4Key.publicKey);
carol5Key = new symbolSdk.symbol.KeyPair(symbolSdk.PrivateKey.random());
carol5Address = facade.network.publicKeyToAddress(carol5Key.publicKey);

console.log(bobKey.privateKey.toString());
console.log(carol1Key.privateKey.toString());
console.log(carol2Key.privateKey.toString());
console.log(carol3Key.privateKey.toString());
console.log(carol4Key.privateKey.toString());
console.log(carol5Key.privateKey.toString());
```

テストネットの場合はFAUCETでネットワーク手数料分をbobとcarol1に補給しておきます。

- Faucet
    - https://testnet.symbol.tools/

##### URL出力

#### v2

```js
console.log("https://testnet.symbol.tools/?recipient=" + bob.address.plain() +"&amount=20");
console.log("https://testnet.symbol.tools/?recipient=" + carol1.address.plain() +"&amount=20");
```

#### v3

```js
console.log("https://testnet.symbol.tools/?recipient=" + bobAddress.toString() +"&amount=20");
console.log("https://testnet.symbol.tools/?recipient=" + carol1Address.toString() +"&amount=20");
```

## 9.1 マルチシグの登録

Symbolではマルチシグアカウントを新規に作成するのではなく、既存アカウントについて連署者を指定してマルチシグ化します。
マルチシグ化には連署者に指定されたアカウントの承諾署名(オプトイン)が必要なため、アグリゲートトランザクションを使用します。

#### v2

```js
multisigTx = sym.MultisigAccountModificationTransaction.create(
    undefined, 
    3, //minApproval:承認のために必要な最小署名者数増分
    3, //minRemoval:除名のために必要な最小署名者数増分
    [
        carol1.address,carol2.address,carol3.address,carol4.address
    ], //追加対象アドレスリスト
    [],//除名対象アドレスリスト
    networkType
);

aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    [//マルチシグ化したいアカウントの公開鍵を指定
      multisigTx.toAggregate(bob.publicAccount),
    ],
    networkType,[]
).setMaxFeeForAggregate(100, 4); // 第二引数に連署者の数:4

signedTx =  aggregateTx.signTransactionWithCosignatories(
    bob, //マルチシグ化したいアカウント
    [carol1,carol2,carol3,carol4], //追加・除外対象として指定したアカウント
    generationHash,
);
await txRepo.announce(signedTx).toPromise();
```

#### v3

```js
// マルチシグ設定Tx作成
multisigTx = facade.transactionFactory.createEmbedded({
  type: 'multisig_account_modification_transaction_v1', // Txタイプ:マルチシグ設定Tx
  signerPublicKey: bobKey.publicKey,  // マルチシグ化したいアカウントの公開鍵を指定
  minApprovalDelta: 3,  // minApproval:承認のために必要な最小署名者数増分
  minRemovalDelta: 3,   // minRemoval:除名のために必要な最小署名者数増分
  addressAdditions: [   // 追加対象アドレスリスト
    carol1Address,
    carol2Address,
    carol3Address,
    carol4Address,
  ],
  addressDeletions: []  // 除名対象アドレスリスト
});

// マークルハッシュの算出
embeddedTransactions = [
  multisigTx
];
merkleHash = facade.constructor.hashEmbeddedTransactions(embeddedTransactions);

// アグリゲートTx作成
aggregateTx = facade.transactionFactory.create({
  type: 'aggregate_complete_transaction_v2',
  signerPublicKey: bobKey.publicKey,  // マルチシグ化したいアカウントの公開鍵を指定
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  transactionsHash: merkleHash,
  transactions: embeddedTransactions
});

// 連署により追加される連署情報のサイズを追加して最終的なTxサイズを算出する
requiredCosignatures = 4; // 連署者の数:4
calculatedCosignatures = requiredCosignatures > aggregateTx.cosignatures.length ? requiredCosignatures : aggregateTx.cosignatures.length;
sizePerCosignature = 8 + 32 + 64;
calculatedSize = aggregateTx.size - aggregateTx.cosignatures.length * sizePerCosignature + calculatedCosignatures * sizePerCosignature;
aggregateTx.fee = new symbolSdk.symbol.Amount(BigInt(calculatedSize * 100)); //手数料

// マルチシグ化したいアカウントによる署名
sig = facade.signTransaction(bobKey, aggregateTx);
jsonPayload = facade.transactionFactory.constructor.attachSignature(aggregateTx, sig);

// 追加・除外対象として指定したアカウントによる連署
coSig1 = facade.cosignTransaction(carol1Key, aggregateTx, false);
aggregateTx.cosignatures.push(coSig1);
coSig2 = facade.cosignTransaction(carol2Key, aggregateTx, false);
aggregateTx.cosignatures.push(coSig2);
coSig3 = facade.cosignTransaction(carol3Key, aggregateTx, false);
aggregateTx.cosignatures.push(coSig3);
coSig4 = facade.cosignTransaction(carol4Key, aggregateTx, false);
aggregateTx.cosignatures.push(coSig4);

// アナウンス
await fetch(
  new URL('/transactions', NODE),
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({"payload": symbolSdk.utils.uint8ToHex(aggregateTx.serialize())}),
  }
)
.then((res) => res.json())
.then((json) => {
  return json;
});
```

## 9.2 確認

### マルチシグ化したアカウントの確認

#### v2

```js
msigRepo = repo.createMultisigRepository();

multisigInfo = await msigRepo.getMultisigAccountInfo(bob.address).toPromise();
console.log(multisigInfo);
```
###### 出力例
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

#### v3

```js
multisigInfo = await fetch(
  new URL('/account/' + bobAddress.toString() + '/multisig', NODE),
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }
)
.then((res) => res.json())
.then((json) => {
  return json.account;
});
console.log(multisigInfo);
```

###### 出力例

```js
> {version: 1, accountAddress: '9828118AF434E834DD45D3E449C3DA49804964416E254B7F', minApproval: 3, minRemoval: 3, cosignatoryAddresses: Array(4), …}
    accountAddress: "9828118AF434E834DD45D3E449C3DA49804964416E254B7F"
  > cosignatoryAddresses: Array(4)
      0: "9874440B7EF2C407445B05A0D8F3253D82F0D39FAA9CF1F6"
      1: "9877E194AC74C47FFDFEF6A5035CA7806F6EB5258377B6F4"
      2: "9898C50E14AF3AB8869A3A72D5C67BD31BF32EFFF3D6CA2E"
      3: "98E76E4AD1623DC4B3F357A29C9496EDD48E2830ABE0CFC3"
      length: 4
    minApproval: 3
    minRemoval: 3
    multisigAddresses: []
    version: 1
```

cosignatoryAddressesが連署者として登録されていることがわかります。
また、minApproval:3 によりトランザクションが成立するために必要な署名数3
minRemoval: 3により連署者を取り外すために必要な署名者数は3であることがわかります。

### 連署者アカウントの確認

#### v2

```js
msigRepo = repo.createMultisigRepository();

multisigInfo = await msigRepo.getMultisigAccountInfo(carol1.address).toPromise();
console.log(multisigInfo);
```
###### 出力例
```
> MultisigAccountInfo
    accountAddress: Address {address: 'TCV67BMTD2JMDQOJUDQHBFJHQPG4DAKVKST3YJI', networkType: 152}
    cosignatoryAddresses: []
    minApproval: 0
    minRemoval: 0
  > multisigAddresses: Array(1)
        0: Address {address: 'TCOMA5VG67TZH4X55HGZOXOFP7S232CYEQMOS7Q', networkType: 152}
```

#### v3

```js
multisigInfo = await fetch(
  new URL('/account/' + carol1Address.toString() + '/multisig', NODE),
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }
)
.then((res) => res.json())
.then((json) => {
  return json.account;
});
console.log(multisigInfo);
```

###### 出力例

```js
> {version: 1, accountAddress: '9898C50E14AF3AB8869A3A72D5C67BD31BF32EFFF3D6CA2E', minApproval: 0, minRemoval: 0, cosignatoryAddresses: Array(0), …}
    accountAddress: "9898C50E14AF3AB8869A3A72D5C67BD31BF32EFFF3D6CA2E"
    cosignatoryAddresses: []
    minApproval: 0
    minRemoval: 0
  > multisigAddresses: Array(1)
      0: "9828118AF434E834DD45D3E449C3DA49804964416E254B7F"
      length: 1
    version: 1
```

multisigAddresses に対して連署する権利を持っていることが分かります。

## 9.3 マルチシグ署名

マルチシグ化したアカウントからモザイクを送信します。

### アグリゲートコンプリートトランザクションで送信

アグリゲートコンプリートトランザクションの場合、ノードにアナウンスする前に連署者の署名を全て集めてからトランザクションを作成します。

#### v2

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
     [//マルチシグ化したアカウントの公開鍵を指定
       tx.toAggregate(bob.publicAccount)
     ],
    networkType,[],
).setMaxFeeForAggregate(100, 2); // 第二引数に連署者の数:2

signedTx =  aggregateTx.signTransactionWithCosignatories(
    carol1, //起案者
    [carol2,carol3],　//連署者
    generationHash,
);
await txRepo.announce(signedTx).toPromise();
```

#### v3

```js
namespaceIds = symbolSdk.symbol.generateNamespacePath("symbol.xym");
namespaceId = namespaceIds[namespaceIds.length - 1];

// アグリゲートTxに含めるTxを作成
tx = facade.transactionFactory.createEmbedded({
  type: 'transfer_transaction_v1',    // Txタイプ:転送Tx
  signerPublicKey: bobKey.publicKey,  // マルチシグ化したアカウントの公開鍵
  recipientAddress: aliceAddress.toString(),
  mosaics: [
    { mosaicId: namespaceId, amount: 1000000n },  // 1XYM送金
  ],
  message: new Uint8Array([0x00,...(new TextEncoder('utf-8')).encode('test')]) // 平文メッセージ
});

// マークルハッシュの算出
embeddedTransactions = [
  tx
];
merkleHash = facade.constructor.hashEmbeddedTransactions(embeddedTransactions);

// アグリゲートTx作成
aggregateTx = facade.transactionFactory.create({
  type: 'aggregate_complete_transaction_v2',
  signerPublicKey: carol1Key.publicKey,  // 起案者アカウントの公開鍵を指定
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  transactionsHash: merkleHash,
  transactions: embeddedTransactions
});

// 連署により追加される連署情報のサイズを追加して最終的なTxサイズを算出する
requiredCosignatures = 2; // 連署者の数:2
calculatedCosignatures = requiredCosignatures > aggregateTx.cosignatures.length ? requiredCosignatures : aggregateTx.cosignatures.length;
sizePerCosignature = 8 + 32 + 64;
calculatedSize = aggregateTx.size - aggregateTx.cosignatures.length * sizePerCosignature + calculatedCosignatures * sizePerCosignature;
aggregateTx.fee = new symbolSdk.symbol.Amount(BigInt(calculatedSize * 100)); //手数料

// 起案者アカウントによる署名
sig = facade.signTransaction(carol1Key, aggregateTx);
jsonPayload = facade.transactionFactory.constructor.attachSignature(aggregateTx, sig);

// 連署者アカウントによる連署
coSig2 = facade.cosignTransaction(carol2Key, aggregateTx, false);
aggregateTx.cosignatures.push(coSig2);
coSig3 = facade.cosignTransaction(carol3Key, aggregateTx, false);
aggregateTx.cosignatures.push(coSig3);

// アナウンス
await fetch(
  new URL('/transactions', NODE),
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({"payload": symbolSdk.utils.uint8ToHex(aggregateTx.serialize())}),
  }
)
.then((res) => res.json())
.then((json) => {
  return json;
});
```

### アグリゲートボンデッドトランザクションで送信

アグリゲートボンデッドトランザクションの場合は連署者を指定せずにアナウンスできます。
事前にハッシュロックでトランザクションを留め置きしておくことを宣言しておき、連署者がネットワーク上に留め置きされたトランザクションに追加署名することで完成となります。

#### v2

```js
tx = sym.TransferTransaction.create(
    undefined,
    alice.address, //Aliceへの送信
    [new sym.Mosaic(new sym.NamespaceId("symbol.xym"),sym.UInt64.fromUint(1000000))], //1XYM
    sym.PlainMessage.create('test'),
    networkType
);

aggregateTx = sym.AggregateTransaction.createBonded(
    sym.Deadline.create(epochAdjustment),
     [ //マルチシグ化したアカウントの公開鍵を指定
       tx.toAggregate(bob.publicAccount)
     ],
    networkType,[],
).setMaxFeeForAggregate(100, 2); // 第二引数に連署者の数:2

signedAggregateTx = carol1.sign(aggregateTx, generationHash);

hashLockTx = sym.HashLockTransaction.create(
  sym.Deadline.create(epochAdjustment),
	new sym.Mosaic(new sym.NamespaceId("symbol.xym"),sym.UInt64.fromUint(10 * 1000000)), //固定値:10XYM
	sym.UInt64.fromUint(480),
	signedAggregateTx,
	networkType
).setMaxFee(100);

signedLockTx = carol1.sign(hashLockTx, generationHash);

//ハッシュロックTXをアナウンス
await txRepo.announce(signedLockTx).toPromise();
```

```js
//ハッシュロックの承認を確認した後、ボンデッドTXをアナウンス
await txRepo.announceAggregateBonded(signedAggregateTx).toPromise();
```

#### v3

```js
namespaceIds = symbolSdk.symbol.generateNamespacePath("symbol.xym");
namespaceId = namespaceIds[namespaceIds.length - 1];

// アグリゲートTxに含めるTxを作成
tx = facade.transactionFactory.createEmbedded({
  type: 'transfer_transaction_v1',            // Txタイプ:転送Tx
  signerPublicKey: bobKey.publicKey,          // マルチシグ化したアカウントの公開鍵
  recipientAddress: aliceAddress.toString(),  // Aliceへの送信
  mosaics: [
    { mosaicId: namespaceId, amount: 1000000n },  // 1XYM送金
  ],
  message: new Uint8Array([0x00,...(new TextEncoder('utf-8')).encode('test')]) // 平文メッセージ
});

// マークルハッシュの算出
embeddedTransactions = [
  tx
];
merkleHash = facade.constructor.hashEmbeddedTransactions(embeddedTransactions);

// アグリゲートTx作成
aggregateTx = facade.transactionFactory.create({
  type: 'aggregate_bonded_transaction_v2',
  signerPublicKey: carol1Key.publicKey,  // 起案者アカウントの公開鍵を指定
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  transactionsHash: merkleHash,
  transactions: embeddedTransactions
});

// 連署により追加される連署情報のサイズを追加して最終的なTxサイズを算出する
requiredCosignatures = 2; // 連署者の数:2
calculatedCosignatures = requiredCosignatures > aggregateTx.cosignatures.length ? requiredCosignatures : aggregateTx.cosignatures.length;
sizePerCosignature = 8 + 32 + 64;
calculatedSize = aggregateTx.size - aggregateTx.cosignatures.length * sizePerCosignature + calculatedCosignatures * sizePerCosignature;
aggregateTx.fee = new symbolSdk.symbol.Amount(BigInt(calculatedSize * 100)); //手数料

// 署名
sig = facade.signTransaction(carol1Key, aggregateTx);
jsonPayload = facade.transactionFactory.constructor.attachSignature(aggregateTx, sig);

// ハッシュロックTx作成
hashLockTx = facade.transactionFactory.create({
  type: 'hash_lock_transaction_v1',     // Txタイプ:ハッシュロックTx
  signerPublicKey: carol1Key.publicKey, // 起案者アカウントの公開鍵を指定
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  mosaic: { mosaicId: namespaceId, amount: 10n * 1000000n },  // 10xym固定値
  duration: new symbolSdk.symbol.BlockDuration(480n),         // ロック有効期限
  hash: facade.hashTransaction(aggregateTx)                   // アグリゲートトランザクションのハッシュ値を登録
});
hashLockTx.fee = new symbolSdk.symbol.Amount(BigInt(hashLockTx.size * 100)); // 手数料

// 署名
hashLockSig = facade.signTransaction(carol1Key, hashLockTx);
hashLockJsonPayload = facade.transactionFactory.constructor.attachSignature(hashLockTx, hashLockSig);

// ハッシュロックTXをアナウンス
await fetch(
  new URL('/transactions', NODE),
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: hashLockJsonPayload,
  }
)
.then((res) => res.json())
.then((json) => {
  return json;
});
```

```js
//ハッシュロックの承認を確認した後、ボンデッドTXをアナウンス
await fetch(
  new URL('/transactions/partial', NODE),
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: jsonPayload,
  }
)
.then((res) => res.json())
.then((json) => {
  return json;
});
```

ボンデッドトランザクションがノードに取り込まれるとパーシャル署名状態となるので、8.ロックで紹介した連署を使用して、マルチシグアカウントで連署します。
連署をサポートするウォレットで承認することもできます。


## 9.4 マルチシグ送信の確認

マルチシグで行った送信トランザクションの結果を確認してみます。

#### v2

```js
txInfo = await txRepo.getTransaction(signedTx.hash,sym.TransactionGroup.Confirmed).toPromise();
console.log(txInfo);
```
###### 出力例
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

- マルチシグアカウント
    - Bob
        - AggregateTransaction.innerTransactions[0].signer.address
            - TCOMA5VG67TZH4X55HGZOXOFP7S232CYEQMOS7Q
- 起案者アカウント
    - Carol1
        - AggregateTransaction.signer.address
            - TCV67BMTD2JMDQOJUDQHBFJHQPG4DAKVKST3YJI
- 連署者アカウント
    - Carol2
        - AggregateTransaction.cosignatures[0].signer.address
            - TB3XP4GQK6XH2SSA2E2U6UWCESNACK566DS4COY
    - Carol3
        - AggregateTransaction.cosignatures[1].signer.address
            - TBAFGZOCB7OHZCCYYV64F2IFZL7SOOXNDHFS5NY

#### v3

```js
txInfo = await fetch(
  new URL('/transactions/confirmed/' + facade.hashTransaction(aggregateTx).toString(), NODE),
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }
)
.then((res) => res.json())
.then((json) => {
  return json;
});
console.log(txInfo);
```

###### 出力例

```js
> {meta: {…}, transaction: {…}, id: '64BBE4CD2F7CE156B010FA51'}
    id: "64BBE4CD2F7CE156B010FA51"
  > meta: 
      feeMultiplier: 100
      hash: "199CD5B4930FCFA59F7FEA33B20C5A9578CE6EFBE117FC99F598CB348A2D9F9A"
      height: "657690"
      index: 1
      merkleComponentHash: "6FA299CD333E512C92E40F36BA08B5E273D5F5264C9F346A21E4F734D4F46A74"
      timestamp: "22784938399"
  > transaction: 
    > cosignatures: Array(2)
      > 0: 
          signature: "67836FE1FE4C4EF5B09A54DF0FBC206F6A1C3B636A0BF2A51DE24ABD5B9D61C54C0632DE335D8A25D34BDB89EBAEADD6F61ED57ADED5BEE25F8C329139570101"
          signerPublicKey: "0ABC3E2B403C9E1597DF04C8E9AE1E9D3F22D70D87A0A7BDC8D1B16BB9D324DD"
          version: "0"
      > 1: 
          signature: "80C6C30A12CDDF94E634006750D7DB60ED714417A39C6E070AE78FB2189D4D9F2A5C936F50FBBA0AD9CAC2CF82339892FB62101A5529DC49762219C886D6EF08"
          signerPublicKey: "A33F1B26DE7498EAE8D27A084323BB9D3AA95486F879F248B679A3DEB06D6431"
          version: "0"
        length: 2
      deadline: "22791898323"
      maxFee: "48000"
      network: 152
      signature: "F1415D6DAB1DAC90AE44FB182BFF7568D0924AC5D63837A8CCFF66A0A284B3F4881F259B1B0C5845F99CA82284AD435DBB4CC6C69BBCC161B798061A4BE8800E"
      signerPublicKey: "E20A3B5BC132EBE9B075F1B326FE1C4C8827ACEF0DF7F24082D6C6A4A708980B"
      size: 480
    > transactions: Array(1)
      > 0: 
          id: "64BBE4CD2F7CE156B010FA52"
        > meta: 
            aggregateHash: "199CD5B4930FCFA59F7FEA33B20C5A9578CE6EFBE117FC99F598CB348A2D9F9A"
            aggregateId: "64BBE4CD2F7CE156B010FA51"
            feeMultiplier: 100
            height: "657690"
            index: 0
            timestamp: "22784938399"
        > transaction: 
            message: "0074657374"
            mosaics: Array(1)
            > 0: 
                amount: "1000000"
                id: "E74B99BA41F4AFEE"
              length: 1
            network: 152
            recipientAddress: "982B2AA2295B5C23528ADDEE7F29F6521944E9F2340428AB"
            signerPublicKey: "09F81ED97EBB0A85C6DFEACF2B518EFB471BEDA18709EF4C60823B21698B7B22"
            type: 16724
            version: 1
          length: 1
      transactionsHash: "CEEC5B3AA2E47265AA68DB5BEDAC9AFE27345055F2D7BFFBD889CE4DA67454C1"
      type: 16961
      version: 2
```

- マルチシグアカウント
  - Bob
    - txInfo.transaction.transactions[0].transaction.signerPublicKey
      - 09F81ED97EBB0A85C6DFEACF2B518EFB471BEDA18709EF4C60823B21698B7B22
    - facade.network.publicKeyToAddress(new symbolSdk.symbol.PublicKey(txInfo.transaction.transactions[0].transaction.signerPublicKey)).toString()
      - TAUBDCXUGTUDJXKF2PSETQ62JGAESZCBNYSUW7Y
- 起案者アカウント
  - Carol1
    - txInfo.transaction.signerPublicKey
      - E20A3B5BC132EBE9B075F1B326FE1C4C8827ACEF0DF7F24082D6C6A4A708980B
    - facade.network.publicKeyToAddress(new symbolSdk.symbol.PublicKey(txInfo.transaction.signerPublicKey)).toString()
      - TCMMKDQUV45LRBU2HJZNLRT32MN7GLX76PLMULQ
- 連署者アカウント
  - Carol3
    - txInfo.transaction.cosignatures[1].signerPublicKey
      - A33F1B26DE7498EAE8D27A084323BB9D3AA95486F879F248B679A3DEB06D6431
    - facade.network.publicKeyToAddress(new symbolSdk.symbol.PublicKey(txInfo.transaction.cosignatures[1].signerPublicKey)).toString()
      - TB2EIC366LCAORC3AWQNR4ZFHWBPBU47VKOPD5Q
  - Carol3
    - txInfo.transaction.cosignatures[0].signerPublicKey
      - 0ABC3E2B403C9E1597DF04C8E9AE1E9D3F22D70D87A0A7BDC8D1B16BB9D324DD
    - facade.network.publicKeyToAddress(new symbolSdk.symbol.PublicKey(txInfo.transaction.cosignatures[0].signerPublicKey)).toString()
      - TDTW4SWRMI64JM7TK6RJZFEW5XKI4KBQVPQM7QY

## 9.5 マルチシグ構成変更

### マルチシグ構成の縮小

連署者を減らすには除名対象アドレスに指定するとともに最小署名者数を連署者数が超えてしまわないように調整してトランザクションをアナウンスします。
除名対象者を連署者に含む必要はありません。

#### v2

```js
multisigTx = sym.MultisigAccountModificationTransaction.create(
    undefined, 
    -1, //承認のために必要な最小署名者数増分
    -1, //除名のために必要な最小署名者数増分
    [], //追加対象アドレス
    [carol3.address],//除名対象アドレス
    networkType
);

aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    [ //構成変更したいマルチシグアカウントの公開鍵を指定
      multisigTx.toAggregate(bob.publicAccount),
    ],
    networkType,[]    
).setMaxFeeForAggregate(100, 2); // 第二引数に連署者の数:2

signedTx =  aggregateTx.signTransactionWithCosignatories(
    carol1,
    [carol2,carol4],
    generationHash,
);
await txRepo.announce(signedTx).toPromise();
```

#### v3

```js
// マルチシグ設定Tx作成
multisigTx = facade.transactionFactory.createEmbedded({
  type: 'multisig_account_modification_transaction_v1', // Txタイプ:マルチシグ設定Tx
  signerPublicKey: bobKey.publicKey,  // 構成変更したいマルチシグアカウントの公開鍵を指定
  minApprovalDelta: -1, // 承認のために必要な最小署名者数増分
  minRemovalDelta: -1,  // 除名のために必要な最小署名者数増分
  addressAdditions: [], // 追加対象アドレスリスト
  addressDeletions: [   // 除名対象アドレスリスト
    carol3Address,
  ]
});

// マークルハッシュの算出
embeddedTransactions = [
  multisigTx
];
merkleHash = facade.constructor.hashEmbeddedTransactions(embeddedTransactions);

// アグリゲートTx作成
aggregateTx = facade.transactionFactory.create({
  type: 'aggregate_complete_transaction_v2',
  signerPublicKey: carol1Key.publicKey,  // 起案者アカウントの公開鍵を指定
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  transactionsHash: merkleHash,
  transactions: embeddedTransactions
});

// 連署により追加される連署情報のサイズを追加して最終的なTxサイズを算出する
requiredCosignatures = 2; // 連署者の数:2
calculatedCosignatures = requiredCosignatures > aggregateTx.cosignatures.length ? requiredCosignatures : aggregateTx.cosignatures.length;
sizePerCosignature = 8 + 32 + 64;
calculatedSize = aggregateTx.size - aggregateTx.cosignatures.length * sizePerCosignature + calculatedCosignatures * sizePerCosignature;
aggregateTx.fee = new symbolSdk.symbol.Amount(BigInt(calculatedSize * 100)); //手数料

// 起案者アカウントによる署名
sig = facade.signTransaction(carol1Key, aggregateTx);
jsonPayload = facade.transactionFactory.constructor.attachSignature(aggregateTx, sig);

// 連署者アカウントによる連署
coSig2 = facade.cosignTransaction(carol2Key, aggregateTx, false);
aggregateTx.cosignatures.push(coSig2);
coSig4 = facade.cosignTransaction(carol4Key, aggregateTx, false);
aggregateTx.cosignatures.push(coSig4);

// アナウンス
await fetch(
  new URL('/transactions', NODE),
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({"payload": symbolSdk.utils.uint8ToHex(aggregateTx.serialize())}),
  }
)
.then((res) => res.json())
.then((json) => {
  return json;
});
```

### 連署者構成の差替え

連署者を差し替えるには、追加対象アドレスと除名対象アドレスを指定します。
新たに追加指定するアカウントの連署は必ず必要です。

#### v2

```js
multisigTx = sym.MultisigAccountModificationTransaction.create(
    undefined, 
    0, //承認のために必要な最小署名者数増分
    0, //除名のために必要な最小署名者数増分
    [carol5.address], //追加対象アドレス
    [carol4.address], //除名対象アドレス
    networkType
);

aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    [ //構成変更したいマルチシグアカウントの公開鍵を指定
      multisigTx.toAggregate(bob.publicAccount),
    ],
    networkType,[]    
).setMaxFeeForAggregate(100, 2); // 第二引数に連署者の数:2

signedTx =  aggregateTx.signTransactionWithCosignatories(
    carol1, //起案者
    [carol2,carol5], //連署者+承諾アカウント
    generationHash,
);
await txRepo.announce(signedTx).toPromise();
```

#### v3

```js
// マルチシグ設定Tx作成
multisigTx = facade.transactionFactory.createEmbedded({
  type: 'multisig_account_modification_transaction_v1', // Txタイプ:マルチシグ設定Tx
  signerPublicKey: bobKey.publicKey,  // 構成変更したいマルチシグアカウントの公開鍵を指定
  minApprovalDelta: 0,  // 承認のために必要な最小署名者数増分
  minRemovalDelta: 0,   // 除名のために必要な最小署名者数増分
  addressAdditions: [   // 追加対象アドレスリスト
    carol5Address,
  ],
  addressDeletions: [   // 除名対象アドレスリスト
    carol4Address,
  ]
});

// マークルハッシュの算出
embeddedTransactions = [
  multisigTx
];
merkleHash = facade.constructor.hashEmbeddedTransactions(embeddedTransactions);

// アグリゲートTx作成
aggregateTx = facade.transactionFactory.create({
  type: 'aggregate_complete_transaction_v2',
  signerPublicKey: carol1Key.publicKey,  // 起案者アカウントの公開鍵を指定
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  transactionsHash: merkleHash,
  transactions: embeddedTransactions
});

// 連署により追加される連署情報のサイズを追加して最終的なTxサイズを算出する
requiredCosignatures = 2; // 連署者の数:2
calculatedCosignatures = requiredCosignatures > aggregateTx.cosignatures.length ? requiredCosignatures : aggregateTx.cosignatures.length;
sizePerCosignature = 8 + 32 + 64;
calculatedSize = aggregateTx.size - aggregateTx.cosignatures.length * sizePerCosignature + calculatedCosignatures * sizePerCosignature;
aggregateTx.fee = new symbolSdk.symbol.Amount(BigInt(calculatedSize * 100)); //手数料

// 起案者アカウントによる署名
sig = facade.signTransaction(carol1Key, aggregateTx);
jsonPayload = facade.transactionFactory.constructor.attachSignature(aggregateTx, sig);

// 連署者アカウントによる連署
coSig2 = facade.cosignTransaction(carol2Key, aggregateTx, false);
aggregateTx.cosignatures.push(coSig2);

// 承諾アカウントによる連署
coSig5 = facade.cosignTransaction(carol5Key, aggregateTx, false);
aggregateTx.cosignatures.push(coSig5);

// アナウンス
await fetch(
  new URL('/transactions', NODE),
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({"payload": symbolSdk.utils.uint8ToHex(aggregateTx.serialize())}),
  }
)
.then((res) => res.json())
.then((json) => {
  return json;
});
```

## 9.6 現場で使えるヒント

### 多要素認証

秘密鍵の管理を複数の端末に分散させることができます。
セキュリティ用の鍵を用意しておけば、紛失・漏洩時にも安全に回復することができます。
また、マルチシグの安全運用については盗難時と紛失時の2パターンを検討しておく必要があるのでご注意ください。
- 盗難時：ほかにも秘密鍵を使える人がいる。
- 紛失時：だれもその秘密鍵を使えなくなる。


### アカウントの所有

マルチシグ化したアカウントの秘密鍵は無効化し、マルチシグを解除しない限りたとえ秘密鍵を知っていたとしても
モザイク送信などはできなくなります。
モザイクの章で説明した通り、所有を「自分の意思で手放すことができる状態」だとすると、
マルチシグ化したアカウントがもつモザイク等の所有者は連署者になります。
また、Symbolではマルチシグの構成変更が可能ですのでアカウントの所有を他の連署者に安全に移転することができます。

### ワークフロー

Symbolではマルチシグを3階層まで構成することができます(マルチレベルマルチシグ)。
マルチレベルマルチシグを用いることで、バックアップ鍵を不正に持ち出して連署を完成させたり、承認者と監査役だけで署名を完成させるといったことを防ぐことができます。
これによって、ブロックチェーン上にトランザクションが存在することが現実社会のワークフローなどの条件を満たした証拠として提示することができます。
