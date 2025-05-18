---
sidebar_position: 11
---

# 11.制限

アカウントに対する制限とモザイクのグローバル制限についての方法を紹介します。
本章では、既存アカウントの権限を制限してしまうので、使い捨てのアカウントを新規に作成してお試しください。

```js
// 使い捨てアカウントCarolの生成
carolKey = new symbolSdk.symbol.KeyPair(symbolSdk.PrivateKey.random());
carolAddress = facade.network.publicKeyToAddress(carolKey.publicKey);
console.log(carolAddress.toString());

// FAUCET URL出力
console.log(
  "https://testnet.symbol.tools/?recipient=" +
    carolAddress.toString() +
    "&amount=100",
);
```

## 11.1 アカウント制限

### 指定アドレスからの受信制限・指定アドレスへの送信制限

```js
bobKey = new symbolSdk.symbol.KeyPair(symbolSdk.PrivateKey.random());
bobAddress = facade.network.publicKeyToAddress(bobKey.publicKey);

// 制限設定
f = symbolSdk.symbol.AccountRestrictionFlags.ADDRESS.value; // アドレス制限
f += symbolSdk.symbol.AccountRestrictionFlags.BLOCK.value; // ブロック
flags = new symbolSdk.symbol.AccountRestrictionFlags(f);

// アドレス制限設定Tx作成
tx = facade.transactionFactory.create({
  type: "account_address_restriction_transaction_v1", // Txタイプ:アドレス制限設定Tx
  signerPublicKey: carolKey.publicKey, // 署名者公開鍵
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  restrictionFlags: flags, // アドレス制限フラグ
  restrictionAdditions: [
    // 設定アドレス
    bobAddress,
  ],
  restrictionDeletions: [], // 解除アドレス
});
tx.fee = new symbolSdk.symbol.Amount(BigInt(tx.size * 100)); // 手数料

// 署名
sig = facade.signTransaction(carolKey, tx);
jsonPayload = facade.transactionFactory.constructor.attachSignature(tx, sig);

// アドレス制限設定Txをアナウンス
await fetch(new URL("/transactions", NODE), {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: jsonPayload,
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
```

`restrictionFlags` は v2 の `AddressRestrictionFlag` に相当します。
`AddressRestrictionFlag` との対応は以下の通りです。

- AllowIncomingAddress：指定アドレスからのみ受信許可
  - symbolSdk.symbol.AccountRestrictionFlags.ADDRESS
- AllowOutgoingAddress：指定アドレス宛のみ送信許可
  - symbolSdk.symbol.AccountRestrictionFlags.ADDRESS + symbolSdk.symbol.AccountRestrictionFlags.OUTGOING
- BlockIncomingAddress：指定アドレスからの受信受拒否
  - symbolSdk.symbol.AccountRestrictionFlags.ADDRESS + symbolSdk.symbol.AccountRestrictionFlags.BLOCK
- BlockOutgoingAddress：指定アドレス宛への送信禁止
  - symbolSdk.symbol.AccountRestrictionFlags.ADDRESS + symbolSdk.symbol.AccountRestrictionFlags.BLOCK + symbolSdk.symbol.AccountRestrictionFlags.OUTGOING

### 指定モザイクの受信制限

```js
// 制限設定
f = symbolSdk.symbol.AccountRestrictionFlags.MOSAIC_ID.value; // モザイク制限
f += symbolSdk.symbol.AccountRestrictionFlags.BLOCK.value; // ブロック
flags = new symbolSdk.symbol.AccountRestrictionFlags(f);

// モザイク制限設定Tx作成
tx = facade.transactionFactory.create({
  type: "account_mosaic_restriction_transaction_v1", // Txタイプ:モザイク制限設定Tx
  signerPublicKey: carolKey.publicKey, // 署名者公開鍵
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  restrictionFlags: flags, // モザイク制限フラグ
  restrictionAdditions: [
    // 設定モザイク
    0x72c0212e67a08bcen,
  ],
  restrictionDeletions: [], // 解除モザイク
});
tx.fee = new symbolSdk.symbol.Amount(BigInt(tx.size * 100)); // 手数料

// 署名
sig = facade.signTransaction(carolKey, tx);
jsonPayload = facade.transactionFactory.constructor.attachSignature(tx, sig);

// モザイク制限設定Txをアナウンス
await fetch(new URL("/transactions", NODE), {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: jsonPayload,
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
```

アカウント制限と同様、 `restrictionFlags` は v2 の `MosaicRestrictionFlag` に相当します。
`MosaicRestrictionFlag` との対応は以下の通りです。

