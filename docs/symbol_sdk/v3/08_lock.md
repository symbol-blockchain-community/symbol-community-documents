---
sidebar_position: 8
---

# 8.ロック

Symbolブロックチェーンにはハッシュロックとシークレットロックの２種類のロック機構があります。

## 8.1 ハッシュロック

ハッシュロックは後でアナウンスされる予定のトランザクションを事前にハッシュ値で登録しておくことで、
該当トランザクションがアナウンスされた場合に、そのトランザクションをAPIノード上で処理せずにロックさせて、署名が集まってから処理を行うことができます。
アカウントが所有するモザイクを操作できないようにロックするわけではなく、ロックされるのはハッシュ値の対象となるトランザクションとなります。
ハッシュロックにかかる費用は10XYM、有効期限は最大約48時間です。ロックしたトランザクションが承認されれば10XYMは返却されます。

### アグリゲートボンデッドトランザクションの作成

```js
bobKey = new symbolSdk.symbol.KeyPair(symbolSdk.PrivateKey.random());
bobAddress = facade.network.publicKeyToAddress(bobKey.publicKey);

namespaceIds = symbolSdk.symbol.generateNamespacePath("symbol.xym");
namespaceId = namespaceIds[namespaceIds.length - 1];

// アグリゲートTxに含めるTxを作成
tx1 = facade.transactionFactory.createEmbedded({
  type: "transfer_transaction_v1", // Txタイプ:転送Tx
  signerPublicKey: aliceKey.publicKey, // Aliceから
  recipientAddress: bobAddress.toString(), // Bobへの送信
  mosaics: [
    { mosaicId: namespaceId, amount: 1000000n }, // 1XYM送金
  ],
  message: new Uint8Array(), // メッセージ無し
});

tx2 = facade.transactionFactory.createEmbedded({
  type: "transfer_transaction_v1", // Txタイプ:転送Tx
  signerPublicKey: bobKey.publicKey, // Bobから
  recipientAddress: aliceAddress.toString(), // Aliceへの送信
  message: new Uint8Array([
    0x00,
    ...new TextEncoder("utf-8").encode("thank you!"),
  ]), // 平文メッセージ
});

// マークルハッシュの算出
embeddedTransactions = [tx1, tx2];
merkleHash = facade.constructor.hashEmbeddedTransactions(embeddedTransactions);

// アグリゲートTx作成
aggregateTx = facade.transactionFactory.create({
  type: "aggregate_bonded_transaction_v2",
  signerPublicKey: aliceKey.publicKey, // 署名者公開鍵
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  transactionsHash: merkleHash,
  transactions: embeddedTransactions,
});

// 連署により追加される連署情報のサイズを追加して最終的なTxサイズを算出する
requiredCosignatures = 1; // 必要な連署者の数を指定
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

// 署名
sig = facade.signTransaction(aliceKey, aggregateTx);
jsonPayload = facade.transactionFactory.constructor.attachSignature(
  aggregateTx,
  sig,
);
```

tx1,tx2の2つのトランザクションをaggregateArrayで配列にする時に、送信元アカウントの公開鍵を指定します。
公開鍵はアカウントの章を参考に事前にAPIで取得しておきましょう。
配列化されたトランザクションはブロック承認時にその順序で整合性を検証されます。
例えば、tx1でNFTをAliceからBobへ送信した後、tx2でBobからCarolへ同じNFTを送信することは可能ですが、tx2,tx1の順序でアグリゲートトランザクションを通知するとエラーになります。
また、アグリゲートトランザクションの中に1つでも整合性の合わないトランザクションが存在していると、アグリゲートトランザクション全体がエラーとなってチェーンに承認されることはありません。

### ハッシュロックトランザクションの作成と署名、アナウンス

```js
// ハッシュロックTx作成
hashLockTx = facade.transactionFactory.create({
  type: "hash_lock_transaction_v1", // Txタイプ:ハッシュロックTx
  signerPublicKey: aliceKey.publicKey, // 署名者公開鍵
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  mosaic: { mosaicId: namespaceId, amount: 10n * 1000000n }, // 10xym固定値
  duration: new symbolSdk.symbol.BlockDuration(480n), // ロック有効期限
  hash: facade.hashTransaction(aggregateTx), // アグリゲートトランザクションのハッシュ値を登録
});
hashLockTx.fee = new symbolSdk.symbol.Amount(BigInt(hashLockTx.size * 100)); // 手数料

// 署名
hashLockSig = facade.signTransaction(aliceKey, hashLockTx);
hashLockJsonPayload = facade.transactionFactory.constructor.attachSignature(
  hashLockTx,
  hashLockSig,
);

// ハッシュロックTXをアナウンス
await fetch(new URL("/transactions", NODE), {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: hashLockJsonPayload,
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
```

