---
sidebar_position: 4
---

# 4.トランザクション

ブロックチェーン上のデータ更新はトランザクションをネットワークにアナウンスすることによって行います。

## 4.1 トランザクションのライフサイクル

トランザクションを作成してから、改ざんが困難なデータとなるまでを順に説明します。

- トランザクション作成
  - ブロックチェーンが受理できるフォーマットでトランザクションを作成します。
- 署名
  - アカウントの秘密鍵でトランザクションを署名します。
- アナウンス
  - 任意のノードに署名済みトランザクションを通知します。
- 未承認トランザクション
  - ノードに受理されたトランザクションは、未承認トランザクションとして全ノードに伝播します
    - トランザクションに設定した最大手数料が、各ノード毎に設定されている最低手数料を満たさない場合はそのノードへは伝播しません。
- 承認済みトランザクション
  - 約30秒に1度ごとに生成されるブロックに未承認トランザクションが取り込まれると、承認済みトランザクションとなります。
- ロールバック
  - ノード間の合意に達することができずロールバックされたブロックに含まれていたトランザクションは、未承認トランザクションに差し戻されます。
    - 有効期限切れや、キャッシュからあふれたトランザクションは切り捨てられます。
- ファイナライズ
  - 投票ノードによるファイナライズプロセスによりブロックが確定するとトランザクションはロールバック不可なデータとして扱うことができます。

### ブロックとは

ブロックは約30秒ごとに生成され、高い手数料を支払ったトランザクションから優先に取り込まれ、ブロック単位で他のノードと同期します。
同期に失敗するとロールバックして、ネットワークが全体で合意が取れるまでこの作業を繰り返します。

## 4.2 トランザクション作成

まずは最も基本的な転送トランザクションを作成してみます。

### Bobへの転送トランザクション

送信先のBobアドレスを作成しておきます。

```js
bobKey = facade.createAccount(sdkCore.PrivateKey.random());
console.log(bobKey.address.toString());
```

```js
> TDWBA6L3CZ6VTZAZPAISL3RWM5VKMHM6J6IM3LY
```

トランザクションを作成します。

```js
// 転送トランザクションの作成（1XYM送金 + メッセージ）
// 平文メッセージ
messageData = new Uint8Array([
  0x00,
  ...new TextEncoder("utf-8").encode("Hello, Symbol!"),
]);
// または下記
messageData = "\0Hello, Symbol!";  // 平文メッセージ（先頭に0x00）

descriptor = new symbolSdk.descriptors.TransferTransactionV1Descriptor(
  bobKey.address,
  [
    // 1XYM 送金
    new symbolSdk.descriptors.UnresolvedMosaicDescriptor(
      // symbol.xymのモザイクID: 0x72C0212E67A08BCE
      new symbolSdk.models.UnresolvedMosaicId(0x72C0212E67A08BCEn),
      // 1XYM(1 * 可分性6)
      new symbolSdk.models.Amount(1n * 1_000_000n)
    )
  ],
  messageData
);
tx = facade.createTransactionFromTypedDescriptor(descriptor, aliceKey.publicKey, 100, 60 * 60 * 2);
console.log(tx);
```

各設定項目について説明します。

#### 有効期限

sdkではデフォルトで2時間後に設定されます。
最大6時間まで指定可能です。

```js
facade.network.fromDatetime(new Date()).addHours(6).timestamp;
```

#### メッセージ

トランザクションに最大1023バイトのメッセージを添付することができます。
バイナリデータであってもrawdataとして送信することが可能です。

##### 空メッセージ

```js
messageData = new Uint8Array();
```

##### 平文メッセージ

v3 では先頭に平文メッセージを表すメッセージタイプ `0x00` を付加する必要があります。

```js
messageData = new Uint8Array([
  0x00,
  ...new TextEncoder("utf-8").encode("Hello, Symbol!"),
]);
```

##### 暗号文メッセージ

`MessageEncoder` を使用して暗号化すると、自動で暗号文メッセージを表すメッセージタイプ `0x01` が付加されます。

