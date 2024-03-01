# 7.元数据

为帐户镶嵌命名空间注册Key-Value格式数据。可写入的数据的最大值为 1024 字节。
本章我们假设 mosaic、namespace 和 account 都是 Alice 创建的。

在运行本章示例脚本之前，请加载以下资料库：
```js
metaRepo = repo.createMetadataRepository();
mosaicRepo = repo.createMosaicRepository();
metaService = new sym.MetadataTransactionService(metaRepo);
```
## 7.1 注册账号

为帐户注册一个Key-Value。

```js
key = sym.KeyGenerator.generateUInt64Key("key_account");
value = "test";

tx = await metaService.createAccountMetadataTransaction(
    undefined,
    networkType,
    alice.address, //Metadata registration destination address
    key,value, //Key-Value
    alice.address //Metadata creator address
).toPromise();

aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [tx.toAggregate(alice.publicAccount)],
  networkType,[]
).setMaxFeeForAggregate(100, 0);

signedTx = alice.sign(aggregateTx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

元数据的注册需要记录它的帐户的签名。
即使注册目的地账户和发送者账户相同，也需要聚合交易。

当将元数据注册到不同的帐户时，请使用“用共签人签署交易”进行签署。

```js
tx = await metaService.createAccountMetadataTransaction(
    undefined,
    networkType,
    bob.address, //Metadata registration destination address
    key,value, //Key-Value
    alice.address //Metadata creator address
).toPromise();

aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [tx.toAggregate(alice.publicAccount)],
  networkType,[]
).setMaxFeeForAggregate(100, 1); // Number of co-signer to second argument: 1

signedTx = aggregateTx.signTransactionWithCosignatories(
  alice,[bob],generationHash,// Co-signer to second argument
);
await txRepo.announce(signedTx).toPromise();
```

如果您不知道 Bob 的私钥，则必须使用后续章节中解释的聚合绑定交易或离线签名。

## 7.2 注册到马赛克

使用元帐户的键值/复合键来为目标马赛克注册值。
注册和更新元数据需要创建马赛克的帐户的签名。

```js
mosaicId = new sym.MosaicId("1275B0B7511D9161");
mosaicInfo = await mosaicRepo.getMosaic(mosaicId).toPromise();

key = sym.KeyGenerator.generateUInt64Key('key_mosaic');
value = 'test';

tx = await metaService.createMosaicMetadataTransaction(
  undefined,
  networkType,
  mosaicInfo.ownerAddress, //Mosaic creator address
  mosaicId,
  key,value, //Key-Value
  alice.address
).toPromise();

aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    [tx.toAggregate(alice.publicAccount)],
    networkType,[]
).setMaxFeeForAggregate(100, 0);

signedTx = alice.sign(aggregateTx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

## 7.3 注册命名空间

注册命名空间的 Key-Value。
注册和更新元数据需要创建马赛克的帐户的签名。

```js
nsRepo = repo.createNamespaceRepository();
namespaceId = new sym.NamespaceId("xembook");
namespaceInfo = await nsRepo.getNamespace(namespaceId).toPromise();

key = sym.KeyGenerator.generateUInt64Key('key_namespace');
value = 'test';

tx = await metaService.createNamespaceMetadataTransaction(
    undefined,networkType,
    namespaceInfo.ownerAddress, //Namespace creator address
    namespaceId,
    key,value, //Key-Value
    alice.address //Metadata registrant
).toPromise();

aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    [tx.toAggregate(alice.publicAccount)],
    networkType,[]
).setMaxFeeForAggregate(100, 0);

signedTx = alice.sign(aggregateTx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

## 7.4 确认
检查注册的元数据。

```js
res = await metaRepo.search({
  targetAddress:alice.address,
  sourceAddress:alice.address}
).toPromise();
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
元数据类型如下。
```js
sym.MetadataType
{0: 'Account', 1: 'Mosaic', 2: 'Namespace'}
```

### 注意事项
虽然元数据具有通过 Key-Value 提供对信息的快速访问的优势，但应该注意它需要更新。
更新需要发行人账户和注册账户的签名，所以只有在两个账户都可以信任的情况下才应该使用它。


## 7.5 使用提示

### 资格证明

我们在 马赛克 一章中描述了所有权证明，在命名空间一章中描述了域链接。
通过接收从可靠域链接的帐户发布的元数据，可以用于证明该域内的资格所有权。

#### DID（去中心化身份）

生态系统分为发行者、拥有者和验证者，例如，学生拥有大学颁发的文凭，公司根据大学公布的公钥验证学生提交的证书。
此验证不需要依赖平台或第三方的信息。
通过这种方式利用元数据，大学可以向学生拥有的帐户发行元数据，公司可以通过验证大学公开密钥和学生的马赛克（帐户）拥有证明，验证元数据中列出的毕业证明。
