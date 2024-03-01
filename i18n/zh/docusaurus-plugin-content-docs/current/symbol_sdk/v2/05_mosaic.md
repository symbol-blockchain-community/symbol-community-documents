# 5. 马赛克

本章介绍 Mosaic 设置及其生成方式。
在 Symbol 中，令牌被称为马赛克。

根据维基百科的描述，令牌（Token）是“各种形状的泥制品，直径约为1厘米，出土于公元前8000年至公元前3000年的美索不达米亚层。”另一方面，马赛克（Mosaic）是“一种装饰艺术技巧，通过将小块材料组装嵌入以形成图像或图案。石材、陶瓷（马赛克瓷砖）、有色和无色玻璃、贝壳和木材用于装饰建筑或工艺品的地面和墙壁。”
在 Symbol 中，马赛克可以被认为是代表 Symbol 区块链创建的生态系统各个方面的各种组件。

## 5.1 马赛克生成

对于马赛克生成，定义要创建的马赛克。
```js
supplyMutable = true; //Availability of supply changes
transferable = false; //Transferability to third parties
restrictable = true; //Availability of restriction settings
revokable = true; //Revocability from the issuer
//Mosaic definition
nonce = sym.MosaicNonce.createRandom();
mosaicDefTx = sym.MosaicDefinitionTransaction.create(
    undefined, 
    nonce,
    sym.MosaicId.createFromNonce(nonce, alice.address), //Mosaic ID
    sym.MosaicFlags.create(supplyMutable, transferable, restrictable, revokable),
    2,//Divisibility:Divisibility
    sym.UInt64.fromUint(0), //Duration:Effective date
    networkType
);
```

马赛克标志如下。

```js
MosaicFlags {
  supplyMutable: false, transferable: false, restrictable: false, revokable: false
}
```
可以指定供应变更的许可、向第三方的可转让性、Mosaic 全球限制的应用和发行人的可撤销性。
一旦设置这些属性，以后就不能更改。

#### 可分割性

可被整除性（Divisibility）决定了可以测量数量的小数位数。数据以整数值保存。

divisibility:0 = 1  
divisibility:1 = 1.0  
divisibility:2 = 1.00  

#### 持续时间

如果指定为 0，则不能再细分为更小的单元。
如果设置了马赛克有效期，有效期过后数据不会消失。
请注意，每个帐户最多可以拥有 1,000 个马赛克。


接下来，更改数量。
```js
//Mosaic change
mosaicChangeTx = sym.MosaicSupplyChangeTransaction.create(
    undefined,
    mosaicDefTx.mosaicId,
    sym.MosaicSupplyChangeAction.Increase,
    sym.UInt64.fromUint(1000000),
    networkType
);
```
如果supplyMutable:false，只有当整个马赛克的供应量在发行者的账户中时，数量才能被更改。 
如果整除率 > 0，则将其定义为最小单位为 1 的整数值。
（如果要创建 1.00 可整除性，请指定 100：2）

马赛克供应量更改操作如下所示。
```js
{0: 'Decrease', 1: 'Increase'}
```
如果要增加它，请指定增加。
将上面的两个事务合并成一个聚合事务。

