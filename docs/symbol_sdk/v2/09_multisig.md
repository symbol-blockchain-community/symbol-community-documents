---
sidebar_position: 9
---

# 9. Multisignature
Symbol accounts can be converted to multisig.


### Points

Multisig accounts can have up to 25 co-signatories. An account can be cosigner of up to 25 multisig accounts. Multisig accounts can be hierarchical and composed of up to 3 levels. This chapter explains single-level multisig.

## 9.0 Preparing an account
Create the accounts used in the sample source code in this chapter and output each secret key.
Note that the Bob multisig account in this chapter will be unusable if Carol's secret key is lost.


```js
bob = sym.Account.generateNewAccount(networkType);
carol1 = sym.Account.generateNewAccount(networkType);
carol2 = sym.Account.generateNewAccount(networkType);
carol3 = sym.Account.generateNewAccount(networkType);
carol4 = sym.Account.generateNewAccount(networkType);
carol5 = sym.Account.generateNewAccount(networkType);
console.log(bob.privateKey);
console.log(carol1.privateKey);
console.log(carol2.privateKey);
console.log(carol3.privateKey);
console.log(carol4.privateKey);
console.log(carol5.privateKey);
```

When using a testnet, the equivalent of the network fee from the faucet should be available in the bob and carol1 accounts.

- Faucet
    - https://testnet.symbol.tools/

##### Output URL

```js
console.log("https://testnet.symbol.tools/?recipient=" + bob.address.plain() +"&amount=20");
console.log("https://testnet.symbol.tools/?recipient=" + carol1.address.plain() +"&amount=20");
```

## 9.1 Multisig registration

Symbol does not need to create a new account when setting up a multisig. Instead co-signatories can be specified for an existing account.
Creating a multisig account requires the consent signature (opt-in) of the account designated as the co-signatory. Aggregate Transactions are used to confirm this.

```js
multisigTx = sym.MultisigAccountModificationTransaction.create(
    undefined, 
    3, //minApproval:Minimum number of signatories required for approval
    3, //minRemoval:Minimum number of signatories required for expulsion
    [
        carol1.address,carol2.address,carol3.address,carol4.address
    ], //Additional target address list
    [],//Reemoved address list
    networkType
);
aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    [//The public key of the multisig account
      multisigTx.toAggregate(bob.publicAccount),
    ],
    networkType,[]
).setMaxFeeForAggregate(100, 4); //Number of co-signatories to the second argument:4
signedTx =  aggregateTx.signTransactionWithCosignatories(
    bob, //Multisig account
    [carol1,carol2,carol3,carol4], //Accounts specified as being added or removed
    generationHash,
);
await txRepo.announce(signedTx).toPromise();
```

## 9.2 Confirmation

### Confirmation of multisig account
```js
msigRepo = repo.createMultisigRepository();
multisigInfo = await msigRepo.getMultisigAccountInfo(bob.address).toPromise();
console.log(multisigInfo);
```
###### Sample output
```js
> MultisigAccountInfo 
    accountAddress: Address {address: 'TCOMA5VG67TZH4X55HGZOXOFP7S232CYEQMOS7Q', networkType: 152}
  > cosignatoryAddresses: Array(4)
        0: Address {address: 'TBAFGZOCB7OHZCCYYV64F2IFZL7SOOXNDHFS5NY', networkType: 152}
        1: Address {address: 'TB3XP4GQK6XH2SSA2E2U6UWCESNACK566DS4COY', networkType: 152}
        2: Address {address: 'TCV67BMTD2JMDQOJUDQHBFJHQPG4DAKVKST3YJI', networkType: 152}
	3: Address {address: 'TDWGG6ZWCGS5AHFTF5FDB347HIMII57PK46AIDA', networkType: 152}
    minApproval: 3
    minRemoval: 3
    multisigAddresses: []
```

It shows that cosignatoryAddresses are registered as co-signatories. Also, minApproval:3 shows that the number of signatures required for a transaction to execute is 3. minRemoval: 3 shows that the number of signatories required to remove a cosignatory is 3.


### Confirmation of co-signatory accounts
```js
msigRepo = repo.createMultisigRepository();
multisigInfo = await msigRepo.getMultisigAccountInfo(carol1.address).toPromise();
console.log(multisigInfo);
```
###### Sample output
```
> MultisigAccountInfo
    accountAddress: Address {address: 'TCV67BMTD2JMDQOJUDQHBFJHQPG4DAKVKST3YJI', networkType: 152}
    cosignatoryAddresses: []
    minApproval: 0
    minRemoval: 0
  > multisigAddresses: Array(1)
        0: Address {address: 'TCOMA5VG67TZH4X55HGZOXOFP7S232CYEQMOS7Q', networkType: 152}
```

It shows that the account is a cosignatory of the multisigAddresses.

## 9.3 Multisig signature

Send mosaics from a multisig account.

### Transfer with an Aggregate Complete Transaction

In the case of Aggregate Complete Transaction, the transaction is created after collecting all the signatures of the cosignatories before announcing it to the nodes.

