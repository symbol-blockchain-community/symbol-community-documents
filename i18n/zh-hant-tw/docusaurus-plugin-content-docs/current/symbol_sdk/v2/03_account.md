# 3.帳戶

帳戶是一種資料存款結構，其中包含與私鑰相關聯的資訊和資產的記錄。只有使用與帳戶相關聯的私鑰進行簽署，才能在區塊鏈上更新資料。

## 3.1 創建帳戶

帳戶包含一對密鑰，即私鑰和公鑰，以及地址和其他信息。首先，嘗試隨機創建一個帳戶，並檢查其中包含的信息。

### 創建一個新帳戶

```js
alice = sym.Account.generateNewAccount(networkType);
console.log(alice);
```

###### 示例輸出

```js
> Account
    address: Address {address: 'TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ', networkType: 152}
    keyPair: {privateKey: Uint8Array(32), publicKey: Uint8Array(32)}
```

網絡類型如下。

```js
{104: 'MAIN_NET', 152: 'TEST_NET'}
```

### 生成公鑰和私鑰

```js
console.log(alice.privateKey);
console.log(alice.publicKey);
```

```
> 1E9139CC1580B4AED6A1FE110085281D4982ED0D89CE07F3380EB83069B1****
> D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2
```

#### 注意事項

如果私鑰遺失，與該帳戶相關的數據將無法更改，並且任何資金將會遺失。此外，私鑰不得與他人分享，因為知道私鑰將可完全存取該帳戶。
在一般的網路服務中，密碼是分配給「帳戶 ID」的，因此密碼可以從帳戶更改，但在區塊鏈中，私鑰是密碼，因此唯一的 ID（位址）會分配給私鑰，因此無法從帳戶更改或重新產生與帳戶關聯的私鑰。

### 產生位址

```js
aliceRawAddress = alice.address.plain();
console.log(aliceRawAddress);
```

```js
> TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ
```

以上這些是操作區塊鏈所需的最基本信息。建議進一步瞭解如何從私鑰生成帳戶，以及如何生成僅處理公鑰和位址的類別。

### 從私鑰生成帳戶

```js
alice = sym.Account.createFromPrivateKey(
  "1E9139CC1580B4AED6A1FE110085281D4982ED0D89CE07F3380EB83069B1****",
  networkType,
);
```

### 公鑰類別的生成

```js
alicePublicAccount = sym.PublicAccount.createFromPublicKey(
  "D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2",
  networkType,
);
console.log(alicePublicAccount);
```

###### 示例輸出

```js
> PublicAccount
    address: Address {address: 'TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ', networkType: 152}
    publicKey: "D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2"

```

### 地址生成

```js
aliceAddress = sym.Address.createFromRawAddress(
  "TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ",
);
console.log(aliceAddress);
```

###### 示例輸出

```js
> Address
    address: "TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ"
    networkType: 152
```

## 3.2 轉帳交易到另一個帳戶

創建賬戶並不僅僅意味著數據可以在區塊鏈上傳輸。
公共區塊鏈需要數據傳輸費用才能有效利用資源。
在 Symbol 區塊鏈上，使用稱為 XYM 的原生代幣支付費用。
生成帳戶後，將 XYM 發送到該帳戶以支付交易費用（在後面的章節中描述）。

### 從水龍頭接收 XYM

可以使用水龍頭免費獲得測試網 XYM。  
對於主網交易，可以在交易所購買XYM，也可以使用NEMLOG、QUEST等打賞服務獲得捐款。

測試網

- FAUCET
  - https://testnet.symbol.tools/

主網

- NEMLOG
  - https://nemlog.nem.social/
- QUEST
  - https://quest-bc.com/

### 使用區塊鏈瀏覽器

從水龍頭轉賬到您創建的賬戶後，可以在瀏覽器中查看交易。

- 測試網
  - https://testnet.symbol.fyi/
- 主網
  - https://symbol.fyi/

## 3.3 查看賬戶信息

檢索節點存儲的帳戶信息

### 檢索擁有的馬賽克列表

```js
accountRepo = repo.createAccountRepository();
accountInfo = await accountRepo.getAccountInfo(aliceAddress).toPromise();
console.log(accountInfo);
```

###### 示例輸出

```js
> AccountInfo
    address: Address {address: 'TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ', networkType: 152}
    publicKey: "0000000000000000000000000000000000000000000000000000000000000000"
  > mosaics: Array(1)
      0: Mosaic
        amount: UInt64 {lower: 10000000, higher: 0}
        id: MosaicId
          id: Id {lower: 760461000, higher: 981735131}
```

#### 公鑰

客戶端剛剛創建的、尚未參與區塊鏈交易的賬戶信息不被記錄。 當地址首次出現在交易中時，帳戶信息將存儲在區塊鏈上。 因此，此時 publicKey 記為“00000...”。

#### UInt64

當數字太大時，JavaScript會溢出，因此ID和金額以UInt64的格式在SDK中進行管理。使用toString()將其轉換為字符串，使用compact()將其轉換為數字，使用toHex()將其轉換為十六進制。

```js
console.log("addressHeight:"); //Block height at which the address is recorded
console.log(accountInfo.addressHeight.compact()); //Numerics
accountInfo.mosaics.forEach((mosaic) => {
  console.log("id:" + mosaic.id.toHex()); //Hexadecimal
  console.log("amount:" + mosaic.amount.toString()); //String
});
```

使用COMPACT將一個太大的ID值反轉為數值時，可能會導致錯誤。
`Compacted value is greater than Number.Max_Value.`

#### 顯示位數的調整

將擁有的代幣數量作為整數值處理，以避免出現舍入誤差。我們可以從代幣定義中獲取可分割性(divisibility)，因此可以使用該值顯示所擁有的代幣的精確數量。

