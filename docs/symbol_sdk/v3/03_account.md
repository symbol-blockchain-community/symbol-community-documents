---
sidebar_position: 3
---

# 3.アカウント

アカウントは秘密鍵に紐づく情報が記録されたデータ構造体です。アカウントと関連づいた秘密鍵を使って署名することでのみブロックチェーンのデータを更新することができます。

## 3.1 アカウント生成

アカウントには秘密鍵と公開鍵をセットにしたキーペア、アドレスなどの情報が含まれています。まずはランダムにアカウントを作成して、それらの情報を確認してみましょう。

### 新規生成

以下の手順で秘密鍵を作成し、秘密鍵より公開鍵を導出します。

```js
aliceKey = facade.createAccount(sdk.core.PrivateKey.random());
// 既存のprivateKeyで作成する場合
aliceKey = facade.createAccount(new sdk.core.PrivateKey("24B929287E1B68F7CB...."))

console.log(aliceKey);
aliceAddress = facade.network.publicKeyToAddress(aliceKey.publicKey);
console.log(aliceAddress);
```

###### 出力例

```js
> KeyPair {_privateKey: PrivateKey, _keyPair: {…}}
    _keyPair: {
      publicKey: Uint8Array(32),
      privateKey: Uint8Array(32)
    }
    _privateKey: PrivateKey {
      bytes: Uint8Array(32)
    }
> Address {bytes: Uint8Array(24)}
```

### 秘密鍵と公開鍵の導出

```js
console.log(alice.keyPair.privateKey.toString());
console.log(alice.publicKey.toString());
```

```
> 1E9139CC1580B4AED6A1FE110085281D4982ED0D89CE07F3380EB83069B1****
> D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2
```

#### 注意事項

秘密鍵を紛失するとそのアカウントに紐づけられたデータを操作することが出来なくなります。また、他人は知らないという秘密鍵の性質を利用してデータ操作の署名を行うので、秘密鍵を他人に教えてはいけません。組織のなかで秘密鍵を譲り受けて運用を続けるといった行為も控えましょう。
一般的な Web サービスでは「アカウント ID」に対してパスワードが割り振られるため、パスワードの変更が可能ですが、ブロックチェーンではパスワードにあたる秘密鍵に対して一意に決まる ID(アドレス)が割り振られるため、アカウントに紐づく秘密鍵を変更するということはできません。

### アドレスの導出

```js
aliceRawAddress = aliceAddress.toString();
console.log(aliceRawAddress);
```

```js
> TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ
```

これらがブロックチェーンを操作するための最も基本的な情報となります。また、秘密鍵からアカウントを生成したり、公開鍵やアドレスのみを扱うクラスの生成方法も確認しておきましょう。

### 秘密鍵からアカウント生成

```js
aliceKey = facade.createAccount(
  new sdk.core.PrivateKey("1E9139CC1580B4AED6A1FE110085281D4982ED0D89CE07F3380EB83069B1****")
);

aliceAddress = facade.network.publicKeyToAddress(aliceKey.publicKey);
```

### 公開鍵クラスの生成

```js
alicePublicAccount = new sdk.symbol.PublicKey(
  Uint8Array.from(
    Buffer.from(
      "D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2",
      "hex",
    ),
  ),
);
alicePublicAccount = facade.createPublicAccount(
  new sdk.core.PublicKey(
    "D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2"
  )
);

console.log(alicePublicAccount);
console.log(alicePublicAccount.publicKey.toString());
```

###### 出力例

```js
> PublicKey {bytes: Uint8Array(32)}
> D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2
```

### アドレスクラスの生成

```js
aliceAddress = new sdk.symbol.Address(
  "TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ",
);
console.log(aliceAddress.toString());
```

###### 出力例

```js
> TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ
```

## 3.2 アカウントへの送信

アカウントを作成しただけでは、ブロックチェーンにデータを送信することはできません。  
パブリックブロックチェーンはリソースを有効活用するためにデータ送信時に手数料を要求します。  
Symbol ブロックチェーンでは、この手数料を XYM という共通トークンで支払うことになります。  
アカウントを生成したら、この後の章から説明するトランザクションを実行するために必要な手数料を送信しておきます。

### フォーセットから送信

テストネットではフォーセット（蛇口）サービスから検証用の XYM を入手することができます。  
メインネットの場合は取引所などで XYM を購入するか、投げ銭サービス(NEMLOG,QUEST)などを利用して寄付を募りましょう。

