---
sidebar_position: 7
---

# 7.Metadata

Key-Value format data can be registered for an account mosaic namespace. The maximum value of data that can be written is 1024 bytes.
We make the assumption that both mosaic, namespace and account are created by Alice in this chapter.

Before running the sample scripts in this chapter, please load the following libraries:
```js
metaRepo = repo.createMetadataRepository();
mosaicRepo = repo.createMosaicRepository();
metaService = new sym.MetadataTransactionService(metaRepo);
```
## 7.1 Register for account

Register a Key-Value for the account.

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

Registration of metadata requires a signature of the account to which it is recorded.
Even if the registration destination account and the sender account are the same, an aggregate transaction is required.

When registering metadata to different accounts, use "signTransactionWithCosignatories" to sign it.

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

In case you don't know Bob's private key, Aggregate Bonded Transactions which are explained in the chapters that follow or offline signing must be used.

## 7.2 Register to a mosaic

Register a value with the composite key of the key value/source account for the target mosaic.
The signature of the account that created the mosaic is required for registering and updating metadata.

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

## 7.3 Register for namespace

Register a Key-Value for the namespace.
The signature of the account that created the mosaic is required for registering and updating metadata.

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

## 7.4 Confirmation
Check the registered metadata.

```js
res = await metaRepo.search({
  targetAddress:alice.address,
  sourceAddress:alice.address}
).toPromise();
console.log(res);
```
###### Sample output
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
The metadataType is as follows.
```js
sym.MetadataType
{0: 'Account', 1: 'Mosaic', 2: 'Namespace'}
```

### Note
While metadata has the advantage of providing quick access to information by Key-Value, it should be noted that it needs updating.
Updating requires the signatures of the issuer account and the account to which it is registered, so it should only be used if both accounts can be trusted.


## 7.5 Tips for use

### Proof of eligibility

We described proof of ownership in the Mosaic chapter and domain linking in the Namespace chapter.
By receiving metadata issued by an account linked from a reliable domain can be used for proofing of ownership of eligibility within that domain.

#### DID (Decentralized identity)

The ecosystem is divided into issuers, owners and verifiers, e.g. students own the diplomas issued by universities, and companies verify the certificates presented by the students based on the public keys published by the universities.
There is no platform-dependent or third party-dependent information required for this verification.
By utilising metadata in this way, universities can issue metadata to accounts owned by students, and companies can verify the proof of graduation listed in the metadata with the university's public key and the student's mosaic (account) proof of ownership.