- AllowMosaic：指定モザイクを含むトランザクションのみ受信許可
  - symbolSdk.symbol.AccountRestrictionFlags.MOSAIC_ID
- BlockMosaic：指定モザイクを含むトランザクションを受信拒否
  - symbolSdk.symbol.AccountRestrictionFlags.MOSAIC_ID + symbolSdk.symbol.AccountRestrictionFlags.BLOCK

モザイク送信の制限機能はありません。
また、後述するモザイクのふるまいを制限するグローバルモザイク制限と混同しないようにご注意ください。

### 指定トランザクションの送信制限

```js
// 制限設定
f = symbolSdk.symbol.AccountRestrictionFlags.TRANSACTION_TYPE.value; // トランザクション制限
f += symbolSdk.symbol.AccountRestrictionFlags.OUTGOING.value; // 送信
flags = new symbolSdk.symbol.AccountRestrictionFlags(f);

// トランザクション制限設定Tx作成
tx = facade.transactionFactory.create({
  type: "account_operation_restriction_transaction_v1", // Txタイプ:トランザクション制限設定Tx
  signerPublicKey: carolKey.publicKey, // 署名者公開鍵
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  restrictionFlags: flags, // トランザクション制限フラグ
  restrictionAdditions: [
    // 設定トランザクション
    symbolSdk.symbol.TransactionType.ACCOUNT_OPERATION_RESTRICTION.value,
  ],
  restrictionDeletions: [], // 解除トランザクション
});
tx.fee = new symbolSdk.symbol.Amount(BigInt(tx.size * 100)); // 手数料

// 署名
sig = facade.signTransaction(carolKey, tx);
jsonPayload = facade.transactionFactory.constructor.attachSignature(tx, sig);

// トランザクション制限設定Txをアナウンス
await fetch(new URL("/transactions", NODE), {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: jsonPayload,
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
```

アカウント制限やモザイク制限と同様、 `restrictionFlags` は v2 の `OperationRestrictionFlag` に相当します。
`OperationRestrictionFlag` との対応は以下の通りです。

- AllowOutgoingTransactionType：指定トランザクションの送信のみ許可
  - symbolSdk.symbol.AccountRestrictionFlags.TRANSACTION_TYPE + symbolSdk.symbol.AccountRestrictionFlags.OUTGOING
- BlockOutgoingTransactionType：指定トランザクションの送信を禁止
  - symbolSdk.symbol.AccountRestrictionFlags.TRANSACTION_TYPE + symbolSdk.symbol.AccountRestrictionFlags.OUTGOING + symbolSdk.symbol.AccountRestrictionFlags.BLOCK

TransactionTypeについては以下の通りです。

```js
{16705: 'AGGREGATE_COMPLETE', 16707: 'VOTING_KEY_LINK', 16708: 'ACCOUNT_METADATA', 16712: 'HASH_LOCK', 16716: 'ACCOUNT_KEY_LINK', 16717: 'MOSAIC_DEFINITION', 16718: 'NAMESPACE_REGISTRATION', 16720: 'ACCOUNT_ADDRESS_RESTRICTION', 16721: 'MOSAIC_GLOBAL_RESTRICTION', 16722: 'SECRET_LOCK', 16724: 'TRANSFER', 16725: 'MULTISIG_ACCOUNT_MODIFICATION', 16961: 'AGGREGATE_BONDED', 16963: 'VRF_KEY_LINK', 16964: 'MOSAIC_METADATA', 16972: 'NODE_KEY_LINK', 16973: 'MOSAIC_SUPPLY_CHANGE', 16974: 'ADDRESS_ALIAS', 16976: 'ACCOUNT_MOSAIC_RESTRICTION', 16977: 'MOSAIC_ADDRESS_RESTRICTION', 16978: 'SECRET_PROOF', 17220: 'NAMESPACE_METADATA', 17229: 'MOSAIC_SUPPLY_REVOCATION', 17230: 'MOSAIC_ALIAS'}
```

##### 注意事項

17232: 'ACCOUNT_OPERATION_RESTRICTION' の制限は許可されていません。
つまり、AllowOutgoingTransactionTypeを指定する場合は、ACCOUNT_OPERATION_RESTRICTIONを必ず含める必要があり、
BlockOutgoingTransactionTypeを指定する場合は、ACCOUNT_OPERATION_RESTRICTIONを含めることはできません。

### 確認

設定した制限情報を確認します

```js
res = await fetch(
  new URL("/restrictions/account/" + carolAddress.toString(), NODE),
  {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  },
)
  .then((res) => res.json())
  .then((json) => {
    return json.accountRestrictions;
  });
console.log(res);
```