```js
message = "Hello Symbol!";
aliceMsgEncoder = new symbolSdk.MessageEncoder(aliceKey.keyPair);
messageData = aliceMsgEncoder.encode(
  bobKey.publicKey,
  new TextEncoder().encode(message),
);
```

##### 生データ

v3 では先頭に生データを表すメッセージタイプ `0xFF` を付加する必要があります。

```js
messageData = new Uint8Array([
  0xff,
  ...new TextEncoder("utf-8").encode("Hello, Symbol!"),
]);
```

#### 最大手数料

ネットワーク手数料については、常に少し多めに払っておけば問題はないのですが、最低限の知識は持っておく必要があります。
アカウントはトランザクションを作成するときに、ここまでは手数料として払ってもいいという最大手数料を指定します。
一方で、ノードはその時々で最も高い手数料となるトランザクションのみブロックにまとめて収穫しようとします。
つまり、多く払ってもいいというトランザクションが他に多く存在すると承認されるまでの時間が長くなります。
逆に、より少なく払いたいというトランザクションが多く存在し、その総額が大きい場合は、設定した最大額に満たない手数料額で送信が実現します。

トランザクションサイズ x feeMultiprilerというもので決定されます。
176バイトだった場合 maxFee を100で設定すると 17600μXYM = 0.0176XYMを手数料として支払うことを許容します。
feeMultiprier = 100として指定する方法とmaxFee = 17600 として指定する方法があります。

##### feeMultiprier = 100として指定する方法

```js
tx = facade.transactionFactory.create({
  type: "transfer_transaction_v1", // Txタイプ:転送Tx
  // 省略
});
tx.fee = new symbolSdk.symbol.Amount(BigInt(tx.size * 100)); //手数料
```

##### maxFee = 17600 として指定する方法

```js
tx = facade.transactionFactory.create({
  type: "transfer_transaction_v1", // Txタイプ:転送Tx
  fee: 17600n, // 手数料
  // 省略
});
```

本書では以後、feeMultiprier = 100として指定する方法で統一して説明します。

## 4.3 署名とアナウンス

作成したトランザクションを秘密鍵で署名して、任意のノードを通じてアナウンスします。

### 署名

```js
sig = facade.signTransaction(aliceKey, tx);
jsonPayload = facade.transactionFactory.constructor.attachSignature(tx, sig);
```

###### 出力例

```js
> '{"payload": "AF0000000000000041EE9F8B3EB4D54F069B1CD47A79656DCE4C85B486D1735DF054B91838ECF6E06B6F371BB986E676A5F5BF091A5DEF5230BC6E6112F7D2104BE24923355B890869A31A837EB7DE323F08CA52495A57BA0A95B52D1BB54CEA9A94C12A87B1CADB00000000019854415C44000000000000426B07250500000098A8D76FEF8382274D472EE377F2FF3393E5B62C08B4329D0F00000000000000FF48656C6C6F2C2053796D626F6C21"}'
```

### アナウンス

```js
res = await fetch(new URL("/transactions", NODE), {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: jsonPayload,
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
console.log(res);
```

```js
> {message: 'packet 9 was pushed to the network via /transactions'}
```

上記のスクリプトのように `packet n was pushed to the network` というレスポンスがあれば、トランザクションはノードに受理されたことになります。
これはトランザクションのフォーマット等に異常が無かった程度の意味しかありません。
Symbolではノードの応答速度を極限に高めるため、トランザクションの内容を検証するまえに受信結果の応答を返し接続を切断します。
レスポンス値はこの情報を受け取ったにすぎません。フォーマットに異常があった場合は以下のようなメッセージ応答があります。

##### アナウンスに失敗した場合の応答例

```js
> {code: 'InvalidArgument', message: 'payload has an invalid format'}
```

## 4.4 確認

### ステータスの確認

ノードに受理されたトランザクションのステータスを確認

```js
body = {
  hashes: facade.hashTransaction(tx).toString(),
};
transactionStatus = await fetch(new URL("/transactionStatus", NODE), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
if (transactionStatus.length <= 0) {
  console.error("not exist tx.");
} else {
  console.log(transactionStatus[0]);
}
```

