# 6. 命名空间

命名空间是可租贷并与地址或马赛克关联的可读性高的文本字符串。
名称最长可达64个字符（允许的字符只有 a 到 z、0 到 9、_ 和 -）。

## 6.1 费用计算

注册命名空间需要支付租金，该费用与网络费用分开。
租金根据网络活动而波动，在网络繁忙期间成本会增加，因此在注册命名空间之前检查费用是明智的。

在以下示例中，费用是针对根命名空间的 365 天租用计算的。


```js
nwRepo = repo.createNetworkRepository();

rentalFees = await nwRepo.getRentalFees().toPromise();
rootNsperBlock = rentalFees.effectiveRootNamespaceRentalFeePerBlock.compact();
rentalDays = 365;
rentalBlock = rentalDays * 24 * 60 * 60 / 30;
rootNsRenatalFeeTotal = rentalBlock * rootNsperBlock;
console.log("rentalBlock:" + rentalBlock);
console.log("rootNsRenatalFeeTotal:" + rootNsRenatalFeeTotal);
```
###### 市例演示
```js
> rentalBlock:1051200
> rootNsRenatalFeeTotal:210240000 //Approximately 210XYM
```

持续时间由块数指定； 一个区块按30秒计算。
最短租用期限为 30 天（最长为 1825 天）。

可以使用以下的程式码来计算获取子命名空间的费用

```js
childNamespaceRentalFee = rentalFees.effectiveChildNamespaceRentalFee.compact()
console.log(childNamespaceRentalFee);
```
###### 市例演示
```js
> 10000000 //10XYM
```

没有为子命名空间指定持续时间限制。只要注册了根名称空间，它就可以使用。

## 6.2 租贷

租用根命名空间。 （示例：xembook）
```js

tx = sym.NamespaceRegistrationTransaction.createRootNamespace(
    sym.Deadline.create(epochAdjustment),
    "xembook",
    sym.UInt64.fromUint(86400),
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

租用一个子命名空间。 （示例：xembook.tomato）
```js
subNamespaceTx = sym.NamespaceRegistrationTransaction.createSubNamespace(
    sym.Deadline.create(epochAdjustment),
    "tomato",  //Subnamespace to be created
    "xembook", //Route namespace to be linked to
    networkType,
).setMaxFee(100);
signedTx = alice.sign(subNamespaceTx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

您还可以创建一个第 2 层子命名空间，例如在本例中，定义 xembook.tomato.morning：

```js
subNamespaceTx = sym.NamespaceRegistrationTransaction.createSubNamespace(
    ,
    "morning",  //Subnamespace to be created
    "xembook.tomato", //Route namespace to be linked to
    ,
)
```


### 到期日的计算

计算租用根命名空间的到期日期。

```js
nsRepo = repo.createNamespaceRepository();
chainRepo = repo.createChainRepository();
blockRepo = repo.createBlockRepository();

namespaceId = new sym.NamespaceId("xembook");
nsInfo = await nsRepo.getNamespace(namespaceId).toPromise();
lastHeight = (await chainRepo.getChainInfo().toPromise()).height;
lastBlock = await blockRepo.getBlockByHeight(lastHeight).toPromise();
remainHeight = nsInfo.endHeight.compact() - lastHeight.compact();

endDate = new Date(lastBlock.timestamp.compact() + remainHeight * 30000 + epochAdjustment * 1000)
console.log(endDate);
```

获取有关命名空间到期的信息，输出剩余区块数的日期和时间，该区块数等于当前区块高度减去命名空间创建高度，然后乘以30秒（平均区块生成间隔）。
对于测试网，更新截止日期从到期日起大约推迟一天。而对于主网，这个值为30天，请注意。


###### 市例演示
```js
> Tue Mar 29 2022 18:17:06 GMT+0900 (JST)
```
## 6.3 链接

### 链接到帐户
```js
namespaceId = new sym.NamespaceId("xembook");
address = sym.Address.createFromRawAddress("TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ");
tx = sym.AliasTransaction.createForAddress(
    sym.Deadline.create(epochAdjustment),
    sym.AliasAction.Link,
    namespaceId,
    address,
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```
链接地址不必归您所有。

### 链接到马赛克
```js
namespaceId = new sym.NamespaceId("xembook.tomato");
mosaicId = new sym.MosaicId("3A8416DB2D53xxxx");
tx = sym.AliasTransaction.createForMosaic(
    sym.Deadline.create(epochAdjustment),
    sym.AliasAction.Link,
    namespaceId,
    mosaicId,
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

只有当马赛克与创建马赛克的地址相同时，才能链接马赛克。


## 6.4 未解析的帐户形式

将目的地指定为未解析的帐户形式以在不识别地址的情况下签署和宣布交易。
将在链上解析的帐户执行交易。
```js
namespaceId = new sym.NamespaceId("xembook");
tx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment),
    namespaceId, //Unresolved Account:Unresolved Account Address
    [],
    sym.EmptyMessage,
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```
将发送马赛克指定为未解决的马赛克，以在不识别马赛克 ID 的情况下签署和宣布交易。

```js
namespaceId = new sym.NamespaceId("xembook.tomato");
tx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment),
    address, 
    [
        new sym.Mosaic(
          namespaceId,//Unresolved Mosaic:Unresolved Mosaic
          sym.UInt64.fromUint(1) //Amount
        )
    ],
    sym.EmptyMessage,
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

