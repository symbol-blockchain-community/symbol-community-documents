---
sidebar_position: 5
---

# 5.モザイク

本章ではモザイクの設定とその生成方法について解説します。
Symbolではトークンのことをモザイクと表現します。

> Wikipediaによると、トークンとは「紀元前8000年頃から紀元前3000年までのメソポタミアの地層から出土する直径が1cm前後の粘土で作られたさまざまな形状の物体」のことを指します。一方でモザイクとは「小片を寄せあわせ埋め込んで、絵（図像）や模様を表す装飾美術の技法。石、陶磁器（モザイクタイル）、有色無色のガラス、貝殻、木などが使用され、建築物の床や壁面、あるいは工芸品の装飾のために施される。」とあります。SymbolにおいてモザイクとはSymbolが作りなすエコシステムの様相を表すさまざまな構成要素、と考えることができます。

## 5.1 モザイク生成

モザイク生成には
作成するモザイクを定義します。

#### v2

```js
supplyMutable = true; //供給量変更の可否
transferable = false; //第三者への譲渡可否
restrictable = true; //制限設定の可否
revokable = true; //発行者からの還収可否

//モザイク定義
nonce = sym.MosaicNonce.createRandom();
mosaicDefTx = sym.MosaicDefinitionTransaction.create(
    undefined, 
    nonce,
    sym.MosaicId.createFromNonce(nonce, alice.address), //モザイクID
    sym.MosaicFlags.create(supplyMutable, transferable, restrictable, revokable),
    2,//divisibility:可分性
    sym.UInt64.fromUint(0), //duration:有効期限
    networkType
);
```

#### v3

```js
// モザイクフラグ設定
f = symbolSdk.symbol.MosaicFlags.NONE.value;
f += symbolSdk.symbol.MosaicFlags.SUPPLY_MUTABLE.value; // 供給量変更の可否
// f += symbolSdk.symbol.MosaicFlags.TRANSFERABLE.value;   // 第三者への譲渡可否
f += symbolSdk.symbol.MosaicFlags.RESTRICTABLE.value;   // 制限設定の可否
f += symbolSdk.symbol.MosaicFlags.REVOKABLE.value;      // 発行者からの還収可否
flags = new symbolSdk.symbol.MosaicFlags(f);

// ナンス設定
array = new Uint8Array(symbolSdk.symbol.MosaicNonce.SIZE);
crypto.getRandomValues(array);
nonce = new symbolSdk.symbol.MosaicNonce(array[0] * 0x00000001 + array[1] * 0x00000100 + array[2] * 0x00010000 + array[3] * 0x01000000);

//モザイク定義
mosaicDefTx = facade.transactionFactory.createEmbedded({
  type: 'mosaic_definition_transaction_v1',         // Txタイプ:モザイク定義Tx
  signerPublicKey: aliceKey.publicKey,              // 署名者公開鍵
  id: new symbolSdk.symbol.MosaicId(symbolSdk.symbol.generateMosaicId(aliceAddress, nonce.value)),
  divisibility: 2,                                  // divisibility:可分性
  duration: new symbolSdk.symbol.BlockDuration(0n), // duration:有効期限
  nonce: nonce,
  flags: flags
});
```

MosaicFlagsは以下の通りです。

```js
MosaicFlags {
  supplyMutable: false, transferable: false, restrictable: false, revokable: false
}
```
数量変更、第三者への譲渡、モザイクグローバル制限の適用、発行者からの還収の可否について指定します。
この項目は後で変更することはできません。

#### divisibility:可分性

可分性は小数点第何位まで数量の単位とするかを決めます。データは整数値として保持されます。

divisibility:0 = 1  
divisibility:1 = 1.0  
divisibility:2 = 1.00  

#### duration:有効期限

0を指定した場合、無期限に使用することができます。
モザイク有効期限を設定した場合、期限が切れた後も消滅することはなくデータとしては残ります。
アカウント1つにつき1000までしか所有することはできませんのでご注意ください。


次に数量を変更します

#### v2