###### 出力例

```js
> {group: 'confirmed', code: 'Success', hash: '02DC42E10B3E51B49AA9CD1074481C4B0764D8DA4BE7F33F83DC1DC9ED84C79D', deadline: '22164976452', height: '636865'}
```

承認されると ` group: "confirmed"`となっています。

受理されたものの、エラーが発生していた場合は以下のような出力となります。トランザクションを書き直して再度アナウンスしてみてください。

```js
> TransactionStatus
    group: "failed"
    code: "Failure_Core_Insufficient_Balance"
    deadline: Deadline {adjustedValue: 11990156766}
    hash: "A82507C6C46DF444E36AC94391EA2D0D7DD1A218948DED465A7A4F9D1B53CA0E"
    height: undefined
```

以下のようにResourceNotFoundエラーが発生した場合はトランザクションが受理されていません。

```js
Uncaught Error: {"statusCode":404,"statusMessage":"Unknown Error","body":"{\"code\":\"ResourceNotFound\",\"message\":\"no resource exists with id '18AEBC9866CD1C15270F18738D577CB1BD4B2DF3EFB28F270B528E3FE583F42D'\"}"}
```

考えられる可能性としては、トランザクションで指定した最大手数料が、ノードで設定された最低手数料に満たない場合や、
アグリゲートトランザクションとしてアナウンスすることが求められているトランザクションを単体のトランザクションでアナウンスした場合に発生するようです。

### 承認確認

トランザクションがブロックに承認されるまでに30秒程度かかります。

#### エクスプローラーで確認

signedTx.hash で取得できるハッシュ値を使ってエクスプローラーで検索してみましょう。

```js
console.log(facade.hashTransaction(tx).toString());
```

```js
> "661360E61C37E156B0BE18E52C9F3ED1022DCE846A4609D72DF9FA8A5B667747"
```

- メインネット
  - https://symbol.fyi/transactions/661360E61C37E156B0BE18E52C9F3ED1022DCE846A4609D72DF9FA8A5B667747
- テストネット
  - https://testnet.symbol.fyi/transactions/661360E61C37E156B0BE18E52C9F3ED1022DCE846A4609D72DF9FA8A5B667747

#### SDKで確認

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
> {meta: {…}, transaction: {…}, id: '64B253382F7CE156B01031C1'}
    id: "64B253382F7CE156B01031C1"
  > meta:
      feeMultiplier: 100
      hash: "02DC42E10B3E51B49AA9CD1074481C4B0764D8DA4BE7F33F83DC1DC9ED84C79D"
      height: "636865"
      index: 0
      merkleComponentHash: "02DC42E10B3E51B49AA9CD1074481C4B0764D8DA4BE7F33F83DC1DC9ED84C79D"
      timestamp: "22157844926"
  > transaction:
      deadline: "22164976452"
      maxFee: "17500"
      message: "0048656C6C6F2C2053796D626F6C21"
      mosaics: []
      network: 152
      recipientAddress: "98A8D76FEF8382274D472EE377F2FF3393E5B62C08B4329D"
      signature: "29783E718E414D2A2B62821FC53E66DCFEBDC1EF10FFD35F7662263FA7332F01CD47676429A982A85FEC7F2E7983D36F4BCE5C5AB1BB4A591BC54979AF906D0A"
      signerPublicKey: "69A31A837EB7DE323F08CA52495A57BA0A95B52D1BB54CEA9A94C12A87B1CADB"
      size: 175
      type: 16724
      version: 1