###### 出力例

```js
> {version: 1, address: '98A3670EF79748312687154D5B92AFED6B7C5E5A7560A423', restrictions: Array(3)}
    address: "98A3670EF79748312687154D5B92AFED6B7C5E5A7560A423"
  > restrictions: Array(3)
    > 0:
        restrictionFlags: 32769
      > values: Array(1)
          0: "98676BDA0CC03FFA5897BA9706005D119F0C240F71F587B9"
          length: 1
    > 1:
        restrictionFlags: 32770
      > values: Array(1)
          0: "72C0212E67A08BCE"
          length: 1
    > 2:
        restrictionFlags: 16388
      > values: Array(1)
          0: 17232
          length: 1
      length: 3
    version: 1
```

## 11.2 グローバルモザイク制限

グローバルモザイク制限はモザイクに対して送信可能な条件を設定します。  
その後、各アカウントに対してグローバルモザイク制限専用の数値メタデータを付与します。  
送信アカウント・受信アカウントの両方が条件を満たした場合のみ、該当モザイクを送信することができます。

### グローバル制限機能つきモザイクの作成

restrictableをtrueにしてCarolでモザイクを作成します。

```js
// モザイクフラグ設定
f = symbolSdk.symbol.MosaicFlags.NONE.value;
f += symbolSdk.symbol.MosaicFlags.SUPPLY_MUTABLE.value; // 供給量変更の可否
f += symbolSdk.symbol.MosaicFlags.TRANSFERABLE.value; // 第三者への譲渡可否
f += symbolSdk.symbol.MosaicFlags.RESTRICTABLE.value; // グローバル制限設定の可否
f += symbolSdk.symbol.MosaicFlags.REVOKABLE.value; // 発行者からの還収可否
flags = new symbolSdk.symbol.MosaicFlags(f);

// ナンス設定
array = new Uint8Array(symbolSdk.symbol.MosaicNonce.SIZE);
crypto.getRandomValues(array);
nonce = new symbolSdk.symbol.MosaicNonce(
  array[0] * 0x00000001 +
    array[1] * 0x00000100 +
    array[2] * 0x00010000 +
    array[3] * 0x01000000,
);

// モザイク定義
mosaicDefTx = facade.transactionFactory.createEmbedded({
  type: "mosaic_definition_transaction_v1", // Txタイプ:モザイク定義Tx
  signerPublicKey: carolKey.publicKey, // 署名者公開鍵
  id: new symbolSdk.symbol.MosaicId(
    symbolSdk.symbol.generateMosaicId(carolAddress, nonce.value),
  ),
  divisibility: 0, // divisibility:可分性
  duration: new symbolSdk.symbol.BlockDuration(0n), // duration:有効期限
  nonce: nonce,
  flags: flags,
});

// モザイク変更
mosaicChangeTx = facade.transactionFactory.createEmbedded({
  type: "mosaic_supply_change_transaction_v1", // Txタイプ:モザイク変更Tx
  signerPublicKey: carolKey.publicKey, // 署名者公開鍵
  mosaicId: mosaicDefTx.id.value,
  delta: new symbolSdk.symbol.Amount(1000000n), // 数量
  action: symbolSdk.symbol.MosaicSupplyChangeAction.INCREASE,
});

// キーと値の設定
key = "KYC"; // restrictionKey

// キー生成(v2 準拠)
hasher = sha3_256.create();
hasher.update(new TextEncoder().encode(key));
digest = hasher.digest();
lower = [...digest.subarray(0, 4)];
lower.reverse();
lowerValue = BigInt("0x" + symbolSdk.utils.uint8ToHex(lower));
higher = [...digest.subarray(4, 8)];
higher.reverse();
higherValue = BigInt("0x" + symbolSdk.utils.uint8ToHex(higher)) | 0x80000000n;
keyId = lowerValue + higherValue * 0x100000000n;

// グローバルモザイク制限
mosaicGlobalResTx = facade.transactionFactory.createEmbedded({
  type: "mosaic_global_restriction_transaction_v1", // Txタイプ:グローバルモザイク制限Tx
  signerPublicKey: carolKey.publicKey, // 署名者公開鍵
  mosaicId: mosaicDefTx.id.value,
  restrictionKey: keyId,
  newRestrictionValue: 1n,
  newRestrictionType: symbolSdk.symbol.MosaicRestrictionType.EQ,
});
// 更新する場合は以下も設定する必要あり
//   - mosaicGlobalResTx.previousRestrictionValue
//   - mosaicGlobalResTx.previousRestrictionType

// マークルハッシュの算出
embeddedTransactions = [mosaicDefTx, mosaicChangeTx, mosaicGlobalResTx];
merkleHash = facade.constructor.hashEmbeddedTransactions(embeddedTransactions);

// アグリゲートTx作成
aggregateTx = facade.transactionFactory.create({
  type: "aggregate_complete_transaction_v2",
  signerPublicKey: carolKey.publicKey, // 署名者公開鍵
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  transactionsHash: merkleHash,
  transactions: embeddedTransactions,
});

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
aggregateTx.fee = new symbolSdk.symbol.Amount(BigInt(calculatedSize * 100)); //手数料

// 署名とアナウンス
sig = facade.signTransaction(carolKey, aggregateTx);
jsonPayload = facade.transactionFactory.constructor.attachSignature(
  aggregateTx,
  sig,
);
await fetch(new URL("/transactions", NODE), {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: jsonPayload,
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
```

