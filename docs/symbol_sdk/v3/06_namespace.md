---
sidebar_position: 6
---

# 6.ネームスペース

Symbolブロックチェーンではネームスペースをレンタルしてアドレスやモザイクに視認性の高い単語をリンクさせることができます。
ネームスペースは最大64文字、利用可能な文字は a, b, c, …, z, 0, 1, 2, …, 9, \_ , - です。

## 6.1 手数料の計算

ネームスペースのレンタルにはネットワーク手数料とは別にレンタル手数料が発生します。
ネットワークの活性度に比例して価格が変動しますので、取得前に確認するようにしてください。

ルートネームスペースを365日レンタルする場合の手数料を計算します。

```js
rentalFees = await fetch(new URL("/network/fees/rental", NODE), {
  method: "GET",
  headers: { "Content-Type": "application/json" },
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });

rootNsperBlock = Number(rentalFees.effectiveRootNamespaceRentalFeePerBlock);
rentalDays = 365;
rentalBlock = (rentalDays * 24 * 60 * 60) / 30;
rootNsRenatalFeeTotal = rentalBlock * rootNsperBlock;
console.log("rentalBlock:" + rentalBlock);
console.log("rootNsRenatalFeeTotal:" + rootNsRenatalFeeTotal);
```

###### 出力例

```js
> rentalBlock:1051200
> rootNsRenatalFeeTotal:210240000 //約210XYM
```

期間はブロック数で指定します。1ブロックを30秒として計算しました。
最低で30日分はレンタルする必要があります（最大で1825日分）。

サブネームスペースの取得手数料を計算します。

```js
// レンタル手数料の取得
rentalFees = await fetch(
  new URL('/network/fees/rental', NODE),
  { method: 'GET', headers: { 'Content-Type': 'application/json' } }
).then(res => res.json());
console.log(rentalFees);
childNamespaceRentalFee = Number(rentalFees.effectiveChildNamespaceRentalFee);
console.log(childNamespaceRentalFee);
```

###### 出力例

```js
> 10000000 //10XYM
```

サブネームスペースに期間指定はありません。ルートネームスペースをレンタルしている限り使用できます。

## 6.2 レンタル

ルートネームスペースをレンタルします(例:xembook)

```js
rootName = "yournamespacename"; // 各自で値を設定してください
rootDescriptor = new symbolSdk.descriptors.NamespaceRegistrationTransactionV1Descriptor(
  new symbolSdk.models.NamespaceId(symbolSdk.generateNamespaceId(rootName)),
  symbolSdk.models.NamespaceRegistrationType.ROOT,
  new symbolSdk.models.BlockDuration(86400n),
  undefined,
  rootName
);
rootTx = facade.createTransactionFromTypedDescriptor(rootDescriptor, aliceKey.publicKey, 100, 60 * 60 * 2);
sig = aliceKey.signTransaction(rootTx);
jsonPayload = facade.transactionFactory.static.attachSignature(rootTx, sig);
await fetch(new URL('/transactions', NODE), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: jsonPayload });
```

サブネームスペースをレンタルします(例:xembook.tomato)

```js
parentNameId = symbolSdk.generateNamespaceId(rootName); // 紐づけたいルートネームスペース
name = "tomato"; // 作成するサブネームスペース
subDescriptor = new symbolSdk.descriptors.NamespaceRegistrationTransactionV1Descriptor(
  new symbolSdk.models.NamespaceId(symbolSdk.generateNamespaceId(name, parentNameId)),
  symbolSdk.models.NamespaceRegistrationType.CHILD,
  undefined,
  parentNameId,
  name
);
subNamespaceTx = facade.createTransactionFromTypedDescriptor(subDescriptor, aliceKey.publicKey, 100, 60 * 60 * 2);
// 署名とアナウンス
sig = aliceKey.signTransaction(subNamespaceTx);
jsonPayload = facade.transactionFactory.static.attachSignature(subNamespaceTx, sig);
await fetch(new URL('/transactions', NODE), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: jsonPayload });
```

2階層目のサブネームスペースを作成したい場合は
例えば、xembook.tomato.morningを定義したい場合は以下のようにします。

```js
// ネームスペース設定
rootNameId = symbolSdk.generateNamespaceId(rootName); // ルートネームスペース
parentNameId = symbolSdk.generateNamespaceId(name, rootNameId); // 紐づけたい1階層目のサブネームスペース
name = "morning"; // 作成するサブネームスペース

// 以下はサブネームスペース作成と同じ
```

