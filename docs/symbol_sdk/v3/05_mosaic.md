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

```js
// モザイクフラグ設定
f = sdk.symbol.models.MosaicFlags.NONE.value;
f += sdk.symbol.models.MosaicFlags.SUPPLY_MUTABLE.value; // 供給量変更の可否
f += sdk.symbol.models.MosaicFlags.TRANSFERABLE.value;   // 第三者への譲渡可否
f += sdk.symbol.models.MosaicFlags.RESTRICTABLE.value; // 制限設定の可否
f += sdk.symbol.models.MosaicFlags.REVOKABLE.value; // 発行者からの還収可否
flags = new sdk.symbol.models.MosaicFlags(f);

// ナンス設定
array = new Uint8Array(sdk.symbol.models.MosaicNonce.SIZE);
crypto.getRandomValues(array);
nonce = new sdk.symbol.models.MosaicNonce(
  array[0] * 0x00000001 +
    array[1] * 0x00000100 +
    array[2] * 0x00010000 +
    array[3] * 0x01000000,
);

// モザイク定義Tx作成
divisibility = 2; // 可分性
mosaicDefDescriptor = new sdk.symbol.descriptors.MosaicDefinitionTransactionV1Descriptor(
  new sdk.symbol.models.MosaicId(sdk.symbol.generateMosaicId(
    aliceKey.address, // 署名者公開鍵
    nonce.value
  )),
  new sdk.symbol.models.BlockDuration(0n),  // duration:有効期限
  nonce,
  flags,
  divisibility
);
mosaicDefTx = facade.createEmbeddedTransactionFromTypedDescriptor(mosaicDefDescriptor, aliceKey.publicKey);
```

MosaicFlagsは以下の通りです。

```js
MosaicFlags {
  NONE: 0,
  SUPPLY_MUTABLE: 1,
  TRANSFERABLE: 2,
  RESTRICTABLE: 4,
  REVOKABLE: 8
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

```js
// モザイク供給変更トランザクションの作成
mosaicChangeDescriptor = new sdk.symbol.descriptors.MosaicSupplyChangeTransactionV1Descriptor(
  new sdk.symbol.models.UnresolvedMosaicId(mosaicDefTx.id.value),
  new sdk.symbol.models.Amount(10000n),
  sdk.symbol.models.MosaicSupplyChangeAction.INCREASE
);
mosaicChangeTx = facade.createEmbeddedTransactionFromTypedDescriptor(mosaicChangeDescriptor, aliceKey.publicKey);

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

```js
// アグリゲートコンプリートトランザクションの作成（モザイク定義+供給変更）
embeddedTransactions = [ mosaicDefTx, mosaicChangeTx ];
aggregateDescriptor = new sdk.symbol.descriptors.AggregateCompleteTransactionV2Descriptor(
  facade.static.hashEmbeddedTransactions(embeddedTransactions),
  embeddedTransactions
);
aggregateTx = facade.createTransactionFromTypedDescriptor(aggregateDescriptor, aliceKey.publicKey, 100, 60 * 60 * 2, 0);

// 連署により追加される連署情報のサイズを追加して最終的なTxサイズを算出する
requiredCosignatures = 0; // 必要な連署者の数を指定
calculatedCosignatures =
  requiredCosignatures > aggregateTx.cosignatures.length
    ? requiredCosignatures
    : aggregateTx.cosignatures.length;
sizePerCosignature = 8 + 32 + 64;
calculatedSize =
  aggregateTx.size -
  aggregateTx.cosignatures.length * sizePerCosignature +
  calculatedCosignatures * sizePerCosignature;
aggregateTx.fee = new sdk.symbol.models.Amount(BigInt(calculatedSize * 100)); //手数料

// 署名とアナウンス
sig = aliceKey.signTransaction(aggregateTx);
jsonPayload = facade.transactionFactory.static.attachSignature(aggregateTx, sig);
await fetch(
  new URL('/transactions', NODE),
  { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: jsonPayload }
);
```