MosaicRestrictionTypeについては以下の通りです。

```js
{0: 'NONE', 1: 'EQ', 2: 'NE', 3: 'LT', 4: 'LE', 5: 'GT', 6: 'GE'}
```

| 演算子 | 略称 | 英語                     |
| ------ | ---- | ------------------------ |
| `=`    | EQ   | equal to                 |
| `!=`   | NE   | not equal to             |
| `<`    | LT   | less than                |
| `<=`   | LE   | less than or equal to    |
| `>`    | GT   | greater than             |
| `<=`   | GE   | greater than or equal to |

### アカウントへのモザイク制限適用

Carol,Bobに対してグローバル制限モザイクに対しての適格情報を追加します。  
送信・受信についてかかる制限なので、すでに所有しているモザイクについての制限はありません。  
送信を成功させるためには、送信者・受信者双方が条件をクリアしている必要があります。  
モザイク作成者の秘密鍵があればどのアカウントに対しても承諾の署名を必要とせずに制限をつけることができます。

```js
// Carolに適用
carolMosaicAddressResTx = facade.transactionFactory.create({
  type: "mosaic_address_restriction_transaction_v1", // Txタイプ:モザイク制限適用Tx
  signerPublicKey: carolKey.publicKey, // 署名者公開鍵
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  mosaicId: mosaicDefTx.id.value,
  restrictionKey: keyId,
  previousRestrictionValue: 0xffffffffffffffffn,
  newRestrictionValue: 1n,
  targetAddress: carolAddress,
});
carolMosaicAddressResTx.fee = new symbolSdk.symbol.Amount(
  BigInt(carolMosaicAddressResTx.size * 100),
); //手数料

// 署名とアナウンス
carolSig = facade.signTransaction(carolKey, carolMosaicAddressResTx);
carolJsonPayload = facade.transactionFactory.constructor.attachSignature(
  carolMosaicAddressResTx,
  carolSig,
);
await fetch(new URL("/transactions", NODE), {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: carolJsonPayload,
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });

bobKey = new symbolSdk.symbol.KeyPair(symbolSdk.PrivateKey.random());
bobAddress = facade.network.publicKeyToAddress(bobKey.publicKey);

// Bobに適用
bobMosaicAddressResTx = facade.transactionFactory.create({
  type: "mosaic_address_restriction_transaction_v1", // Txタイプ:モザイク制限適用Tx
  signerPublicKey: carolKey.publicKey, // 署名者公開鍵
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  mosaicId: mosaicDefTx.id.value,
  restrictionKey: keyId,
  previousRestrictionValue: 0xffffffffffffffffn,
  newRestrictionValue: 1n,
  targetAddress: bobAddress,
});
bobMosaicAddressResTx.fee = new symbolSdk.symbol.Amount(
  BigInt(bobMosaicAddressResTx.size * 100),
); //手数料

// 署名とアナウンス
bobSig = facade.signTransaction(carolKey, bobMosaicAddressResTx);
bobJsonPayload = facade.transactionFactory.constructor.attachSignature(
  bobMosaicAddressResTx,
  bobSig,
);
await fetch(new URL("/transactions", NODE), {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: bobJsonPayload,
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
```

### 制限状態確認

ノードに問い合わせて制限状態を確認します。

```js
query = new URLSearchParams({
  mosaicId: mosaicDefTx.id.toString().substr(2),
});
res = await fetch(new URL("/restrictions/mosaic?" + query.toString(), NODE), {
  method: "GET",
  headers: { "Content-Type": "application/json" },
})
  .then((res) => res.json())
  .then((json) => {
    return json.data;
  });
console.log(res);
```