```js
aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    [
      mosaicDefTx.toAggregate(alice.publicAccount),
      mosaicChangeTx.toAggregate(alice.publicAccount),
    ],
    networkType,[],
).setMaxFeeForAggregate(100, 0);
signedTx = alice.sign(aggregateTx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

请注意，聚合交易的一个特点是它会尝试更改尚不存在的马赛克的数量。
排列时，如果没有不一致，则可以在单个块内毫无问题的处理它们。


### 确认
确认创建马赛克的账户持有的马赛克信息。

```js
mosaicRepo = repo.createMosaicRepository();
accountInfo.mosaics.forEach(async mosaic => {
  mosaicInfo = await mosaicRepo.getMosaic(mosaic.id).toPromise();
  console.log(mosaicInfo);
});
```
###### 示例演示
```js
> MosaicInfo {version: 1, recordId: '622988B12A6128903FC10496', id: MosaicId, supply: UInt64, startHeight: UInt64, …}
> MosaicInfo
    divisibility: 2 //Divisibility
    duration: UInt64 {lower: 0, higher: 0} //Duration
  > flags: MosaicFlags
        restrictable: true //Availability of restriction settings
        revokable: true //Revocability from the issuer
        supplyMutable: true //Availability of supply changes
        transferable: false //Transferability to third parties
  > id: MosaicId
        id: Id {lower: 207493124, higher: 890137608} //MosaicID
    ownerAddress: Address {address: 'TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ', networkType: 152} //Issure address
    recordId: "62626E3C741381859AFAD4D5" 
    supply: UInt64 {lower: 1000000, higher: 0} //Total supply
```

## 5.2 马赛克转移

传输创建的马赛克。
刚接触区块链的人常常把马赛克传输想像成“将存储在一个客户端的马赛克发送到另一个客户端”，但马赛克信息始终在所有节点之间共享和同步，而不是将马赛克信息传输到目的地。
更准确地说，它是指通过向区块链“发送交易”来重新组合账户之间代币余额的操作。

```js
//Creating a receiving account
bob = sym.Account.generateNewAccount(networkType);
tx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment),
    bob.address,  //Destination address
    // Transfer mosaic list
    [ 
      new sym.Mosaic(
        new sym.MosaicId("3A8416DB2D53B6C8"), //TestnetXYM
        sym.UInt64.fromUint(1000000) //1XYM(divisibility:6)
      ),
      new sym.Mosaic(
        mosaicDefTx.mosaicId, // Mosaic created in 5.1.
        sym.UInt64.fromUint(1)  // Amount:0.01(InCaseDivisibility:2)
      )
    ],
    sym.EmptyMessage,
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```



##### 传输马赛克列表

可以在单个事务中传输多个马赛克。
要传输 XYM，请指定以下马赛克 ID。

- 主网：6BED913FA20223F8
- 测试网：3A8416DB2D53B6C8

#### 帐户
所有小数点也指定为整数。
XYM 可整除 6，因此指定为 1XYM=1000000。

### 交易确认

```js
txInfo = await txRepo.getTransaction(signedTx.hash,sym.TransactionGroup.Confirmed).toPromise();
console.log(txInfo); 
```
###### 示例演示
```js
> TransferTransaction
    deadline: Deadline {adjustedValue: 12776690385}
    maxFee: UInt64 {lower: 19200, higher: 0}
    message: RawMessage {type: -1, payload: ''}
  > mosaics: Array(2)
      > 0: Mosaic
            amount: UInt64 {lower: 1, higher: 0}
          > id: MosaicId
                id: Id {lower: 207493124, higher: 890137608}
      > 1: Mosaic
            amount: UInt64 {lower: 1000000, higher: 0}
          > id: MosaicId
                id: Id {lower: 760461000, higher: 981735131}
    networkType: 152
    payloadSize: 192
    recipientAddress: Address {address: 'TAR6ERCSTDJJ7KCN4BJNJTK7LBBL5JPPVSHUNGY', networkType: 152}
    signature: "7C4E9E80D250C6D09352FB8EC80175719D59787DE67446896A73AABCFE6C420AF7DD707E6D4D2B2987B8BAD775F2989DCB6F738D39C48C1239FC8CC900A6740D"
    signer: PublicAccount {publicKey: '0E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26', address: Address}
  > transactionInfo: TransactionInfo
        hash: "DE479C001E9736976BDA55E560AB1A5DE526236D9E1BCE24941CF8ED8884289E"
        height: UInt64 {lower: 326922, higher: 0}
        id: "626270069F1D5202A10AE93E"
        index: 0
        merkleComponentHash: "DE479C001E9736976BDA55E560AB1A5DE526236D9E1BCE24941CF8ED8884289E"
    type: 16724
    version: 1