アグリゲートトランザクションの特徴として、
まだ存在していないモザイクの数量を変更しようとしている点に注目してください。
配列化した時に、矛盾点がなければ1つのブロック内で問題なく処理することができます。

### 確認

モザイク作成したアカウントが持つモザイク情報を確認します。

```js
// 3.3 アカウント情報の確認 - 所有モザイク一覧の取得 を事前に実施する

accountInfo.mosaics.forEach(async (mosaic) => {
  mosaicInfo = await fetch(new URL("/mosaics/" + mosaic.id, NODE), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
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

```js
//受信アカウント作成
bobKey = facade.createAccount(sdk.core.PrivateKey.random());
// 既存のprivateKeyで作成する場合
bobKey = facade.createAccount(new sdk.core.PrivateKey("24B929287E1B68F7CB...."))

bobAddress = facade.network.publicKeyToAddress(bobKey.publicKey);

// モザイク転送トランザクションの作成（1XYM + 5.1で作成したモザイクを送信）
descriptor = new sdk.symbol.descriptors.TransferTransactionV1Descriptor(
  bobAddress,
  [
    // 1 XYM 送金
    new sdk.symbol.descriptors.UnresolvedMosaicDescriptor(
      new sdk.symbol.models.UnresolvedMosaicId(0x72C0212E67A08BCEn),
      new sdk.symbol.models.Amount(1000000n)
    ),
    // 作成したカスタムモザイクを1送信
    new sdk.symbol.descriptors.UnresolvedMosaicDescriptor(
      new sdk.symbol.models.UnresolvedMosaicId(mosaicDefTx.id.value),
      new sdk.symbol.models.Amount(1n)
    )
  ],
  new Uint8Array()  // メッセージなし
);

// 署名とアナウンス
tx = facade.createTransactionFromTypedDescriptor(descriptor, aliceKey.publicKey, 100, 60 * 60 * 2);
sig = aliceKey.signTransaction(tx);
jsonPayload = facade.transactionFactory.static.attachSignature(tx, sig);
await fetch(
  new URL('/transactions', NODE),
  { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: jsonPayload }
);
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

```js
txInfo = await fetch(
  new URL(
    "/transactions/confirmed/" + facade.hashTransaction(tx).toString(),
    NODE,
  ),
  {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  },
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

```js
// モザイクフラグ設定
f = sdk.symbol.models.MosaicFlags.NONE.value;
// f += sdk.symbol.models.MosaicFlags.SUPPLY_MUTABLE.value; // 供給量変更の可否
f += sdk.symbol.models.MosaicFlags.TRANSFERABLE.value; // 第三者への譲渡可否
f += sdk.symbol.models.MosaicFlags.RESTRICTABLE.value; // 制限設定の可否
f += sdk.symbol.models.MosaicFlags.REVOKABLE.value; // 発行者からの還収可否
flags = new sdk.symbol.models.MosaicFlags(f);

// ナンス設定
array = new Uint8Array(sdk.symbol.models.MosaicNonce.SIZE);
crypto.getRandomValues(array);
nonce = new sdk.symbol.models.MosaicNonce(
  array[0] * 0x00000001 +
    array[1] * 0x00000100 +
    array[2] * 0x00010000 +
    array[3] * 0x01000000,
);

// モザイク定義Tx作成
divisibility = 0; // 可分性
mosaicDefDescriptor = new sdk.symbol.descriptors.MosaicDefinitionTransactionV1Descriptor(
  new sdk.symbol.models.MosaicId(sdk.symbol.generateMosaicId(
    aliceKey.address, // 署名者公開鍵
    nonce.value
  )),
  new sdk.symbol.models.BlockDuration(0n),  // duration:有効期限
  nonce,
  flags,
  divisibility
);
mosaicDefTx = facade.createEmbeddedTransactionFromTypedDescriptor(mosaicDefDescriptor, aliceKey.publicKey);

