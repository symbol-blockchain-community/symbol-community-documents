# 4.交易

在區塊鏈上更新數據是通過向網絡宣布交易來完成的。

## 4.1 交易生命週期

以下是交易的生命週期描述：

- 交易創建
  - 以區塊鏈可接受的格式創建交易。
- 簽名
  - 使用帳戶的私鑰簽署交易。
- 宣告
  - 向網絡上的任何節點宣布已簽名的交易。
- 未確認狀態交易
  - 節點接受的交易作為未確認狀態交易傳播到所有節點。
    - 如果為交易設置的最高費用不足以滿足為每個節點設置的最低費用，則不會將其傳播到該節點。
- 確認交易
  - 當一個未確認的交易包含在後續的新區塊中（大約每 30 秒生成一次），它就成為一個已批准的交易。
- 回滾
  - 節點間無法達成共識的交易回滾到未確認狀態。
    - 已過期或已超出緩存的交易將被截斷。
- 完成
  - 一旦區塊被投票節點的終結過程終結，交易就可以被視為最終交易，數據不能再回滾。

### 什麼是塊?

塊大約每 30 秒生成一次，並逐塊與其他節點同步，優先考慮支付較高費用的交易。
如果同步失敗，則回滾，網絡重複此過程，直到所有節點達成共識。

## 4.2 交易創建

首先，從創建最基本的轉賬交易開始。

### 將交易轉移給Bob

創建要發送到的 Bob 地址。

```js
bob = sym.Account.generateNewAccount(networkType);
console.log(bob.address);
```

```js
> Address {address: 'TDWBA6L3CZ6VTZAZPAISL3RWM5VKMHM6J6IM3LY', networkType: 152}
```

創建交易。

```js
tx = sym.TransferTransaction.create(
  sym.Deadline.create(epochAdjustment), //Deadline:Expiry date
  sym.Address.createFromRawAddress("TDWBA6L3CZ6VTZAZPAISL3RWM5VKMHM6J6IM3LY"),
  [],
  sym.PlainMessage.create("Hello Symbol!"), //Message
  networkType, //Testnet/Mainnet classification
).setMaxFee(100); //Fees
```

每個設置解釋如下。

#### 到期日

2 小時是 SDK 的默認設置。
最多可以指定 6 小時。

```js
sym.Deadline.create(epochAdjustment, 6);
```

#### 信息

在信息字段中，最多可以將 1023 個字節附加到交易。
二進制數據也可以作為原始數據發送。

##### 空消息

```js
sym.EmptyMessage;
```

##### 純信息

```js
sym.PlainMessage.create("Hello Symbol!");
```

##### 加密信息

```js
sym.EncryptedMessage(
  "294C8979156C0D941270BAC191F7C689E93371EDBC36ADD8B920CF494012A97BA2D1A3759F9A6D55D5957E9D",
);
```

當您使用加密消息時，會附加一個標誌（標記）到消息上，表示“指定的消息已加密”。探索器和錢包將使用該標誌作為參考，以隱藏它或不解密該消息。加密本身不是由該方法實現的。

##### 原始數據

```js
sym.RawMessage.create(uint8Arrays[i]);
```

#### 最高費用

儘管支付少量額外費用可以更好地確保交易成功，但對網絡費用有一些了解也是一個好主意。
該賬戶指定了它在創建交易時願意支付的最高費用。
另一方面，節點嘗試一次只將費用最高的交易收割到一個區塊中。
這意味著，如果有許多其他交易願意支付更多費用，則該交易將需要更長的時間才能獲得批准。
反之，如果有很多其他交易想要少付，而你的最高手續費較大，那麼交易將以低於你設置的最高金額的手續費進行處理。

支付的費用由交易規模 x 費用乘數決定。
如果它是 176 字節並且您的 maxFee 設置為 100，則 17600µXYM = 0.0176XYM 是您允許作為交易費用支付的最大值。
有兩種指定方式：feeMultiplier = 100 或 maxFee = 17600。

##### 指定費用乘數為100

```js
tx = sym.TransferTransaction.create(
  ,,,,
  networkType
).setMaxFee(100);
```

##### 指定為最大費用 = 17600

```js
tx = sym.TransferTransaction.create(
  ,,,,
  networkType,
  sym.UInt64.fromUint(17600)
);
```

我們將使用指定費用乘數為100的方法。

## 4.3 簽名和廣播

使用私鑰簽署您創建的交易並將其公佈給任何節點。

### 簽名

```js
signedTx = alice.sign(tx, generationHash);
console.log(signedTx);
```

###### 示例演示