```js
//モザイク変更
mosaicChangeTx = sym.MosaicSupplyChangeTransaction.create(
    undefined,
    mosaicDefTx.mosaicId,
    sym.MosaicSupplyChangeAction.Increase,
    sym.UInt64.fromUint(1000000), //数量
    networkType
);
```

#### v3

```js
//モザイク変更
mosaicChangeTx = facade.transactionFactory.createEmbedded({
  type: 'mosaic_supply_change_transaction_v1',  // Txタイプ:モザイク変更Tx
  signerPublicKey: aliceKey.publicKey,          // 署名者公開鍵
  mosaicId: new symbolSdk.symbol.UnresolvedMosaicId(mosaicDefTx.id.value),
  delta: new symbolSdk.symbol.Amount(10000n),   // 数量
  action: symbolSdk.symbol.MosaicSupplyChangeAction.INCREASE
});
```

supplyMutable:falseの場合、全モザイクが発行者にある場合だけ数量の変更が可能です。
divisibility > 0 の場合は、最小単位を1として整数値で定義してください。
（divisibility:2 で 1.00 作成したい場合は100と指定）

MosaicSupplyChangeActionは以下の通りです。
```js
{0: 'Decrease', 1: 'Increase'}
```
増やしたい場合はIncreaseを指定します。
上記2つのトランザクションをまとめてアグリゲートトランザクションを作成します。

#### v2

```js
aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    [
      mosaicDefTx.toAggregate(alice.publicAccount),
      mosaicChangeTx.toAggregate(alice.publicAccount),
    ],
    networkType,[],
).setMaxFeeForAggregate(100, 0);

signedTx = alice.sign(aggregateTx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

#### v3

```js
// マークルハッシュの算出
embeddedTransactions = [
  mosaicDefTx,
  mosaicChangeTx
];
merkleHash = facade.constructor.hashEmbeddedTransactions(embeddedTransactions);

// アグリゲートTx作成
aggregateTx = facade.transactionFactory.create({
  type: 'aggregate_complete_transaction_v2',
  signerPublicKey: aliceKey.publicKey,  // 署名者公開鍵
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  transactionsHash: merkleHash,
  transactions: embeddedTransactions
});

// 連署により追加される連署情報のサイズを追加して最終的なTxサイズを算出する
requiredCosignatures = 0; // 必要な連署者の数を指定
calculatedCosignatures = requiredCosignatures > aggregateTx.cosignatures.length ? requiredCosignatures : aggregateTx.cosignatures.length;
sizePerCosignature = 8 + 32 + 64;
calculatedSize = aggregateTx.size - aggregateTx.cosignatures.length * sizePerCosignature + calculatedCosignatures * sizePerCosignature;
aggregateTx.fee = new symbolSdk.symbol.Amount(BigInt(calculatedSize * 100)); //手数料

