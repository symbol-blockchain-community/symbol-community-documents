# 11. 限制

本节介绍了有关帐户的限制和对代币进行全局限制的相关内容。
在本章中，我们将限制现有帐户的权限，请创建一个新的一次性帐户来尝试此操作。

```js
//Generating disposable accounts Carol
carol = sym.Account.generateNewAccount(networkType);
console.log(carol.address);

//Outlet FAUCET URL
console.log(
  "https://testnet.symbol.tools/?recipient=" +
    carol.address.plain() +
    "&amount=100"
);
```

## 11.1 帐户限制

### 指定地址以限制进出交易

```js
bob = sym.Account.generateNewAccount(networkType);

tx =
  sym.AccountRestrictionTransaction.createAddressRestrictionModificationTransaction(
    sym.Deadline.create(epochAdjustment),
    sym.AddressRestrictionFlag.BlockIncomingAddress, //Address restriction flag
    [bob.address], //Setup address
    [], //Cancellation address
    networkType
  ).setMaxFee(100);
signedTx = carol.sign(tx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

对于 AddressRestrictionFlag(地址限制标志) 设置如下。

```js
{1: 'AllowIncomingAddress', 16385: 'AllowOutgoingAddress', 32769: 'BlockIncomingAddress', 49153: 'BlockOutgoingAddress'}
```

除了 AllowIncomingAddress 之外，可以使用以下的标志(AddressRestrictionFlag)：

- AllowIncomingAddress：仅允许来自特定地址的传入交易
- AllowOutgoingAddress：只允许传出交易到特定地址
- BlockIncomingAddress：拒绝来自指定地址的传入交易
- BlockOutgoingAddress：禁止向特定地址发出交易

### 接收指定马赛克的限制

```js
mosaicId = new sym.MosaicId("72C0212E67A08BCE"); //Testnet XYM
tx =
  sym.AccountRestrictionTransaction.createMosaicRestrictionModificationTransaction(
    sym.Deadline.create(epochAdjustment),
    sym.MosaicRestrictionFlag.BlockMosaic, //Mosaic restriction flag
    [mosaicId], //Setup mosaic
    [], //Cancellation mosaic
    networkType
  ).setMaxFee(100);