```js
tx = sym.TransferTransaction.create(
    undefined,
    alice.address, 
    [new sym.Mosaic(new sym.NamespaceId("symbol.xym"),sym.UInt64.fromUint(1000000))],
    sym.PlainMessage.create('test'),
    networkType
);
aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
     [//The public key of the multisig account
       tx.toAggregate(bob.publicAccount)
     ],
    networkType,[],
).setMaxFeeForAggregate(100, 2); //Number of co-signatories to the second argument:2
signedTx =  aggregateTx.signTransactionWithCosignatories(
    carol1, //Transaction creator
    [carol2,carol3],　//Cosignatories
    generationHash,
);
await txRepo.announce(signedTx).toPromise();
```

### Transfer with an Aggregate Bonded Transaction

Aggregate bonded transactions can be announced without specifying co-signatories. It is completed by declaring that the transaction will be pre-stored with a hash lock, and the co-signer additionally signs the transaction once it has been stored on the network.

```js
tx = sym.TransferTransaction.create(
    undefined,
    alice.address, //Transfer to Alice
    [new sym.Mosaic(new sym.NamespaceId("symbol.xym"),sym.UInt64.fromUint(1000000))], //1XYM
    sym.PlainMessage.create('test'),
    networkType
);
aggregateTx = sym.AggregateTransaction.createBonded(
    sym.Deadline.create(epochAdjustment),
     [ //The public key of the multisig account
       tx.toAggregate(bob.publicAccount)
     ],
    networkType,[],
).setMaxFeeForAggregate(100, 0); //Number of co-signatories to the second argument:0
signedAggregateTx = carol1.sign(aggregateTx, generationHash);
hashLockTx = sym.HashLockTransaction.create(
  sym.Deadline.create(epochAdjustment),
	new sym.Mosaic(new sym.NamespaceId("symbol.xym"),sym.UInt64.fromUint(10 * 1000000)), //Fixed value:10XYM
	sym.UInt64.fromUint(480),
	signedAggregateTx,
	networkType
).setMaxFee(100);
signedLockTx = carol1.sign(hashLockTx, generationHash);
//Announce Hashlock TX
await txRepo.announce(signedLockTx).toPromise();
```

```js
//Announces bonded TX after confirming approval of hashlocks
await txRepo.announceAggregateBonded(signedAggregateTx).toPromise();
```
When a bonded transaction is known by a node, it will be a partial signature state and will be signed with a multisig account, using the co-signature introduced in chapter 8. Locking. It can also be confirmed by a wallet that supports co-signatures.


## 9.4 Confirmation of multisig transfer

Check the results of a multisig transfer transaction.

```js
txInfo = await txRepo.getTransaction(signedTx.hash,sym.TransactionGroup.Confirmed).toPromise();
console.log(txInfo);
```
###### Sample output
```js
> AggregateTransaction
  > cosignatures: Array(2)
        0: AggregateTransactionCosignature
            signature: "554F3C7017C32FD4FE67C1E5E35DD21D395D44742B43BD1EF99BC8E9576845CDC087B923C69DB2D86680279253F2C8A450F97CC7D3BCD6E86FE4E70135D44B06"
            signer: PublicAccount
                address: Address {address: 'TB3XP4GQK6XH2SSA2E2U6UWCESNACK566DS4COY', networkType: 152}
                publicKey: "A1BA266B56B21DC997D637BCC539CCFFA563ABCB34EAA52CF90005429F5CB39C"
        1: AggregateTransactionCosignature
            signature: "AD753E23D3D3A4150092C13A410D5AB373B871CA74D1A723798332D70AD4598EC656F580CB281DB3EB5B9A7A1826BAAA6E060EEA3CC5F93644136E9B52006C05"
            signer: PublicAccount
                address: Address {address: 'TBAFGZOCB7OHZCCYYV64F2IFZL7SOOXNDHFS5NY', networkType: 152}
                publicKey: "B00721EDD76B24E3DDCA13555F86FC4BDA89D413625465B1BD7F347F74B82FF0"
    deadline: Deadline {adjustedValue: 12619660047}
  > innerTransactions: Array(1)
      > 0: TransferTransaction
            deadline: Deadline {adjustedValue: 12619660047}
            maxFee: UInt64 {lower: 48000, higher: 0}
            message: PlainMessage {type: 0, payload: 'test'}
            mosaics: [Mosaic]
            networkType: 152
            payloadSize: undefined
            recipientAddress: Address {address: 'TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ', networkType: 152}
            signature: "670EA8CFA4E35604DEE20877A6FC95C2786D748A8449CE7EEA7CB941FE5EC181175B0D6A08AF9E99955640C872DAD0AA68A37065C866EE1B651C3CE28BA95404"
            signer: PublicAccount
                address: Address {address: 'TCOMA5VG67TZH4X55HGZOXOFP7S232CYEQMOS7Q', networkType: 152}
                publicKey: "4667BC99B68B6CA0878CD499CE89CDEB7AAE2EE8EB96E0E8656386DECF0AD657"
            transactionInfo: AggregateTransactionInfo {height: UInt64, index: 0, id: '62600A8C0A21EB5CD28679A4', hash: undefined, merkleComponentHash: undefined, …}
            type: 16724
    maxFee: UInt64 {lower: 48000, higher: 0}
    networkType: 152
    payloadSize: 480
    signature: "670EA8CFA4E35604DEE20877A6FC95C2786D748A8449CE7EEA7CB941FE5EC181175B0D6A08AF9E99955640C872DAD0AA68A37065C866EE1B651C3CE28BA95404"
  > signer: PublicAccount
        address: Address {address: 'TCV67BMTD2JMDQOJUDQHBFJHQPG4DAKVKST3YJI', networkType: 152}
        publicKey: "FF9595FDCD983F46FF9AE0F7D86D94E9B164E385BD125202CF16528F53298656"
  > transactionInfo: 
        hash: "AA99F8F4000F989E6F135228829DB66AEB3B3C4B1F06BA77D373D042EAA4C8DA"
        height: UInt64 {lower: 322376, higher: 0}
        id: "62600A8C0A21EB5CD28679A3"
        merkleComponentHash: "1FD6340BCFEEA138CC6305137566B0B1E98DEDE70E79CC933665FE93E10E0E3E"
    type: 16705
```

