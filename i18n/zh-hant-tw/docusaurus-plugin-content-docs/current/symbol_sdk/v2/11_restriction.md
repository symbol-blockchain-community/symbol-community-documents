# 11.限制

本節介紹了有關帳戶的限制和對代幣進行全局限制的相關內容。
在本章中，我們將限制現有帳戶的權限，請創建一個新的一次性帳戶來嘗試此操作。

```js
//Generating disposable accounts Carol
carol = sym.Account.generateNewAccount(networkType);
console.log(carol.address);

//Outlet FAUCET URL
console.log(
  "https://testnet.symbol.tools/?recipient=" +
    carol.address.plain() +
    "&amount=100",
);
```

## 11.1 帳戶限制

### 指定地址以限制進出交易

```js
bob = sym.Account.generateNewAccount(networkType);

tx =
  sym.AccountRestrictionTransaction.createAddressRestrictionModificationTransaction(
    sym.Deadline.create(epochAdjustment),
    sym.AddressRestrictionFlag.BlockIncomingAddress, //Address restriction flag
    [bob.address], //Setup address
    [], //Cancellation address
    networkType,
  ).setMaxFee(100);
signedTx = carol.sign(tx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

對於 AddressRestrictionFlag(地址限制標誌) 設置如下。

```js
{1: 'AllowIncomingAddress', 16385: 'AllowOutgoingAddress', 32769: 'BlockIncomingAddress', 49153: 'BlockOutgoingAddress'}
```

除了 AllowIncomingAddress 之外，可以使用以下的標誌(AddressRestrictionFlag)：

- AllowIncomingAddress：僅允許來自特定地址的傳入交易
- AllowOutgoingAddress：只允許傳出交易到特定地址
- BlockIncomingAddress：拒絕來自指定地址的傳入交易
- BlockOutgoingAddress：禁止向特定地址發出交易

### 接收指定馬賽克的限制

```js
mosaicId = new sym.MosaicId("72C0212E67A08BCE"); //Testnet XYM
tx =
  sym.AccountRestrictionTransaction.createMosaicRestrictionModificationTransaction(
    sym.Deadline.create(epochAdjustment),
    sym.MosaicRestrictionFlag.BlockMosaic, //Mosaic restriction flag
    [mosaicId], //Setup mosaic
    [], //Cancellation mosaic
    networkType,
  ).setMaxFee(100);