### アグリゲートボンデッドトランザクションのアナウンス

エクスプローラーなどで確認した後、ボンデッドトランザクションをネットワークにアナウンスします。

```js
await fetch(
  new URL("/transactions/partial", NODE), // アグリゲートボンデッドTxはアナウンスする際のURLが違う
  {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: jsonPayload,
  },
)
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
```

### 連署

ロックされたトランザクションを指定されたアカウント(Bob)で連署します。

```js
// アグリゲートボンデッドトランザクションの取得
txInfo = await fetch(
  new URL(
    "/transactions/partial/" + facade.hashTransaction(aggregateTx).toString(),
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

// 連署者の署名
cosignature = new symbolSdk.symbol.DetachedCosignature();
signTxHash = new symbolSdk.symbol.Hash256(
  symbolSdk.utils.hexToUint8(txInfo.meta.hash),
);
cosignature.parentHash = signTxHash;
cosignature.version = 0n;
cosignature.signerPublicKey = bobKey.publicKey;
cosignature.signature = new symbolSdk.symbol.Signature(
  bobKey.sign(signTxHash.bytes).bytes,
);

// アナウンス
body = {
  parentHash: cosignature.parentHash.toString(),
  signature: cosignature.signature.toString(),
  signerPublicKey: cosignature.signerPublicKey.toString(),
  version: cosignature.version.toString(),
};
await fetch(new URL("/transactions/cosignature", NODE), {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
```

### 注意点

ハッシュロックトランザクションは起案者(トランザクションを作成し最初に署名するアカウント)に限らず、誰が作成してアナウンスしても大丈夫ですが、
アグリゲートトランザクションにそのアカウントがsignerとなるトランザクションを含めるようにしてください。
モザイク送信無し＆メッセージ無しのダミートランザクションでも問題ありません（パフォーマンスに影響が出るための仕様とのことです）
また、ハッシュロックトランザクションが承認された直後にボンデッドトランザクションをアナウンスした場合、
ハッシュロックの承認がネットワーク全体に伝播する前にボンデッドトランザクションを受け取ってしまうノードが出てくる可能性があります。
そのような状態を防ぐために、ボンデッドトランザクションはハッシュロックトランザクションが承認された後しばらく待ってからアナウンスするようにしてください。

## 8.2 シークレットロック・シークレットプルーフ

シークレットロックは事前に共通パスワードを作成しておき、指定モザイクをロックします。
受信者が有効期限内にパスワードの所有を証明することができればロックされたモザイクを受け取ることができる仕組みです。

ここではAliceが1XYMをロックしてBobが解除することで受信する方法を説明します。

まずはAliceとやり取りするBobアカウントを作成します。
ロック解除にBob側からトランザクションをアナウンスする必要があるのでFAUCETで10XYMほど受信しておきます。

```js
bobKey = new symbolSdk.symbol.KeyPair(symbolSdk.PrivateKey.random());
bobAddress = facade.network.publicKeyToAddress(bobKey.publicKey);
console.log(bobAddress.toString());

//FAUCET URL出力
console.log(
  "https://testnet.symbol.tools/?recipient=" +
    bobAddress.toString() +
    "&amount=10",
);
```

### シークレットロック

ロック・解除にかかわる共通暗号を作成します。

```js
sha3_256 = (await import("https://cdn.skypack.dev/@noble/hashes/sha3"))
  .sha3_256;

proof = crypto.getRandomValues(new Uint8Array(20)); // 解除用キーワード
hash = sha3_256.create();
hash.update(proof);
secret = hash.digest(); // ロック用キーワード
console.log("secret:" + symbolSdk.utils.uint8ToHex(secret));
console.log("proof:" + symbolSdk.utils.uint8ToHex(proof));
```

###### 出力例

```js
> secret:D5543DD80B973DCBD0ED792667242DF301E83383367A49B30E926272EA915E24
> proof:065949369A849D5D5B7B8BC2F948508228D67BCD
```

