# 2.建立開發環境

這個章節說明如何閱讀本文件。

## 2.1 語言

所有的程式碼都將使用 JavaScript 撰寫。

### SDK-軟體開發套件

symbol-sdk-typescript-javascript v2.0.0
https://github.com/symbol/symbol-sdk-typescript-javascript

在瀏覽器的開發人員控制台中，將上面的 SDK 作為 Browserify 載入。
https://github.com/xembook/nem2-browserify

##### 注意事項

目前 symbol-sdk 的 alpha 版本是 3.0.0，2.0.3 版本已不再支援。
版本 3 移除了許多 rxjs 依賴的功能，因此建議直接存取 REST API。

### 參考文獻

Symbol SDK 支援 TypeScript 和 JavaScript
https://symbol.github.io/symbol-sdk-typescript-javascript/1.0.3/

Catapult REST端點 (1.0.3)
https://symbol.github.io/symbol-openapi/v1.0.3/

## 2.2 範例原始碼

### 變數宣告

本文件中，我們沒有宣告 const，是希望您在控制台上重複編寫它以驗證其是否正常運作。當開發應用程序時，請通過聲明 const 確保安全性。

### 檢查輸出值

Console.log() 會輸出該變數的內容。依照個人偏好，可以試著使用輸出函數。輸出結果會在 > 下方。在練習範例時，可以不包含這部分的內容。

### 同步和非同步

有些習慣於其他語言的開發者可能會因為不習慣寫非同步處理而感到不安，因此除非有特殊需求，本文中的解釋都是不使用非同步處理的。

### 帳戶

#### Alice

本手冊著重於介紹 Alice 帳戶。我們將在後續章節中繼續使用第三章中創建的 Alice 帳戶。請確保 Alice 帳戶中有足夠的 XYM，然後繼續閱讀本手冊。

#### Bob

Bob 被創建成為與 Alice 進行交易所需的帳戶，作為後續章節中的對象。其他人，例如 Carol，在多簽章節中使用。

### 手續費

在本文件中，交易使用的交易費用乘數為 100。

## 2.3 事先準備工作

從節點清單中，使用 Chrome 瀏覽器打開任何節點的頁面。本手冊基於測試網的假設。

- 測試網
  - https://symbolnodes.org/nodes_testnet/
- 主網
  - https://symbolnodes.org/nodes/

按 F12 鍵開啟開發人員控制台，並輸入以下腳本。

```js
(script = document.createElement("script")).src =
  "https://xembook.github.io/nem2-browserify/symbol-sdk-pack-2.0.0.js";
document.getElementsByTagName("head")[0].appendChild(script);
```

然後，運行在幾乎所有章節中使用的通用邏輯。

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

您現在已經準備就緒。
如果本手冊的內容有些令人困惑，請參考 Qiita 的文章。

[在Symbol區塊鏈測試網體驗轉帳的過程](https://qiita.com/nem_takanobu/items/e2b1f0aafe7a2df0fe1b)
