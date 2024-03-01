---
sidebar_position: 4
---

# 4.Transaction
Updating data on the blockchain is done by announcing transactions to the network.

## 4.1 Transaction lifecycle

Below is a description of the lifecycle of a transaction:

- Transaction creation
  - Create transactions in an acceptable format for the blockchain.
- Signature
  - Sign the transaction with the account's privatekey.
- Announcement
  - Announce a signed transaction to any node on the network.
- Unconfirmed state transactions
  - Transactions accepted by a node are propagated to all nodes as unconfirmed state transactions.
    - In a case where the maximum fee set for a transaction is not enough for the minimum fee set for each node, it will not be propagated to that node.
- Confirmed transaction
  - When an unconfirmed transaction is contained in a subsequent new block (generated approximately every 30 seconds), it becomes an approved transaction.
- Rollbacks
  - Transactions that could not reach a consensus agreement between nodes are rolled back to an unconfirmed state.
    - Transactions that have expired or overflowed the cache are truncated.
- Finalise
  - Once the block is finalised by the finalisation process of the voting node, the transaction can be treated as final and data can no longer be rolled back.

### What is a block?

Blocks are generated approximately every 30 seconds and are synchronised with other nodes on a block-by-block basis with priority given to transactions that have paid higher fees.
If synchronisation fails, it is rolled back and the network repeats this process until consensus agreement is reached across all nodes.

## 4.2 Transaction creation

First of all, start with creating the most basic transfer transaction.

### Transfer transaction to Bob

Create the Bob address to send to.
```js
bob = sym.Account.generateNewAccount(networkType);
console.log(bob.address);
```
```js
> Address {address: 'TDWBA6L3CZ6VTZAZPAISL3RWM5VKMHM6J6IM3LY', networkType: 152}
```

Create transaction.
```js
tx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment), //Deadline:Expiry date
    sym.Address.createFromRawAddress("TDWBA6L3CZ6VTZAZPAISL3RWM5VKMHM6J6IM3LY"), 
    [],
    sym.PlainMessage.create("Hello Symbol!"), //Message
    networkType //Testnet/Mainnet classification
).setMaxFee(100); //Fees
```

Each setting is explained below.

#### Expiry date
2 hours is the SDK's default setting. 
A maximum of 6 hours can be specified.
```js
sym.Deadline.create(epochAdjustment,6)
```

#### Message
In a message field, up to 1023 bytes can be attached to a transaction.
Also binary data can be sent as raw data.

##### Empty message
```js
sym.EmptyMessage
```

##### Plain message
```js
sym.PlainMessage.create("Hello Symbol!")
```

##### Encrypted message
```js
sym.EncryptedMessage('294C8979156C0D941270BAC191F7C689E93371EDBC36ADD8B920CF494012A97BA2D1A3759F9A6D55D5957E9D');
```

When you use EncryptedMessage, a flag (marker) is attached to the message that means 'the specified message is encrypted'. The explorer and wallet will use the flag as a reference to hide it or not decode the message. Encryption is not made by the method itself.


##### Raw data
```js
sym.RawMessage.create(uint8Arrays[i])
```

#### Maximum fee

Although paying a small additional fee is better to ensure a transaction is successful, having some knowledge about network fees is a good idea.
The account specifies the maximum fee it is willing to pay when it creates the transaction.
On the other hand, nodes try to harvest only the transactions with the highest fees into a block at a time.
This means that if there are many other transactions that are willing to pay more, the transaction will take longer to be approved.
Conversely, if there are many other transactions that want to pay less and your maximum fee is larger, then the transaction will be processed with a fee below the maximum value you set.

The fee paid is determined by a transaction size x feeMultiplier.
If it was 176 bytes and your maxFee is set at 100, 17600µXYM = 0.0176XYM is the maximum value you allow to be paid as a fee for the transaction.
There are two ways to specify this: as feeMultiplier = 100 or as maxFee = 17600.

##### To specify as feeMultiprier = 100
```js
tx = sym.TransferTransaction.create(
  ,,,,
  networkType
).setMaxFee(100);
```

##### To specify as maxFee = 17600
```js
tx = sym.TransferTransaction.create(
  ,,,,
  networkType,
  sym.UInt64.fromUint(17600)
);
```

We will use the method of specifying feeMultiplier = 100.

## 4.3 Signature and announcement

Sign the transaction which you create with the private key and announce it to any node.

### Signature
```js
signedTx = alice.sign(tx,generationHash);
console.log(signedTx);
```
###### Sample output
```js
> SignedTransaction
    hash: "3BD00B0AF24DE70C7F1763B3FD64983C9668A370CB96258768B715B117D703C2"
    networkType: 152
    payload:        
"AE00000000000000CFC7A36C17060A937AFE1191BC7D77E33D81F3CC48DF9A0FFE892858DFC08C9911221543D687813ECE3D36836458D2569084298C09223F9899DF6ABD41028D0AD4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD20000000001985441F843000000000000879E76C702000000986F4982FE77894ABC3EBFDC16DFD4A5C2C7BC05BFD44ECE0E000000000000000048656C6C6F2053796D626F6C21"
    signerPublicKey: "D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2"
    type: 16724
```