```js
mosaicRepo = repo.createMosaicRepository();
mosaicAmount = accountInfo.mosaics[0].amount.toString();
mosaicInfo = await mosaicRepo.getMosaic(accountInfo.mosaics[0].id).toPromise();
divisibility = mosaicInfo.divisibility; //Divisibility
if (divisibility > 0) {
  displayAmount =
    mosaicAmount.slice(0, mosaicAmount.length - divisibility) +
    "." +
    mosaicAmount.slice(-divisibility);
} else {
  displayAmount = mosaicAmount;
}
console.log(displayAmount);
```

## 3.4 使用提示

### 加密和簽名

為帳戶生成的私鑰和公鑰均可用於常規加密和數字簽名。 即使應用程序存在可靠性問題，也可以在 p2p（端到端）的基礎上驗證數據的機密性和合法性。

#### 預先準備：為連通性測試生成Bob帳戶

```js
bob = sym.Account.generateNewAccount(networkType);
bobPublicAccount = bob.publicAccount;
```

#### 加密

用Alice的私鑰和Bob的公鑰加密，用Alice的公鑰和Bob的私鑰解密（AES-GCM格式）。

```js
message = "Hello Symol!";
encryptedMessage = alice.encryptMessage(message, bob.publicAccount);
console.log(encryptedMessage);
```

```js
> 294C8979156C0D941270BAC191F7C689E93371EDBC36ADD8B920CF494012A97BA2D1A3759F9A6D55D5957E9D
```

#### 解密

```js
decryptMessage = bob.decryptMessage(
  new sym.EncryptedMessage(
    "294C8979156C0D941270BAC191F7C689E93371EDBC36ADD8B920CF494012A97BA2D1A3759F9A6D55D5957E9D",
  ),
  alice.publicAccount,
).payload;
console.log(decryptMessage);
```

```js
> "Hello Symol!"
```

#### 簽名

使用 Alice 的私鑰對消息進行簽名，並使用 Alice 的公鑰和簽名驗證消息。

```js
Buffer = require("/node_modules/buffer").Buffer;
payload = Buffer.from("Hello Symol!", "utf-8");
signature = Buffer.from(sym.KeyPair.sign(alice.keyPair, payload))
  .toString("hex")
  .toUpperCase();
console.log(signature);
```

```
> B8A9BCDE9246BB5780A8DED0F4D5DFC80020BBB7360B863EC1F9C62CAFA8686049F39A9F403CB4E66104754A6AEDEF8F6B4AC79E9416DEEDC176FDD24AFEC60E
```

#### 驗證

```js
isVerified = sym.KeyPair.verify(
  alice.keyPair.publicKey,
  Buffer.from("Hello Symol!", "utf-8"),
  Buffer.from(signature, "hex"),
);
console.log(isVerified);
```

```js
> true
```

請注意，不使用區塊鏈的簽名可能會被多次重複使用。

### 帳戶管理

本節介紹如何管理您的帳戶。
私鑰不應以純文本形式存儲。以下是使用symbol-qr-library對私鑰進行加密並使用密碼保護存儲的方法。

#### 私鑰加密

```js
qr = require("/node_modules/symbol-qr-library");

//Passphrase-Locked account generation
signerQR = qr.QRCodeGenerator.createExportAccount(
  alice.privateKey,
  networkType,
  generationHash,
  "Passphrase",
);

//QR code display
signerQR.toBase64().subscribe((x) => {
  //Example of displaying a QR code on an HTML body
  (tag = document.createElement("img")).src = x;
  document.getElementsByTagName("body")[0].appendChild(tag);
});

//Display accounts as encrypted JSON data
jsonSignerQR = signerQR.toJSON();
console.log(jsonSignerQR);
```

###### 示例輸出

```js
> {"v":3,"type":2,"network_id":152,"chain_id":"7FCCD304802016BEBBCD342A332F91FF1F3BB5E902988B352697BE245F48E836","data":{"ciphertext":"e9e2f76cb482fd054bc13b7ca7c9d086E7VxeGS/N8n1WGTc5MwshNMxUiOpSV2CNagtc6dDZ7rVZcnHXrrESS06CtDTLdD7qrNZEZAi166ucDUgk4Yst0P/XJfesCpXRxlzzNgcK8Q=","salt":"54de9318a44cc8990e01baba1bcb92fa111d5bcc0b02ffc6544d2816989dc0e9"}}
```

此jsonSignerQR輸出的QR碼或文本可隨時保存，以便恢復私鑰。

#### 加密私鑰解密

```js
//Assign stored text or text retrieved from a QR code scan into json signer QR
jsonSignerQR =
  '{"v":3,"type":2,"network_id":152,"chain_id":"7FCCD304802016BEBBCD342A332F91FF1F3BB5E902988B352697BE245F48E836","data":{"ciphertext":"e9e2f76cb482fd054bc13b7ca7c9d086E7VxeGS/N8n1WGTc5MwshNMxUiOpSV2CNagtc6dDZ7rVZcnHXrrESS06CtDTLdD7qrNZEZAi166ucDUgk4Yst0P/XJfesCpXRxlzzNgcK8Q=","salt":"54de9318a44cc8990e01baba1bcb92fa111d5bcc0b02ffc6544d2816989dc0e9"}}';

qr = require("/node_modules/symbol-qr-library");
signerQR = qr.AccountQR.fromJSON(jsonSignerQR, "Passphrase");
console.log(signerQR.accountPrivateKey);
```

###### 示例輸出

```js
> 1E9139CC1580B4AED6A1FE110085281D4982ED0D89CE07F3380EB83069B1****
```
