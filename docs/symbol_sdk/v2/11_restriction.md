---
sidebar_position: 11
---

# 11. Restrictions

This section describes restrictions on accounts and global restrictions on mosaics.
In this chapter, we will restrict the permissions of existing accounts, so please create a new disposable account to try it out.

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

## 11.1 Account Restrictions

### Specify addresses to restrict incoming and outgoing transactions

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

For AddressRestrictionFlag is as follows.

```js
{1: 'AllowIncomingAddress', 16385: 'AllowOutgoingAddress', 32769: 'BlockIncomingAddress', 49153: 'BlockOutgoingAddress'}
```

In addition to AllowIncomingAddress, the following flags can be used for AddressRestrictionFlag.

- AllowIncomingAddress：Allowing incoming transactions only from specific addresses
- AllowOutgoingAddress：Permitting outgoing transactions only to specific addresses
- BlockIncomingAddress：Reject incoming transactions from designated addresses
- BlockOutgoingAddress：Prohibit outgoing transactions to specific addresses

### Restrictions on receiving designated mosaics

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

MosaicRestrictionFlag is as follows.

```js
{2: 'AllowMosaic', 32770: 'BlockMosaic'}
```

- AllowMosaic：Allowing to receive only transactions containing the specified mosaic
- BlockMosaic：Rejection of incoming transactions containing specified mosaics

There is no restriction function for mosaic outgoing transactions.
Please note that this should not to be confused with the global mosaic restriction, which restricts the behaviour of mosaics, described below.

### Restrictions on specified transactions

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

OperationRestrictionFlag is as follows.

```js
{16388: 'AllowOutgoingTransactionType', 49156: 'BlockOutgoingTransactionType'}
```

- AllowOutgoingTransactionType：Permit only for specified transaction types
- BlockOutgoingTransactionType：Prohibit only for specified transaction types

There is no restriction function for transaction receipts. The operations that can be specified are as follows.

TransactionType is as follows.

```js
{16705: 'AGGREGATE_COMPLETE', 16707: 'VOTING_KEY_LINK', 16708: 'ACCOUNT_METADATA', 16712: 'HASH_LOCK', 16716: 'ACCOUNT_KEY_LINK', 16717: 'MOSAIC_DEFINITION', 16718: 'NAMESPACE_REGISTRATION', 16720: 'ACCOUNT_ADDRESS_RESTRICTION', 16721: 'MOSAIC_GLOBAL_RESTRICTION', 16722: 'SECRET_LOCK', 16724: 'TRANSFER', 16725: 'MULTISIG_ACCOUNT_MODIFICATION', 16961: 'AGGREGATE_BONDED', 16963: 'VRF_KEY_LINK', 16964: 'MOSAIC_METADATA', 16972: 'NODE_KEY_LINK', 16973: 'MOSAIC_SUPPLY_CHANGE', 16974: 'ADDRESS_ALIAS', 16976: 'ACCOUNT_MOSAIC_RESTRICTION', 16977: 'MOSAIC_ADDRESS_RESTRICTION', 16978: 'SECRET_PROOF', 17220: 'NAMESPACE_METADATA', 17229: 'MOSAIC_SUPPLY_REVOCATION', 17230: 'MOSAIC_ALIAS'}
```

##### Note

17232: `ACCOUNT_OPERATION_RESTRICTION` restriction is not permitted.
This means that if AllowOutgoingTransactionType is specified, ACCOUNT_OPERATION_RESTRICTION must be included, and
If BlockOutgoingTransactionType is specified, ACCOUNT_OPERATION_RESTRICTION cannot be included.


### Confirmation

Check the information on the restrictions that you have set

```js
resAccountRepo = repo.createRestrictionAccountRepository();

res = await resAccountRepo.getAccountRestrictions(carol.address).toPromise();
console.log(res);
```

###### Sample output

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

## 11.2 Mosaic Global Restriction

Mosaic Global Restriction sets the conditions under which mosaics can be transferred.  
Assigning to each account for numeric metadata dedicated to the mosaic global restriction.  
The relevant mosaic can only be sent if both the incoming and outgoing accounts meet the conditions.

Firstly, setting up the necessary libraries.

```js
nsRepo = repo.createNamespaceRepository();
resMosaicRepo = repo.createRestrictionMosaicRepository();
mosaicResService = new sym.MosaicRestrictionTransactionService(
  resMosaicRepo,
  nsRepo
);
```

### Creating mosaics with global restrictions

Set restrictable to true to create a mosaic in Carol.

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

MosaicRestrictionType is as follows.

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

### Applying mosaic restrictions to accounts

Add eligibility information against the Mosaic Global Restriction to Carol and Bob.  
There are no restrictions on mosaics already owned, as these restrictions apply to incoming and outgoing transactions.  
For a successful transfer, both sender and receiver must fulfil the conditions.  
Restrictions can be placed on any account with the private key of the mosaic creator without requiring a signature of consent.

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

### Confirmation of restriction status check

Query the node to check its restriction status.

```js
res = await resMosaicRepo
  .search({ mosaicId: mosaicDefTx.mosaicId })
  .toPromise();
console.log(res);
```

###### Sample output

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

### Confirmation of transfer

Check the restriction status by transferring the mosaic.

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

Failure will result in the following error status.

```js
{"hash":"E3402FB7AE21A6A64838DDD0722420EC67E61206C148A73B0DFD7F8C098062FA","code":"Failure_RestrictionMosaic_Account_Unauthorized","deadline":"12371602742","group":"failed"}
```

## 11.3 Tips for use

"Account restriction" and "Mosaic Global Restriction" features can be used to control the properties of Symbol accounts and mosaics. The flexibility of restrictions has the potential to fulfil practical use cases of the Symbol blockchain in real-world situations. For example, it could be necessary to place limitations on the transfer of a specific mosaic to comply with laws and regulations or to avoid specific tokens issued by a business from being traded. Accounts can also be limited to restrict incoming transactions of certain mosaics or from specific users to avoid spam or malicious transactions providing additional safety to Symbol users.

### Account burn

Using "AllowIncomingAddress" to limit funds being received only from a specified address and then sending the entire XYM balance to another account a user can explicitly create an account that is difficult to operate on its own, even with the  private key. (Note, it is possibly to be authorised by a node whose minimum fee is 0.)

### Mosaic lock
A mosaic can be issued with non-transferable settings, if the account creator prohibits the mosaic from being received by their account then the mosaic is locked and cannot be moved from the recipient's account.

### Proof of membership
Proof of ownership was explained in the chapter on mosaics. By utilising the mosaic global restriction, it is possible to create a mosaic that can only be owned and circulated between accounts that have for instance, gone through a KYC process, creating a unique economic zone to which only the owner can belong.
