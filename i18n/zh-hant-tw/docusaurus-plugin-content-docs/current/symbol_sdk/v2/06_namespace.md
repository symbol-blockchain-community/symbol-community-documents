# 6.命名空間

命名空間是可租貸並與地址或馬賽克關聯的可讀性高的文本字符串。
名稱最長可達64個字符（允許的字符只有 a 到 z、0 到 9、\_ 和 -）。

## 6.1 費用計算

註冊命名空間需要支付租金，該費用與網絡費用分開。
租金根據網絡活動而波動，在網絡繁忙期間成本會增加，因此在註冊命名空間之前檢查費用是明智的。

在以下示例中，費用是針對根命名空間的 365 天租用計算的。

```js
nwRepo = repo.createNetworkRepository();

rentalFees = await nwRepo.getRentalFees().toPromise();
rootNsperBlock = rentalFees.effectiveRootNamespaceRentalFeePerBlock.compact();
rentalDays = 365;
rentalBlock = (rentalDays * 24 * 60 * 60) / 30;
rootNsRenatalFeeTotal = rentalBlock * rootNsperBlock;
console.log("rentalBlock:" + rentalBlock);
console.log("rootNsRenatalFeeTotal:" + rootNsRenatalFeeTotal);
```

###### 市例演示

```js
> rentalBlock:1051200
> rootNsRenatalFeeTotal:210240000 //Approximately 210XYM
```

持續時間由塊數指定； 一個區塊按30秒計算。
最短租用期限為 30 天（最長為 1825 天）。

可以使用以下的程式碼來計算獲取子命名空間的費用

```js
childNamespaceRentalFee = rentalFees.effectiveChildNamespaceRentalFee.compact();
console.log(childNamespaceRentalFee);
```

###### 市例演示

```js
> 10000000 //10XYM
```

沒有為子命名空間指定持續時間限制。 只要註冊了根名稱空間，它就可以使用。

## 6.2 租貸

租用根命名空間。（示例：xembook）