The Account class and generationHash value are required to sign the transaction.

generationHash
- Testnet
    - 7FCCD304802016BEBBCD342A332F91FF1F3BB5E902988B352697BE245F48E836
- Mainnet
    - 57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6

The generationHash value uniquely identifies the blockchain network.
A signed transaction is created by interweaving the network's individual hash values so that they cannot be used by other networks with the same private key.


### Announcement
```js
res = await txRepo.announce(signedTx).toPromise();
console.log(res);
```
```js
> TransactionAnnounceResponse {message: 'packet 9 was pushed to the network via /transactions'}
```

As in the script above, a response will be sent: `packet n was pushed to the network`, this means that the transaction has been accepted by the node.
However, this only means that there were no anomalies in the formatting of the transaction.
In order to maximise the response speed of the node, Symbol returns the response of the received result and disconnects the connection before verifying the content of the transaction. The response value is merely the receipt of this information. If there is an error in the format, the message response will be as follows:


##### Sample output of response if announcement fails
```js
Uncaught Error: {"statusCode":409,"statusMessage":"Unknown Error","body":"{\"code\":\"InvalidArgument\",\"message\":\"payload has an invalid format\"}"}
```

## 4.4 Confirmation


### Status confirmation

Check the status of transactions accepted by the node.

```js
tsRepo = repo.createTransactionStatusRepository();
transactionStatus = await tsRepo.getTransactionStatus(signedTx.hash).toPromise();
console.log(transactionStatus);
```
###### Sample output
```js
> TransactionStatus
    group: "confirmed"
    code: "Success"
    deadline: Deadline {adjustedValue: 11989512431}
    hash: "661360E61C37E156B0BE18E52C9F3ED1022DCE846A4609D72DF9FA8A5B667747"
    height: undefined
```

When it is approved, the output shows  ` group: "confirmed"` .

If it was accepted but an error occurred, the output will show as follows. Rewrite the transaction and try announcing it again.

```js
> TransactionStatus
    group: "failed"
    code: "Failure_Core_Insufficient_Balance"
    deadline: Deadline {adjustedValue: 11990156766}
    hash: "A82507C6C46DF444E36AC94391EA2D0D7DD1A218948DED465A7A4F9D1B53CA0E"
    height: undefined
```

If the transaction has not been accepted, the output will show the ResourceNotFound error as follows.
```js
Uncaught Error: {"statusCode":404,"statusMessage":"Unknown Error","body":"{\"code\":\"ResourceNotFound\",\"message\":\"no resource exists with id '18AEBC9866CD1C15270F18738D577CB1BD4B2DF3EFB28F270B528E3FE583F42D'\"}"}
```

This error occurs when the maximum fee specified in the transaction is less than the minimum fee set by the node, or if a transaction that is required to be announced as an aggregate transaction is announced as a single transaction.

### Approval Confirmation

It takes around 30 seconds for a transaction to be approved for the block.

#### Check with the Explorer
Search in Explorer using the hash value that can be retrieved with signedTx.hash.

```js
console.log(signedTx.hash);
```
```js
> "661360E61C37E156B0BE18E52C9F3ED1022DCE846A4609D72DF9FA8A5B667747"
```

- Mainnet　
  - https://symbol.fyi/transactions/661360E61C37E156B0BE18E52C9F3ED1022DCE846A4609D72DF9FA8A5B667747
- Testnet　
  - https://testnet.symbol.fyi/transactions/661360E61C37E156B0BE18E52C9F3ED1022DCE846A4609D72DF9FA8A5B667747

#### Check with the SDK

```js
txInfo = await txRepo.getTransaction(signedTx.hash,sym.TransactionGroup.Confirmed).toPromise();
console.log(txInfo);
```
###### Sample output
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
##### Note

Even when a transaction is confirmed in a block, the confirmation of the transaction still has the possibility of being revoked if a rollback occurs.
After a block has been approved, the probability of a rollback occurring decreases as the approval process proceeds for several blocks.
In addition, waiting for the finalisation block, which is carried out by voting nodes, ensures that the recorded data is certain.

##### Sample script
After announcing the transaction, it is useful to see the following script to keep track of the chain status.
```js
hash = signedTx.hash;
tsRepo = repo.createTransactionStatusRepository();
transactionStatus = await tsRepo.getTransactionStatus(hash).toPromise();
console.log(transactionStatus);
txInfo = await txRepo.getTransaction(hash,sym.TransactionGroup.Confirmed).toPromise();
console.log(txInfo);
```

## 4.5 Transaction history

Get a list of the transaction history sent and received by Alice.
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
###### Sample output
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

