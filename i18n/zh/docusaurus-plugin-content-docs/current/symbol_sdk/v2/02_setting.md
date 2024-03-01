# 2.建立开发环境

这个章节说明如何阅读本文件。

## 2.1 语言

所有的程式码都将使用 JavaScript 撰写。

### SDK-软体开发套件

symbol-sdk-typescript-javascript v2.0.0  
https://github.com/symbol/symbol-sdk-typescript-javascript

在浏览器的开发人员控制台中，将上面的 SDK 作为 Browserify 载入。  
https://github.com/xembook/nem2-browserify

##### 注意事项

目前 symbol-sdk 的 alpha 版本是 3.0.0，2.0.3 版本已不再支援。  
版本 3 移除了许多 rxjs 依赖的功能，因此建议直接存取 REST API。

### 参考文献

Symbol SDK 支援 TypeScript 和 JavaScript  
https://symbol.github.io/symbol-sdk-typescript-javascript/1.0.3/

Catapult REST端点 (1.0.3)  
https://symbol.github.io/symbol-openapi/v1.0.3/

## 2.2 范例原始码

### 变数宣告

本文件中，我们没有宣告 const，是希望您在控制台上重复编写它以验证其是否正常运作。当开发应用程序时，请通过声明 const 确保安全性。

### 检查输出值

Console.log() 会输出该变数的内容。依照个人偏好，可以试着使用输出函数。输出结果会在 > 下方。在练习范例时，可以不包含这部分的内容。

### 同步和非同步

有些习惯于其他语言的开发者可能会因为不习惯写非同步处理而感到不安，因此除非有特殊需求，本文中的解释都是不使用非同步处理的。

### 帐户

#### Alice

本手册着重于介绍 Alice 帐户。我们将在后续章节中继续使用第三章中创建的 Alice 帐户。请确保 Alice 帐户中有足够的 XYM，然后继续阅读本手册。

#### Bob

Bob 被创建成为与 Alice 进行交易所需的帐户，作为后续章节中的对象。其他人，例如 Carol，在多签章节中使用。

### 手续费

在本文件中，交易使用的交易费用乘数为 100。

## 2.3 事先准备工作

从节点清单中，使用 Chrome 浏览器打开任何节点的页面。本手册基于测试网的假设。

- 测试网
  - https://symbolnodes.org/nodes_testnet/
- 主网
  - https://symbolnodes.org/nodes/

按 F12 键开启开发人员控制台，并输入以下脚本。

```js
(script = document.createElement("script")).src =
  "https://xembook.github.io/nem2-browserify/symbol-sdk-pack-2.0.0.js";
document.getElementsByTagName("head")[0].appendChild(script);
```

然后，运行在几乎所有章节中使用的通用逻辑。

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

您现在已经准备就绪。
如果本手册的内容有些令人困惑，请参考 Qiita 的文章。

[在Symbol区块链测试网体验转帐的过程](https://qiita.com/nem_takanobu/items/e2b1f0aafe7a2df0fe1b)