テストネット

- FAUCET(蛇口)
  - https://testnet.symbol.tools/

メインネット

- NEMLOG
  - https://nemlog.nem.social/
- QUEST
  - https://quest-bc.com/

### エクスプローラーで確認

フォーセットから作成したアカウントへ送信が成功したらエクスプローラーで確認してみましょう。

- テストネット
  - https://testnet.symbol.fyi/
- メインネット
  - https://symbol.fyi/

## 3.3 アカウント情報の確認

ノードに保存されているアカウント情報を取得します。

### 所有モザイク一覧の取得

```js
accountInfo = await fetch(
  new URL("/accounts/" + aliceAddress.toString(), NODE),
  {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  },
)
  .then((res) => res.json())
  .then((json) => {
    return json.account;
  });
console.log(accountInfo);

accountInfo = await fetch(
  new URL('/accounts/' + aliceAddress.toString(), NODE),
  {
    method: 'GET', 
    headers: { 'Content-Type': 'application/json' }
  }
).then(res => res.json()).then(json => json.account);

console.log(accountInfo); // まだ404エラー
```

#### アカウント情報の取得について

クライアント側で作成しただけで、ブロックチェーンでまだ利用されていないアカウント情報は記録されていません。宛先として指定されて受信することで初めてアカウント情報が記録され、署名したトランザクションを送信することで公開鍵の情報が記録されます。そのため、現時点では404エラーが返ります。


#### BigInt

v3 では UInt64 は定義されておらず、大きすぎる数値を表現するために JavaScript の `BigInt` が使用されています。
以降の章で登場するため、ここで構文を紹介します。

```js
12345n; // 数値の後ろに n を付ける
BigInt(12345); // BigInt(数値)
0x12345n; // 16進数も同様
BigInt(0x12345);
```

#### 表示桁数の調整

所有するトークンの量は誤差の発生を防ぐため、整数値で扱います。トークンの定義から可分性を取得することができるので、その値を使って正確な所有量を表示してみます。

```js
mosaicAmount = accountInfo.mosaics[0].amount;
mosaicInfo = await fetch(
  new URL('/mosaics/' + accountInfo.mosaics[0].id, NODE),
  {
    method: 'GET',
    headers: {'Content-Type': 'application/json'}
  }
).then(res => res.json()).then(json => json.mosaic);

divisibility = mosaicInfo.divisibility;

if (divisibility > 0) {
  displayAmount = mosaicAmount.slice(0, mosaicAmount.length - divisibility) + "." + mosaicAmount.slice(-divisibility);
} else {
  displayAmount = mosaicAmount;
}
console.log(displayAmount);
```

## 3.4 現場で使えるヒント

### 暗号化と署名

アカウントとして生成した秘密鍵や公開鍵は、そのまま従来の暗号化や電子署名として活用することができます。信頼性に問題点があるアプリケーションを使用する必要がある場合も、個人間（エンドツーエンド）でデータの秘匿性・正当性を検証することができます。

#### 事前準備：対話のための Bob アカウントを生成

```js
bobKey = facade.createAccount(sdk.core.PrivateKey.random());
```

#### 暗号化

Alice の秘密鍵・Bob の公開鍵で暗号化し、Alice の公開鍵・Bob の秘密鍵で復号します（AES-GCM 形式）。

```js
message = "Hello Symbol!";
aliceMsgEncoder = new sdk.symbol.MessageEncoder(alice);

encryptedMessage = alice.messageEncoder().encode(bobKey.publicKey, new TextEncoder().encode(message));

console.log(Buffer.from(encryptedMessage).toString("hex").toUpperCase());
```

```js
> 0167AF68C3E7EFBD7048F6E9140FAA14256B64DD19FD0708EDCF17758A81FCC00084D869D6F1434A77AF
```

#### 復号化

```js
decryptMessageData = bob.messageEncoder().tryDecode(alice.publicKey, encryptedMessage);

console.log(decryptMessageData);
if (decryptMessageData.isDecoded) {
  decryptMessage = new TextDecoder().decode(decryptMessageData.message);
  console.log(decryptMessage);
} else {
  console.log("decrypt failed!");
}
```

```js
> {isDecoded: true, message: Uint8Array(13)}
> "Hello Symbol!"
```