トランザクションを作成・署名・アナウンスします

```js
// シークレットロックTx作成
lockTx = facade.transactionFactory.create({
  type: "secret_lock_transaction_v1", // Txタイプ:シークレットロックTx
  signerPublicKey: aliceKey.publicKey, // 署名者公開鍵
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  mosaic: { mosaicId: namespaceId, amount: 1000000n }, // ロックするモザイク
  duration: new symbolSdk.symbol.BlockDuration(480n), // ロック期間(ブロック数)
  hashAlgorithm: symbolSdk.symbol.LockHashAlgorithm.SHA3_256, // ロックキーワード生成に使用したアルゴリズム
  secret: secret, // ロック用キーワード
  recipientAddress: bobAddress, // 解除時の転送先:Bob
});
lockTx.fee = new symbolSdk.symbol.Amount(BigInt(lockTx.size * 100)); // 手数料

// 署名
sig = facade.signTransaction(aliceKey, lockTx);
jsonPayload = facade.transactionFactory.constructor.attachSignature(
  lockTx,
  sig,
);

// シークレットロックTXをアナウンス
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

LockHashAlgorithmは以下の通りです。

```js
{0: 'Op_Sha3_256', 1: 'Op_Hash_160', 2: 'Op_Hash_256'}
```

ロック時に解除先を指定するのでBob以外のアカウントが解除しても転送先（Bob）を変更することはできません。
ロック期間は最長で365日(ブロック数を日換算)までです。

承認されたトランザクションを確認します。

```js
params = new URLSearchParams({
  secret: symbolSdk.utils.uint8ToHex(secret),
});
result = await fetch(new URL("/lock/secret?" + params.toString(), NODE), {
  method: "GET",
  headers: { "Content-Type": "application/json" },
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });

txes = result.data;
txes.forEach((tx) => {
  console.log(tx);
});
```

###### 出力例

```js
> {lock: {…}, id: '64BBC4CD6FFE587B6D3F7D80'}
    id: "64BBC4CD6FFE587B6D3F7D80"
    lock:
      amount: "1000000"
      compositeHash: "905CDD9755A0B30E1AFE4395482DB0673E3FE9CEA3445861BE56B044A9CF212D"
      endHeight: "657898"
      hashAlgorithm: 0
      mosaicId: "72C0212E67A08BCE"
      ownerAddress: "982B2AA2295B5C23528ADDEE7F29F6521944E9F2340428AB"
      recipientAddress: "98A8D76FEF8382274D472EE377F2FF3393E5B62C08B4329D"
      secret: "079FEC44B889EF6E96A4B614930B1271B7BB8EE9412596C4BECB199DE6A7D30E"
      status: 0
      version: 1
```

ロックしたAliceがownerAddress、受信予定のBobがrecipientAddressに記録されています。
secret情報が公開されていて、これに対応するproofをBobがネットワークに通知します。

### シークレットプルーフ

解除用キーワードを使用してロック解除します。
Bobは事前に解除用キーワードを入手しておく必要があります。

```js
// シークレットプルーフTx作成
proofTx = facade.transactionFactory.create({
  type: "secret_proof_transaction_v1", // Txタイプ:シークレットプルーフTx
  signerPublicKey: bobKey.publicKey, // 署名者公開鍵
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  hashAlgorithm: symbolSdk.symbol.LockHashAlgorithm.SHA3_256, // ロックキーワード生成に使用したアルゴリズム
  secret: secret, // ロックキーワード
  recipientAddress: bobAddress, // 解除アカウント（受信アカウント）
  proof: proof, // 解除用キーワード
});
proofTx.fee = new symbolSdk.symbol.Amount(BigInt(proofTx.size * 100)); // 手数料

// 署名
sig = facade.signTransaction(bobKey, proofTx);
jsonPayload = facade.transactionFactory.constructor.attachSignature(
  proofTx,
  sig,
);

// シークレットロックTXをアナウンス
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

承認結果を確認します。

