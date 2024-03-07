# 9.Intestatari delegati

Gli Indirizzi della blockchain Symbol possono essere cointestati.

### Concetti di base

Gli indirizzi cointestati accettano fino a 25 cofirmatari. Un Indirizzo di per sè, può comparire nella lista di cofirmatari di al massimo 25 Indirizzi cointestati diversi. Gli Indirizzi cointestati possono essere strutturati in modo gerarchico per un massimo di 3 livelli. Questo capitolo descrive indirizzi cointestati di primo livello.

## 9.1 Preparazione dell'Indirizzo Cointestato

Creiamo gli Indirizzi usati nel codice sorgente nell'esempio di questo capitolo e ne stampiamo la chiave privata
Si fa notare che l'Indirizzo di Bob in questo capitolo, essendo cointestato, diverà inutilizzabile se andasse persa la chiave privata di Carol.

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

Utilizzando la rete di test, possiamo avvalerci del faucet per trasferire negli Indirizzi di Bob e Carol, una quandità di xym adeguata per consentirci di pagare le commissioni di transazione.

- Indirizzo Internet del Faucet
  - https://testnet.symbol.tools/

##### Output URL

```js
console.log(
  "https://testnet.symbol.tools/?recipient=" +
    bob.address.plain() +
    "&amount=20",
);
console.log(
  "https://testnet.symbol.tools/?recipient=" +
    carol1.address.plain() +
    "&amount=20",
);
```

## 9.2 Registrazione dei cointestatari

La blockchain Symbol non vincola alla creazione di un nuovo Indirizzo, anche un Indirizzo già esistente si può essere convertito in indirizzo cointestato. I cofirmatari possono essere Indirizzi già esistenti.
Per creare un Indirizzo cointestato è necessario che ogni Indirizzo cointestato apponga una firma di consenso (opt-in). Utilizziamo una Transazione di Gruppo.

```js
multisigTx = sym.MultisigAccountModificationTransaction.create(
  undefined,
  3, //minApproval:Minimum number of signatories required for approval
  3, //minRemoval:Minimum number of signatories required for expulsion
  [carol1.address, carol2.address, carol3.address, carol4.address], //Additional target address list
  [], //Reemoved address list
  networkType,
);
aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [
    //The public key of the multisig account
    multisigTx.toAggregate(bob.publicAccount),
  ],
  networkType,
  [],
).setMaxFeeForAggregate(100, 4); //Il numero di cointestatari come secondo parametro è 4
signedTx = aggregateTx.signTransactionWithCosignatories(
  bob, //Indirizzo cointestato
  [carol1, carol2, carol3, carol4], //Indirizzi da aggiungere (è consentito anche rimuovere)
  generationHash,
);
await txRepo.announce(signedTx).toPromise();
```

## 9.3 Convalida di un Indirizzo Cointestato

### Controllo dello stato della transazione accettata dal nodo per un Indirizzo cointestato

```js
msigRepo = repo.createMultisigRepository();
multisigInfo = await msigRepo.getMultisigAccountInfo(bob.address).toPromise();
console.log(multisigInfo);
```

###### Output esemplificativo

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

Mostra che gli Indirizzi cofirmatari sono stati registrati. Il valore `minApproval` indica il numero minimo di firme richieste per eseguire una transazione dall'Indirizzo cointestato. Il valore `minRemoval` mostra il numero minimo di firme per rimuovere un cointestatario.

### Convalida di un Indirizzo cofirmatario

```js
msigRepo = repo.createMultisigRepository();
multisigInfo = await msigRepo
  .getMultisigAccountInfo(carol1.address)
  .toPromise();
console.log(multisigInfo);
```

###### Output esemplificativo

```
> MultisigAccountInfo
    accountAddress: Address {address: 'TCV67BMTD2JMDQOJUDQHBFJHQPG4DAKVKST3YJI', networkType: 152}
    cosignatoryAddresses: []
    minApproval: 0
    minRemoval: 0
  > multisigAddresses: Array(1)
        0: Address {address: 'TCOMA5VG67TZH4X55HGZOXOFP7S232CYEQMOS7Q', networkType: 152}
```

Mostra che l'Indirizzo è cofirmatario per un Indirizzo cointestato (elencato nell'array `multisigAddresses`).

