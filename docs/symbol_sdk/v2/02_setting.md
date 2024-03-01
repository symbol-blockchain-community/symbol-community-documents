---
sidebar_position: 2
---

# 2.Building a development environment

This section explains how to read this document.

## 2.1 Language

All code will be written in JavaScript.

### SDK

symbol-sdk-typescript-javascript v2.0.0  
https://github.com/symbol/symbol-sdk-typescript-javascript

Load The SDK above as browserify in the browser developer console.  
https://github.com/xembook/nem2-browserify

##### Note

Currently symbol-sdk v3.0.0 is released in alpha version, v 2.0.3 is deprecated.  
And version 3 removed many of the rxjs-dependent features thus direct access to the REST API is recommended.

### Reference

Symbol SDK for TypeScript and JavaScript  
https://symbol.github.io/symbol-sdk-typescript-javascript/1.0.3/

Catapult REST Endpoints (1.0.3)  
https://symbol.github.io/symbol-openapi/v1.0.3/

## 2.2 Sample source code

### Variable declaration

In this document, we do not declare const because we want you to rewrite it repeatedly on the console to verify that it works. When developing applications, ensure security by declaring const.

### Check output value

Console.log() outputs the contents of the variable. Try out the output functions according to your preferences. The output is described under `>`. When practicing with a sample, try it without this part.

### Synchronous and asynchronous

Some developers used to other languages may feel uneasy writing asynchronous processing, so unless there is a particular reason, the explanations are written without asynchronous processing.

### Account

#### Alice

This manual focuses on the Alice account. We will continue to use the Alice account created in chapter 3 in subsequent chapters. Please go on reading this manual with sufficient XYM sent.

#### Bob

Bob is created as an account for transacting with Alice, as required in the chapters. Others, such as Carol, are used in the multisig chapters.

### Fee

In this document, transactions are created with a transaction fee multiplier of 100.

## 2.3 Preparations in advance

From the node list, open the page of any node with e.g. Chrome browser. This manual is based on the assumption of a testnet.

- Testnet
  - https://symbolnodes.org/nodes_testnet/
- Mainnet
  - https://symbolnodes.org/nodes/

Press F12 to open the developer console, and enter the following script.

```js
(script = document.createElement("script")).src =
  "https://xembook.github.io/nem2-browserify/symbol-sdk-pack-2.0.0.js";
document.getElementsByTagName("head")[0].appendChild(script);
```

Then, run the common logic that is used in almost all chapters.

```js
NODE = window.origin; //The URL of the page is shown here.
sym = require("/node_modules/symbol-sdk");
repo = new sym.RepositoryFactoryHttp(NODE);
txRepo = repo.createTransactionRepository();
(async () => {
  networkType = await repo.getNetworkType().toPromise();
  generationHash = await repo.getGenerationHash().toPromise();
  epochAdjustment = await repo.getEpochAdjustment().toPromise();
})();
function clog(signedTx) {
  console.log(NODE + "/transactionStatus/" + signedTx.hash);
  console.log(NODE + "/transactions/confirmed/" + signedTx.hash);
  console.log("https://symbol.fyi/transactions/" + signedTx.hash);
  console.log("https://testnet.symbol.fyi/transactions/" + signedTx.hash);
}
```

You are now ready to go.
If the content of this manual is a little confusing, please refer to the Qiita article.

[Symbol ブロックチェーンのテストネットで送金を体験する](https://qiita.com/nem_takanobu/items/e2b1f0aafe7a2df0fe1b)
