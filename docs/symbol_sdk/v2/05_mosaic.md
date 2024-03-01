---
sidebar_position: 5
---

# 5. Mosaics

This chapter describes the Mosaic settings and how they are generated.
In Symbol, a token is called as a Mosaic.

> According to Wikipedia, Tokens are 'objects of various shapes made of clay with a diameter of around 1 cm, excavated from Mesopotamian strata from around 8000 BC to 3000 BC'. On the other hand, mosaic,  is "a technique of decorative art in which small pieces are assembled and embedded to form a picture (image) or pattern. Stone, ceramics (mosaic tiles), coloured and colourless glass, shells and wood are used to decorate the floors and walls of buildings or crafts.".
In Symbol, mosaics can be thought of as the various components that represent aspects of the ecosystem created by the Symbol blockchain.

## 5.1 Mosaic generation

For mosaic generation, define the mosaic to be created.
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

MosaicFlags are as follows.

```js
MosaicFlags {
  supplyMutable: false, transferable: false, restrictable: false, revokable: false
}
```
Permissions of supply changes, transferability to third parties, application of Mosaic Global Restrictions and revocability from the issuer can be specified.
Once set these properties cannot be changed at a later date.

#### Divisibility

Divisibility determines to what number of decimal places the quantity can be measured. Data is held as integer values.

divisibility:0 = 1  
divisibility:1 = 1.0  
divisibility:2 = 1.00  

#### Duration

If specified as 0, it cannot be subdivided into smaller units.
If a mosaic expiry date is set, the data will not disappear after the expiry date.
Please note that you can own up to 1,000 mosaics per account.


Next, change the quantity.
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
If supplyMutable:false, the quantity can only be changed if the entire supply of the mosaic is in the issuers account.
If divisibility > 0, define it as an integer value with the smallest unit being 1.
（Specify divisibility:2 if you want to value 100 units as 1.00）

MosaicSupplyChangeAction is as follows.
```js
{0: 'Decrease', 1: 'Increase'}
```
Specify Increase if you want to increase it.
Merge two transactions above into an aggregate transaction.

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

Note that a feature of the aggregate transaction is that it attempts to change the quantity of a mosaic that does not yet exist.
When arrayed, if there are no inconsistencies, they can be handled without problems within a single block.


### Confirmation
Confirm the mosaic information held by the account which created the mosaic.

```js
mosaicRepo = repo.createMosaicRepository();
accountInfo.mosaics.forEach(async mosaic => {
  mosaicInfo = await mosaicRepo.getMosaic(mosaic.id).toPromise();
  console.log(mosaicInfo);
});
```
###### Sample output
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

## 5.2 Mosaic transfer

Transfer the created mosaic.
Those new to blockchain often imagine mosaic transferring as "sending a mosaic stored on a client terminal to another client terminal", but mosaic information is always shared and synchronised across all nodes, and it is not about transferring mosaic information to the destination. 
More precisely, it refers to the operation of recombining token balances between accounts by 'sending transactions' to the blockchain.

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



##### Transfer a list of mosaics

Multiple mosaics can be transferred in a single transaction.
To transfer XYM, specify the following mosaic ID.

- Mainnet：6BED913FA20223F8
- Testnet：3A8416DB2D53B6C8

#### Amount
All decimal points are also specified as integers.
XYM is divisibility 6, so it is specified as 1XYM=1000000.

### Confirmation of transaction

```js
txInfo = await txRepo.getTransaction(signedTx.hash,sym.TransactionGroup.Confirmed).toPromise();
console.log(txInfo); 
```
###### Sample output
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
It can be seen that two types of mosaics have been transferred in the Mosaic of the TransferTransaction. You can also find information on the approved blocks in the TransactionInfo.

## 5.3 Tips for use

### Proof of existence

Proof of existence by transaction was explained in the previous chapter.
The transferring instructions created by an account can be left as an indelible record, so that a ledger can be created that is absolutely consistent.
As a result of the accumulation of 'absolute, indelible transaction instructions' for all accounts, each account can prove its own mosaic ownership.
As a result of the accumulation of 'indelible transaction instructions' for all accounts, each account can prove its own mosaic ownership.
(In this document, possession is defined as "the state of being able to give it up at will". Slightly off topic, but the meaning of 'state of being able to give it up at will' may make sense if you look at the fact that ownership is not legally recognised for digital data, at least in Japan yet, and that once you know the data, you cannot prove to others that you have forgotten it of your own will. The blockchain allows you to clearly indicate the relinquishment of that data, but I'll leave the details to the legal experts.)

#### NFT (non fungible token)

By limiting the number of tokens total supply to 1 and setting supplyMutable to false, only one token can be issued and no more can ever exist.

Mosaics store information about the account address that issued the mosaic and this data cannot be tampered with. Therefore, transactions from the account that issued the mosaic can be treated as metadata.

Note that there is also a way to register metadata to the mosaic, described in Chapter 7, which can be updated by the multi signature of the registered account and the mosaic issuer.

There are many ways to create NFTs, an example of the process is given below (please set the nonce and flag information appropriately for execution).
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

The block height and creation account at the time of mosaic generation are included in the mosaic information, so by searching for transactions in the same block, the NFT data associated with the mosaic can be retrieved.
The NFT data associated with the transactions in the same block can be retrieved.


##### Note
In case that the creator of the mosaic owns the entire quantity, the total supply can be changed.
If the data is split into transactions and recorded, it cannot be tampered with, but data can be appended.
When managing an NFT, please take care to manage it appropriately, for example by strictly managing or discarding the mosaic creator's private key.


#### Revocable point service operations.

Setting transferable to false restricts resale, making it possible to define points that are less susceptible to the act on settlement laws or regulations.
Setting revokable to true enables centrally managed point service operations where the user does not need to manage the private key to collect the amount used.

```js
transferable = false; //Transferability to third parties
revokable = true; //Refundability from the issuer
```