```js
> SignedTransaction
    hash: "3BD00B0AF24DE70C7F1763B3FD64983C9668A370CB96258768B715B117D703C2"
    networkType: 152
    payload:
"AE00000000000000CFC7A36C17060A937AFE1191BC7D77E33D81F3CC48DF9A0FFE892858DFC08C9911221543D687813ECE3D36836458D2569084298C09223F9899DF6ABD41028D0AD4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD20000000001985441F843000000000000879E76C702000000986F4982FE77894ABC3EBFDC16DFD4A5C2C7BC05BFD44ECE0E000000000000000048656C6C6F2053796D626F6C21"
    signerPublicKey: "D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2"
    type: 16724
```

需要使用帳戶和生成的哈希值對交易進行簽名。

生成哈希

- 測試網
  - 7FCCD304802016BEBBCD342A332F91FF1F3BB5E902988B352697BE245F48E836
- 主網
  - 57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6

生成的哈希值唯一標識區塊鏈網絡。
通過交織網絡的各個哈希值來創建已簽署的交易，以便它們不能使用相同的私鑰在其他網絡中使用。

### 廣播

```js
res = await txRepo.announce(signedTx).toPromise();
console.log(res);
```

```js
> TransactionAnnounceResponse {message: 'packet 9 was pushed to the network via /transactions'}
```

就像上面的腳本一樣，將發送一個回應：“封包n已推送到網絡”，這意味著該交易已被節點接受。
然而，這僅僅意味著交易的格式沒有異常。
為了最大化節點的響應速度，Symbol會在驗證交易內容之前返回接收到的結果並斷開連接。回應值僅僅是此信息的收據。如果格式出現錯誤，則消息回應如下：

##### 如果廣播失敗，回應的樣本輸出如下：

```js
Uncaught Error: {"statusCode":409,"statusMessage":"Unknown Error","body":"{\"code\":\"InvalidArgument\",\"message\":\"payload has an invalid format\"}"}
```

## 4.4 確認

### 狀態確認

檢查節點接受的交易狀態。

```js
tsRepo = repo.createTransactionStatusRepository();
transactionStatus = await tsRepo
  .getTransactionStatus(signedTx.hash)
  .toPromise();
console.log(transactionStatus);
```

###### 示例演示

```js
> TransactionStatus
    group: "confirmed"
    code: "Success"
    deadline: Deadline {adjustedValue: 11989512431}
    hash: "661360E61C37E156B0BE18E52C9F3ED1022DCE846A4609D72DF9FA8A5B667747"
    height: undefined
```

當被確認時，輸出會顯示 group: "confirmed"。

如果接受但發生錯誤，輸出將顯示如下。 重寫交易並嘗試再次廣播它。

```js
> TransactionStatus
    group: "failed"
    code: "Failure_Core_Insufficient_Balance"
    deadline: Deadline {adjustedValue: 11990156766}
    hash: "A82507C6C46DF444E36AC94391EA2D0D7DD1A218948DED465A7A4F9D1B53CA0E"
    height: undefined
```

如果該交易未被接受，則輸出將顯示以下的ResourceNotFound錯誤。

```js
Uncaught Error: {"statusCode":404,"statusMessage":"Unknown Error","body":"{\"code\":\"ResourceNotFound\",\"message\":\"no resource exists with id '18AEBC9866CD1C15270F18738D577CB1BD4B2DF3EFB28F270B528E3FE583F42D'\"}"}
```

當交易中指定的最高手續費小於節點設置的最低手續費時，或者需要公告為聚合交易的交易被公告為單筆交易時，就會出現該錯誤。

### 批准確認

批准該塊的交易大約需要 30 秒。

#### 通過探索器進行檢查。

使用可以通過signedTx.hash檢索的哈希值在探索器中搜索。

```js
console.log(signedTx.hash);
```

```js
> "661360E61C37E156B0BE18E52C9F3ED1022DCE846A4609D72DF9FA8A5B667747"
```

- 主網
  - https://symbol.fyi/transactions/661360E61C37E156B0BE18E52C9F3ED1022DCE846A4609D72DF9FA8A5B667747
- 測試網
  - https://testnet.symbol.fyi/transactions/661360E61C37E156B0BE18E52C9F3ED1022DCE846A4609D72DF9FA8A5B667747

#### 檢查SDK

```js
txInfo = await txRepo
  .getTransaction(signedTx.hash, sym.TransactionGroup.Confirmed)
  .toPromise();
console.log(txInfo);
```

###### 示例演示

