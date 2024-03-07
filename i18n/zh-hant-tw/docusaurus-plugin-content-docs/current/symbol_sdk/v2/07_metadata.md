# 7.元數據

為帳戶鑲嵌命名空間註冊Key-Value格式數據。 可寫入的數據的最大值為 1024 字節。
本章我們假設 mosaic、namespace 和 account 都是 Alice 創建的。

在運行本章示例腳本之前，請加載以下資料庫：

```js
metaRepo = repo.createMetadataRepository();
mosaicRepo = repo.createMosaicRepository();
metaService = new sym.MetadataTransactionService(metaRepo);
```

## 7.1 註冊賬號

為帳戶註冊一個Key-Value。

```js
key = sym.KeyGenerator.generateUInt64Key("key_account");
value = "test";

tx = await metaService
  .createAccountMetadataTransaction(
    undefined,
    networkType,
    alice.address, //Metadata registration destination address
    key,
    value, //Key-Value
    alice.address, //Metadata creator address
  )
  .toPromise();

aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [tx.toAggregate(alice.publicAccount)],
  networkType,
  [],
).setMaxFeeForAggregate(100, 0);

signedTx = alice.sign(aggregateTx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

元數據的註冊需要記錄它的帳戶的簽名。
即使註冊目的地賬戶和發送者賬戶相同，也需要聚合交易。

當將元數據註冊到不同的帳戶時，請使用“用共簽人簽署交易”進行簽署。

```js
tx = await metaService
  .createAccountMetadataTransaction(
    undefined,
    networkType,
    bob.address, //Metadata registration destination address
    key,
    value, //Key-Value
    alice.address, //Metadata creator address
  )
  .toPromise();

aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [tx.toAggregate(alice.publicAccount)],
  networkType,
  [],
).setMaxFeeForAggregate(100, 1); // Number of co-signer to second argument: 1

signedTx = aggregateTx.signTransactionWithCosignatories(
  alice,
  [bob],
  generationHash, // Co-signer to second argument
);
await txRepo.announce(signedTx).toPromise();
```

如果您不知道 Bob 的私鑰，則必須使用後續章節中解釋的聚合綁定交易或離線簽名。

## 7.2 註冊到馬賽克

使用元帳戶的鍵值/複合鍵來為目標馬賽克註冊值。
註冊和更新元數據需要創建馬賽克的帳戶的簽名。

```js
mosaicId = new sym.MosaicId("1275B0B7511D9161");
mosaicInfo = await mosaicRepo.getMosaic(mosaicId).toPromise();

key = sym.KeyGenerator.generateUInt64Key("key_mosaic");
value = "test";

tx = await metaService
  .createMosaicMetadataTransaction(
    undefined,
    networkType,
    mosaicInfo.ownerAddress, //Mosaic creator address
    mosaicId,
    key,
    value, //Key-Value
    alice.address,
  )
  .toPromise();

aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [tx.toAggregate(alice.publicAccount)],
  networkType,
  [],
).setMaxFeeForAggregate(100, 0);

signedTx = alice.sign(aggregateTx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

## 7.3 註冊命名空間

註冊命名空間的 Key-Value。
註冊和更新元數據需要創建馬賽克的帳戶的簽名。

```js
nsRepo = repo.createNamespaceRepository();
namespaceId = new sym.NamespaceId("xembook");
namespaceInfo = await nsRepo.getNamespace(namespaceId).toPromise();

key = sym.KeyGenerator.generateUInt64Key("key_namespace");
value = "test";

tx = await metaService
  .createNamespaceMetadataTransaction(
    undefined,
    networkType,
    namespaceInfo.ownerAddress, //Namespace creator address
    namespaceId,
    key,
    value, //Key-Value
    alice.address, //Metadata registrant
  )
  .toPromise();

aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [tx.toAggregate(alice.publicAccount)],
  networkType,
  [],
).setMaxFeeForAggregate(100, 0);

signedTx = alice.sign(aggregateTx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

## 7.4 確認

檢查註冊的元數據。

```js
res = await metaRepo
  .search({
    targetAddress: alice.address,
    sourceAddress: alice.address,
  })
  .toPromise();
console.log(res);
```

###### 市例演示

```js
data: Array(3)
  0: Metadata
    id: "62471DD2BF42F221DFD309D9"
    metadataEntry: MetadataEntry
      compositeHash: "617B0F9208753A1080F93C1CEE1A35ED740603CE7CFC21FBAE3859B7707A9063"
      metadataType: 0
      scopedMetadataKey: UInt64 {lower: 92350423, higher: 2540877595}
      sourceAddress: Address {address: 'TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ', networkType: 152}
      targetAddress: Address {address: 'TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ', networkType: 152}
      targetId: undefined
      value: "test"
  1: Metadata
    id: "62471F87BF42F221DFD30CC8"
    metadataEntry: MetadataEntry
      compositeHash: "D9E2019D7BD5BA58245320392A68B51752E35A35DA349B08E141DCE99AC3655A"
      metadataType: 1
      scopedMetadataKey: UInt64 {lower: 1789141730, higher: 3475078673}
      sourceAddress: Address {address: 'TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ', networkType: 152}
      targetAddress: Address {address: 'TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ', networkType: 152}
      targetId: MosaicId
      id: Id {lower: 1360892257, higher: 309702839}
      value: "test"
  3: Metadata
    id: "62616372BF42F221DF00A88C"
    metadataEntry: MetadataEntry
      compositeHash: "D8E597C7B491BF7F9990367C1798B5C993E1D893222F6FC199F98915339D92D5"
      metadataType: 2
      scopedMetadataKey: UInt64 {lower: 141807833, higher: 2339015223}
      sourceAddress: Address {address: 'TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ', networkType: 152}
      targetAddress: Address {address: 'TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ', networkType: 152}
      targetId: NamespaceId
      id: Id {lower: 646738821, higher: 2754876907}
      value: "test"
```

元數據類型如下。

```js
sym.MetadataType
{0: 'Account', 1: 'Mosaic', 2: 'Namespace'}
```

### 注意事項

雖然元數據具有通過 Key-Value 提供對信息的快速訪問的優勢，但應該注意它需要更新。
更新需要發行人賬戶和註冊賬戶的簽名，所以只有在兩個賬戶都可以信任的情況下才應該使用它。

## 7.5 使用提示

### 資格證明

我們在 馬賽克 一章中描述了所有權證明，在命名空間一章中描述了域鏈接。
通過接收從可靠域鏈接的帳戶發布的元數據，可以用於證明該域內的資格所有權。

#### DID（去中心化身份）

生態系統分為發行者、擁有者和驗證者，例如，學生擁有大學頒發的文憑，公司根據大學公佈的公鑰驗證學生提交的證書。
此驗證不需要依賴平台或第三方的信息。
通過這種方式利用元數據，大學可以向學生擁有的帳戶發行元數據，公司可以通過驗證大學公開密鑰和學生的馬賽克（帳戶）擁有證明，驗證元數據中列出的畢業證明。