### 有効期限の計算

レンタル済みルートネームスペースの有効期限を計算します。

```js
namespaceIds = symbolSdk.generateNamespacePath("quicklearnsymbolyourname"); // ルートネームスペース
namespaceId = new symbolSdk.models.NamespaceId(namespaceIds[namespaceIds.length - 1]);

nsInfo = await fetch(
  new URL("/namespaces/" + namespaceId.toString(16).toUpperCase(), NODE),
  {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  },
)
  .then((res) => res.json())
  .then((json) => {
    return json.namespace;
  });

chainInfo = await fetch(new URL("/chain/info", NODE), {
  method: "GET",
  headers: { "Content-Type": "application/json" },
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
lastHeight = chainInfo.height;

lastBlock = await fetch(new URL("/blocks/" + lastHeight, NODE), {
  method: "GET",
  headers: { "Content-Type": "application/json" },
})
  .then((res) => res.json())
  .then((json) => {
    return json.block;
  });
remainHeight = nsInfo.endHeight - lastHeight;

endDate = new Date(
  Number(lastBlock.timestamp) + remainHeight * 30000 + epochAdjustment * 1000,
);
console.log(endDate);
```

ネームスペース情報の終了ブロックを取得し、現在のブロック高から差し引いた残ブロック数に30秒(平均ブロック生成間隔)を掛け合わせた日時を出力します。
テストネットでは設定した有効期限よりも1日程度更新期限が猶予されます。メインネットはこの値が30日となっていますのでご留意ください

###### 出力例

```js
> Tue Mar 29 2022 18:17:06 GMT+0900 (日本標準時)
```

## 6.3 リンク

### アカウントへのリンク

```js
// リンクするネームスペースとアドレスの設定
namespaceIds = symbolSdk.generateNamespacePath(rootName);
namespaceId = new symbolSdk.models.NamespaceId(namespaceIds[namespaceIds.length - 1]);
address = new symbolSdk.Address("TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ");  // リンク先アドレス

// Tx作成(Txタイプ:アドレスエイリアスTx)
descriptor = new symbolSdk.descriptors.AddressAliasTransactionV1Descriptor(
  namespaceId,
  address,
  symbolSdk.models.AliasAction.LINK
);
tx = facade.createTransactionFromTypedDescriptor(descriptor, aliceKey.publicKey, 100, 60 * 60 * 2);

// 署名とアナウンス
sig = aliceKey.signTransaction(tx);
jsonPayload = facade.transactionFactory.static.attachSignature(tx, sig);
await fetch(new URL('/transactions', NODE), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: jsonPayload });
```

リンク先のアドレスは自分が所有していなくても問題ありません。

### モザイクへリンク

```js
// リンクするネームスペースとモザイクの設定
namespaceIds = symbolSdk.generateNamespacePath(`${rootName}.${name}`); // {namespace}.{mosaic}形式
namespaceId = new symbolSdk.models.NamespaceId(namespaceIds[namespaceIds.length - 1]);
mosaicId = new symbolSdk.models.MosaicId(0x3A8416DB2D53****n);  // リンク先モザイクID

// Tx作成(Txタイプ:モザイクエイリアスTx)
descriptor = new symbolSdk.descriptors.MosaicAliasTransactionV1Descriptor(
  namespaceId,
  mosaicId,
  symbolSdk.models.AliasAction.LINK
);
tx = facade.createTransactionFromTypedDescriptor(descriptor, aliceKey.publicKey, 100, 60 * 60 * 2);

// 署名とアナウンス
sig = aliceKey.signTransaction(tx);
jsonPayload = facade.transactionFactory.static.attachSignature(tx, sig);
await fetch(new URL('/transactions', NODE), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: jsonPayload });
```

モザイクを作成したアドレスと同一の場合のみリンクできるようです。

## 6.4 未解決で使用

送信先にUnresolvedAccountとして指定して、アドレスを特定しないままトランザクションを署名・アナウンスします。
チェーン側で解決されたアカウントに対しての送信が実施されます。

v3 ではネームスペースを直接指定できないため、アドレスを特定しないまま操作する場合はデータを加工する必要があります。