```js
> TransferTransaction
    deadline: Deadline {adjustedValue: 12883929118}
    maxFee: UInt64 {lower: 17400, higher: 0}
    message: PlainMessage {type: 0, payload: 'Hello Symbol!'}
    mosaics: []
    networkType: 152
    payloadSize: 174
    recipientAddress: Address {address: 'TDWBA6L3CZ6VTZAZPAISL3RWM5VKMHM6J6IM3LY', networkType: 152}
    signature: "7A3562DCD7FEE4EE9CB456E48EFEEC687647119DC053DE63581FD46CA9D16A829FA421B39179AABBF4DE0C1D987B58490E3F95C37327358E6E461832E3B3A60D"
    signer: PublicAccount {publicKey: '0E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26', address: Address}
  > transactionInfo: TransactionInfo
        hash: "DA4B672E68E6561EAE560FB89B144AFE1EF75D2BE0D9B6755D90388F8BCC4709"
        height: UInt64 {lower: 330012, higher: 0}
        id: "626413050A21EB5CD286E17D"
        index: 1
        merkleComponentHash: "DA4B672E68E6561EAE560FB89B144AFE1EF75D2BE0D9B6755D90388F8BCC4709"
    type: 16724
    version: 1
```

##### 注意事項

即使在區塊中確認了一筆交易，如果發生回滾，該交易的確認仍有可能被撤銷。
在一個塊被批准後，隨著批准過程對幾個塊的進行，發生回滾的可能性會降低。
此外，等待由投票節點執行的敲定區塊，確保記錄的數據是確定的。

##### 示例腳本

在廣播交易之後，查看以下腳本以跟踪鏈的狀態非常有用。

```js
hash = signedTx.hash;
tsRepo = repo.createTransactionStatusRepository();
transactionStatus = await tsRepo.getTransactionStatus(hash).toPromise();
console.log(transactionStatus);
txInfo = await txRepo
  .getTransaction(hash, sym.TransactionGroup.Confirmed)
  .toPromise();
console.log(txInfo);
```

## 4.5 交易紀錄

獲取 Alice 發送和接收的交易歷史列表。

```js
result = await txRepo
  .search({
    group: sym.TransactionGroup.Confirmed,
    embedded: true,
    address: alice.address,
  })
  .toPromise();

txes = result.data;
txes.forEach((tx) => {
  console.log(tx);
});
```

###### 示例演示

```js
> TransferTransaction
    type: 16724
    networkType: 152
    payloadSize: 176
    deadline: Deadline {adjustedValue: 11905303680}
    maxFee: UInt64 {lower: 200000000, higher: 0}
    recipientAddress: Address {address: 'TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ', networkType: 152}
    signature: "E5924A1EB653240A7220405A4DD4E221E71E43327B3BA691D267326FEE3F57458E8721907188DB33A3F2A9CB1D0293845B4D0F1D7A93C8A3389262D1603C7108"
    signer: PublicAccount {publicKey: 'BDFAF3B090270920A30460AA943F9D8D4FCFF6741C2CB58798DBF7A2ED6B75AB', address: Address}
  > message: RawMessage
      payload: ""
      type: -1
  > mosaics: Array(1)
      0: Mosaic
        amount: UInt64 {lower: 10000000, higher: 0}
        id: MosaicId
          id: Id {lower: 760461000, higher: 981735131}
  > transactionInfo: TransactionInfo
      hash: "308472D34BE1A58B15A83B9684278010F2D69B59E39127518BE38A4D22EEF31D"
      height: UInt64 {lower: 301717, higher: 0}
      id: "6255242053E0E706653116F9"
      index: 0
      merkleComponentHash: "308472D34BE1A58B15A83B9684278010F2D69B59E39127518BE38A4D22EEF31D"
```

交易類型如下。

```js
{0: 'RESERVED', 16705: 'AGGREGATE_COMPLETE', 16707: 'VOTING_KEY_LINK', 16708: 'ACCOUNT_METADATA', 16712: 'HASH_LOCK', 16716: 'ACCOUNT_KEY_LINK', 16717: 'MOSAIC_DEFINITION', 16718: 'NAMESPACE_REGISTRATION', 16720: 'ACCOUNT_ADDRESS_RESTRICTION', 16721: 'MOSAIC_GLOBAL_RESTRICTION', 16722: 'SECRET_LOCK', 16724: 'TRANSFER', 16725: 'MULTISIG_ACCOUNT_MODIFICATION', 16961: 'AGGREGATE_BONDED', 16963: 'VRF_KEY_LINK', 16964: 'MOSAIC_METADATA', 16972: 'NODE_KEY_LINK', 16973: 'MOSAIC_SUPPLY_CHANGE', 16974: 'ADDRESS_ALIAS', 16976: 'ACCOUNT_MOSAIC_RESTRICTION', 16977: 'MOSAIC_ADDRESS_RESTRICTION', 16978: 'SECRET_PROOF', 17220: 'NAMESPACE_METADATA', 17229: 'MOSAIC_SUPPLY_REVOCATION', 17230: 'MOSAIC_ALIAS', 17232: 'ACCOUNT_OPERATION_RESTRICTION'
```

