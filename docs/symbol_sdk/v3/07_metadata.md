---
sidebar_position: 7
---

# 7.メタデータ

アカウント・モザイク・ネームスペースに対してKey-Value形式のデータを登録することができます。  
Valueの最大値は1024バイトです。
本章ではモザイク・ネームスペースの作成アカウントとメタデータの作成アカウントがどちらもAliceであることを前提に説明します。

本章のサンプルスクリプトを実行する前に以下を実行して必要ライブラリを読み込んでおいてください。
v3 ではキーを生成するメソッドが無いため、 v2 と同様のキーを生成するためにハッシュライブラリをインポートする必要があります。

```js
sha3_256 = (await import("https://cdn.skypack.dev/@noble/hashes/sha3"))
  .sha3_256;
```

## 7.1 アカウントに登録

アカウントに対して、Key-Value値を登録します。

```js
// ターゲットと作成者アドレスの設定
targetAddress = aliceAddress.toString(); // メタデータ記録先アドレス
sourceAddress = aliceAddress.toString(); // メタデータ作成者アドレス

// キーと値の設定
key = "key_account";
value = "test";

// キー生成(v2 準拠)
hasher = sha3_256.create();
hasher.update(new TextEncoder().encode(key));
digest = hasher.digest();
lower = [...digest.subarray(0, 4)];
lower.reverse();
lowerValue = BigInt("0x" + sdk.core.utils.uint8ToHex(lower));
higher = [...digest.subarray(4, 8)];
higher.reverse();
higherValue = BigInt("0x" + sdk.core.utils.uint8ToHex(higher)) | 0x80000000n;
keyId = lowerValue + higherValue * 0x100000000n;
valueData = new TextEncoder().encode(value);

// 同じキーのメタデータが登録されているか確認
query = new URLSearchParams({
  targetAddress: targetAddress,
  sourceAddress: sourceAddress,
  scopedMetadataKey: keyId.toString(16).toUpperCase(),
  metadataType: 0,
});
metadataInfo = await fetch(new URL("/metadata?" + query.toString(), NODE), {
  method: "GET",
  headers: { "Content-Type": "application/json" },
})
  .then((res) => res.json())
  .then((json) => {
    return json.data;
  });
// 登録済の場合は差分データを作成する
sizeDelta = valueData.length;
if (metadataInfo.length > 0) {
  sizeDelta -= metadataInfo[0].metadataEntry.valueSize;
  originData = sdk.core.utils.hexToUint8(metadataInfo[0].metadataEntry.value);
  diffData = new Uint8Array(Math.max(originData.length, valueData.length));
  for (idx = 0; idx < diffData.length; idx++) {
    diffData[idx] =
      (originData[idx] == undefined ? 0 : originData[idx]) ^
      (valueData[idx] == undefined ? 0 : valueData[idx]);
  }
  valueData = diffData;
}

// アカウントメタデータ登録Tx作成
metadataDescriptor = new sdk.symbol.descriptors.AccountMetadataTransactionV1Descriptor(
  targetAddress,
  keyId,
  sizeDelta,
  valueData
);

// アグリゲートTx作成
embeddedTx = facade.createEmbeddedTransactionFromTypedDescriptor(metadataDescriptor, aliceKey.publicKey);
embeddedTransactions = [embeddedTx];
aggregateDescriptor = new sdk.symbol.descriptors.AggregateCompleteTransactionV2Descriptor(
  facade.static.hashEmbeddedTransactions(embeddedTransactions),
  embeddedTransactions
);
aggregateTx = facade.createTransactionFromTypedDescriptor(aggregateDescriptor, aliceKey.publicKey, 100, 60 * 60 * 2);

// 署名とアナウンス
sig = aliceKey.signTransaction(aggregateTx);
jsonPayload = facade.transactionFactory.static.attachSignature(aggregateTx, sig);
await fetch(new URL('/transactions', NODE), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: jsonPayload });
```

メタデータの登録には記録先アカウントが承諾を示す署名が必要です。
また、記録先アカウントと記録者アカウントが同一でもアグリゲートトランザクションにする必要があります。

異なるアカウントのメタデータに登録する場合は署名時に
signTransactionWithCosignatoriesを使用します。

