---
sidebar_position: 2
---

# 2.環境構築

本書の読み進め方について解説します。

## 2.1 使用言語

JavaScript を使用します。

### SDK

`symbol-sdk@2` が deprecated となりました。このセクションでは `symbol-sdk@3` での使用方法を紹介します。
`symbol-sdk@3` は Node との REST API 接続の実装が削除されました。`Catapult REST Endpoints` を参照して直接実装をして下さい。

Symbol SDK v3 Referenve<br/>
https://symbol.github.io/symbol/sdk/javascript/index.html

Catapult REST Endpoints (1.0.4)<br/>
https://symbol.github.io/symbol-openapi/v1.0.4/

なお npm package を使用可能な場合は、コミュニティによって開発されたサポートツールがあります。

@symbol-blockchain-community/symbol-rest-client<br/>
https://www.npmjs.com/package/@symbol-blockchain-community/symbol-rest-client

## 2.2 サンプルソースコード

### 変数宣言

console 上で何度も書き直して動作検証をして欲しいため、あえて const 宣言を行いません。  
アプリケーション開発時は const 宣言するなどしてセキュリティを確保してください。

### 出力値確認

console.log()を変数の内容を出力します。好みに応じた出力関数に読み替えてお試しください。  
出力内容は `>` 以下に記述しています。サンプルを実行する場合はこの部分を含まずに試してください。

### 同期・非同期

他言語に慣れた開発者の方には非同期処理の書き方に抵抗がある人もいると思うので、特に問題が無い限り非同期処理を使わずに解説します。

### アカウント

#### Alice

本書では主に Alice アカウントを中心として解説します。  
3 章で作成した Alice をその後の章でも引き続き使いますので、十分な XYM を送信した状態でお読みください。

#### Bob

Alice との送受信用のアカウントとして各章で必要に応じて作成します。その他、マルチシグの章などで Carol などを使用します。

### 手数料

本書で紹介するトランザクションの手数料乗数は 100 でトランザクションを作成します。

## 2.3 事前準備

ノード一覧より任意のノードのページを Chrome ブラウザなどで開きます。本書ではテストネットを前提として解説しています。

- テストネット
  - https://symbolnodes.org/nodes_testnet/
- メインネット
  - https://symbolnodes.org/nodes/

F12 キーを押して開発者コンソールを開き、以下のスクリプトを入力します。
`SDK_VERSION` は最新のバージョンを使用して下さい。

```js
// @see https://www.npmjs.com/package/symbol-sdk?activeTab=versions
const SDK_VERSION = "3.2.3";
const sdk = await import(`https://www.unpkg.com/symbol-sdk@${SDK_VERSION}/dist/bundle.web.js`);
const sdkCore = sdk.core;
const symbolSdk = sdk.symbol;

// Buffer を読み込んでおく
(script = document.createElement("script")).src =
  "https://bundle.run/buffer@6.0.3";
document.getElementsByTagName("head")[0].appendChild(script);
```

続いて、ほぼすべての章で利用する共通ロジック部分を実行しておきます。

```js
const NODE = window.origin; //現在開いているページのURLがここに入ります
const Buffer = buffer.Buffer;

const nodeInfo = await (await fetch(`${NODE}/node/info`)).json();
const networkType = nodeInfo.networkIdentifier;
const generationHash = nodeInfo.networkGenerationHashSeed;

const nodeNetwork = await (await fetch(`${NODE}/network/properties`)).json();
const epochAdjustment = Number(nodeNetwork.network.epochAdjustment.slice(0, -1));
const identifier = nodeNetwork.network.identifier;
const facade = new symbolSdk.SymbolFacade(identifier);
```

これで準備完了です。

本ドキュメントの内容が少し分かりにくい場合は Qiita 等の記事もご参考ください。

[Symbol ブロックチェーンのテストネットで送金を体験する](https://qiita.com/nem_takanobu/items/e2b1f0aafe7a2df0fe1b)