## 9.4 Eseguire una transazione dall'Indirizzo Cointestato e firme dei cointestatari

Supponiamo di inviare un Mosaic dall'Indirizzo cointestato.
Possiamo farlo sia con una transazione Aggregate Complete, sia con una transazione Aggregate Bonded

### Caso Transazione di Gruppo Aggregate Complete

Condizione sufficiente per eseguire una Transazione di Gruppo di tipo 'Aggregate Complete' è che un numero minimo (`minApproval`) di cofirmatari apponga la firma prima della propagazione della transazione alla rete.

```js
tx = sym.TransferTransaction.create(
  undefined,
  alice.address, //Trasferimento ad Alice
  [
    new sym.Mosaic(
      new sym.NamespaceId("symbol.xym"),
      sym.UInt64.fromUint(1000000),
    ),
  ],
  sym.PlainMessage.create("test"),
  networkType,
);
aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [
    //Imposta la chiave pubblica del mittente, Indirizzo cointestato
    tx.toAggregate(bob.publicAccount),
  ],
  networkType,
  [],
).setMaxFeeForAggregate(100, 2); //Numero di cofirmatari come secondo argomento:2
signedTx = aggregateTx.signTransactionWithCosignatories(
  carol1, //Indirizzo che ha creato la transazione
  [carol2, carol3], //Cofirmatari
  generationHash,
);
await txRepo.announce(signedTx).toPromise();
```

### Caso Transazione di Gruppo Aggregate Bonded

Una transazione Aggregate Bonded si può propagare senza specificare i cofirmatari. Verrà completata dichiarando un `hash lock`, solo dopo che la rete l'avrà registrata, l'Indirizzo cofirmatario apporrà la firma.

```js
tx = sym.TransferTransaction.create(
  undefined,
  alice.address, //Trasferimento ad Alice
  [
    new sym.Mosaic(
      new sym.NamespaceId("symbol.xym"),
      sym.UInt64.fromUint(1000000),
    ),
  ], //1XYM
  sym.PlainMessage.create("test"),
  networkType,
);
aggregateTx = sym.AggregateTransaction.createBonded(
  sym.Deadline.create(epochAdjustment),
  [
    //Chiave pubblica dell'Indirizzo cointestato
    tx.toAggregate(bob.publicAccount),
  ],
  networkType,
  [],
).setMaxFeeForAggregate(100, 0); //Numero di cofirmatari come secondo argomento:0
signedAggregateTx = carol1.sign(aggregateTx, generationHash);
hashLockTx = sym.HashLockTransaction.create(
  sym.Deadline.create(epochAdjustment),
  new sym.Mosaic(
    new sym.NamespaceId("symbol.xym"),
    sym.UInt64.fromUint(10 * 1000000),
  ), //Commissione fissa:10XYM
  sym.UInt64.fromUint(480),
  signedAggregateTx,
  networkType,
).setMaxFee(100);
signedLockTx = carol1.sign(hashLockTx, generationHash);
//Propagazione Transazione Hashlock
await txRepo.announce(signedLockTx).toPromise();
```

```js
//Propagazione della transazione bonded dopo la conferma della propagazione della transazione Hashlock
await txRepo.announceAggregateBonded(signedAggregateTx).toPromise();
```

Quando una transazione bonded diventa di conoscenza del nodo, il suo stato è detto di 'firma parziale', e potrà essere firmata con un Indirizzo cofirmatario, usando il metodo cofirmatario descritto nel capitolo [8.Lock](./08_lock.md). Alternativamente può anche essere firmata da un wallet dotato di funzionalità cofirmatario.

## 9.5 Convalida di una transazione a firma multipla

Controlliamo il risultato dell'esecuzione della transazione a firma multipla.

```js
txInfo = await txRepo
  .getTransaction(signedTx.hash, sym.TransactionGroup.Confirmed)
  .toPromise();
console.log(txInfo);
```

###### Output esemplificativo

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

- Indirizzo Cointestato
  - Bob
    - AggregateTransaction.innerTransactions[0].signer.address
      - TCOMA5VG67TZH4X55HGZOXOFP7S232CYEQMOS7Q
- Indirizzo di creazione della transazione
  - Carol1
    - AggregateTransaction.signer.address
      - TCV67BMTD2JMDQOJUDQHBFJHQPG4DAKVKST3YJI