```js
// UnresolvedAccount 導出
namespaceId = symbolSdk.generateNamespaceId(rootName);
namespaceIdData = symbolSdk.utils.hexToUint8(namespaceId.toString(16));
namespaceIdData.reverse();
unresolvecAccount = new Uint8Array([
  networkType + 1,
  ...namespaceIdData,
  ...new Uint8Array(24 - (namespaceIdData.length + 1)),
]);

// Tx作成(Txタイプ:転送Tx)
tx = facade.createTransactionFromTypedDescriptor(
  new symbolSdk.descriptors.TransferTransactionV1Descriptor(
    unresolvecAccount, // UnresolvedAccount:未解決アカウントアドレス
    [], // 送信モザイクなし
    new Uint8Array(), // 空メッセージ
    new symbolSdk.models.Amount(BigInt(tx.size * 100)), // 手数料
    new symbolSdk.models.Deadline(facade.network.fromDatetime(Date.now()).addHours(2).timestamp), // Deadline:有効期限
    new symbolSdk.models.MosaicId(0x3A8416DB2D53xxxxn) // 送信モザイクID
  ),
  aliceKey.publicKey, // 署名者公開鍵
  100, // 手数料乗数
  60 * 60 * 2 // 有効期限（2時間）
);

// 署名とアナウンス
sig = aliceKey.signTransaction(tx);
jsonPayload = facade.transactionFactory.static.attachSignature(tx, sig);
await fetch(new URL('/transactions', NODE), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: jsonPayload });
```

送信モザイクにUnresolvedMosaicとして指定して、モザイクIDを特定しないままトランザクションを署名・アナウンスします。

```js
// address = new symbolSdk.Address("*****"); // 送信先アドレス
namespaceIds = symbolSdk.generateNamespacePath(`${rootName}.${name}`); // {namespace}.{mosaic}形式
namespaceId = new symbolSdk.models.NamespaceId(namespaceIds[namespaceIds.length - 1]);

// Tx作成(Txタイプ:転送Tx)
tx = facade.createTransactionFromTypedDescriptor(
  new symbolSdk.descriptors.TransferTransactionV1Descriptor(
    address, // 送信先アドレス
    [
      {
        mosaicId: namespaceId, // UnresolvedMosaic:未解決モザイク
        amount: 1n, // 送信量
      },
    ],
    new Uint8Array(), // 空メッセージ
    new symbolSdk.models.Amount(BigInt(tx.size * 100)), // 手数料
    new symbolSdk.models.Deadline(facade.network.fromDatetime(Date.now()).addHours(2).timestamp), // Deadline:有効期限
    new symbolSdk.models.MosaicId(0x3A8416DB2D53xxxxn) // 送信モザイクID
  ),
  aliceKey.publicKey, // 署名者公開鍵
  100, // 手数料乗数
  60 * 60 * 2 // 有効期限（2時間）
);

// 署名とアナウンス
sig = aliceKey.signTransaction(tx);
jsonPayload = facade.transactionFactory.static.attachSignature(tx, sig);
await fetch(new URL('/transactions', NODE), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: jsonPayload });
```

XYMをネームスペースで使用する場合は以下のように指定します。

```js
namespaceIds = symbolSdk.generateNamespacePath("symbol.xym");
namespaceId = new symbolSdk.models.NamespaceId(namespaceIds[namespaceIds.length - 1]);
```

```js
> 16666583871264174062n
```

## 6.5 参照

アドレスへリンクしたネームスペースの参照します

```js
nameId = symbolSdk.generateNamespaceId(rootName);
namespaceInfo = await fetch(
  new URL("/namespaces/" + nameId.toString(16).toUpperCase(), NODE),
  {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  },
)
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
console.log(namespaceInfo);
```

###### 出力例

```js
> {meta: {…}, namespace: {…}, id: '6492E0242F7CE156B00D7580'}
    id: "6492E0242F7CE156B00D7580"
  > meta:
      active: true
      index: 9
  > namespace:
    > alias:
        address: "981CFF6235B50FEAB020C824D5E0EBD4894F8D605DD2DF93"
        type: 2 //AliasType
      depth: 1
      endHeight: "1432950"
      level0: "A43415EB268C7385"
      ownerAddress: "981CFF6235B50FEAB020C824D5E0EBD4894F8D605DD2DF93"
      parentId: "0000000000000000"
      registrationType: 0 // NamespaceRegistrationType
      startHeight: "393270"
      version: 1
```

AliasTypeは以下の通りです。

```js
{0: 'None', 1: 'Mosaic', 2: 'Address'}
```

NamespaceRegistrationTypeは以下の通りです。

```js
{0: 'RootNamespace', 1: 'SubNamespace'}
```

モザイクへリンクしたネームスペースを参照します。

