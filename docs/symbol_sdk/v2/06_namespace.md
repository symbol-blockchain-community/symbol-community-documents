---
sidebar_position: 6
---

# 6. Namespaces

Namespaces are human-readable text strings that can be rented and linked with an address or a mosaic.
The name has a maximum length of 64 characters (the only allowed characters are `a` through `z`, `0` through `9`, `_` and `-`).

## 6.1 Fee calculation

There is a rental fee associated with registering a namespace which is separate from the network fee.
Rental fees fluctuate depending on network activity with costs increasing during busy network periods, therefore it is sensible to check fees before registering a namespace.

In the following example, the fees are calculated for a 365-day rental of a root namespace.

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

###### Sample output

```js
> rentalBlock:1051200
> rootNsRenatalFeeTotal:210240000 //Approximately 210XYM
```

The duration is specified by the number of blocks; one block is calculated as 30 seconds.
There is a minimum rental period of 30 days (maximum 1825 days).

Calculate the fee for acquiring a sub namespace.

```js
childNamespaceRentalFee = rentalFees.effectiveChildNamespaceRentalFee.compact();
console.log(childNamespaceRentalFee);
```

###### Sample output

```js
> 10000000 //10XYM
```

There is no duration limit specified for the sub namespace. It can be used for as long as the root namespace is registered.

## 6.2 Rental

Rent a root namespace.(Example:xembook)

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

Rent a sub namespace.(Example:xembook.tomato)

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

You can also create a tier 2 sub namespace, for example in this case, defining xembook.tomato.morning:

```js
subNamespaceTx = sym.NamespaceRegistrationTransaction.createSubNamespace(
    ,
    "morning",  //Subnamespace to be created
    "xembook.tomato", //Route namespace to be linked to
    ,
)
```

### Calculation of expiry date

Calculates the expiry date of the rented root namespace.

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

Retrieve information about the namespace expiry and output the date and time of the remaining number of blocks subtracted from the current block height multiplied by 30 seconds (the average block generation interval).
For testnet, the update deadline is postponed by about a day from the expiry date. And for the mainnet, this value is 30 days, please note it.

###### Sample output

```js
> Tue Mar 29 2022 18:17:06 GMT+0900 (JST)
```

## 6.3 Link

### Link to an account

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

The linked address does not have to be owned by you.

### Link to a mosaic

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

Mosaics can only be linked if it is identical to the address at which the mosaic was created.

## 6.4 Use as an UnresolvedAccount

Designate the destination as UnresolvedAccount to sign and announce the transaction without identifying the address.
Transaction is executed for an account resolved on the chain side.

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

Designate the sending mosaic as an UnresolvedMosaic to sign and announce the transaction without identifying the mosaic ID.

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

To use XYM in a namespace, specify as follows.

```js
namespaceId = new sym.NamespaceId("symbol.xym");
```

```js
> NamespaceId {fullName: 'symbol.xym', id: Id}
    fullName: "symbol.xym"
    id: Id {lower: 1106554862, higher: 3880491450}
```

Id is held internally as a number `{lower: 1106554862, higher: 3880491450}` called Uint64.

## 6.5 Reference

Refer to the namespace linked to the address.

```js
nsRepo = repo.createNamespaceRepository();

namespaceInfo = await nsRepo
  .getNamespace(new sym.NamespaceId("xembook"))
  .toPromise();
console.log(namespaceInfo);
```

###### Sample output

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

AliasType is as follows.

```js
{0: 'None', 1: 'Mosaic', 2: 'Address'}
```

NamespaceRegistrationType is as follows.

```js
{0: 'RootNamespace', 1: 'SubNamespace'}
```

Refer to the namespace linked to the mosaic.

```js
nsRepo = repo.createNamespaceRepository();

namespaceInfo = await nsRepo
  .getNamespace(new sym.NamespaceId("xembook.tomato"))
  .toPromise();
console.log(namespaceInfo);
```

###### Sample output

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

### Reverse lookup

Check all namespaces linked to the address.

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

Check all namespaces linked to the mosaic.

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

### Receipt reference

Check how the blockchain has resolved the namespace used for the transaction.

```js
receiptRepo = repo.createReceiptRepository();
state = await receiptRepo
  .searchAddressResolutionStatements({ height: 179401 })
  .toPromise();
```

###### Sample output

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

ResolutionType is as follows.

```js
{0: 'Address', 1: 'Mosaic'}
```

#### Note

As the namespace itself is rented, the link to the namespace used in past transactions may differ from the link to the current namespace.

Always refer to your receipt if you want to know which account you were linked to at the time, e.g. when referring to historical data.

## 6.6 Tips for use

### Reciprocal links with external domains

As duplicate namespaces are restricted by protocol, user can build the brand valuation of one's account on the Symbol by acquiring a namespace that is identical to an internet domain or a well-known trademark name in the real world, and by promoting recognition of the namespace from external sources like official websites, printed materials, etc.
(For legal validity, please seek expert opinion.)
Beware of hacking external domains and renewing your own Symbol namespaces duration.

#### Note on accounts acquiring a namespace

Namespaces are rented for a specified duration .
At the moment, options for acquired namespaces are only abandonment or duration extension.
In case of utilising a namespace in a system where operational transfers, etc. are considered, we recommend acquiring a namespace with a multisig account (Chapter 9).