- Indirizzo cofirmatario
  - Carol2
    - AggregateTransaction.cosignatures[0].signer.address
      - TB3XP4GQK6XH2SSA2E2U6UWCESNACK566DS4COY
  - Carol3
    - AggregateTransaction.cosignatures[1].signer.address
      - TBAFGZOCB7OHZCCYYV64F2IFZL7SOOXNDHFS5NY

## 9.6 Modificare un Indirizzo cointestato (numero minimo di firme)

### Modifica della configurazione dell'Indirizzo cointestato

Per ridurre il numero di cofirmatari di un Indirizzo cointestato, specificare l'Indirizzo da rimuovere e cambiare di conseguenza il numero minimo di cofirmatari di conseguenza, quindi propagare la transazione. E' necessario includere l'Indirizzo in questione perchè sia rimosso dai cofirmatari.

```js
multisigTx = sym.MultisigAccountModificationTransaction.create(
  undefined,
  -1, //Riduce di uno il numero minimo di cofirmatari per l'approvazione di transazioni
  -1, //Riduce di uno il numero minimo di cofirmatari per rimuovere cofirmatari
  [], //Eventuale altro Indirizzo
  [carol3.address], //Indirizzo da rimuovere
  networkType,
);
aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [
    //Specificare la chiave pubblica dell'Indirizzo cointestato da modificare
    multisigTx.toAggregate(bob.publicAccount),
  ],
  networkType,
  [],
).setMaxFeeForAggregate(100, 1); //numero di cofirmatari come secondo argomento:1
signedTx = aggregateTx.signTransactionWithCosignatories(
  carol1,
  [carol2],
  generationHash,
);
await txRepo.announce(signedTx).toPromise();
```

### Sostituzione di cofirmatari

Per sostituire un cofirmatario, specificare l'Indirizzo da aggiungere e l'Indirizzo da togliere.
Si chiede sempre la firma del nuovo Indirizzo cofirmatario.

```js
multisigTx = sym.MultisigAccountModificationTransaction.create(
  undefined,
  0, //variazione sul numero di cofirmatari per l'approvazione di transazioni
  0, //variazione sul numero minimo di cofirmatari per rimuovere cofirmatari
  [carol5.address], //Indirizzo aggiuntivo
  [carol4.address], //Indirizzo da rimuovere
  networkType,
);
aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [
    //specificare la chiave pubblica dell'Indirizzo cointestato da modificare
    multisigTx.toAggregate(bob.publicAccount),
  ],
  networkType,
  [],
).setMaxFeeForAggregate(100, 2); //Numero di cofirmatari nel secondo argomento: 2
signedTx = aggregateTx.signTransactionWithCosignatories(
  carol1, //Indirizzo che crea la transazione
  [carol2, carol5], //cofirmatari per consenso
  generationHash,
);
await txRepo.announce(signedTx).toPromise();
```

## 9.7 Consigli pratici

### Autenticazione a più fattori

La gestione delle chiavi private può essere distribuita su più terminali. La cointestazione si può usare per consentire il recupero nel caso di smarrimento o compromissione di chiavi. In caso di perdita di chiave l'utente può operare con le chiavi dei cofirmatari, in caso di compromissione, l'intruso non può trasferire fondi senza il consenso dei cofirmatari.

### Proprietà dell'Indirizzo

La chiave privata di un Indirizzo cointestato è inattiva quindi non si possono trasferire Mosaic fino alla rimozione dei cofirmatari. Come spiegato nel capitolo [5.Mosaic](./05_mosaic.md), il possesso va inteso in modo dinamico, la proprietà delle monete in un Indirizzo cointestato coincide coi i cofirmatari. La blockchain Symbol consente di riconfigurare la cointestazione con la sostituzione in sicurezza dei cofirmatari.

### Workflow

La blockchain Symbol permette di configurare fino a 3 livelli di cointestazione (multi-level multisig).
L'uso di Indirizzi con più livelli di contestazione impedisce l'uso di chiavi rubate di backup, per
confermare una cointestazione. Impedisce per esempio l'uso di un unico verificatore e approvatore alla firma,
dando prova dell'esistenza di transazioni nella blockchain condizionate al soddisfacimento di requisiti.