- Multisig account
    - Bob
        - AggregateTransaction.innerTransactions[0].signer.address
            - TCOMA5VG67TZH4X55HGZOXOFP7S232CYEQMOS7Q
- Creator's account
    - Carol1
        - AggregateTransaction.signer.address
            - TCV67BMTD2JMDQOJUDQHBFJHQPG4DAKVKST3YJI
- Co-signer account
    - Carol2
        - AggregateTransaction.cosignatures[0].signer.address
            - TB3XP4GQK6XH2SSA2E2U6UWCESNACK566DS4COY
    - Carol3
        - AggregateTransaction.cosignatures[1].signer.address
            - TBAFGZOCB7OHZCCYYV64F2IFZL7SOOXNDHFS5NY

## 9.5 Modifying a multisig account min approval

### Editing multisig configuration

To reduce the number of co-signatories, specify the address to remove and adjust the number of co-signatories so that the minimum number of signatories is not exceeded and then announce the transaction. It is not necessary to include the account subject to remove as a co-signatory.

```js
multisigTx = sym.MultisigAccountModificationTransaction.create(
    undefined, 
    -1, //Minimum incremental number of signatories required for approval
    -1, //Minimum incremental number of signatories required for remove
    [], //Additional target address
    [carol3.address],//Address to removing
    networkType
);
aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    [ //Specify the public key of the multisig account which configuration you want to change
      multisigTx.toAggregate(bob.publicAccount),
    ],
    networkType,[]    
).setMaxFeeForAggregate(100, 1); //Number of co-signatories to the second argument:1
signedTx =  aggregateTx.signTransactionWithCosignatories(
    carol1,
    [carol2],
    generationHash,
);
await txRepo.announce(signedTx).toPromise();
```

### Replacement of co-signatories

To replace a co-signatory, specify the address to be added and the address to be removed.
The co-signature of the new additionally designated account is always required.

```js
multisigTx = sym.MultisigAccountModificationTransaction.create(
    undefined, 
    0, //Minimum incremental number of signatories required for approval
    0, //Minimum incremental number of signatories required for remove
    [carol5.address], //Additional target address
    [carol4.address], //Address to removing
    networkType
);
aggregateTx = sym.AggregateTransaction.createComplete(
    sym.Deadline.create(epochAdjustment),
    [ //Specify the public key of the multisig account which configuration you want to change
      multisigTx.toAggregate(bob.publicAccount),
    ],
    networkType,[]    
).setMaxFeeForAggregate(100, 2); //Number of co-signatories to the second argument:
signedTx =  aggregateTx.signTransactionWithCosignatories(
    carol1, //Transaction creator
    [carol2,carol5], //Cosignatory + Consent account
    generationHash,
);
await txRepo.announce(signedTx).toPromise();
```

## 9.6 Tips for use

### Multi-factor authorisation

The management of private keys can be distributed across multiple terminals. Multisigs can be used to ensure safe recovery in the event of a lost or compromised key. If the key is lost then the user can access funds through co-signatories and if stolen then the attacker cannot transfer funds without cosignatory approval.

### Account ownership

The private key of a multisig account is deactivated and unless the multisig is removed on the account sending mosaics will no longer be possible. As explained in Chapter 5. Mosaics, possession is “the state of being able to give it up at will', it can be said the owner of the assets on a multisig account are the co-signatories. Symbol allows replacement of co-signatories in a multisig configuration, so account ownership can be securely replaceable to another co-signatory.

### Workflow

Symbol allows you to configure up to 3 levels of multisig (multi-level multisig).
The use of multi-level multisig accounts prevents the use of stolen backup keys to complete a multisig, or the use of only an approver and an auditor to complete a signature.
This allows the existence of transactions on the blockchain to be presented as evidence that certain operations and conditions have been met.