signedTx = carol.sign(tx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

MosaicRestrictionFlag(马赛克限制标志) 设置如下。

```js
{2: 'AllowMosaic', 32770: 'BlockMosaic'}
```

- AllowMosaic：只允许接收包含指定马赛克的交易
- BlockMosaic：拒绝包含指定马赛克的传入交易

没有专门限制 马赛克 外发交易的功能。
请注意，这与全局马赛克限制不应混淆，该限制限制了马赛克的行为，如下所述。

### 特定交易的限制

```js
tx =
  sym.AccountRestrictionTransaction.createOperationRestrictionModificationTransaction(
    sym.Deadline.create(epochAdjustment),
    sym.OperationRestrictionFlag.AllowOutgoingTransactionType,
    [sym.TransactionType.ACCOUNT_OPERATION_RESTRICTION], //Setup transaction
    [], //Cancellation transaction
    networkType
  ).setMaxFee(100);
signedTx = carol.sign(tx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

OperationRestrictionFlag(操作限制标志) 设置如下。

```js
{16388: 'AllowOutgoingTransactionType', 49156: 'BlockOutgoingTransactionType'}
```

- AllowOutgoingTransactionType：只允许特定的交易类型
- BlockOutgoingTransactionType：仅针对特定交易类型禁止

交易收据无限制功能。可以指定的操作如下。

交易类型如下。

```js
{16705: 'AGGREGATE_COMPLETE', 16707: 'VOTING_KEY_LINK', 16708: 'ACCOUNT_METADATA', 16712: 'HASH_LOCK', 16716: 'ACCOUNT_KEY_LINK', 16717: 'MOSAIC_DEFINITION', 16718: 'NAMESPACE_REGISTRATION', 16720: 'ACCOUNT_ADDRESS_RESTRICTION', 16721: 'MOSAIC_GLOBAL_RESTRICTION', 16722: 'SECRET_LOCK', 16724: 'TRANSFER', 16725: 'MULTISIG_ACCOUNT_MODIFICATION', 16961: 'AGGREGATE_BONDED', 16963: 'VRF_KEY_LINK', 16964: 'MOSAIC_METADATA', 16972: 'NODE_KEY_LINK', 16973: 'MOSAIC_SUPPLY_CHANGE', 16974: 'ADDRESS_ALIAS', 16976: 'ACCOUNT_MOSAIC_RESTRICTION', 16977: 'MOSAIC_ADDRESS_RESTRICTION', 16978: 'SECRET_PROOF', 17220: 'NAMESPACE_METADATA', 17229: 'MOSAIC_SUPPLY_REVOCATION', 17230: 'MOSAIC_ALIAS'}
```

##### 参考资料

17232: 禁止使用ACCOUNT_OPERATION_RESTRICTION限制。 
这意味着如果指定了AllowOutgoingTransactionType，就必须包括ACCOUNT_OPERATION_RESTRICTION，
而如果指定了BlockOutgoingTransactionType，就不能包括ACCOUNT_OPERATION_RESTRICTION。


### 确认

检查有关您设置的限制的信息

```js
resAccountRepo = repo.createRestrictionAccountRepository();

res = await resAccountRepo.getAccountRestrictions(carol.address).toPromise();
console.log(res);
```

###### 市例演示

```js
> AccountRestrictions
    address: Address {address: 'TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ', networkType: 152}
  > restrictions: Array(2)
      0: AccountRestriction
        restrictionFlags: 32770
        values: Array(1)
          0: MosaicId
            id: Id {lower: 1360892257, higher: 309702839}
      1: AccountRestriction
        restrictionFlags: 49153
        values: Array(1)
          0: Address {address: 'TCW2ZW7LVJMS4LWUQ7W6NROASRE2G2QKSBVCIQY', networkType: 152}
```

## 11.2 马赛克全局限制(Mosaic Global Restriction)

代币全局限制设置了转移代币的条件。
为专用于马赛克全局限制的数字元数据分配给每个帐户。
相关马赛克只有进出账号都满足条件才能发送。

首先，设置必要的资料库。

```js
nsRepo = repo.createNamespaceRepository();
resMosaicRepo = repo.createRestrictionMosaicRepository();
mosaicResService = new sym.MosaicRestrictionTransactionService(
  resMosaicRepo,
  nsRepo
);
```

### 创建具有全局限制的马赛克

将 restrictable 设置为 true 以在 Carol 中创建马赛克。

```js
supplyMutable = true; //Availability of changes in supply
transferable = true; //Transferability to third parties
restrictable = true; //Availability of global restriction settings
revokable = true; //Revokability from the issuer

nonce = sym.MosaicNonce.createRandom();
mosaicDefTx = sym.MosaicDefinitionTransaction.create(
  undefined,
  nonce,
  sym.MosaicId.createFromNonce(nonce, carol.address),
  sym.MosaicFlags.create(supplyMutable, transferable, restrictable, revokable),
  0, //divisibility
  sym.UInt64.fromUint(0), //duration
  networkType
);

//Mosaic change
mosaicChangeTx = sym.MosaicSupplyChangeTransaction.create(
  undefined,
  mosaicDefTx.mosaicId,
  sym.MosaicSupplyChangeAction.Increase,
  sym.UInt64.fromUint(1000000),
  networkType
);

//Mosaic Global Restriction
key = sym.KeyGenerator.generateUInt64Key("KYC"); // restrictionKey
mosaicGlobalResTx = await mosaicResService
  .createMosaicGlobalRestrictionTransaction(
    undefined,
    networkType,
    mosaicDefTx.mosaicId,
    key,
    "1",
    sym.MosaicRestrictionType.EQ
  )
  .toPromise();

aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [
    mosaicDefTx.toAggregate(carol.publicAccount),
    mosaicChangeTx.toAggregate(carol.publicAccount),
    mosaicGlobalResTx.toAggregate(carol.publicAccount),
  ],
  networkType,
  []
).setMaxFeeForAggregate(100, 0);