注意：
v3.0.7 では復号化データの構造が異なります。
v3.0.8 以降では、結果とメッセージを持つ **オブジェクト** ですが、v3.0.7 では結果とメッセージの **配列** です。
このため、復号化したメッセージへのアクセス方法が異なります。

##### v3.0.7

```js
if (decryptMessageData[0]) {
  decryptMessage = new TextDecoder().decode(decryptMessageData[1]);
  console.log(decryptMessage);
} else {
  console.log("decrypt failed!");
}
```

```js
> [true, Uint8Array(13)]
> "Hello Symbol!"
```

#### 署名

Alice の秘密鍵でメッセージを署名し、Alice の公開鍵と署名でメッセージを検証します。

```js
payload = Buffer.from("Hello Symbol!", 'utf-8');
signature = alice.keyPair.sign(payload);

console.log(signature.toString());
```

```
> B8A9BCDE9246BB5780A8DED0F4D5DFC80020BBB7360B863EC1F9C62CAFA8686049F39A9F403CB4E66104754A6AEDEF8F6B4AC79E9416DEEDC176FDD24AFEC60E
```

#### 検証

```js
verifier = new sdk.symbol.Verifier(alice.publicKey);
isVerified = verifier.verify(Buffer.from("Hello Symbol!", 'utf-8'), signature);
console.log(isVerified);
```

```js
> true
```

ブロックチェーンを使用しない署名は何度も再利用される可能性があることにご注意ください。

### アカウントの保管

アカウントの管理方法について説明しておきます。  
秘密鍵はそのままで保存しないようにしてください。symbol-qr-library を利用して秘密鍵をパスフレーズで暗号化して保存する方法を紹介します。

#### 秘密鍵の暗号化

```js
qr = require("/node_modules/symbol-qr-library");

//パスフレーズでロックされたアカウント生成
signerQR = qr.QRCodeGenerator.createExportAccount(
  alice.privateKey,
  networkType,
  generationHash,
  "パスフレーズ",
);

//QRコード表示
signerQR.toBase64().subscribe((x) => {
  //HTML body上にQRコードを表示する例
  (tag = document.createElement("img")).src = x;
  document.getElementsByTagName("body")[0].appendChild(tag);
});

//アカウントを暗号化したJSONデータとして表示
jsonSignerQR = signerQR.toJSON();
console.log(jsonSignerQR);
```

###### 出力例

```js
> {
    "v": 3,
    "type": 2,
    "network_id": 152,
    "chain_id": "7FCCD304802016BEBBCD342A332F91FF1F3BB5E902988B352697BE245F48E836",
    "data": {
      "ciphertext": "e9e2f76cb482fd054bc13b7ca7c9d086E7VxeGS/N8n1WGTc5MwshNMxUiOpSV2CNagtc6dDZ7rVZcnHXrrESS06CtDTLdD7qrNZEZAi166ucDUgk4Yst0P/XJfesCpXRxlzzNgcK8Q=",
      "salt": "54de9318a44cc8990e01baba1bcb92fa111d5bcc0b02ffc6544d2816989dc0e9"
    }
  }
```

この jsonSignerQR で出力される QR コード、あるいはテキストを保存しておけばいつでも秘密鍵を復元することができます。

#### 暗号化された秘密鍵の復号

```js
//保存しておいたテキスト、あるいはQRコードスキャンで得られたテキストをjsonSignerQRに代入
jsonSignerQR =
  '{"v":3,"type":2,"network_id":152,"chain_id":"7FCCD304802016BEBBCD342A332F91FF1F3BB5E902988B352697BE245F48E836","data":{"ciphertext":"e9e2f76cb482fd054bc13b7ca7c9d086E7VxeGS/N8n1WGTc5MwshNMxUiOpSV2CNagtc6dDZ7rVZcnHXrrESS06CtDTLdD7qrNZEZAi166ucDUgk4Yst0P/XJfesCpXRxlzzNgcK8Q=","salt":"54de9318a44cc8990e01baba1bcb92fa111d5bcc0b02ffc6544d2816989dc0e9"}}';

qr = require("/node_modules/symbol-qr-library");
signerQR = qr.AccountQR.fromJSON(jsonSignerQR, "パスフレーズ");
console.log(signerQR.accountPrivateKey);
```

###### 出力例

```js
> 1E9139CC1580B4AED6A1FE110085281D4982ED0D89CE07F3380EB83069B1****
```