signedTx = carol.sign(tx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

MosaicRestrictionFlag(馬賽克限制標誌) 設置如下。

```js
{2: 'AllowMosaic', 32770: 'BlockMosaic'}
```

- AllowMosaic：只允許接收包含指定馬賽克的交易
- BlockMosaic：拒絕包含指定馬賽克的傳入交易

沒有專門限制 馬賽克 外發交易的功能。
請注意，這與全局馬賽克限制不應混淆，該限制限制了馬賽克的行為，如下所述。

### 特定交易的限制

```js
tx =
  sym.AccountRestrictionTransaction.createOperationRestrictionModificationTransaction(
    sym.Deadline.create(epochAdjustment),
    sym.OperationRestrictionFlag.AllowOutgoingTransactionType,
    [sym.TransactionType.ACCOUNT_OPERATION_RESTRICTION], //Setup transaction
    [], //Cancellation transaction
    networkType,
  ).setMaxFee(100);
signedTx = carol.sign(tx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

OperationRestrictionFlag(操作限制標誌) 設置如下。

```js
{16388: 'AllowOutgoingTransactionType', 49156: 'BlockOutgoingTransactionType'}
```

- AllowOutgoingTransactionType：只允許特定的交易類型
- BlockOutgoingTransactionType：僅針對特定交易類型禁止

交易收據無限制功能。 可以指定的操作如下。

交易類型如下。

```js
{16705: 'AGGREGATE_COMPLETE', 16707: 'VOTING_KEY_LINK', 16708: 'ACCOUNT_METADATA', 16712: 'HASH_LOCK', 16716: 'ACCOUNT_KEY_LINK', 16717: 'MOSAIC_DEFINITION', 16718: 'NAMESPACE_REGISTRATION', 16720: 'ACCOUNT_ADDRESS_RESTRICTION', 16721: 'MOSAIC_GLOBAL_RESTRICTION', 16722: 'SECRET_LOCK', 16724: 'TRANSFER', 16725: 'MULTISIG_ACCOUNT_MODIFICATION', 16961: 'AGGREGATE_BONDED', 16963: 'VRF_KEY_LINK', 16964: 'MOSAIC_METADATA', 16972: 'NODE_KEY_LINK', 16973: 'MOSAIC_SUPPLY_CHANGE', 16974: 'ADDRESS_ALIAS', 16976: 'ACCOUNT_MOSAIC_RESTRICTION', 16977: 'MOSAIC_ADDRESS_RESTRICTION', 16978: 'SECRET_PROOF', 17220: 'NAMESPACE_METADATA', 17229: 'MOSAIC_SUPPLY_REVOCATION', 17230: 'MOSAIC_ALIAS'}
```

##### 參考資料

17232: 禁止使用ACCOUNT_OPERATION_RESTRICTION限制。
這意味著如果指定了AllowOutgoingTransactionType，就必須包括ACCOUNT_OPERATION_RESTRICTION，
而如果指定了BlockOutgoingTransactionType，就不能包括ACCOUNT_OPERATION_RESTRICTION。

### 確認

檢查有關您設置的限制的信息

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

## 11.2 馬賽克全局限制(Mosaic Global Restriction)

代幣全局限制設置了轉移代幣的條件。
為專用於馬賽克全局限制的數字元數據分配給每個帳戶。
相關馬賽克只有進出賬號都滿足條件才能發送。

首先，設置必要的資料庫。

```js
nsRepo = repo.createNamespaceRepository();
resMosaicRepo = repo.createRestrictionMosaicRepository();
mosaicResService = new sym.MosaicRestrictionTransactionService(
  resMosaicRepo,
  nsRepo,
);
```

### 創建具有全局限制的馬賽克

將 restrictable 設置為 true 以在 Carol 中創建馬賽克。

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
  networkType,
);

//Mosaic change
mosaicChangeTx = sym.MosaicSupplyChangeTransaction.create(
  undefined,
  mosaicDefTx.mosaicId,
  sym.MosaicSupplyChangeAction.Increase,
  sym.UInt64.fromUint(1000000),
  networkType,
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
    sym.MosaicRestrictionType.EQ,
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
  [],
).setMaxFeeForAggregate(100, 0);

signedTx = carol.sign(aggregateTx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

MosaicRestrictionType (代幣限制類型)如下。

```js
{0: 'NONE', 1: 'EQ', 2: 'NE', 3: 'LT', 4: 'LE', 5: 'GT', 6: 'GE'}
```

| Operator | Abbreviation | English                  |
| -------- | ------------ | ------------------------ |
| =        | EQ           | equal to                 |
| !=       | NE           | not equal to             |
| <        | LT           | less than                |
| <=       | LE           | less than or equal to    |
| >        | GT           | greater than             |
| <=       | GE           | greater than or equal to |

### 對帳戶應用馬賽克限制

將針對 Mosaic 全局限制的資格信息添加到 Carol 和 Bob。
對已經擁有的馬賽克沒有限制，因為這些限制適用於傳入和傳出交易。
為了成功傳輸，發送方和接收方都必須滿足條件。  
可以使用馬賽克創建者的私鑰對任何帳戶進行限制，無需簽名同意。

```js
//Apply to Carol
carolMosaicAddressResTx = sym.MosaicAddressRestrictionTransaction.create(
  sym.Deadline.create(epochAdjustment),
  mosaicDefTx.mosaicId, // mosaicId
  sym.KeyGenerator.generateUInt64Key("KYC"), // restrictionKey
  carol.address, // address
  sym.UInt64.fromUint(1), // newRestrictionValue
  networkType,
  sym.UInt64.fromHex("FFFFFFFFFFFFFFFF"), //previousRestrictionValue
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
  sym.UInt64.fromHex("FFFFFFFFFFFFFFFF"), //previousRestrictionValue
).setMaxFee(100);
signedTx = carol.sign(bobMosaicAddressResTx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

### 確認限制狀態檢查

查詢節點以檢查其限制狀態。

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

### 轉賬確認

通過傳輸馬賽克檢查限制狀態。

```js
//Success (Carol to Bob)
trTx = sym.TransferTransaction.create(
  sym.Deadline.create(epochAdjustment),
  bob.address,
  [new sym.Mosaic(mosaicDefTx.mosaicId, sym.UInt64.fromUint(1))],
  sym.PlainMessage.create(""),
  networkType,
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
  networkType,
).setMaxFee(100);
signedTx = carol.sign(trTx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

失敗將導致以下錯誤狀態。

```js
{"hash":"E3402FB7AE21A6A64838DDD0722420EC67E61206C148A73B0DFD7F8C098062FA","code":"Failure_RestrictionMosaic_Account_Unauthorized","deadline":"12371602742","group":"failed"}
```

## 11.3 使用提示

“賬戶限制”和“代幣全局限制”功能可用於控制Symbol賬戶和代幣的屬性。這些限制的靈活性使Symbol區塊鏈具備在實際應用場景中實現的潛力。例如，為了遵守法律法規或避免交易某個特定業務發行的代幣，可能需要限制某個代幣的轉移。賬戶也可以限制，以限制特定代幣的入賬交易或來自特定用戶的交易，從而避免垃圾郵件或惡意交易，為Symbol用戶提供額外的安全保障。

### 賬號燒毀

通過使用“AllowIncomingAddress”來限制僅從指定地址接收資金，然後將整個 XYM 餘額發送到另一個帳戶，用戶可以顯式地創建一個難以單獨操作的帳戶，即使擁有私鑰也很難。 （請注意，可以通過授權最低費用為 0 的節點進行授權。）

### 馬賽克鎖

如果發行的馬賽克設置為不可轉讓，而創建者禁止將馬賽克接收到其帳戶，那麼該馬賽克將被鎖定，無法從接收者的帳戶移動。

### 所有權證明

所有權證明已在有關馬賽克的章節中解釋。通過利用馬賽克全局限制，可以創建一種只能由那些已經通過KYC過程的帳戶擁有和流通的馬賽克，從而創建一個獨特的經濟區域，只有擁有者可以參與。