```js
// ターゲットと作成者アドレスの設定
targetAddress = bobAddress.toString(); // メタデータ記録先アドレス
sourceAddress = aliceAddress.toString(); // メタデータ作成者アドレス

// キーと値の設定
key = "key_account";
value = "test";

// キー生成(v2 準拠)
hasher = sha3_256.create();
hasher.update(new TextEncoder().encode(key));
digest = hasher.digest();
lower = [...digest.subarray(0, 4)];
lower.reverse();
lowerValue = BigInt("0x" + sdk.core.utils.uint8ToHex(lower));
higher = [...digest.subarray(4, 8)];
higher.reverse();
higherValue = BigInt("0x" + sdk.core.utils.uint8ToHex(higher)) | 0x80000000n;
keyId = lowerValue + higherValue * 0x100000000n;
valueData = new TextEncoder().encode(value);

// 同じキーのメタデータが登録されているか確認
query = new URLSearchParams({
  targetAddress: targetAddress,
  sourceAddress: sourceAddress,
  scopedMetadataKey: keyId.toString(16).toUpperCase(),
  metadataType: 0,
});
metadataInfo = await fetch(new URL("/metadata?" + query.toString(), NODE), {
  method: "GET",
  headers: { "Content-Type": "application/json" },
})
  .then((res) => res.json())
  .then((json) => {
    return json.data;
  });

// 登録済の場合は差分データを作成する
sizeDelta = valueData.length;
if (metadataInfo.length > 0) {
  sizeDelta -= metadataInfo[0].metadataEntry.valueSize;
  originData = sdk.core.utils.hexToUint8(metadataInfo[0].metadataEntry.value);
  diffData = new Uint8Array(Math.max(originData.length, valueData.length));
  for (idx = 0; idx < diffData.length; idx++) {
    diffData[idx] =
      (originData[idx] == undefined ? 0 : originData[idx]) ^
      (valueData[idx] == undefined ? 0 : valueData[idx]);
  }
  valueData = diffData;
}

// アカウントメタデータ登録Tx作成
metadataDescriptor = new sdk.symbol.descriptors.AccountMetadataTransactionV1Descriptor(
  targetAddress,
  keyId,
  sizeDelta,
  valueData
);

// アグリゲートTx作成
embeddedTx = facade.createEmbeddedTransactionFromTypedDescriptor(metadataDescriptor, aliceKey.publicKey);
embeddedTransactions = [embeddedTx];
aggregateDescriptor = new sdk.symbol.descriptors.AggregateCompleteTransactionV2Descriptor(
  facade.static.hashEmbeddedTransactions(embeddedTransactions),
  embeddedTransactions
);
aggregateTx = facade.createTransactionFromTypedDescriptor(aggregateDescriptor, aliceKey.publicKey, 100, 60 * 60 * 2);

// 作成者による署名
sig = aliceKey.signTransaction(aggregateTx);
jsonPayload = facade.transactionFactory.static.attachSignature(aggregateTx, sig);

// 記録先アカウントによる連署
coSig = facade.cosignTransaction(bobKey, aggregateTx, false);
aggregateTx.cosignatures.push(coSig);

// アナウンス
await fetch(new URL("/transactions", NODE), {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    payload: sdk.symbol.utils.uint8ToHex(aggregateTx.serialize()),
  }),
});
```

bobの秘密鍵が分からない場合はこの後の章で説明する
アグリゲートボンデッドトランザクション、あるいはオフライン署名を使用する必要があります。

## 7.2 モザイクに登録

ターゲットとなるモザイクに対して、Key値・ソースアカウントの複合キーでValue値を登録します。
登録・更新にはモザイクを作成したアカウントの署名が必要です。