要在名称空间中使用 XYM，请按如下方式指定。

```js
namespaceId = new sym.NamespaceId("symbol.xym");
```
```js
> NamespaceId {fullName: 'symbol.xym', id: Id}
    fullName: "symbol.xym"
    id: Id {lower: 1106554862, higher: 3880491450}
```

id 以内部数字 Uint64（{lower: 1106554862, higher: 3880491450}）表示。

## 6.5 参考资料

引用链接到地址的命名空间。
```js
nsRepo = repo.createNamespaceRepository();

namespaceInfo = await nsRepo.getNamespace(new sym.NamespaceId("xembook")).toPromise();
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

别名类型如下。
```js
{0: 'None', 1: 'Mosaic', 2: 'Address'}
```

命名空间注册类型如下。
```js
{0: 'RootNamespace', 1: 'SubNamespace'}
```

引用链接到马赛克的命名空间。
```js
nsRepo = repo.createNamespaceRepository();

namespaceInfo = await nsRepo.getNamespace(new sym.NamespaceId("xembook.tomato")).toPromise();
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

检查链接到该地址的所有命名空间。
```js
nsRepo = repo.createNamespaceRepository();

accountNames = await nsRepo.getAccountsNames(
  [sym.Address.createFromRawAddress("TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ")]
).toPromise();

namespaceIds = accountNames[0].names.map(name=>{
  return name.namespaceId;
});
console.log(namespaceIds);
```

检查链接到马赛克的所有命名空间。
```js
nsRepo = repo.createNamespaceRepository();

mosaicNames = await nsRepo.getMosaicsNames(
  [new sym.MosaicId("72C0212E67A08BCE")]
).toPromise();

namespaceIds = mosaicNames[0].names.map(name=>{
  return name.namespaceId;
});
console.log(namespaceIds);
```


### 收据参考

检查区块链如何解析用于交易的命名空间。

```js
receiptRepo = repo.createReceiptRepository();
state = await receiptRepo.searchAddressResolutionStatements({height:179401}).toPromise();
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

分辨率类型如下。
```js
{0: 'Address', 1: 'Mosaic'}
```

#### 注意事项
由于命名空间本身是租贷的，过去交易中使用的命名空间链接可能与当前命名空间的链接不同。

如果您想知道您当时链接到哪个帐户，请务必参考您的收据，例如 参考历史数据时。


## 6.6 使用提示

### 与外部域的相互链接

由于协议限制了重复的命名空间，因此使用者可以在 Symbol 上通过取得与互联网域名或现实世界中知名商标名称相同的命名空间，并通过促进外部来源（如官方网站、印刷材料等）对该命名空间的认识，来建立自己帐户在品牌价值上的地位。
（有关法律效力，请征求专家意见。）
当心黑客攻击外部域并更新您自己的Symbol名称空间持续时间。


#### 关于获取命名空间的帐户的注意事项
命名空间在指定期限内租贷。
目前，获取命名空间的选项只有放弃或延长期限。
如果在考虑操作转帐等情况下使用命名空间，建议使用多重签名帐户（第9章）来购买命名空间。

