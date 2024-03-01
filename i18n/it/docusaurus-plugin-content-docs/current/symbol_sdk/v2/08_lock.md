# 8.Transazioni `Lock`

La blockchain Symbol offre due tipi di `LockTransacion`: 
 - `Hash Lock Transaction`
 - `Secret Lock Transaction`

## 8.1 Transazione `Hash Lock`

Le transazioni Hash Lock hanno la caratteristica di poter essere propagate in ritardo (annunciate in differita).
Una transazione di questo tipo viene memorizzata nell'area temporanea e limitata (cache) di ogni nodo della rete,
usando come riferimento l'impronta hash. Questo dato rimarrà nella cache del nodo fino al momento della richiesta
di propagazione vera e propria. La transazione rimane bloccata nella memoria del nodo della rete (locked) e verrà elaborata solo previa esecuzione della firma di tutti i cofirmatari. Le monete dell'Indirizzo non sono vincolate/bloccate, eccezzion fatta per l'importo di 10 XYM che va pagato dal proponente esecutore della Transazione. Tali fondi vincolati verranno restituiti all'Indirizzo del proponente esecutore, al completamento delle operazioni di firma. L'intervallo di validità di una transazione Hash Lock, è di circa 48 ore. Se alla scadenza del periodo di validità la transazione no verrà firmata e confermata, la cauzione di 10 XYM andrà perduta.

### Creazione di una transazione `Aggregate Bonded` 

```js
bob = sym.Account.generateNewAccount(networkType);

tx1 = sym.TransferTransaction.create(
    undefined,
    bob.address,  //Il destinatario è Bob
    [ //invio di 1 XYM
      new sym.Mosaic(
        new sym.NamespaceId("symbol.xym"),
        sym.UInt64.fromUint(1000000)
      )
    ],
    sym.EmptyMessage, //senza messaggio 
    networkType
);

tx2 = sym.TransferTransaction.create(
    undefined,
    alice.address,  //Il destinatario è Alice
    [],
    sym.PlainMessage.create('Grazie!'), //Messaggio
    networkType
);

aggregateArray = [
    tx1.toAggregate(alice.publicAccount), //Il mittente è Alice
    tx2.toAggregate(bob.publicAccount), //Il mittente è  Bob
]

//Transazione di gruppo legata: Aggregate Bonded 
aggregateTx = sym.AggregateTransaction.createBonded(
    sym.Deadline.create(epochAdjustment),
    aggregateArray,
    networkType,
    [],
).setMaxFeeForAggregate(100, 1);

//Operazione di firma
signedAggregateTx = alice.sign(aggregateTx, generationHash);
```
Specificare la chiave pubblica dell'Indirizzo del mittente negli elementi del parametro `AggregateArray`, per le due transazioni `tx1` e `tx2` inserite nella transazione di gruppo. Per recuperare la chiave pubblica di un Indirizzo confrontare il capitolo sugli Indirizzi. Le transazioni di gruppo subiscono la verifica di integrità, nell'ordine che corrispone alla posizione in cui sono state inserite nell'array parametro, tale verifica verrà eseguita durante la creazione del prossimo blocco.

Per esempio, si potrebbe inviare un NFT (Non Fungible Token) da Alice a Bob definendo una transazione tx1 e contestualmente trasferirlo da Bob a Carol definendo una transazione tx2 nell'ordine. Invertendo l'ordine nel parametro array della transazione di gruppo specificando tx2, seguito da tx1 si otterrà invece un errore. Inoltre la presenza di almeno una transazione inconsistente nella transazione di gruppo, solleverà un errore invalidando l'approvazione di tutte le transazioni del gruppo.

### Creazione, firma e propagazione di una transazione Hash
```js
//Creazione di transazione Hash Lock 
hashLockTx = sym.HashLockTransaction.create(
  sym.Deadline.create(epochAdjustment),
    new sym.Mosaic(new sym.NamespaceId("symbol.xym"),sym.UInt64.fromUint(10 * 1000000)), //cauzione predefinita di 10xym 
    sym.UInt64.fromUint(480), // Tempo di scadenza della transazione
    signedAggregateTx,// Prenotata con il riferimento all'impronta hash
    networkType
).setMaxFee(100);

//Firma
signedLockTx = alice.sign(hashLockTx, generationHash);

//Propagazione della transazione Hash Lock 
await txRepo.announce(signedLockTx).toPromise();
```

### Propagazione di una transazione Aggregate Bonded

