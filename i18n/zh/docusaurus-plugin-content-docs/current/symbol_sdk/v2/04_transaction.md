# 4.交易
在区块链上更新数据是通过向网络宣布交易来完成的。

## 4.1 交易生命周期

以下是交易的生命周期描述：

- 交易创建
  - 以区块链可接受的格式创建交易。
- 签名
  - 使用帐户的私钥签署交易。
- 宣告
  - 向网络上的任何节点宣布已签名的交易。
- 未确认状态交易
  - 节点接受的交易作为未确认状态交易传播到所有节点。
    - 如果为交易设置的最高费用不足以满足为每个节点设置的最低费用，则不会将其传播到该节点。
- 确认交易
  - 当一个未确认的交易包含在后续的新区块中（大约每 30 秒生成一次），它就成为一个已批准的交易。
- 回滚
  - 节点间无法达成共识的交易回滚到未确认状态。
    - 已过期或已超出缓存的交易将被截断。
- 完成
  - 一旦区块被投票节点的终结过程终结，交易就可以被视为最终交易，数据不能再回滚。

### 什么是块?

块大约每 30 秒生成一次，并逐块与其他节点同步，优先考虑支付较高费用的交易。
如果同步失败，则回滚，网络重复此过程，直到所有节点达成共识。

## 4.2 交易创建

首先，从创建最基本的转账交易开始。

### 将交易转移给Bob

创建要发送到的 Bob 地址。
```js
bob = sym.Account.generateNewAccount(networkType);
console.log(bob.address);
```
```js
> Address {address: 'TDWBA6L3CZ6VTZAZPAISL3RWM5VKMHM6J6IM3LY', networkType: 152}
```

创建交易。
```js
tx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment), //Deadline:Expiry date
    sym.Address.createFromRawAddress("TDWBA6L3CZ6VTZAZPAISL3RWM5VKMHM6J6IM3LY"), 
    [],
    sym.PlainMessage.create("Hello Symbol!"), //Message
    networkType //Testnet/Mainnet classification
).setMaxFee(100); //Fees
```

每个设置解释如下。

#### 到期日
2 小时是 SDK 的默认设置。
最多可以指定 6 小时。
```js
sym.Deadline.create(epochAdjustment,6)
```

#### 信息
在信息字段中，最多可以将 1023 个字节附加到交易。
二进制数据也可以作为原始数据发送。

##### 空消息
```js
sym.EmptyMessage
```

##### 纯信息
```js
sym.PlainMessage.create("Hello Symbol!")
```

##### 加密信息
```js
sym.EncryptedMessage('294C8979156C0D941270BAC191F7C689E93371EDBC36ADD8B920CF494012A97BA2D1A3759F9A6D55D5957E9D');
```

当您使用加密消息时，会附加一个标志（标记）到消息上，表示“指定的消息已加密”。探索器和钱包将使用该标志作为参考，以隐藏它或不解密该消息。加密本身不是由该方法实现的。


##### 原始数据
```js
sym.RawMessage.create(uint8Arrays[i])
```

#### 最高费用

尽管支付少量额外费用可以更好地确保交易成功，但对网络费用有一些了解也是一个好主意。
该账户指定了它在创建交易时愿意支付的最高费用。
另一方面，节点尝试一次只将费用最高的交易收割到一个区块中。
这意味着，如果有许多其他交易愿意支付更多费用，则该交易将需要更长的时间才能获得批准。
反之，如果有很多其他交易想要少付，而你的最高手续费较大，那么交易将以低于你设置的最高金额的手续费进行处理。

支付的费用由交易规模 x 费用乘数决定。
如果它是 176 字节并且您的 maxFee 设置为 100，则 17600µXYM = 0.0176XYM 是您允许作为交易费用支付的最大值。
有两种指定方式：feeMultiplier = 100 或 maxFee = 17600。

##### 指定费用乘数为100
```js
tx = sym.TransferTransaction.create(
  ,,,,
  networkType
).setMaxFee(100);
```

##### 指定为最大费用 = 17600
```js
tx = sym.TransferTransaction.create(
  ,,,,
  networkType,
  sym.UInt64.fromUint(17600)
);
```

我们将使用指定费用乘数为100的方法。

## 4.3 签名和广播

使用私钥签署您创建的交易并将其公布给任何节点。