```js
// ターゲットと作成者アドレスの設定
targetMosaic = 0x1275b0b7511d9161n; // メタデータ記録先モザイク
mosaicInfo = await fetch(
  new URL("/mosaics/" + targetMosaic.toString(16).toUpperCase(), NODE),
  {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  },
)
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
sourceAddress = new sdk.symbol.symbol.Address(
  sdk.symbol.utils.hexToUint8(mosaicInfo.mosaic.ownerAddress),
); // モザイク作成者アドレス

// キーと値の設定
key = "key_mosaic";
value = "test";

// キー生成(v2 準拠)
hasher = sha3_256.create();
hasher.update(new TextEncoder().encode(key));
digest = hasher.digest();
lower = [...digest.subarray(0, 4)];
lower.reverse();
lowerValue = BigInt("0x" + sdk.core.utils.uint8ToHex(lower));
higher = [...digest.subarray(4, 8)];
higher.reverse();
higherValue = BigInt("0x" + sdk.core.utils.uint8ToHex(higher)) | 0x80000000n;
keyId = lowerValue + higherValue * 0x100000000n;
valueData = new TextEncoder().encode(value);

// 同じキーのメタデータが登録されているか確認
query = new URLSearchParams({
  targetId: targetMosaic.toString(16).toUpperCase(),
  sourceAddress: sourceAddress,
  scopedMetadataKey: keyId.toString(16).toUpperCase(),
  metadataType: 1,
});
metadataInfo = await fetch(new URL("/metadata?" + query.toString(), NODE), {
  method: "GET",
  headers: { "Content-Type": "application/json" },
})
  .then((res) => res.json())
  .then((json) => {
    return json.data;
  });

// 登録済の場合は差分データを作成する
sizeDelta = valueData.length;
if (metadataInfo.length > 0) {
  sizeDelta -= metadataInfo[0].metadataEntry.valueSize;
  originData = sdk.core.utils.hexToUint8(metadataInfo[0].metadataEntry.value);
  diffData = new Uint8Array(Math.max(originData.length, valueData.length));
  for (idx = 0; idx < diffData.length; idx++) {
    diffData[idx] =
      (originData[idx] == undefined ? 0 : originData[idx]) ^
      (valueData[idx] == undefined ? 0 : valueData[idx]);
  }
  valueData = diffData;
}

// モザイクメタデータ登録Tx作成
metadataDescriptor = new sdk.symbol.descriptors.MosaicMetadataTransactionV1Descriptor(
  targetAddress,
  targetMosaic,
  keyId,
  sizeDelta,
  valueData
);

// アグリゲートTx作成
embeddedTx = facade.createEmbeddedTransactionFromTypedDescriptor(metadataDescriptor, aliceKey.publicKey);
embeddedTransactions = [embeddedTx];
aggregateDescriptor = new sdk.symbol.descriptors.AggregateCompleteTransactionV2Descriptor(
  facade.static.hashEmbeddedTransactions(embeddedTransactions),
  embeddedTransactions
);
aggregateTx = facade.createTransactionFromTypedDescriptor(aggregateDescriptor, aliceKey.publicKey, 100, 60 * 60 * 2);

// 署名とアナウンス
sig = aliceKey.signTransaction(aggregateTx);
jsonPayload = facade.transactionFactory.static.attachSignature(aggregateTx, sig);
await fetch(new URL('/transactions', NODE), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: jsonPayload });
```

## 7.3 ネームスペースに登録

ネームスペースに対して、Key-Value値を登録します。
登録・更新にはネームスペースを作成したアカウントの署名が必要です。

```js
// ターゲットと作成者アドレスの設定
targetNamespace = sdk.symbol.generateNamespaceId("xembook"); // メタデータ記録先ネームスペース
namespaceInfo = await fetch(
  new URL("/namespaces/" + targetNamespace.toString(16).toUpperCase(), NODE),
  {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  },
)
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
sourceAddress = new sdk.symbol.symbol.Address(
  sdk.symbol.utils.hexToUint8(namespaceInfo.namespace.ownerAddress),
); // ネームスペース作成者アドレス

// キーと値の設定
key = "key_namespace";
value = "test";

// キー生成(v2 準拠)
hasher = sha3_256.create();
hasher.update(new TextEncoder().encode(key));
digest = hasher.digest();
lower = [...digest.subarray(0, 4)];
lower.reverse();
lowerValue = BigInt("0x" + sdk.core.utils.uint8ToHex(lower));
higher = [...digest.subarray(4, 8)];
higher.reverse();
higherValue = BigInt("0x" + sdk.core.utils.uint8ToHex(higher)) | 0x80000000n;
keyId = lowerValue + higherValue * 0x100000000n;
valueData = new TextEncoder().encode(value);

// 同じキーのメタデータが登録されているか確認
query = new URLSearchParams({
  targetId: targetNamespace.toString(16).toUpperCase(),
  sourceAddress: sourceAddress,
  scopedMetadataKey: keyId.toString(16).toUpperCase(),
  metadataType: 2,
});
metadataInfo = await fetch(new URL("/metadata?" + query.toString(), NODE), {
  method: "GET",
  headers: { "Content-Type": "application/json" },
})
  .then((res) => res.json())
  .then((json) => {
    return json.data;
  });

// 登録済の場合は差分データを作成する
sizeDelta = valueData.length;
if (metadataInfo.length > 0) {
  sizeDelta -= metadataInfo[0].metadataEntry.valueSize;
  originData = sdk.core.utils.hexToUint8(metadataInfo[0].metadataEntry.value);
  diffData = new Uint8Array(Math.max(originData.length, valueData.length));
  for (idx = 0; idx < diffData.length; idx++) {
    diffData[idx] =
      (originData[idx] == undefined ? 0 : originData[idx]) ^
      (valueData[idx] == undefined ? 0 : valueData[idx]);
  }
  valueData = diffData;
}

// ネームスペースメタデータ登録Tx作成
metadataDescriptor = new sdk.symbol.descriptors.NamespaceMetadataTransactionV1Descriptor(
  targetAddress,
  targetNamespace,
  keyId,
  sizeDelta,
  valueData
);

// アグリゲートTx作成
embeddedTx = facade.createEmbeddedTransactionFromTypedDescriptor(metadataDescriptor, aliceKey.publicKey);
embeddedTransactions = [embeddedTx];
aggregateDescriptor = new sdk.symbol.descriptors.AggregateCompleteTransactionV2Descriptor(
  facade.static.hashEmbeddedTransactions(embeddedTransactions),
  embeddedTransactions
);
aggregateTx = facade.createTransactionFromTypedDescriptor(aggregateDescriptor, aliceKey.publicKey, 100, 60 * 60 * 2);

// 署名とアナウンス
sig = aliceKey.signTransaction(aggregateTx);
jsonPayload = facade.transactionFactory.static.attachSignature(aggregateTx, sig);
await fetch(new URL('/transactions', NODE), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: jsonPayload });
```