TransactionType is as follows.
```js
{0: 'RESERVED', 16705: 'AGGREGATE_COMPLETE', 16707: 'VOTING_KEY_LINK', 16708: 'ACCOUNT_METADATA', 16712: 'HASH_LOCK', 16716: 'ACCOUNT_KEY_LINK', 16717: 'MOSAIC_DEFINITION', 16718: 'NAMESPACE_REGISTRATION', 16720: 'ACCOUNT_ADDRESS_RESTRICTION', 16721: 'MOSAIC_GLOBAL_RESTRICTION', 16722: 'SECRET_LOCK', 16724: 'TRANSFER', 16725: 'MULTISIG_ACCOUNT_MODIFICATION', 16961: 'AGGREGATE_BONDED', 16963: 'VRF_KEY_LINK', 16964: 'MOSAIC_METADATA', 16972: 'NODE_KEY_LINK', 16973: 'MOSAIC_SUPPLY_CHANGE', 16974: 'ADDRESS_ALIAS', 16976: 'ACCOUNT_MOSAIC_RESTRICTION', 16977: 'MOSAIC_ADDRESS_RESTRICTION', 16978: 'SECRET_PROOF', 17220: 'NAMESPACE_METADATA', 17229: 'MOSAIC_SUPPLY_REVOCATION', 17230: 'MOSAIC_ALIAS', 17232: 'ACCOUNT_OPERATION_RESTRICTION'
```

MessageType is as follows.
```js
{0: 'PlainMessage', 1: 'EncryptedMessage', 254: 'PersistentHarvestingDelegationMessage', -1: 'RawMessage'}
```
## 4.6 Aggregate Transactions

Aggregate transactions can merge multiple transactions into one.
Symbol’s public network supports aggregate transactions containing up to 100 inner transactions (involving up to 25 different cosignatories).
The content covered in subsequent chapters includes functions that require an understanding of aggregate transactions.
This chapter introduces only the simplest of aggregate transactions.

### A case only the signature of the originator is required

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

First, create the transactions to be included in the aggregate transaction.
It is not necessary to specify a Deadline at this time.
When listing, add toAggregate to the generated transaction and specify the publickey of the sender account.
Note that the sender and signing accounts **do not always match**.
This is because of the possibility of scenarios such as 'Alice signing the transaction that Bob sent', which will be explained in subsequent chapters.
This is the most important concept in using transactions on the Symbol blockchain.
The transactions in this chapter are sent and signed by Alice, so the signature on the aggregate bonded transaction also specifies Alice.

## 4.7 Tips for use

### Proof of existence

The chapter on Accounts described how to sign and verify data by account.
Putting this data into a transaction that is confirmed on the blockchain makes it impossible to delete the fact that an account has proved the existence of certain data at a certain time.
It can be considered to have the same meaning as the possession between interested parties of a time-stamped electronic signature.（Legal decisions are left to experts）

The blockchain updates data such as transactions with the existence of this "indelible fact that the account has proved".
And also the blockchain can be used as proof of knowledge of a fact that nobody should have known about yet.
This section describes two patterns in which data whose existence has been proven can be put on a transaction.


#### Digital data hash value (SHA256) output method

The existence of a file can be proved by recording its digest value in the blockchain.

The calculation of the hash value using SHA256 for files in each operating system is as follows.
```sh
#Windows
certutil -hashfile WINfilepath SHA256
#Mac
shasum -a 256 MACfilepath
#Linux
sha256sum Linuxfilepath
```

#### Splitting large data

As the payload of a transaction can only contain 1023 bytes. Large data is split up and packed into the payload to make an aggregate transaction.

```js
bigdata = 'C00200000000000093B0B985101C1BDD1BC2BF30D72F35E34265B3F381ECA464733E147A4F0A6B9353547E2E08189EF37E50D271BEB5F09B81CE5816BB34A153D2268520AF630A0A0E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26000000000198414140770200000000002A769FB40000000076B455CFAE2CCDA9C282BF8556D3E9C9C0DE18B0CBE6660ACCF86EB54AC51B33B001000000000000DB000000000000000E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26000000000198544198205C1A4CE06C45B3A896B1B2360E03633B9F36BF7F22338B000000000000000066653465353435393833444430383935303645394533424446434235313637433046394232384135344536463032413837364535303734423641303337414643414233303344383841303630353343353345354235413835323835443639434132364235343233343032364244444331443133343139464435353438323930334242453038423832304100000000006800000000000000B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D000000000198444198205C1A4CE06C45B3A896B1B2360E03633B9F36BF7F2233BC089179EBBE01A81400140035383435344434373631364336433635373237396800000000000000B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D000000000198444198205C1A4CE06C45B3A896B1B2360E03633B9F36BF7F223345ECB996EDDB9BEB1400140035383435344434373631364336433635373237390000000000000000B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D5A71EBA9C924EFA146897BE6C9BB3DACEFA26A07D687AC4A83C9B03087640E2D1DDAE952E9DDBC33312E2C8D021B4CC0435852C0756B1EBD983FCE221A981D02';

let payloads = [];
for (let i = 0; i < bigdata.length / 1023; i++) {
    payloads.push(bigdata.substr(i * 1023, 1023));
}
console.log(payloads);
```