```js
namespaceIds = symbolSdk.generateNamespacePath(`${rootName}.${name}`);
nameId = new symbolSdk.models.NamespaceId(namespaceIds[namespaceIds.length - 1]);
namespaceInfo = await fetch(
  new URL("/namespaces/" + nameId.toString(16).toUpperCase(), NODE),
  {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  },
)
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
console.log(namespaceInfo);
```

###### 出力例

```js
> {meta: {…}, namespace: {…}, id: '6492E0242F7CE156B00D758B'}
    id: "6492E0242F7CE156B00D758B"
  > meta:
      active: true
      index: 9
  > namespace:
    > alias:
        mosaicId: "663B178E904CADB8"
        type: 1 //AliasType
      depth: 1
      endHeight: "1432950"
      level0: "A43415EB268C7385"
      level1: "FA547FD28C836431"
      ownerAddress: "981CFF6235B50FEAB020C824D5E0EBD4894F8D605DD2DF93"
      parentId: "A43415EB268C7385"
      registrationType: 1 // NamespaceRegistrationType
      startHeight: "393270"
      version: 1
```

### 逆引き

アドレスに紐づけられたネームスペースを全て調べます。

```js
body = {
  addresses: ["TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ"],
};
accountNames = await fetch(new URL("/namespaces/account/names", NODE), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})
  .then((res) => res.json())
  .then((json) => {
    return json.accountNames;
  });

namespaceIds = accountNames[0].names;
console.log(namespaceIds);
```

モザイクに紐づけられたネームスペースを全て調べます。

```js
body = {
  mosaicIds: ["72C0212E67A08BCE"],
};
mosaicNames = await fetch(new URL("/namespaces/mosaic/names", NODE), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})
  .then((res) => res.json())
  .then((json) => {
    return json.mosaicNames;
  });

namespaceIds = mosaicNames[0].names;
console.log(namespaceIds);
```

### レシートの参照

トランザクションに使用されたネームスペースをブロックチェーン側がどう解決したかを確認します。
v3 では、ネームスペースを紐づけている対象によってアクセスする際のURLが異なります。

##### アドレスの場合

```js
query = new URLSearchParams({
  height: 179401, // 6.4 で作成したTxが取り込まれたブロック高
});
state = await fetch(
  new URL("/statements/resolutions/address?" + query.toString(), NODE), // アドレス用のURI
  {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  },
)
  .then((res) => res.json())
  .then((json) => {
    return json.data;
  });
```

##### モザイクの場合

```js
query = new URLSearchParams({
  height: 179401, // 6.4 で作成したTxが取り込まれたブロック高
});
state = await fetch(
  new URL("/statements/resolutions/mosaic?" + query.toString(), NODE), // モザイク用のURI
  {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  },
)
  .then((res) => res.json())
  .then((json) => {
    return json.data;
  });
```

###### 出力例

```js
> data: Array(1)
  > 0:
      id: "64B6A3742F7CE156B0108826"
    > meta:
        timestamp: "22440529194"
    > statement:
        height: "646246"
        resolutionEntries: Array(1)
        > 0:
            resolved: "986A4B98552007D13947E6F4F1202604BD26CC4018BACACC"
          > source:
              primaryId: 1
              secondaryId: 0
        unresolved: "99534C3F83755AD3D9000000000000000000000000000000"
```

#### 注意事項

ネームスペースはレンタル制のため、過去のトランザクションで使用したネームスペースのリンク先と
現在のネームスペースのリンク先が異なる可能性があります。
過去のデータを参照する際などに、その時どのアカウントにリンクしていたかなどを知りたい場合は
必ずレシートを参照するようにしてください。

## 6.6 現場で使えるヒント

### 外部ドメインとの相互リンク

ネームスペースは重複取得がプロトコル上制限されているため、
インターネットドメインや実世界で周知されている商標名と同一のネームスペースを取得し、
外部(公式サイトや印刷物など)からネームスペース存在の認知を公表することで、
Symbol上のアカウントのブランド価値を構築することができます
(法的な効力については調整が必要です)。
外部ドメイン側のハッキングあるいは、Symbol側でのネームスペース更新忘れにはご注意ください。

#### ネームスペースを取得するアカウントについての注意

ネームスペースはレンタル期限という概念をもつ機能です。
今のところ、取得したネームスペースは放棄か延長の選択肢しかありません。
運用譲渡などが発生する可能性のあるシステムでネームスペース活用を検討する場合は
マルチシグ化(9章)したアカウントでネームスペースを取得することをおすすめします。