```js
// 承認確認
txInfo = await fetch(
  new URL(
    "/transactions/confirmed/" + facade.hashTransaction(proofTx).toString(),
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
> {meta: {…}, transaction: {…}, id: '64BBC85E2F7CE156B010F80E'}
    id: "64BBC85E2F7CE156B010F80E"
  > meta:
      feeMultiplier: 100
      hash: "68526EBA094A8F4D8FB6118C04FDB44CCA321F278AF93D54203FFBDB7672C255"
      height: "657450"
      index: 0
      merkleComponentHash: "68526EBA094A8F4D8FB6118C04FDB44CCA321F278AF93D54203FFBDB7672C255"
      timestamp: "22777659619"
  > transaction:
      deadline: "22784827324"
      hashAlgorithm: 0
      maxFee: "20700"
      network: 152
      proof: "11E7035AC7269DAF9551078987CCEF359BB851BA"
      recipientAddress: "98A8D76FEF8382274D472EE377F2FF3393E5B62C08B4329D"
      secret: "079FEC44B889EF6E96A4B614930B1271B7BB8EE9412596C4BECB199DE6A7D30E"
      signature: "5EBF2281D4557ED8ECF6B3A63AE5284E42BDD379AE671CEA7A5F4A758C74FB2AA3101F80654FD98DE301100A09E9B524C49C1E00998CAA0817F95029A5372A0C"
      signerPublicKey: "662CEDF69962B1E0F1BF0C43A510DFB12190128B90F7FE9BA48B1249E8E10DBE"
      size: 207
      type: 16978
      version: 1
```

SecretProofTransactionにはモザイクの受信量の情報は含まれていません。
ブロック生成時に作成されるレシートで受信量を確認します。
レシートタイプ:LockSecret_Completed でBob宛のレシートを検索してみます。

```js
params = new URLSearchParams({
  receiptType: symbolSdk.symbol.ReceiptType.LOCK_SECRET_COMPLETED.value,
  targetAddress: bob.address.toString(),
});
result = await fetch(
  new URL("/statements/transaction?" + params.toString(), NODE),
  {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  },
)
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
console.log(result.data);
```

###### 出力例

```js
> (1) [{…}]
  > 0:
      id: "64BBC7952F7CE156B010F7FD"
    > meta:
        timestamp: "22777457773"
    > statement:
        height: "657444"
      > receipts: Array(1)
        > 0:
            amount: "1000000"
            mosaicId: "72C0212E67A08BCE"
            targetAddress: "98A8D76FEF8382274D472EE377F2FF3393E5B62C08B4329D"
            type: 8786
            version: 1
          length: 1
      > source:
          primaryId: 1
          secondaryId: 0
```

ReceiptTypeは以下の通りです。

```js
{4685: 'Mosaic_Rental_Fee', 4942: 'Namespace_Rental_Fee', 8515: 'Harvest_Fee', 8776: 'LockHash_Completed', 8786: 'LockSecret_Completed', 9032: 'LockHash_Expired', 9042: 'LockSecret_Expired', 12616: 'LockHash_Created', 12626: 'LockSecret_Created', 16717: 'Mosaic_Expired', 16718: 'Namespace_Expired', 16974: 'Namespace_Deleted', 20803: 'Inflation', 57667: 'Transaction_Group', 61763: 'Address_Alias_Resolution', 62019: 'Mosaic_Alias_Resolution'}

8786: 'LockSecret_Completed' :ロック解除完了
9042: 'LockSecret_Expired'　：ロック期限切れ
```

## 8.3 現場で使えるヒント

### 手数料代払い

一般的にブロックチェーンはトランザクション送信に手数料を必要とします。
そのため、ブロックチェーンを利用しようとするユーザは事前に手数料を取引所から入手しておく必要があります。
このユーザが企業である場合はその管理方法も加えてさらにハードルの高い問題となります。
アグリゲートトランザクションを使用することでハッシュロック費用とネットワーク手数料をサービス提供者が代理で負担することができます。

### タイマー送信

シークレットロックは指定ブロック数を経過すると元のアカウントへ払い戻されます。
この原理を利用して、シークレットロックしたアカウントにたいしてロック分の費用をサービス提供者が充足しておけば、
期限が過ぎた後ユーザ側がロック分のトークン所有量が増加することになります。
一方で、期限が過ぎる前にシークレット証明トランザクションをアナウンスすると、送信が完了し、サービス提供者に充当戻るためキャンセル扱いとなります。

### アトミックスワップ

シークレットロックを使用して、他のチェーンとのトークン・モザイクの交換を行うことができます。
他のチェーンではハッシュタイムロックコントラクト(HTLC)と呼ばれているためハッシュロックと間違えないようにご注意ください。