// 署名とアナウンス
sig = facade.signTransaction(aliceKey, aggregateTx);
jsonPayload = facade.transactionFactory.constructor.attachSignature(aggregateTx, sig);
await fetch(
  new URL('/transactions', NODE),
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

アグリゲートトランザクションの特徴として、
まだ存在していないモザイクの数量を変更しようとしている点に注目してください。
配列化した時に、矛盾点がなければ1つのブロック内で問題なく処理することができます。


### 確認
モザイク作成したアカウントが持つモザイク情報を確認します。

#### v2

```js
mosaicRepo = repo.createMosaicRepository();
accountInfo.mosaics.forEach(async mosaic => {
  mosaicInfo = await mosaicRepo.getMosaic(mosaic.id).toPromise();
  console.log(mosaicInfo);
});
```
###### 出力例
```js
> MosaicInfo {version: 1, recordId: '622988B12A6128903FC10496', id: MosaicId, supply: UInt64, startHeight: UInt64, …}
> MosaicInfo
    divisibility: 2 //可分性
    duration: UInt64 {lower: 0, higher: 0} //有効期限
  > flags: MosaicFlags
        restrictable: true //制限設定の可否
        revokable: true //発行者からの還収可否
        supplyMutable: true //供給量変更の可否
        transferable: false //第三者への譲渡可否
  > id: MosaicId
        id: Id {lower: 207493124, higher: 890137608} //モザイクID
    ownerAddress: Address {address: 'TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ', networkType: 152} //作成者アドレス
    recordId: "62626E3C741381859AFAD4D5" 
    supply: UInt64 {lower: 1000000, higher: 0} //供給量
```

#### v3

```js
// 3.3 アカウント情報の確認 - 所有モザイク一覧の取得 を事前に実施する

accountInfo.mosaics.forEach(async mosaic => {
  mosaicInfo = await fetch(
    new URL('/mosaics/' + mosaic.id, NODE),
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  )
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
  console.log(mosaicInfo);
});
```
###### 出力例
```js
> {mosaic: {…}, id: '64B3E2336FFE587B6D24CE90'}
    id: "64B3E2336FFE587B6D24CE90"
  > mosaic: 
        divisibility: 2         // 可分性
        duration: "0"           // 有効期限
        flags: 13               // モザイクフラグ、有効なフラグに対応した値の合計
                                //   供給量変更の可否(1)
                                //   第三者への譲渡可否(2)
                                //   制限設定の可否(4)
                                //   発行者からの還収可否(8)
        id: "663B178E904CADB8"  // モザイクID
        ownerAddress: "982B2AA2295B5C23528ADDEE7F29F6521944E9F2340428AB" // 作成者アドレス
        revision: 1
        startHeight: "640252"
        supply: "10000"         // 供給量
        version: 1
```

## 5.2 モザイク送信

作成したモザイクを送信します。
よく、ブロックチェーンに初めて触れる方は、
モザイク送信について「クライアント端末に保存されたモザイクを別のクライアント端末へ送信」することとイメージされている人がいますが、
モザイク情報はすべてのノードで常に共有・同期化されており、送信先に未知のモザイク情報を届けることではありません。
正確にはブロックチェーンへ「トランザクションを送信」することにより、アカウント間でのトークン残量を組み替える操作のことを言います。

#### v2

```js
//受信アカウント作成
bob = sym.Account.generateNewAccount(networkType);

tx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment),
    bob.address,  //送信先アドレス
    // 送信モザイクリスト
    [ 
      new sym.Mosaic(
        new sym.MosaicId("72C0212E67A08BCE"), //テストネットXYM
        sym.UInt64.fromUint(1000000) //1XYM(divisibility:6)
      ),
      new sym.Mosaic(
        mosaicDefTx.mosaicId, // 5.1 で作成したモザイク
        sym.UInt64.fromUint(1)  // 数量:0.01(divisibility:2 の場合)
      )
    ],
    sym.EmptyMessage,
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();

```

#### v3

```js
//受信アカウント作成
bobKey = new symbolSdk.symbol.KeyPair(symbolSdk.PrivateKey.random());
bobAddress = facade.network.publicKeyToAddress(bobKey.publicKey);

// Tx作成
tx = facade.transactionFactory.create({
  type: 'transfer_transaction_v1',      // Txタイプ:転送Tx
  signerPublicKey: aliceKey.publicKey,  // 署名者公開鍵
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  recipientAddress: bobAddress.toString(),
  mosaics: [
    { mosaicId: 0x72C0212E67A08BCEn, amount: 1000000n },  // 1XYM送金
    { mosaicId: mosaicDefTx.id.value, amount: 1n },       // 5.1 で作成したモザイク
  ],
  message: new Uint8Array()
});
tx.fee = new symbolSdk.symbol.Amount(BigInt(tx.size * 100)); //手数料

// 署名とアナウンス
sig = facade.signTransaction(aliceKey, tx);
jsonPayload = facade.transactionFactory.constructor.attachSignature(tx, sig);
await fetch(
  new URL('/transactions', NODE),
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


##### 送信モザイクリスト

複数のモザイクを一度に送信できます。
XYMを送信するには以下のモザイクIDを指定します。
- メインネット：6BED913FA20223F8
- テストネット：72C0212E67A08BCE

#### 送信量
小数点もすべて整数にして指定します。
XYMは可分性6なので、1XYM=1000000で指定します。

### 送信確認

#### v2

```js
txInfo = await txRepo.getTransaction(signedTx.hash,sym.TransactionGroup.Confirmed).toPromise();
console.log(txInfo); 
```
###### 出力例
```js
> TransferTransaction
    deadline: Deadline {adjustedValue: 12776690385}
    maxFee: UInt64 {lower: 19200, higher: 0}
    message: RawMessage {type: -1, payload: ''}
  > mosaics: Array(2)
      > 0: Mosaic
            amount: UInt64 {lower: 1, higher: 0}
          > id: MosaicId
                id: Id {lower: 207493124, higher: 890137608}
      > 1: Mosaic
            amount: UInt64 {lower: 1000000, higher: 0}
          > id: MosaicId
                id: Id {lower: 760461000, higher: 981735131}
    networkType: 152
    payloadSize: 192
    recipientAddress: Address {address: 'TAR6ERCSTDJJ7KCN4BJNJTK7LBBL5JPPVSHUNGY', networkType: 152}
    signature: "7C4E9E80D250C6D09352FB8EC80175719D59787DE67446896A73AABCFE6C420AF7DD707E6D4D2B2987B8BAD775F2989DCB6F738D39C48C1239FC8CC900A6740D"
    signer: PublicAccount {publicKey: '0E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26', address: Address}
  > transactionInfo: TransactionInfo
        hash: "DE479C001E9736976BDA55E560AB1A5DE526236D9E1BCE24941CF8ED8884289E"
        height: UInt64 {lower: 326922, higher: 0}
        id: "626270069F1D5202A10AE93E"
        index: 0
        merkleComponentHash: "DE479C001E9736976BDA55E560AB1A5DE526236D9E1BCE24941CF8ED8884289E"
    type: 16724
    version: 1
```

#### v3

```js
txInfo = await fetch(
  new URL('/transactions/confirmed/' + facade.hashTransaction(tx).toString(), NODE),
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
> {meta: {…}, transaction: {…}, id: '64B3E87B2F7CE156B0104ED5'}
    id: "64B3E87B2F7CE156B0104ED5"
  > meta: 
      feeMultiplier: 100
      hash: "5712450621C086E383B2A22E9936E434DF36DE4F13D49B5003C93E731414E98F"
      height: "640304"
      index: 0
      merkleComponentHash: "5712450621C086E383B2A22E9936E434DF36DE4F13D49B5003C93E731414E98F"
      timestamp: "22261591734"
  > transaction: 
      deadline: "22268781776"
      maxFee: "19200"
    > mosaics: Array(2)
        0: 
          amount: "1"
          id: "663B178E904CADB8"
        1: 
          amount: "1000000"
          id: "72C0212E67A08BCE"
      network: 152
      recipientAddress: "98A8D76FEF8382274D472EE377F2FF3393E5B62C08B4329D"
      signature: "99CD1E706E7D105F21804B1A614098E49E90803E935EB33A20C9C77DCA4532D654FDAF91C05C4B78F3640F27B15AD301D305197E4BF317F55CC5B7A9311B4D03"
      signerPublicKey: "69A31A837EB7DE323F08CA52495A57BA0A95B52D1BB54CEA9A94C12A87B1CADB"
      size: 192
      type: 16724
      version: 1
```

TransferTransactionのmosaicsに2種類のモザイクが送信されていることが確認できます。また、TransactionInfoに承認されたブロックの情報が記載されています。

## 5.3 現場で使えるヒント

### 所有証明

前章でトランザクションによる存在証明について説明しました。
アカウントの作成した送信指示が消せない形で残せるので、絶対につじつまの合う台帳を作ることができます。
すべてのアカウントの「絶対に消せない送信指示」の蓄積結果として、各アカウントは自分のモザイク所有を証明することができます。
（本ドキュメントでは所有を「自分の意思で手放すことができる状態」とします。少し話題がそれますが、法律的にはデジタルデータに所有権が認められていないのも、一度知ってしまったデータは自分の意志では忘れたことを他人に証明することができない点に注目すると「手放すことができる状態」の意味に納得がいくかもしれません。ブロックチェーンによりそのデータの放棄を明確に示すことができるのですが、詳しくは法律の専門の方にお任せします。）

#### NFT(non fungible token)

発行枚数を1に限定し、supplyMutableをfalseに設定することで、1つだけしか存在しないトークンを発行できます。
モザイクは作成したアカウントアドレスを改ざんできない情報として保有しているので、
そのアカウントの送信トランザクションをメタ情報として利用できます。
7章で説明するメタデータをモザイクに登録する方法もありますが、その方法は登録アカウントとモザイク作成者の連署によって更新可能なことにご注意ください。

NFTの実現方法はいろいろありますが、その一例の処理概要を以下に例示します（実行するためにはnonceやフラグ情報を適切に設定してください）。

#### v2

```js
supplyMutable = false; //供給量変更の可否

//モザイク定義
mosaicDefTx = sym.MosaicDefinitionTransaction.create(
    undefined, nonce,mosaicId,
    sym.MosaicFlags.create(supplyMutable, transferable, restrictable, revokable),
    0,//divisibility:可分性
    sym.UInt64.fromUint(0), //duration:無期限
    networkType
);

//モザイク数量固定
mosaicChangeTx = sym.MosaicSupplyChangeTransaction.create(
    undefined,mosaicId,
    sym.MosaicSupplyChangeAction.Increase, //増やす
    sym.UInt64.fromUint(1), //数量1
    networkType
);

//NFTデータ
nftTx  = sym.TransferTransaction.create(
    undefined, //Deadline:有効期限
    alice.address, 
    [],
    sym.PlainMessage.create("Hello Symbol!"), //NFTデータ実体
    networkType
)

//モザイクの生成とNFTデータをアグリゲートしてブロックに登録
aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    [
      mosaicDefTx.toAggregate(alice.publicAccount),
      mosaicChangeTx.toAggregate(alice.publicAccount),
      nftTx.toAggregate(alice.publicAccount)
    ],
    networkType,[],
).setMaxFeeForAggregate(100, 0);
```

#### v3

```js
// モザイクフラグ設定
f = symbolSdk.symbol.MosaicFlags.NONE.value;
// f += symbolSdk.symbol.MosaicFlags.SUPPLY_MUTABLE.value; // 供給量変更の可否
f += symbolSdk.symbol.MosaicFlags.TRANSFERABLE.value;   // 第三者への譲渡可否
f += symbolSdk.symbol.MosaicFlags.RESTRICTABLE.value;   // 制限設定の可否
f += symbolSdk.symbol.MosaicFlags.REVOKABLE.value;      // 発行者からの還収可否
flags = new symbolSdk.symbol.MosaicFlags(f);

// ナンス設定
array = new Uint8Array(symbolSdk.symbol.MosaicNonce.SIZE);
crypto.getRandomValues(array);
nonce = new symbolSdk.symbol.MosaicNonce(array[0] * 0x00000001 + array[1] * 0x00000100 + array[2] * 0x00010000 + array[3] * 0x01000000);

//モザイク定義
mosaicDefTx = facade.transactionFactory.createEmbedded({
  type: 'mosaic_definition_transaction_v1',         // Txタイプ:モザイク定義Tx
  signerPublicKey: aliceKey.publicKey,              // 署名者公開鍵
  id: new symbolSdk.symbol.MosaicId(symbolSdk.symbol.generateMosaicId(aliceAddress, nonce.value)),
  divisibility: 0,                                  // divisibility:可分性
  duration: new symbolSdk.symbol.BlockDuration(0n), // duration:有効期限
  nonce: nonce,
  flags: flags
});

//モザイク数量固定
mosaicChangeTx = facade.transactionFactory.createEmbedded({
  type: 'mosaic_supply_change_transaction_v1',  // Txタイプ:モザイク変更Tx
  signerPublicKey: aliceKey.publicKey,          // 署名者公開鍵
  mosaicId: new symbolSdk.symbol.UnresolvedMosaicId(mosaicDefTx.id.value),
  delta: new symbolSdk.symbol.Amount(1n),       // 数量
  action: symbolSdk.symbol.MosaicSupplyChangeAction.INCREASE
});

// NFTデータ
nftTx = facade.transactionFactory.createEmbedded({
  type: 'transfer_transaction_v1',      // Txタイプ:転送Tx
  signerPublicKey: aliceKey.publicKey,  // 署名者公開鍵
  recipientAddress: bobAddress.toString(),
  message: new Uint8Array([0x00,...(new TextEncoder('utf-8')).encode('Hello Symbol!')]) // NFTデータ実体
});

// マークルハッシュの算出
embeddedTransactions = [
  mosaicDefTx,
  mosaicChangeTx,
  nftTx
];
merkleHash = facade.constructor.hashEmbeddedTransactions(embeddedTransactions);

// モザイクの生成とNFTデータをアグリゲートしてブロックに登録
aggregateTx = facade.transactionFactory.create({
  type: 'aggregate_complete_transaction_v2',
  signerPublicKey: aliceKey.publicKey,
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  transactionsHash: merkleHash,
  transactions: embeddedTransactions
});

// 連署により追加される連署情報のサイズを追加して最終的なTxサイズを算出する
requiredCosignatures = 0; // 必要な連署者の数を指定
calculatedCosignatures = requiredCosignatures > aggregateTx.cosignatures.length ? requiredCosignatures : aggregateTx.cosignatures.length;
sizePerCosignature = 8 + 32 + 64;
calculatedSize = aggregateTx.size - aggregateTx.cosignatures.length * sizePerCosignature + calculatedCosignatures * sizePerCosignature;
aggregateTx.fee = new symbolSdk.symbol.Amount(BigInt(calculatedSize * 100)); //手数料
```

モザイク生成時のブロック高と作成アカウントがモザイク情報に含まれているので同ブロック内のトランザクションを検索することにより、
紐づけられたNFTデータを取得することができます。

##### 注意事項
モザイクの作成者が全数量を所有している場合、供給量を変更することが可能です。
またトランザクションに分割してデータを記録した場合、改ざんできませんがデータの追記は可能です。
NFTを運用する場合はモザイク作成者の秘密鍵を厳重に管理・あるいは破棄するなど、適切な運用にご注意ください。


#### 回収可能なポイント運用

transferableをfalseに設定することで転売が制限されるため、資金決済法の影響を受けにくいポイントを定義することができます。
またrevokableをtrueに設定することで、ユーザ側が秘密鍵を管理しなくても使用分を回収できるような中央管理型のポイント運用を行うことができます。

#### v2

```js
transferable = false; //第三者への譲渡可否
revokable = true; //発行者からの還収可否
```

#### v3

```js
// モザイクフラグ設定
f = symbolSdk.symbol.MosaicFlags.NONE.value;
f += symbolSdk.symbol.MosaicFlags.SUPPLY_MUTABLE.value; // 供給量変更の可否
// f += symbolSdk.symbol.MosaicFlags.TRANSFERABLE.value;   // 第三者への譲渡可否
f += symbolSdk.symbol.MosaicFlags.RESTRICTABLE.value;   // 制限設定の可否
f += symbolSdk.symbol.MosaicFlags.REVOKABLE.value;      // 発行者からの還収可否
flags = new symbolSdk.symbol.MosaicFlags(f);
```

トランザクションは以下のように記述します。

#### v2

```js
revocationTx = sym.MosaicSupplyRevocationTransaction.create(
    sym.Deadline.create(epochAdjustment),
    bob.address, //回収先アドレス
    new sym.Mosaic(mosaicId, sym.UInt64.fromUint(3)), //回収モザイクIDと数量
    networkType
).setMaxFee(100);
```

#### v3

```js
revocationTx = facade.transactionFactory.create({
  type: 'mosaic_supply_revocation_transaction_v1',  // Txタイプ:モザイク回収Tx
  signerPublicKey: aliceKey.publicKey,              // 署名者公開鍵
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  mosaic: { mosaicId: mosaicId, amount: 1n },       // 回収モザイクIDと数量
  sourceAddress: bobAddress
});
revocationTx.fee = new symbolSdk.symbol.Amount(BigInt(revocationTx.size * 100)); //手数料
```