## 7.4 確認

登録したメタデータを確認します。

```js
query = new URLSearchParams({
  targetAddress: aliceAddress,
  sourceAddress: aliceAddress,
});
res = await fetch(new URL("/metadata?" + query.toString(), NODE), {
  method: "GET",
  headers: { "Content-Type": "application/json" },
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
console.log(res);
```

###### 出力例

```js
> {data: Array(3), pagination: {…}}
  data: Array(3)
  > 0:
      id: "64B918B76FFE587B6D3625C9"
    > metadataEntry:
        compositeHash: "D2C53CF2F4601F9BD367C2BB4B15CD250D6E21EF59BE99B9D368C25B8A0CF1E1"
        metadataType: 0
        scopedMetadataKey: "9772B71B058127D7"
        sourceAddress: "982B2AA2295B5C23528ADDEE7F29F6521944E9F2340428AB"
        targetAddress: "982B2AA2295B5C23528ADDEE7F29F6521944E9F2340428AB"
        targetId: "0000000000000000"
        value: "74657374"
        valueSize: 4
        version: 1
  > 1:
      id: "64B9191C6FFE587B6D36266A"
    > metadataEntry:
        compositeHash: "6B95280F23224CA0A8D02C586C8E0E5043DC339EA6F3EC9EB3CBEBB12D8C5971"
        metadataType: 1
        scopedMetadataKey: "CF217E116AA422E2"
        sourceAddress: "982B2AA2295B5C23528ADDEE7F29F6521944E9F2340428AB"
        targetAddress: "982B2AA2295B5C23528ADDEE7F29F6521944E9F2340428AB"
        targetId: "3D86CF283C1C547D"
        value: "74657374"
        valueSize: 4
        version: 1
  > 2:
      id: "64B919576FFE587B6D3626D5"
    > metadataEntry:
        compositeHash: "C92EF86FA799EF32364164584BCFB66A0A874C70C7A8495FA869A8C2E936B99A"
        metadataType: 2
        scopedMetadataKey: "8B6A8A370873D0D9"
        sourceAddress: "982B2AA2295B5C23528ADDEE7F29F6521944E9F2340428AB"
        targetAddress: "982B2AA2295B5C23528ADDEE7F29F6521944E9F2340428AB"
        targetId: "D9D35A75833F4C53"
        value: "74657374"
        valueSize: 4
        version: 1
```

metadataTypeは以下の通りです。

```js
sym.MetadataType
{0: 'Account', 1: 'Mosaic', 2: 'Namespace'}
```

### 注意事項

メタデータはキー値で素早く情報にアクセスできるというメリットがある一方で更新可能であることに注意しておく必要があります。
更新には、発行者アカウントと登録先アカウントの署名が必要のため、それらのアカウントの管理状態が信用できる場合のみ使用するようにしてください。

## 7.5 現場で使えるヒント

### 有資格証明

モザイクの章で所有証明、ネームスペースの章でドメインリンクの説明をしました。
実社会で信頼性の高いドメインからリンクされたアカウントが発行したメタデータの付与を受けることで
そのドメイン内での有資格情報の所有を証明することができます。

#### DID

分散型アイデンティティと呼ばれます。
エコシステムは発行者、所有者、検証者に分かれ、例えば大学が発行した卒業証書を学生が所有し、
企業は学生から提示された証明書を大学が公表している公開鍵をもとに検証します。
このやりとりにプラットフォームに依存する情報はありません。
メタデータを活用することで、大学は学生の所有するアカウントにメタデータを発行することができ、
企業は大学の公開鍵と学生のモザイク(アカウント)所有証明でメタデータに記載された卒業証明を検証することができます。