```

##### 注意点

トランザクションはブロックで承認されたとしても、ロールバックが発生するとトランザクションの承認が取り消される場合があります。
ブロックが承認された後、数ブロックの承認が進むと、ロールバックの発生する確率は減少していきます。
また、Votingノードの投票で実施されるファイナライズブロックを待つことで、記録されたデータは確実なものとなります。

##### スクリプト例

トランザクションをアナウンスした後は以下のようなスクリプトを流すと、チェーンの状態を把握しやすくて便利です。

```js
hash = facade.hashTransaction(tx).toString();
// ステータスの確認
body = {
  hashes: hash,
};
transactionStatus = await fetch(new URL("/transactionStatus", NODE), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
if (transactionStatus.length <= 0) {
  console.error("not exist tx.");
} else {
  console.log(transactionStatus[0]);
}
console.log(transactionStatus);
// 承認確認
txInfo = await fetch(new URL("/transactions/confirmed/" + hash, NODE), {
  method: "GET",
  headers: { "Content-Type": "application/json" },
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
console.log(txInfo);
```

## 4.5トランザクション履歴

Aliceが送受信したトランザクション履歴を一覧で取得します。

```js
params = new URLSearchParams({
  address: aliceAddress.toString(),
  embedded: true,
});
result = await fetch(
  new URL("/transactions/confirmed?" + params.toString(), NODE),
  {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  },
)
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
// 取得できたTx数分表示されます
> {meta: {…}, transaction: {…}, id: '636EF1EF8EFA5A777403DEDA'}
    id: "636EF1EF8EFA5A777403DEDA"
  > meta:
      feeMultiplier: 1136363
      hash: "EFDD7A4D419CAC459DA034089DF7F25E416A4782A1A6D9DBEC4ECF9AC3AAF1A9"
      height: "18925"
      index: 0
      merkleComponentHash: "EFDD7A4D419CAC459DA034089DF7F25E416A4782A1A6D9DBEC4ECF9AC3AAF1A9"
      timestamp: "964811467"
  > transaction:
      deadline: "971971235"
      maxFee: "200000000"
    > mosaics: Array(1)
        0:
          amount: "100000000"
          id: "72C0212E67A08BCE"
      network: 152
      recipientAddress: "982B2AA2295B5C23528ADDEE7F29F6521944E9F2340428AB"
      signature: "17104B0B8C9CB34C4FC42E448488A6608387841715921160F81C0FD60054CFACAE7200E3F41D911AA914D431197D923D6D98566E711DDC13C4BF0C768AAB3A04"
      signerPublicKey: "81EA7C15E7EC06261C9F654F54EAC4748CFCF00E09A8FE47779ACD14A7602004"
      size: 176
      type: 16724
      version: 1
```

`transaction.type` は v2 の `TransactionType` と同じです。

## 4.5.1 Txペイロード作成時のメッセージの差異

v3 ではメッセージはバイナリデータで表されます。
平文メッセージはバイナリデータに変換され、暗号化メッセージや生データのようなバイナリデータはそのままのバイナリデータとなります。

```js
message = "Hello Symbol!";
plainMessage = new Uint8Array([
  0x00,
  ...new TextEncoder("utf-8").encode("Hello, Symbol!"),
]);
console.log(plainMessage);
aliceMsgEncoder = new symbolSdk.symbol.MessageEncoder(aliceKey);
encryptedMessage = aliceMsgEncoder.encode(
  bobKey.publicKey,
  new TextEncoder().encode(message),
);
console.log(encryptedMessage);
rawMessage = new Uint8Array([0xff, 0x10, 0x20, 0x30]);
console.log(rawMessage);
```

###### 出力例

```js
> Uint8Array(15) [...]
    0: 0    // メッセージタイプ 0x00 (平文メッセージ)
    1: 72   // 'H'
    2: 101  // 'e'
    3: 108  // 'l'
    // 以下省略
> Uint8Array(42) [...]
    0: 1    // メッセージタイプ 0x01 (暗号化メッセージ)
    1: 163
    2: 55
    3: 105
    // 以下省略
> Uint8Array(4) [...]
    0: 255  // メッセージタイプ 0xFF (生データ)
    1: 16   // 0x10
    2: 32   // 0x20
    3: 48   // 0x30
```

署名時にTxのペイロードを作成する際には、メッセージデータを16進数文字列に変換します。
v2 では文字列データ、 v3 ではバイナリデータがメッセージデータとなりますが、 v2 における暗号化メッセージや生データは16進数文字列に変換されたものですので、元のデータから2回変換されることとなります。
また、ブロックチェーン上のTxを取得して表示する際も同様に、 v2 では16進数文字列から戻すための変換が2回行われます。

このようなメッセージデータの変換方法の違いから、Txを作成したSDKとバージョンが異なるSDKで読み込む際に正しく読み込まれない場合があります。

### 標準の方法でメッセージを読み込む

実際に異なるSDKバージョンでTxを読み込んでみます。
まずはそれぞれのバージョンでTxを作成し、ブロックチェーン上にアナウンスします。

#### v2

```js
// 暗号化メッセージの作成
encryptedMessage = alice.encryptMessage("Hello Symbol!", bob.publicAccount);

// Tx 作成
tx = sym.TransferTransaction.create(
  sym.Deadline.create(epochAdjustment), //Deadline:有効期限
  bob.address,
  [],
  encryptedMessage, //メッセージ
  networkType, //テストネット・メインネット区分
).setMaxFee(100); //手数料

// 署名とアナウンス
signedTx = alice.sign(tx, generationHash);
res = await txRepo.announce(signedTx).toPromise();
// Txハッシュの表示
console.log(signedTx.hash);
```

```js
> DE663D99BC9E2EEC408E255055CC4DA18CCEEEEF57CE97E607B2C47E9C725085
```

#### v3

```js
// 暗号化メッセージの作成
aliceMsgEncoder = new symbolSdk.symbol.MessageEncoder(aliceKey);
encryptedMessage = aliceMsgEncoder.encode(
  bobKey.publicKey,
  new TextEncoder().encode("Hello Symbol!"),
);

// Tx 作成
tx = facade.transactionFactory.create({
  type: "transfer_transaction_v1", // Txタイプ:転送Tx
  signerPublicKey: aliceKey.publicKey, // 署名者公開鍵
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  recipientAddress: bobAddress.toString(),
  mosaics: [
    // { mosaicId: 0x72C0212E67A08BCEn, amount: 1000000n } // 1XYM送金
  ],
  message: encryptedMessage,
});
tx.fee = new symbolSdk.symbol.Amount(BigInt(tx.size * 100)); //手数料

// 署名とアナウンス
sig = facade.signTransaction(aliceKey, tx);
jsonPayload = facade.transactionFactory.constructor.attachSignature(tx, sig);
res = await fetch(new URL("/transactions", NODE), {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: jsonPayload,
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
// Txハッシュの表示
console.log(facade.hashTransaction(tx).toString());
```

```js
> AB6146ADBC96DAF58741F98FB2BACE7D96AAEBFA20416458AE7EF4253FB40ECF
```

次に、Txを作成したバージョンと異なるバージョンのSDKでTxを読み込み、メッセージを表示してみます。

#### v2

```js
// v3 でアナウンスしたTxのハッシュ値を指定してTx取得
txInfo = await txRepo
  .getTransaction(
    "AB6146ADBC96DAF58741F98FB2BACE7D96AAEBFA20416458AE7EF4253FB40ECF",
    sym.TransactionGroup.Confirmed,
  )
  .toPromise();

// メッセージを復号化して表示
console.log(bob.decryptMessage(txInfo.message, alice.publicAccount));
```

```js
> Uncaught Error: unrecognized hex char, char1:D, char2:�
```

#### v3

```js
// v2 でアナウンスしたTxのハッシュ値を指定してTx取得
txInfo = await fetch(
  new URL(
    "/transactions/confirmed/DE663D99BC9E2EEC408E255055CC4DA18CCEEEEF57CE97E607B2C47E9C725085",
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

// メッセージを復号化して表示
bobMsgEncoder = new symbolSdk.symbol.MessageEncoder(bobKey);
console.log(
  bobMsgEncoder.tryDecode(
    aliceKey.publicKey,
    Buffer.from(txInfo.transaction.message, "hex"),
  ),
);
```

```js
> (2) [false, Uint8Array(82)]
    0: false
    1: Uint8Array(82)
```

### v2 で作成したメッセージを v3 で読み込む

v2 で作成したメッセージを v3 で読み込むためには、16進数文字列から戻すための変換を2回行う必要があります。

#### v3

```js
messageV2 = txInfo.transaction.message.substr(2); // メッセージタイプを取り除く
hex1 = Buffer.from(messageV2, "hex"); // 1回目の16進数文字列から戻す変換
hex2 = Buffer.from(hex1.toString(), "hex"); // 2回目の16進数文字列から戻す変換
bobMsgEncoder = new symbolSdk.symbol.MessageEncoder(bobKey);
console.log(
  bobMsgEncoder.tryDecode(aliceKey.publicKey, new Uint8Array([0x01, ...hex2])),
); // メッセージタイプ 0x01 を付けてメッセージを復号する
```

```js
> (2) [true, Uint8Array(13)]
    0: true
    1: Uint8Array(13)
```

なお、v3.0.8 以降であれば、自動判別して復号を行うための関数 `tryDecodeDeprecated()` が用意されています。

#### v3

```js
bobMsgEncoder.tryDecodeDeprecated(
  aliceKey.publicKey,
  Buffer.from(txInfo.transaction.message, "hex"),
);
```

### v2 で読み込めるように v3 でメッセージを作成する

v2 で読み込めるようにするため、 v3 でメッセージを作成する際に16進数文字列への変換を2回行います。

#### v3

```js
// 暗号化メッセージの作成
aliceMsgEncoder = new symbolSdk.symbol.MessageEncoder(aliceKey);
encrypted = aliceMsgEncoder.encode(bobKey.publicKey, "Hello Symbol!");
hex1 = Buffer.from(encrypted).subarray(1).toString("hex").toUpperCase();
encryptedMessage = new Uint8Array([0x01, ...new TextEncoder().encode(hex1)]);
// Tx作成、アナウンス
```

#### v2

```js
txInfo = await txRepo
  .getTransaction(
    "B50B7D51AE9401C364799EAC1E0FFE9CB1F4B8F531B03AD39658BD4FB5245A7F",
    sym.TransactionGroup.Confirmed,
  )
  .toPromise();
console.log(bob.decryptMessage(txInfo.message, alice.publicAccount));
```

```js
> PlainMessage {type: 0, payload: 'Hello Symbol!'}
    payload: "Hello Symbol!"
    type: 0
```

こちらも v3.0.8 以降であれば、 v2 向けに暗号化を行うための関数 `encodeDeprecated()` が用意されています。

#### v3

```js
aliceMsgEncoder.encodeDeprecated(
  bobKey.publicKey,
  new TextEncoder().encode("Hello Symbol!"),
);
```

## 4.6 アグリゲートトランザクション

Symbolでは複数のトランザクションを1ブロックにまとめてアナウンスすることができます。
最大で100件のトランザクションをまとめることができます（連署者が異なる場合は25アカウントまでを連署指定可能）。
以降の章で扱う内容にアグリゲートトランザクションへの理解が必要な機能が含まれますので、
本章ではアグリゲートトランザクションのうち、簡単なものだけを紹介します。

### 起案者の署名だけが必要な場合

```js
bobKey = new symbolSdk.symbol.KeyPair(symbolSdk.PrivateKey.random());
bobAddress = facade.network.publicKeyToAddress(bobKey.publicKey);
carolKey = new symbolSdk.symbol.KeyPair(symbolSdk.PrivateKey.random());
carolAddress = facade.network.publicKeyToAddress(carolKey.publicKey);

// アグリゲートTxに含めるTxを作成
innerTx1 = facade.transactionFactory.createEmbedded({
  type: "transfer_transaction_v1", // Txタイプ:転送Tx
  signerPublicKey: aliceKey.publicKey, // 署名者公開鍵
  recipientAddress: bobAddress.toString(),
  message: new Uint8Array([0x00, ...new TextEncoder("utf-8").encode("tx1")]), // 平文メッセージ
});

innerTx2 = facade.transactionFactory.createEmbedded({
  type: "transfer_transaction_v1", // Txタイプ:転送Tx
  signerPublicKey: aliceKey.publicKey, // 署名者公開鍵
  recipientAddress: carolAddress.toString(),
  message: new Uint8Array([0x00, ...new TextEncoder("utf-8").encode("tx2")]), // 平文メッセージ
});

// マークルハッシュの算出
embeddedTransactions = [innerTx1, innerTx2];
merkleHash = facade.constructor.hashEmbeddedTransactions(embeddedTransactions);

// アグリゲートTx作成
aggregateTx = facade.transactionFactory.create({
  type: "aggregate_complete_transaction_v2",
  signerPublicKey: aliceKey.publicKey, // 署名者公開鍵
  deadline: facade.network.fromDatetime(Date.now()).addHours(2).timestamp, //Deadline:有効期限
  transactionsHash: merkleHash,
  transactions: embeddedTransactions,
});
aggregateTx.fee = new symbolSdk.symbol.Amount(1000000n); //手数料

// 署名とアナウンス
sig = facade.signTransaction(aliceKey, aggregateTx);
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

まず、アグリゲートトランザクションに含めるトランザクションを作成します。
このときDeadlineを指定する必要はありません。
リスト化するときに、生成したトランザクションにtoAggregateを追加して送信元アカウントの公開鍵を指定します。
ちなみに送信元アカウントと署名アカウントが **必ずしも一致するとは限りません** 。
後の章での解説で「Bobの送信トランザクションをAliceが署名する」といった事が起こり得るためこのような書き方をします。
これはSymbolブロックチェーンでトランザクションを扱ううえで最も重要な概念になります。
なお、本章で扱うトランザクションは同じAliceですので、アグリゲートボンデッドトランザクションへの署名もAliceを指定します。

### アグリゲートトランザクションにおける最大手数料

アグリゲートトランザクションも通常のトランザクション同様、最大手数料を直接指定する方法とfeeMultiprierで指定する方法があります。
先の例では最大手数料を直接指定する方法を使用しました。ここではfeeMultiprierで指定する方法を紹介します。

```js
// アグリゲートTx作成
aggregateTx = facade.transactionFactory.create({
  type: "aggregate_complete_transaction_v2",
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
```

## 4.7 現場で使えるヒント

### 存在証明

アカウントの章でアカウントによるデータの署名と検証する方法について説明しました。
このデータをトランザクションに載せてブロックチェーンが承認することで、
アカウントがある時刻にあるデータの存在を認知したことを消すことができなくなります。
タイムスタンプの刻印された電子署名を利害関係者間で所有することと同じ意味があると考えることもできます。
（法律的な判断は他の方にお任せします）

ブロックチェーンは、この消せない「アカウントが認知したという事実」の存在をもって送信などのデータ更新を行います。
また、誰もがまだ知らないはずの事実を知っていたことの証明としてブロックチェーンを利用することもできます。
ここでは、その存在が証明されたデータをトランザクションに載せる２つの方法について説明します。

#### デジタルデータのハッシュ値(SHA256)出力方法

ファイルの要約値をブロックチェーンに記録することでそのファイルの存在を証明することができます。

各OSごとのファイルのSHA256でハッシュ値を計算する方法は下記の通りです。

```sh
#Windows
certutil -hashfile WINファイルパス SHA256
#Mac
shasum -a 256 MACファイルパス
#Linux
sha256sum Linuxファイルパス
```

#### 大きなデータの分割

トランザクションのペイロードには1023バイトしか格納できないため、
大きなデータは分割してペイロードに詰め込んでアグリゲートトランザクションにします。

```js
bigdata =
  "C00200000000000093B0B985101C1BDD1BC2BF30D72F35E34265B3F381ECA464733E147A4F0A6B9353547E2E08189EF37E50D271BEB5F09B81CE5816BB34A153D2268520AF630A0A0E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26000000000198414140770200000000002A769FB40000000076B455CFAE2CCDA9C282BF8556D3E9C9C0DE18B0CBE6660ACCF86EB54AC51B33B001000000000000DB000000000000000E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26000000000198544198205C1A4CE06C45B3A896B1B2360E03633B9F36BF7F22338B000000000000000066653465353435393833444430383935303645394533424446434235313637433046394232384135344536463032413837364535303734423641303337414643414233303344383841303630353343353345354235413835323835443639434132364235343233343032364244444331443133343139464435353438323930334242453038423832304100000000006800000000000000B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D000000000198444198205C1A4CE06C45B3A896B1B2360E03633B9F36BF7F2233BC089179EBBE01A81400140035383435344434373631364336433635373237396800000000000000B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D000000000198444198205C1A4CE06C45B3A896B1B2360E03633B9F36BF7F223345ECB996EDDB9BEB1400140035383435344434373631364336433635373237390000000000000000B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D5A71EBA9C924EFA146897BE6C9BB3DACEFA26A07D687AC4A83C9B03087640E2D1DDAE952E9DDBC33312E2C8D021B4CC0435852C0756B1EBD983FCE221A981D02";

let payloads = [];
for (let i = 0; i < bigdata.length / 1023; i++) {
  payloads.push(bigdata.substr(i * 1023, 1023));
}
console.log(payloads);
```

分割したデータを使用してトランザクションを作成します。

```js
// 分割したデータごとにトランザクションを作成（SDK v3形式）
innerTxs = payloads.map((payload) => {
  // descriptor生成
  const descriptor = new symbolSdk.descriptors.TransferTransactionV1Descriptor(
    bobAddress,
    [],
    new Uint8Array([0xff, ...new TextEncoder("utf-8").encode(payload)])
  );
  // Embedded Tx生成
  return facade.createEmbeddedTransactionFromTypedDescriptor(descriptor, aliceKey.publicKey);
});

// マークルハッシュの算出
merkleHash = facade.static.hashEmbeddedTransactions(innerTxs);

// AggregateCompleteTransactionのdescriptor生成
aggregateDescriptor = new symbolSdk.descriptors.AggregateCompleteTransactionV2Descriptor(
  merkleHash,
  innerTxs
);

// Aggregate Tx生成
aggregateTx = facade.createTransactionFromTypedDescriptor(
  aggregateDescriptor,
  aliceKey.publicKey,
  100, // feeMultiplier
  60 * 60 * 2, // deadline
  0 // maxFee
);

// 連署者数に応じた手数料計算
requiredCosignatures = 0;
calculatedCosignatures =
  requiredCosignatures > aggregateTx.cosignatures.length
    ? requiredCosignatures
    : aggregateTx.cosignatures.length;
sizePerCosignature = 8 + 32 + 64;
calculatedSize =
  aggregateTx.size -
  aggregateTx.cosignatures.length * sizePerCosignature +
  calculatedCosignatures * sizePerCosignature;
aggregateTx.fee = new symbolSdk.models.Amount(BigInt(calculatedSize * 100));

// 署名とアナウンス
sig = aliceKey.signTransaction(aggregateTx);
jsonPayload = facade.transactionFactory.static.attachSignature(aggregateTx, sig);
await fetch(
  new URL('/transactions', NODE),
  { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: jsonPayload }
);
```

このようにアグリゲートトランザクションを活用することで、大きなデータを分割して送信することができます。
ただし、ブロックチェーンは改ざん防止の仕組みであって、データベースではありません。
ブロックチェーンに大量のデータを記録することは、ネットワークに負荷をかけることになりますので、
利用には注意が必要です。

## 4.8 まとめ

4章では以下のことを確認しました。

- トランザクションのライフサイクル
  - 作成、署名、アナウンス、承認
- メッセージの送信方法
  - 平文メッセージ
  - 暗号化メッセージ
  - 生データ
- アグリゲートトランザクション
  - 複数のトランザクションをまとめて送信
  - 連署の必要性
- 現場で使えるヒント
  - 存在証明
  - 大きなデータの分割送信

次章ではモザイクを作成して、独自のトークンを発行する方法について説明します。