Chiamata di propagazione della transazione di gruppo legata. (Per es. dopo aver controllato con l'Explorer dei blocchi)
```js
await txRepo.announceAggregateBonded(signedAggregateTx).toPromise();
```


### Cofirmatari

Firme dei cointestatari della transazione. Nel nostro caso Bob.

```js
txInfo = await txRepo.getTransaction(signedAggregateTx.hash,sym.TransactionGroup.Partial).toPromise();
cosignatureTx = sym.CosignatureTransaction.create(txInfo);
signedCosTx = bob.signCosignatureTransaction(cosignatureTx);
await txRepo.announceAggregateBondedCosignature(signedCosTx).toPromise();
```

### Note
Le transazioni `Hash Lock` possono essere create e propagate da chiunque, non sono limitate all'Indirizzo che le ha create e firmate. Tuttavia, assicurarsi che questo tipo di transazioni includa almeno una transazione in cui il firmatario coincida. Sono accettate anche transazioni nelle quali non viene specificato alcun Mosaic o con messaggio vuoto.


## 8.2 Transazioni `Secret Lock` e `Secret Proof`

La transazione `Secret Lock` registra una password condivisa in precedenza e blocca/vincola il Mosaic specificato. Ciò permette al destinatario di ricevere il Mosaic dando prova di conoscenza della password prima della scadenza della transazione.

Questa sezione descrive un vincolo del valore di 1 XYM fissato da Alice e sbloccato da Bob con il fine di ricevere i fondi.

Creiamo gli Indirizzi di Bob e di Alice.
Bob deve propagare la transazione per avviare lo sblocco, quindi richiediamo 10 XYM dal faucet.

```js
bob = sym.Account.generateNewAccount(networkType);
console.log(bob.address);

//FAUCET URL 
console.log("https://testnet.symbol.tools/?recipient=" + bob.address.plain() +"&amount=10");
```

### Creazione del Secret Lock

Creazione di una parola chiave condivisa per il blocco e sblocco della transazione.

```js
sha3_256 = require('/node_modules/js-sha3').sha3_256;

random = sym.Crypto.randomBytes(20);
hash = sha3_256.create();
secret = hash.update(random).hex();//hash per bloccare la transazione (lock)
proof = random.toString('hex'); //chiave segreta di sblocco (unlock)
console.log("secret:" + secret);
console.log("proof:" + proof);
```

###### Output esemplificativo
```js
> secret:f260bfb53478f163ee61ee3e5fb7cfcaf7f0b663bc9dd4c537b958d4ce00e240
  proof:7944496ac0f572173c2549baf9ac18f893aab6d0
```

Creazione, firma e propagazione della transazione:
```js
lockTx = sym.SecretLockTransaction.create(
    sym.Deadline.create(epochAdjustment),
    new sym.Mosaic(
      new sym.NamespaceId("symbol.xym"),
      sym.UInt64.fromUint(1000000) //1XYM
    ), //Mosaic da vincolare
    sym.UInt64.fromUint(480), //Durata del vincolo (numero di blocchi)
    sym.LockHashAlgorithm.Op_Sha3_256, //Algorithm used for lock keyword generation
    secret, //Password di blocco
    bob.address, //Indirizzo di destinazione allo sblocco:Bob
    networkType
).setMaxFee(100);

signedLockTx = alice.sign(lockTx,generationHash);
await txRepo.announce(signedLockTx).toPromise();
```

Descrizione dell'algoritmo LockHashAlgorithm 
```js
{0: 'Op_Sha3_256', 1: 'Op_Hash_160', 2: 'Op_Hash_256'}
```

L'Indirizzo destinatario, viene specificato quando si crea la transazione di lock, nel nostro caso Bob. quindi non può essere modificato a posteriori, nemmeno dalla transazione di sblocco.

La durata massima di un lock è fissata in 365 giorni (misurata in numero di blocchi).

Effettuare la convalida delle transazioni.
```js
slRepo = repo.createSecretLockRepository();
res = await slRepo.search({secret:secret}).toPromise();
console.log(res.data[0]);
```
###### Output esemplificativo
```js
> SecretLockInfo
    amount: UInt64 {lower: 1000000, higher: 0}
    compositeHash: "770F65CB0CC0CA17370DE961B2AA5B48B8D86D6DB422171AB00DF34D19DEE2F1"
    endHeight: UInt64 {lower: 323495, higher: 0}
    hashAlgorithm: 0
    mosaicId: MosaicId {id: Id}
    ownerAddress: Address {address: 'TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ', networkType: 152}
    recipientAddress: Address {address: 'TBTWKXCNROT65CJHEBPL7F6DRHX7UKSUPD7EUGA', networkType: 152}
    recordId: "6260A1D3205E94BEA3D9E3E9"
    secret: "F260BFB53478F163EE61EE3E5FB7CFCAF7F0B663BC9DD4C537B958D4CE00E240"
    status: 0
    version: 1
```
Ciò mostra che Alice, esecutore del lock, risulta l'Indirizzo proprietario del lock, mentre Bob risulta l'Indirizzo destinatario dei fondi. Alla pubblicazione del `secret` Bob potrà informare la rete dando la prova per lo sblocco.


### Transazione di sblocco (unlock) 

Per sbloccare la transazione usando la parola chiave di sblocco (secret proof), che Bob ha preventivamente ricevuto.

```js
proofTx = sym.SecretProofTransaction.create(
    sym.Deadline.create(epochAdjustment),
    sym.LockHashAlgorithm.Op_Sha3_256, //Algoritmo di hash per verificare la chiave di sblocco
    secret, //Chiave di sblocco
    bob.address, //Deactivated accounts (receiving accounts)
    proof, //Unlock keyword
    networkType
).setMaxFee(100);

signedProofTx = bob.sign(proofTx,generationHash);
await txRepo.announce(signedProofTx).toPromise();
```

Ottenere la convalida:
```js
txInfo = await txRepo.getTransaction(signedProofTx.hash,sym.TransactionGroup.Confirmed).toPromise();
console.log(txInfo);
```
###### Output esemplificativo
```js
> SecretProofTransaction
  > deadline: Deadline {adjustedValue: 12669305546}
    hashAlgorithm: 0
    maxFee: UInt64 {lower: 20700, higher: 0}
    networkType: 152
    payloadSize: 207
    proof: "A6431E74005585779AD5343E2AC5E9DC4FB1C69E"
    recipientAddress: Address {address: 'TBTWKXCNROT65CJHEBPL7F6DRHX7UKSUPD7EUGA', networkType: 152}
    secret: "4C116F32D986371D6BCC44CE64C970B6567686E79850E4A4112AF869580B7C3C"
    signature: "951F440860E8F24F6F3AB8EC670A3D448B12D75AB954012D9DB70030E31DA00B965003D88B7B94381761234D5A66BE989B5A8009BB234716CA3E5847C33F7005"
    signer: PublicAccount {publicKey: '9DC9AE081DF2E76554084DFBCCF2BC992042AA81E8893F26F8504FCED3692CFB', address: Address}
  > transactionInfo: TransactionInfo
        hash: "85044FF702A6966AB13D05DBE4AC4C3A13520C7381F32540429987C207B2056B"
        height: UInt64 {lower: 323805, higher: 0}
        id: "6260CC7F60EE2B0EA10CCEDA"
        merkleComponentHash: "85044FF702A6966AB13D05DBE4AC4C3A13520C7381F32540429987C207B2056B"
    type: 16978
```

La transazione per lo sblocco `SecretProofTransaction` non contiene informazioni sulla quantità di monete Mosaic trasferite. Per controllare tale valore è necessario leggerlo dalle informazioni della ricevuta di creazione dell'ultimo blocco della blockchain, cercando la ricevuta con destinatario Bob e di tipo:`LockHash_Completed`. 

```js
receiptRepo = repo.createReceiptRepository();

receiptInfo = await receiptRepo.searchReceipts({
    receiptType:sym.ReceiptTypeLockHash_Completed,
    targetAddress:bob.address
}).toPromise();
console.log(receiptInfo.data);
```
###### Output esemplificativo
```js
> data: Array(1)
  >  0: TransactionStatement
        height: UInt64 {lower: 323805, higher: 0}
     >  receipts: Array(1)
          > 0: BalanceChangeReceipt
                amount: UInt64 {lower: 1000000, higher: 0}
            > mosaicId: MosaicId
                  id: Id {lower: 760461000, higher: 981735131}
              targetAddress: Address {address: 'TBTWKXCNROT65CJHEBPL7F6DRHX7UKSUPD7EUGA', networkType: 152}
              type: 8786
```

I tipi delle ricevute sono definiti come segue:

```js
{4685: 'Mosaic_Rental_Fee', 4942: 'Namespace_Rental_Fee', 8515: 'Harvest_Fee', 8776: 'LockHash_Completed', 8786: 'LockSecret_Completed', 9032: 'LockHash_Expired', 9042: 'LockSecret_Expired', 12616: 'LockHash_Created', 12626: 'LockSecret_Created', 16717: 'Mosaic_Expired', 16718: 'Namespace_Expired', 16974: 'Namespace_Deleted', 20803: 'Inflation', 57667: 'Transaction_Group', 61763: 'Address_Alias_Resolution', 62019: 'Mosaic_Alias_Resolution'}

8786: 'LockSecret_Completed' : LockSecret is completed
9042: 'LockSecret_Expired'　：LockSecret is expired
```

## 8.3 Consigli pratici


### Sul pagamento di commissioni delle transazioni

Di solito le blockchain applicano delle commissioni alle esecuzioni di transazioni di trasferimenti. Gli utenti della blockchain devono ottenere dal sito di scambio, le rispettive monete per pagare le commissioni (per es. la moneta di Symbol ha nome XYM). Se l'utente è una società, la gestione delle monete potrebbe essere problematica. Per questo motivo il pagamento di commissioni di Transazioni di gruppo (aggregate) può essere delegato a fornitori esterni di monete mediante l'utilizzo di transazioni Hash Lock.

### Schedulare transazioni

Le transazioni Secret Lock rimborsano l'Indirizzo che le ha create quando la blockchain è cresciuta di un certo numero di blocchi.
Quando un fornitore di servizi esterno, addebita il costo del lock all'Indirizzo, e la quantità di monete possedute dall'utente aumenterà dopo la scadenza. Viceversa, propagare una transazione di tipo secret proof prima della scadenza viene considerata una richiesta di cancellazione, e i fondi vengono restituiti al fornitore di servizi.

### Operazione di scambio atomica (Atomic swap)
I Secret lock si possono usare per scambio di Mosaic tra blockchain eterogenee. Altre implementazioni di blockchain danno nome a questa operazione Hash time lock contract (HTLC) che non va confuda con l'implementazione Symbol della transazione Hash Lock.