### 签名
```js
signedTx = alice.sign(tx,generationHash);
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

需要使用帐户和生成的哈希值对交易进行签名。

生成哈希
- 测试网
    - 7FCCD304802016BEBBCD342A332F91FF1F3BB5E902988B352697BE245F48E836
- 主网
    - 57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6

生成的哈希值唯一标识区块链网络。
通过交织网络的各个哈希值来创建已签署的交易，以便它们不能使用相同的私钥在其他网络中使用。


### 广播
```js
res = await txRepo.announce(signedTx).toPromise();
console.log(res);
```
```js
> TransactionAnnounceResponse {message: 'packet 9 was pushed to the network via /transactions'}
```

就像上面的脚本一样，将发送一个回应：“封包n已推送到网络”，这意味着该交易已被节点接受。
然而，这仅仅意味着交易的格式没有异常。
为了最大化节点的响应速度，Symbol会在验证交易内容之前返回接收到的结果并断开连接。回应值仅仅是此信息的收据。如果格式出现错误，则消息回应如下：


##### 如果广播失败，回应的样本输出如下：
```js
Uncaught Error: {"statusCode":409,"statusMessage":"Unknown Error","body":"{\"code\":\"InvalidArgument\",\"message\":\"payload has an invalid format\"}"}
```

## 4.4 确认


### 状态确认

检查节点接受的交易状态。

```js
tsRepo = repo.createTransactionStatusRepository();
transactionStatus = await tsRepo.getTransactionStatus(signedTx.hash).toPromise();
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

当被确认时，输出会显示 group: "confirmed"。

如果接受但发生错误，输出将显示如下。重写交易并尝试再次广播它。

```js
> TransactionStatus
    group: "failed"
    code: "Failure_Core_Insufficient_Balance"
    deadline: Deadline {adjustedValue: 11990156766}
    hash: "A82507C6C46DF444E36AC94391EA2D0D7DD1A218948DED465A7A4F9D1B53CA0E"
    height: undefined
```

如果该交易未被接受，则输出将显示以下的ResourceNotFound错误。
```js
Uncaught Error: {"statusCode":404,"statusMessage":"Unknown Error","body":"{\"code\":\"ResourceNotFound\",\"message\":\"no resource exists with id '18AEBC9866CD1C15270F18738D577CB1BD4B2DF3EFB28F270B528E3FE583F42D'\"}"}
```

当交易中指定的最高手续费小于节点设置的最低手续费时，或者需要公告为聚合交易的交易被公告为单笔交易时，就会出现该错误。

### 批准确认

批准该块的交易大约需要 30 秒。

#### 通过探索器进行检查。
使用可以通过signedTx.hash检索的哈希值在探索器中搜索。

```js
console.log(signedTx.hash);
```
```js
> "661360E61C37E156B0BE18E52C9F3ED1022DCE846A4609D72DF9FA8A5B667747"
```

- 主网
  - https://symbol.fyi/transactions/661360E61C37E156B0BE18E52C9F3ED1022DCE846A4609D72DF9FA8A5B667747
- 测试网
  - https://testnet.symbol.fyi/transactions/661360E61C37E156B0BE18E52C9F3ED1022DCE846A4609D72DF9FA8A5B667747

#### 检查SDK

```js
txInfo = await txRepo.getTransaction(signedTx.hash,sym.TransactionGroup.Confirmed).toPromise();
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
##### 注意事项

即使在区块中确认了一笔交易，如果发生回滚，该交易的确认仍有可能被撤销。
在一个块被批准后，随着批准过程对几个块的进行，发生回滚的可能性会降低。
此外，等待由投票节点执行的敲定区块，确保记录的数据是确定的。

##### 示例脚本
在广播交易之后，查看以下脚本以跟踪链的状态非常有用。
```js
hash = signedTx.hash;
tsRepo = repo.createTransactionStatusRepository();
transactionStatus = await tsRepo.getTransactionStatus(hash).toPromise();
console.log(transactionStatus);
txInfo = await txRepo.getTransaction(hash,sym.TransactionGroup.Confirmed).toPromise();
console.log(txInfo);
```

## 4.5 交易纪录

获取 Alice 发送和接收的交易历史列表。
```js
result = await txRepo.search(
  {
    group:sym.TransactionGroup.Confirmed,
    embedded:true,
    address:alice.address
  }
).toPromise();

txes = result.data;
txes.forEach(tx => {
  console.log(tx);
})
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

交易类型如下。
```js
{0: 'RESERVED', 16705: 'AGGREGATE_COMPLETE', 16707: 'VOTING_KEY_LINK', 16708: 'ACCOUNT_METADATA', 16712: 'HASH_LOCK', 16716: 'ACCOUNT_KEY_LINK', 16717: 'MOSAIC_DEFINITION', 16718: 'NAMESPACE_REGISTRATION', 16720: 'ACCOUNT_ADDRESS_RESTRICTION', 16721: 'MOSAIC_GLOBAL_RESTRICTION', 16722: 'SECRET_LOCK', 16724: 'TRANSFER', 16725: 'MULTISIG_ACCOUNT_MODIFICATION', 16961: 'AGGREGATE_BONDED', 16963: 'VRF_KEY_LINK', 16964: 'MOSAIC_METADATA', 16972: 'NODE_KEY_LINK', 16973: 'MOSAIC_SUPPLY_CHANGE', 16974: 'ADDRESS_ALIAS', 16976: 'ACCOUNT_MOSAIC_RESTRICTION', 16977: 'MOSAIC_ADDRESS_RESTRICTION', 16978: 'SECRET_PROOF', 17220: 'NAMESPACE_METADATA', 17229: 'MOSAIC_SUPPLY_REVOCATION', 17230: 'MOSAIC_ALIAS', 17232: 'ACCOUNT_OPERATION_RESTRICTION'
```