```
可以看到在TransferTransaction的马赛克中转了两种类型的马赛克。您还可以在 TransactionInfo 中找到有关已批准区块的信息。

## 5.3 使用提示

### 存在证明

上一章解释了交易的存在证明。
一个账户创建的转账指令可以作为不可磨灭的记录留下，这样就可以创建一个绝对一致的账本。
由于为所有账户累积了“绝对的、不可磨灭的交易指令”，因此每个账户可以证明自己拥有的马赛克。
由于为所有账户累积了“不可磨灭的交易指令”，因此每个账户可以证明自己拥有的马赛克。
（在本文档中，拥有被定义为“有能力随意放弃的状态”。稍微离题，但“有能力随意放弃的状态”的意义在于，数字数据的所有权至少在日本尚未得到法律承认，而一旦您知道了这些数据，就无法向他人证明您已经自愿遗忘了它。区块链允许您清楚地指示放弃这些数据，但我将把详细信息留给法律专家。）

#### NFT (非同质化代币)

通过将代币总供应量限制为 1 并将 supplyMutable 设置为 false，只能发行一个代币，并且永远不会再存在。

马赛克存储有关发出马赛克的帐户地址的信息，并且该数据不能被篡改。因此，来自发出马赛克的账户的交易可以被视为元数据。

请注意，还有一种方法可以将元数据注册到 马赛克，如第 7 章所述，可以通过注册帐户和 马赛克 发布者的多重签名来更新。

创建 NFT 的方法有很多种，下面给出了一个过程示例（执行时请适当设置 nonce 和 flag 信息）。
```js
supplyMutable = false; //Availability of supply changes
//Mosaic definition
mosaicDefTx = sym.MosaicDefinitionTransaction.create(
    undefined, nonce,mosaicId,
    sym.MosaicFlags.create(supplyMutable, transferable, restrictable, revokable),
    0,//Divisibility:Divisibility
    sym.UInt64.fromUint(0), //Duration:Indefinite
    networkType
);
//Fixed mosaic quantity
mosaicChangeTx = sym.MosaicSupplyChangeTransaction.create(
    undefined,mosaicId,
    sym.MosaicSupplyChangeAction.Increase, //Increase
    sym.UInt64.fromUint(1), //Amount1
    networkType
);
//NFTdata
nftTx  = sym.TransferTransaction.create(
    undefined, //Deadline:Duration
    alice.address, 
    [],
    sym.PlainMessage.create("Hello Symbol!"), //NFTdata
    networkType
)
//Generating mosaic and aggregating NFT data and registering them in blocks.
aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    [
      mosaicDefTx.toAggregate(alice.publicAccount),
      mosaicChangeTx.toAggregate(alice.publicAccount),
      nftTx.toAggregate(alice.publicAccount)
    ],
    networkType,[],
).setMaxFeeForAggregate(100, 0);
```

马赛克信息中包含马赛克生成时的区块高度和创建账户，因此通过搜索同一区块内的交易，可以检索到与马赛克关联的NFT数据。
可以检索与同一块中的交易关联的 NFT 数据。


##### 注意事项
如果马赛克的创建者拥有全部数量，则可以更改总供应量。
如果将数据拆分成交易记录，则不可篡改，但可以追加数据。
在管理 NFT 时，请注意妥善管理，例如严格管理或丢弃马赛克创建者的私钥。


#### 可撤销的积分服务操作。

将 transferable 设置为 false 可以限制转售，使得可以定义出更不易受到结算法律或规定影响的积分。
将 revokable 设置为 true 可以启用集中管理的积分服务操作，用户无需管理私钥即可收集使用的金额。

```js
transferable = false; //Transferability to third parties
revokable = true; //Refundability from the issuer
```