###### 出力例

```js
> (3) [{…}, {…}, {…}]
  > 0:
      id: "64BD2ADC6FFE587B6D446083"
    > mosaicRestrictionEntry:
        compositeHash: "5A697731C9F459E1693B0ECA633FD19E050975A787F8F0E3528662FA187DDC50"
        entryType: 1
        mosaicId: "69594C1564469E28"
      > restrictions: Array(1)
        > 0:
            key: "9300605567124626807"
          > restriction:
              referenceMosaicId: "0000000000000000"
              restrictionType: 1
              restrictionValue: "1"
          length: 1
        version: 1
  > 1:
      id: "64BD3B4C6FFE587B6D4497E5"
    > mosaicRestrictionEntry:
        compositeHash: "986A5008C27D92E0BEC10D36694BDD7D6514035D115E8CA4224CAAF8F789BAF2"
        entryType: 0
        mosaicId: "69594C1564469E28"
      > restrictions: Array(1)
        > 0:
            key: "9300605567124626807"
            value: "1"
          length: 1
        targetAddress: "98A3670EF79748312687154D5B92AFED6B7C5E5A7560A423"
        version: 1
  > 2:
    ...
    length: 3
```

### 送信確認

実際にモザイクを送信してみて、制限状態を確認します。

```js
// 成功（CarolからBobに送信）
trTx = facade.transactionFactory.create({
  type: "transfer_transaction_v1", // Txタイプ:転送Tx
  signerPublicKey: carolKey.publicKey, // 署名者公開鍵
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  recipientAddress: bobAddress.toString(),
  mosaics: [{ mosaicId: mosaicDefTx.id.value, amount: 1n }],
  message: new Uint8Array(),
});
trTx.fee = new symbolSdk.symbol.Amount(BigInt(trTx.size * 100)); //手数料
// 署名とアナウンス
sig = facade.signTransaction(carolKey, trTx);
jsonPayload = facade.transactionFactory.constructor.attachSignature(trTx, sig);
await fetch(new URL("/transactions", NODE), {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: jsonPayload,
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });

// 失敗（CarolからDaveに送信）
daveKey = new symbolSdk.symbol.KeyPair(symbolSdk.PrivateKey.random());
daveAddress = facade.network.publicKeyToAddress(daveKey.publicKey);
// Tx作成
trTx = facade.transactionFactory.create({
  type: "transfer_transaction_v1", // Txタイプ:転送Tx
  signerPublicKey: carolKey.publicKey, // 署名者公開鍵
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  recipientAddress: daveAddress.toString(),
  mosaics: [{ mosaicId: mosaicDefTx.id.value, amount: 1n }],
  message: new Uint8Array(),
});
trTx.fee = new symbolSdk.symbol.Amount(BigInt(trTx.size * 100)); //手数料

// 署名とアナウンス
sig = facade.signTransaction(carolKey, trTx);
jsonPayload = facade.transactionFactory.constructor.attachSignature(trTx, sig);
await fetch(new URL("/transactions", NODE), {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: jsonPayload,
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
```

失敗した場合以下のようなエラーステータスになります。

```js
{"hash":"E3402FB7AE21A6A64838DDD0722420EC67E61206C148A73B0DFD7F8C098062FA","code":"Failure_RestrictionMosaic_Account_Unauthorized","deadline":"12371602742","group":"failed"}
```

## 11.3 現場で使えるヒント

ブロックチェーンの社会実装などを考えたときに、法律や信頼性の見地から
一つの役割のみを持たせたいアカウント、関係ないアカウントを巻き込みたくないと思うことがあります。
そんな場合にアカウント制限とグローバルモザイク制限を使いこなすことで、
モザイクのふるまいを柔軟にコントロールすることができます。

### アカウントバーン

AllowIncomingAddressによって指定アドレスからのみ受信可能にしておいて、  
XYMを全量送信すると、秘密鍵を持っていても自力では操作困難なアカウントを明示的に作成することができます。  
（最小手数料を0に設定したノードによって承認されることもあり、その可能性はゼロではありません）

### モザイクロック

譲渡不可設定のモザイクを配布し、配布者側のアカウントで受け取り拒否を行うとモザイクをロックさせることができます。

### 所属証明

モザイクの章で所有の証明について説明しました。グローバルモザイク制限を活用することで、
KYCが済んだアカウント間でのみ所有・流通させることが可能なモザイクを作り、所有者のみが所属できる独自経済圏を構築することが可能です。