消息类型如下。
```js
{0: 'PlainMessage', 1: 'EncryptedMessage', 254: 'PersistentHarvestingDelegationMessage', -1: 'RawMessage'}
```
## 4.6 聚合交易

聚合事务可以将多个事务合并为一个。
Symbol 的公共网络支持包含多达 100 个内部交易（涉及多达 25 个不同的联署人）的聚合交易。
后续章节涵盖的内容包括需要了解聚合事务的函数。
本章只介绍最简单的聚合事务。

### 一个案例只需要发起人的签名

```js
bob = sym.Account.generateNewAccount(networkType);
carol = sym.Account.generateNewAccount(networkType);

innerTx1 = sym.TransferTransaction.create(
    undefined, //Deadline
    bob.address,  //Destination of the transaction
    [],
    sym.PlainMessage.create("tx1"),
    networkType
);

innerTx2 = sym.TransferTransaction.create(
    undefined, //Deadline
    carol.address,  //Destination of the transaction
    [],
    sym.PlainMessage.create("tx2"),
    networkType
);

aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    [
      innerTx1.toAggregate(alice.publicAccount), //Publickey of the sender account
      innerTx2.toAggregate(alice.publicAccount)  //Publickey of the sender account
    ],
    networkType,
    [],
    sym.UInt64.fromUint(1000000)
);
signedTx = alice.sign(aggregateTx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

首先，创建要包含在聚合交易中的交易。
目前没有必要指定截止日期。
列举时，将生成的交易添加到聚合中，并指定发送方帐户的公钥。
请注意，发送方和签名帐户不总是匹配的。
这是因为可能会出现“Alice 签署 Bob 发送的交易”等场景，这将在后续章节中进行解释。
这是在 Symbol 区块链上使用交易的最重要概念。
本章中的交易由Alice发送和签署，因此聚合绑定交易上的签名也指定了Alice。

## 4.7 使用提示

### 存在证明

「帐户」章节介绍了如何使用帐户对数据进行签署和验证。
将这些数据放入在区块链上得到确认的交易中，就不可能删除一个帐户证明某些数据在某个时间存在的事实。
可以认为它具有与有关方拥有时间戳电子签名相同的含义。 （法律决策由专家决定）

区块链以这种“账户已经证明的不可磨灭的事实”的存在来更新交易等数据。
区块链也可以用作证明某个事实的知识证明，而这个事实此时还没有被任何人知道。
本节描述了两种模式，其中已经证明存在的数据可以放在交易中。


#### 数字数据哈希值（SHA256）输出方式

文件的存在可以通过在区块链中记录其摘要值来证明。

各操作系统中文件使用SHA256计算哈希值的方法如下。
```sh
#Windows
certutil -hashfile WINfilepath SHA256
#Mac
shasum -a 256 MACfilepath
#Linux
sha256sum Linuxfilepath
```

#### 拆分大数据

由于交易的有效载荷只能包含 1023 个字节。大数据被拆分并打包到有效负载中以进行聚合交易。

```js
bigdata = 'C00200000000000093B0B985101C1BDD1BC2BF30D72F35E34265B3F381ECA464733E147A4F0A6B9353547E2E08189EF37E50D271BEB5F09B81CE5816BB34A153D2268520AF630A0A0E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26000000000198414140770200000000002A769FB40000000076B455CFAE2CCDA9C282BF8556D3E9C9C0DE18B0CBE6660ACCF86EB54AC51B33B001000000000000DB000000000000000E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26000000000198544198205C1A4CE06C45B3A896B1B2360E03633B9F36BF7F22338B000000000000000066653465353435393833444430383935303645394533424446434235313637433046394232384135344536463032413837364535303734423641303337414643414233303344383841303630353343353345354235413835323835443639434132364235343233343032364244444331443133343139464435353438323930334242453038423832304100000000006800000000000000B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D000000000198444198205C1A4CE06C45B3A896B1B2360E03633B9F36BF7F2233BC089179EBBE01A81400140035383435344434373631364336433635373237396800000000000000B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D000000000198444198205C1A4CE06C45B3A896B1B2360E03633B9F36BF7F223345ECB996EDDB9BEB1400140035383435344434373631364336433635373237390000000000000000B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D5A71EBA9C924EFA146897BE6C9BB3DACEFA26A07D687AC4A83C9B03087640E2D1DDAE952E9DDBC33312E2C8D021B4CC0435852C0756B1EBD983FCE221A981D02';

let payloads = [];
for (let i = 0; i < bigdata.length / 1023; i++) {
    payloads.push(bigdata.substr(i * 1023, 1023));
}
console.log(payloads);
```