//モザイク数量固定
mosaicChangeDescriptor = new sdk.symbol.descriptors.MosaicSupplyChangeTransactionV1Descriptor(
  new sdk.symbol.models.UnresolvedMosaicId(mosaicDefTx.id.value),
  new sdk.symbol.models.Amount(1n),
  sdk.symbol.models.MosaicSupplyChangeAction.INCREASE
);
mosaicChangeTx = facade.createEmbeddedTransactionFromTypedDescriptor(mosaicChangeDescriptor, aliceKey.publicKey);

nftTxDescriptor = new sdk.symbol.descriptors.TransferTransactionV1Descriptor(
  bobAddress,
  [
    new sdk.symbol.descriptors.UnresolvedMosaicDescriptor(
      new sdk.symbol.models.UnresolvedMosaicId(mosaicDefTx.id.value),
      new sdk.symbol.models.Amount(1n)
    )
  ],
  `\0Hello, Symbol!` // NFTデータ実体
)
nftTx = facade.createTransactionFromTypedDescriptor(nftTxDescriptor, aliceKey.publicKey, 100, 60 * 60 * 2);

// マークルハッシュの算出
embeddedTransactions = [mosaicDefTx, mosaicChangeTx, nftTx];
aggregateDescriptor = new sdk.symbol.descriptors.AggregateCompleteTransactionV2Descriptor(
  facade.static.hashEmbeddedTransactions(embeddedTransactions),
  embeddedTransactions
);
aggregateTx = facade.createTransactionFromTypedDescriptor(aggregateDescriptor, aliceKey.publicKey, 100, 60 * 60 * 2, 0);

// 連署により追加される連署情報のサイズを追加して最終的なTxサイズを算出する
requiredCosignatures = 0; // 必要な連署者の数を指定
calculatedCosignatures =
  requiredCosignatures > aggregateTx.cosignatures.length
    ? requiredCosignatures
    : aggregateTx.cosignatures.length;
sizePerCosignature = 8 + 32 + 64;
calculatedSize =
  aggregateTx.size -
  aggregateTx.cosignatures.length * sizePerCosignature +
  calculatedCosignatures * sizePerCosignature;
aggregateTx.fee = new sdk.symbol.models.Amount(BigInt(calculatedSize * 100)); //手数料

// 署名とアナウンス(5.2参照)
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

```js
// モザイクフラグ設定
f = sdk.symbol.models.MosaicFlags.NONE.value;
f += sdk.symbol.models.MosaicFlags.SUPPLY_MUTABLE.value; // 供給量変更の可否
// f += sdk.symbol.models.MosaicFlags.TRANSFERABLE.value;   // 第三者への譲渡可否(ここでは使用しない)
f += sdk.symbol.models.MosaicFlags.RESTRICTABLE.value; // 制限設定の可否
f += sdk.symbol.models.MosaicFlags.REVOKABLE.value; // 発行者からの還収可否
flags = new sdk.symbol.models.MosaicFlags(f);
```

トランザクションは以下のように記述します。
(今回はMosaicの作成はしていないのでmosaicIdは適切な値を指定してください)

```js
// モザイク回収トランザクションの作成
revocationDescriptor = new sdk.symbol.descriptors.MosaicSupplyRevocationTransactionV1Descriptor(
  bobAddress, // ソースアドレス（回収対象のアカウント）
  new sdk.symbol.descriptors.UnresolvedMosaicDescriptor(
    new sdk.symbol.models.UnresolvedMosaicId(mosaicId), // 回収するモザイクID
    new sdk.symbol.models.Amount(1n) // 回収する量
  )
);

// トランザクション作成
revocationTx = facade.createTransactionFromTypedDescriptor(revocationDescriptor, aliceKey.publicKey, 100, 60 * 60 * 2);
revocationTx.fee = new sdk.symbol.models.Amount(BigInt(revocationTx.size * 100)); //手数料

// 署名とアナウンス
sig = aliceKey.signTransaction(revocationTx);
jsonPayload = facade.transactionFactory.static.attachSignature(revocationTx, sig);
await fetch(
  new URL('/transactions', NODE),
  { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: jsonPayload }
);
```