signedTx = carol.sign(aggregateTx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

MosaicRestrictionType (代币限制类型)如下。

```js
{0: 'NONE', 1: 'EQ', 2: 'NE', 3: 'LT', 4: 'LE', 5: 'GT', 6: 'GE'}
```

| Operator | Abbreviation | English                     |
| ------ | ---- | ------------------------ |
| =      | EQ   | equal to                 |
| !=     | NE   | not equal to             |
| <      | LT   | less than                |
| <=     | LE   | less than or equal to    |
| >      | GT   | greater than             |
| <=     | GE   | greater than or equal to |

### 对帐户应用马赛克限制

将针对 Mosaic 全局限制的资格信息添加到 Carol 和 Bob。
对已经拥有的马赛克没有限制，因为这些限制适用于传入和传出交易。  
为了成功传输，发送方和接收方都必须满足条件。
可以使用马赛克创建者的私钥对任何帐户进行限制，无需签名同意。

```js
//Apply to Carol
carolMosaicAddressResTx = sym.MosaicAddressRestrictionTransaction.create(
  sym.Deadline.create(epochAdjustment),
  mosaicDefTx.mosaicId, // mosaicId
  sym.KeyGenerator.generateUInt64Key("KYC"), // restrictionKey
  carol.address, // address
  sym.UInt64.fromUint(1), // newRestrictionValue
  networkType,
  sym.UInt64.fromHex("FFFFFFFFFFFFFFFF") //previousRestrictionValue
).setMaxFee(100);
signedTx = carol.sign(carolMosaicAddressResTx, generationHash);
await txRepo.announce(signedTx).toPromise();

//Apply to Bob
bob = sym.Account.generateNewAccount(networkType);
bobMosaicAddressResTx = sym.MosaicAddressRestrictionTransaction.create(
  sym.Deadline.create(epochAdjustment),
  mosaicDefTx.mosaicId, // mosaicId
  sym.KeyGenerator.generateUInt64Key("KYC"), // restrictionKey
  bob.address, // address
  sym.UInt64.fromUint(1), // newRestrictionValue
  networkType,
  sym.UInt64.fromHex("FFFFFFFFFFFFFFFF") //previousRestrictionValue
).setMaxFee(100);
signedTx = carol.sign(bobMosaicAddressResTx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

### 确认限制状态检查

查询节点以检查其限制状态。

```js
res = await resMosaicRepo
  .search({ mosaicId: mosaicDefTx.mosaicId })
  .toPromise();
console.log(res);
```

###### 市例演示

```js
> data
    > 0: MosaicGlobalRestriction
      compositeHash: "68FBADBAFBD098C157D42A61A7D82E8AF730D3B8C3937B1088456432CDDB8373"
      entryType: 1
    > mosaicId: MosaicId
        id: Id {lower: 2467167064, higher: 973862467}
    > restrictions: Array(1)
        0: MosaicGlobalRestrictionItem
          key: UInt64 {lower: 2424036727, higher: 2165465980}
          restrictionType: 1
          restrictionValue: UInt64 {lower: 1, higher: 0}
    > 1: MosaicAddressRestriction
      compositeHash: "920BFD041B6D30C0799E06585EC5F3916489E2DDF47FF6C30C569B102DB39F4E"
      entryType: 0
    > mosaicId: MosaicId
        id: Id {lower: 2467167064, higher: 973862467}
    > restrictions: Array(1)
        0: MosaicAddressRestrictionItem
          key: UInt64 {lower: 2424036727, higher: 2165465980}
          restrictionValue: UInt64 {lower: 1, higher: 0}
          targetAddress: Address {address: 'TAZCST2RBXDSD3227Y4A6ZP3QHFUB2P7JQVRYEI', networkType: 152}
  > 2: MosaicAddressRestriction
  ...
```

### 转账确认

通过传输马赛克检查限制状态。

```js
//Success (Carol to Bob)
trTx = sym.TransferTransaction.create(
  sym.Deadline.create(epochAdjustment),
  bob.address,
  [new sym.Mosaic(mosaicDefTx.mosaicId, sym.UInt64.fromUint(1))],
  sym.PlainMessage.create(""),
  networkType
).setMaxFee(100);
signedTx = carol.sign(trTx, generationHash);
await txRepo.announce(signedTx).toPromise();

//Failed (Carol to Dave)
dave = sym.Account.generateNewAccount(networkType);
trTx = sym.TransferTransaction.create(
  sym.Deadline.create(epochAdjustment),
  dave.address,
  [new sym.Mosaic(mosaicDefTx.mosaicId, sym.UInt64.fromUint(1))],
  sym.PlainMessage.create(""),
  networkType
).setMaxFee(100);
signedTx = carol.sign(trTx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

失败将导致以下错误状态。

```js
{"hash":"E3402FB7AE21A6A64838DDD0722420EC67E61206C148A73B0DFD7F8C098062FA","code":"Failure_RestrictionMosaic_Account_Unauthorized","deadline":"12371602742","group":"failed"}
```

## 11.3 使用提示

“账户限制”和“代币全局限制”功能可用于控制Symbol账户和代币的属性。这些限制的灵活性使Symbol区块链具备在实际应用场景中实现的潜力。例如，为了遵守法律法规或避免交易某个特定业务发行的代币，可能需要限制某个代币的转移。账户也可以限制，以限制特定代币的入账交易或来自特定用户的交易，从而避免垃圾邮件或恶意交易，为Symbol用户提供额外的安全保障。

### 账号烧毁

通过使用“AllowIncomingAddress”来限制仅从指定地址接收资金，然后将整个 XYM 余额发送到另一个帐户，用户可以显式地创建一个难以单独操作的帐户，即使拥有私钥也很难。 （请注意，可以通过授权最低费用为 0 的节点进行授权。）

### 马赛克锁
如果发行的马赛克设置为不可转让，而创建者禁止将马赛克接收到其帐户，那么该马赛克将被锁定，无法从接收者的帐户移动。

### 所有权证明
所有权证明已在有关马赛克的章节中解释。通过利用马赛克全局限制，可以创建一种只能由那些已经通过KYC过程的帐户拥有和流通的马赛克，从而创建一个独特的经济区域，只有拥有者可以参与。