消息類型如下。

```js
{0: 'PlainMessage', 1: 'EncryptedMessage', 254: 'PersistentHarvestingDelegationMessage', -1: 'RawMessage'}
```

## 4.6 聚合交易

聚合事務可以將多個事務合併為一個。
Symbol 的公共網絡支持包含多達 100 個內部交易（涉及多達 25 個不同的聯署人）的聚合交易。
後續章節涵蓋的內容包括需要了解聚合事務的函數。
本章只介紹最簡單的聚合事務。

### 一個案例只需要發起人的簽名

```js
bob = sym.Account.generateNewAccount(networkType);
carol = sym.Account.generateNewAccount(networkType);

innerTx1 = sym.TransferTransaction.create(
  undefined, //Deadline
  bob.address, //Destination of the transaction
  [],
  sym.PlainMessage.create("tx1"),
  networkType,
);

innerTx2 = sym.TransferTransaction.create(
  undefined, //Deadline
  carol.address, //Destination of the transaction
  [],
  sym.PlainMessage.create("tx2"),
  networkType,
);

aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [
    innerTx1.toAggregate(alice.publicAccount), //Publickey of the sender account
    innerTx2.toAggregate(alice.publicAccount), //Publickey of the sender account
  ],
  networkType,
  [],
  sym.UInt64.fromUint(1000000),
);
signedTx = alice.sign(aggregateTx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

首先，創建要包含在聚合交易中的交易。
目前沒有必要指定截止日期。
列舉時，將生成的交易添加到聚合中，並指定發送方帳戶的公鑰。
請注意，發送方和簽名帳戶不總是匹配的。
這是因為可能會出現“Alice 簽署 Bob 發送的交易”等場景，這將在後續章節中進行解釋。
這是在 Symbol 區塊鏈上使用交易的最重要概念。
本章中的交易由Alice發送和簽署，因此聚合綁定交易上的簽名也指定了Alice。

## 4.7 使用提示

### 存在證明

「帳戶」章節介紹了如何使用帳戶對數據進行簽署和驗證。
將這些數據放入在區塊鏈上得到確認的交易中，就不可能刪除一個帳戶證明某些數據在某個時間存在的事實。
可以認為它具有與有關方擁有時間戳電子簽名相同的含義。 （法律決策由專家決定）

區塊鏈以這種“賬戶已經證明的不可磨滅的事實”的存在來更新交易等數據。
區塊鏈也可以用作證明某個事實的知識證明，而這個事實此時還沒有被任何人知道。
本節描述了兩種模式，其中已經證明存在的數據可以放在交易中。

#### 數字數據哈希值（SHA256）輸出方式

文件的存在可以通過在區塊鏈中記錄其摘要值來證明。

各操作系統中文件使用SHA256計算哈希值的方法如下。

```sh
#Windows
certutil -hashfile WINfilepath SHA256
#Mac
shasum -a 256 MACfilepath
#Linux
sha256sum Linuxfilepath
```

#### 拆分大數據

由於交易的有效載荷只能包含 1023 個字節。 大數據被拆分並打包到有效負載中以進行聚合交易。

```js
bigdata =
  "C00200000000000093B0B985101C1BDD1BC2BF30D72F35E34265B3F381ECA464733E147A4F0A6B9353547E2E08189EF37E50D271BEB5F09B81CE5816BB34A153D2268520AF630A0A0E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26000000000198414140770200000000002A769FB40000000076B455CFAE2CCDA9C282BF8556D3E9C9C0DE18B0CBE6660ACCF86EB54AC51B33B001000000000000DB000000000000000E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26000000000198544198205C1A4CE06C45B3A896B1B2360E03633B9F36BF7F22338B000000000000000066653465353435393833444430383935303645394533424446434235313637433046394232384135344536463032413837364535303734423641303337414643414233303344383841303630353343353345354235413835323835443639434132364235343233343032364244444331443133343139464435353438323930334242453038423832304100000000006800000000000000B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D000000000198444198205C1A4CE06C45B3A896B1B2360E03633B9F36BF7F2233BC089179EBBE01A81400140035383435344434373631364336433635373237396800000000000000B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D000000000198444198205C1A4CE06C45B3A896B1B2360E03633B9F36BF7F223345ECB996EDDB9BEB1400140035383435344434373631364336433635373237390000000000000000B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D5A71EBA9C924EFA146897BE6C9BB3DACEFA26A07D687AC4A83C9B03087640E2D1DDAE952E9DDBC33312E2C8D021B4CC0435852C0756B1EBD983FCE221A981D02";

let payloads = [];
for (let i = 0; i < bigdata.length / 1023; i++) {
  payloads.push(bigdata.substr(i * 1023, 1023));
}
console.log(payloads);
```