```js
tx = sym.NamespaceRegistrationTransaction.createRootNamespace(
  sym.Deadline.create(epochAdjustment),
  "xembook",
  sym.UInt64.fromUint(86400),
  networkType,
).setMaxFee(100);
signedTx = alice.sign(tx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

租用一個子命名空間。（示例：xembook.tomato）

```js
subNamespaceTx = sym.NamespaceRegistrationTransaction.createSubNamespace(
  sym.Deadline.create(epochAdjustment),
  "tomato", //Subnamespace to be created
  "xembook", //Route namespace to be linked to
  networkType,
).setMaxFee(100);
signedTx = alice.sign(subNamespaceTx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

您還可以創建一個第 2 層子命名空間，例如在本例中，定義 xembook.tomato.morning：

```js
subNamespaceTx = sym.NamespaceRegistrationTransaction.createSubNamespace(
    ,
    "morning",  //Subnamespace to be created
    "xembook.tomato", //Route namespace to be linked to
    ,
)
```

### 到期日的計算

計算租用根命名空間的到期日期。

```js
nsRepo = repo.createNamespaceRepository();
chainRepo = repo.createChainRepository();
blockRepo = repo.createBlockRepository();

namespaceId = new sym.NamespaceId("xembook");
nsInfo = await nsRepo.getNamespace(namespaceId).toPromise();
lastHeight = (await chainRepo.getChainInfo().toPromise()).height;
lastBlock = await blockRepo.getBlockByHeight(lastHeight).toPromise();
remainHeight = nsInfo.endHeight.compact() - lastHeight.compact();

endDate = new Date(
  lastBlock.timestamp.compact() + remainHeight * 30000 + epochAdjustment * 1000,
);
console.log(endDate);
```

獲取有關命名空間到期的信息，輸出剩餘區塊數的日期和時間，該區塊數等於當前區塊高度減去命名空間創建高度，然後乘以30秒（平均區塊生成間隔）。
對於測試網，更新截止日期從到期日起大約推遲一天。 而對於主網，這個值為30天，請注意。

###### 市例演示

```js
> Tue Mar 29 2022 18:17:06 GMT+0900 (JST)
```

## 6.3 鏈接

### 鏈接到帳戶

```js
namespaceId = new sym.NamespaceId("xembook");
address = sym.Address.createFromRawAddress(
  "TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ",
);
tx = sym.AliasTransaction.createForAddress(
  sym.Deadline.create(epochAdjustment),
  sym.AliasAction.Link,
  namespaceId,
  address,
  networkType,
).setMaxFee(100);
signedTx = alice.sign(tx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

鏈接地址不必歸您所有。

### 鏈接到馬賽克

```js
namespaceId = new sym.NamespaceId("xembook.tomato");
mosaicId = new sym.MosaicId("3A8416DB2D53xxxx");
tx = sym.AliasTransaction.createForMosaic(
  sym.Deadline.create(epochAdjustment),
  sym.AliasAction.Link,
  namespaceId,
  mosaicId,
  networkType,
).setMaxFee(100);
signedTx = alice.sign(tx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

只有當馬賽克與創建馬賽克的地址相同時，才能鏈接馬賽克。

## 6.4 未解析的帳戶形式

將目的地指定為未解析的帳戶形式以在不識別地址的情況下簽署和宣布交易。
將在鏈上解析的帳戶執行交易。

```js
namespaceId = new sym.NamespaceId("xembook");
tx = sym.TransferTransaction.create(
  sym.Deadline.create(epochAdjustment),
  namespaceId, //Unresolved Account:Unresolved Account Address
  [],
  sym.EmptyMessage,
  networkType,
).setMaxFee(100);
signedTx = alice.sign(tx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

將發送馬賽克指定為未解決的馬賽克，以在不識別馬賽克 ID 的情況下簽署和宣布交易。

```js
namespaceId = new sym.NamespaceId("xembook.tomato");
tx = sym.TransferTransaction.create(
  sym.Deadline.create(epochAdjustment),
  address,
  [
    new sym.Mosaic(
      namespaceId, //Unresolved Mosaic:Unresolved Mosaic
      sym.UInt64.fromUint(1), //Amount
    ),
  ],
  sym.EmptyMessage,
  networkType,
).setMaxFee(100);
signedTx = alice.sign(tx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

要在名稱空間中使用 XYM，請按如下方式指定。

```js
namespaceId = new sym.NamespaceId("symbol.xym");
```

```js
> NamespaceId {fullName: 'symbol.xym', id: Id}
    fullName: "symbol.xym"
    id: Id {lower: 1106554862, higher: 3880491450}
```

id 以內部數字 `Uint64（{lower: 1106554862, higher: 3880491450}）` 表示。

## 6.5 參考資料

引用鏈接到地址的命名空間。

```js
nsRepo = repo.createNamespaceRepository();

namespaceInfo = await nsRepo
  .getNamespace(new sym.NamespaceId("xembook"))
  .toPromise();
console.log(namespaceInfo);
```

###### 市例演示

```js
NamespaceInfo
    active: true
  > alias: AddressAlias
        address: Address {address: 'TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ', networkType: 152}
        mosaicId: undefined
        type: 2 //AliasType
    depth: 1
    endHeight: UInt64 {lower: 500545, higher: 0}
    index: 1
    levels: [NamespaceId]
    ownerAddress: Address {address: 'TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ', networkType: 152}
    parentId: NamespaceId {id: Id}
    registrationType: 0 //NamespaceRegistrationType
    startHeight: UInt64 {lower: 324865, higher: 0}
```

別名類型如下。

```js
{0: 'None', 1: 'Mosaic', 2: 'Address'}
```

命名空間註冊類型如下。

```js
{0: 'RootNamespace', 1: 'SubNamespace'}
```

引用鏈接到馬賽克的命名空間。

```js
nsRepo = repo.createNamespaceRepository();

namespaceInfo = await nsRepo
  .getNamespace(new sym.NamespaceId("xembook.tomato"))
  .toPromise();
console.log(namespaceInfo);
```

###### 市例演示

```js
NamespaceInfo
  > active: true
    alias: MosaicAlias
        address: undefined
        mosaicId: MosaicId
        id: Id {lower: 1360892257, higher: 309702839}
        type: 1 //AliasType
    depth: 2
    endHeight: UInt64 {lower: 500545, higher: 0}
    index: 1
    levels: (2) [NamespaceId, NamespaceId]
    ownerAddress: Address {address: 'TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ', networkType: 152}
    parentId: NamespaceId {id: Id}
    registrationType: 1 //NamespaceRegistrationType
    startHeight: UInt64 {lower: 324865, higher: 0}
```

### 反向查找

檢查鏈接到該地址的所有命名空間。

```js
nsRepo = repo.createNamespaceRepository();

accountNames = await nsRepo
  .getAccountsNames([
    sym.Address.createFromRawAddress("TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ"),
  ])
  .toPromise();

namespaceIds = accountNames[0].names.map((name) => {
  return name.namespaceId;
});
console.log(namespaceIds);
```

檢查鏈接到馬賽克的所有命名空間。

```js
nsRepo = repo.createNamespaceRepository();

mosaicNames = await nsRepo
  .getMosaicsNames([new sym.MosaicId("72C0212E67A08BCE")])
  .toPromise();

namespaceIds = mosaicNames[0].names.map((name) => {
  return name.namespaceId;
});
console.log(namespaceIds);
```

### 收據參考

檢查區塊鏈如何解析用於交易的命名空間。

```js
receiptRepo = repo.createReceiptRepository();
state = await receiptRepo
  .searchAddressResolutionStatements({ height: 179401 })
  .toPromise();
```

###### 市例演示

```js
data: Array(1)
  0: ResolutionStatement
    height: UInt64 {lower: 179401, higher: 0}
    resolutionEntries: Array(1)
      0: ResolutionEntry
        resolved: Address {address: 'TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ', networkType: 152}
        source: ReceiptSource {primaryId: 1, secondaryId: 0}
    resolutionType: 0 //ResolutionType
    unresolved: NamespaceId
      id: Id {lower: 646738821, higher: 2754876907}
```

分辨率類型如下。

```js
{0: 'Address', 1: 'Mosaic'}
```

#### 注意事項

由於命名空間本身是租貸的，過去交易中使用的命名空間鏈接可能與當前命名空間的鏈接不同。

如果您想知道您當時鏈接到哪個帳戶，請務必參考您的收據，例如 參考歷史數據時。

## 6.6 使用提示

### 與外部域的相互鏈接

由於協議限制了重複的命名空間，因此使用者可以在 Symbol 上通過取得與互聯網域名或現實世界中知名商標名稱相同的命名空間，並通過促進外部來源（如官方網站、印刷材料等）對該命名空間的認識，來建立自己帳戶在品牌價值上的地位。
（有關法律效力，請徵求專家意見。）
當心黑客攻擊外部域並更新您自己的Symbol名稱空間持續時間。

#### 關於獲取命名空間的帳戶的注意事項

命名空間在指定期限內租貸。
目前，獲取命名空間的選項只有放棄或延長期限。
如果在考慮操作轉帳等情況下使用命名空間，建議使用多重簽名帳戶（第9章）來購買命名空間。
