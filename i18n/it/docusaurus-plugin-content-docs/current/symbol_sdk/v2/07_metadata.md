# 7.Metadati

E' possibile memorizzare dati di tipo coppia chiave-valore per ogni Sinonimo associato ad un Indirizzo o Mosaic,
con una dimensione massima di 1024 byte per il valore.
In questo capitolo assumiamo che il Sinonimo, in entrambi i casi in cui sia associato all'Indirizzo oppure al Mosaic, venga
creato da Alice.

Prima di eseguire gli script di esempio, è necessario caricare le seguenti librerie:

```js
metaRepo = repo.createMetadataRepository();
mosaicRepo = repo.createMosaicRepository();
metaService = new sym.MetadataTransactionService(metaRepo);
```

## 7.1 Memorizzazione nell'Indirizzo

Memorizzazione di una coppia chiave-valore nell'Indirizzo.

```js
key = sym.KeyGenerator.generateUInt64Key("key_account");
value = "test";

tx = await metaService
  .createAccountMetadataTransaction(
    undefined,
    networkType,
    alice.address, //Indirizzo su cui si vogliono memorizzare i Metadati
    key,
    value, //coppia chiave-valore
    alice.address, //Indirizzo del proprietario dei Metadati
  )
  .toPromise();

aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [tx.toAggregate(alice.publicAccount)],
  networkType,
  [],
).setMaxFeeForAggregate(100, 0);

signedTx = alice.sign(aggregateTx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

Per memorizzare i Metadati è richiesta la firma dell'Indirizzo in cui vengono registrati.
E' necessario eseguire una transazione di gruppo (detta aggregata) in ogni caso, compreso
il caso in cui l'Indirizzo di destinazione e l'Indirizzo mittente coincidono.

Se si memorizzano Metadati su più Indirizzi, usare il metodo `signTransactionWithCosignatories` per l'operazione di firma.

```js
tx = await metaService
  .createAccountMetadataTransaction(
    undefined,
    networkType,
    bob.address, //Indirizzo di destinazione della memorizzazione dei Metadati
    key,
    value, //Coppia chiave-valore
    alice.address, //Indirizzo di chi sta creando i Metadati
  )
  .toPromise();

aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [tx.toAggregate(alice.publicAccount)],
  networkType,
  [],
).setMaxFeeForAggregate(100, 1); // Il numero di cofirmatari nel secondo argomento: 1

signedTx = aggregateTx.signTransactionWithCosignatories(
  alice,
  [bob],
  generationHash, // Specificare il cofirmatario nel secondo argomento
);
await txRepo.announce(signedTx).toPromise();
```

Se non si conosce la chiave privata di Bob, al posto della Transazione Aggregata, eseguire una
Transazione Aggregata Legata che verrà descritta nei capitoli seguenti, oppure ricorrere alla Firma a Freddo.

## 7.2 Memorizzazione nel Mosaic

Per memorizzare una coppia chiave valore nel Mosaic con il rispettivo l'Indirizzo di creazione.
E' necessario firmare la Transazione per memorizzare i dati, con l'Indirizzo con cui è stato creato il Mosaic.

```js
mosaicId = new sym.MosaicId("1275B0B7511D9161");
mosaicInfo = await mosaicRepo.getMosaic(mosaicId).toPromise();

key = sym.KeyGenerator.generateUInt64Key("key_mosaic");
value = "test";

tx = await metaService
  .createMosaicMetadataTransaction(
    undefined,
    networkType,
    mosaicInfo.ownerAddress, //Indirizzo con cui è stato creato il Mosaic
    mosaicId,
    key,
    value, //coppia chiave valore
    alice.address,
  )
  .toPromise();

aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [tx.toAggregate(alice.publicAccount)],
  networkType,
  [],
).setMaxFeeForAggregate(100, 0);

signedTx = alice.sign(aggregateTx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

## 7.3 Memorizzazione nel Sinonimo

Per memorizzare la coppia chiave valore nel Sinonimo.
La firma della Transazione che registra i dati va eseguita con l'Indirizzo con cui è stato creato il Sinonimo.

```js
nsRepo = repo.createNamespaceRepository();
namespaceId = new sym.NamespaceId("xembook");
namespaceInfo = await nsRepo.getNamespace(namespaceId).toPromise();

key = sym.KeyGenerator.generateUInt64Key("key_namespace");
value = "test";

tx = await metaService
  .createNamespaceMetadataTransaction(
    undefined,
    networkType,
    namespaceInfo.ownerAddress, //Indirizzo con cui è stato creato il Sinonimo
    namespaceId,
    key,
    value, //coppia chiave valore
    alice.address, //Indirizzo del regisrante
  )
  .toPromise();

aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [tx.toAggregate(alice.publicAccount)],
  networkType,
  [],
).setMaxFeeForAggregate(100, 0);

signedTx = alice.sign(aggregateTx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

## 7.4 Convalida

Per verificare che i metadati siano stati registrati.

```js
res = await metaRepo
  .search({
    targetAddress: alice.address,
    sourceAddress: alice.address,
  })
  .toPromise();
console.log(res);
```

###### Output esemplificativo

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

Segue la definizione del tipo `metadataType`:

```js
sym.MetadataType
{0: 'Account', 1: 'Mosaic', 2: 'Namespace'}
```

### Note

Nonostante la comodità che deriva dall'utilizzo semplice e veloce di informazioni di tipo coppia chiave valore,
si rammenta l'operazione richiede la registrazione nella blockchain. Ciò comporta la firma dell'operazione con l'Indirizzo
del registrante oltre alla firma fatta con l'Indirizzo di destinazione, in cui verrà registrata la coppia chiave valore.
Di conseguenza, gli Indirizzi che si utilizzano devono essere di fiducia.

## 7.5 Consigli pratici

### Certificazione di accreditamento (proof of eligibility)

Si tratta della prova di appartenenza, con riferimento a quanto descritta nel capitolo dedicato ai Mosaic, di un nome di dominio collegato ad un Sinonimo.
Registrando dei metadati per mezzo di un Indirizzo associato ad un nome di dominio, si può certificare l'accreditamento dell'Indirizzo a rappresentare il dominio.

#### DID (Decentralized identity)

Un sistema che impiega i DID, può essere suddiviso nei ruoli di emittente, proprietario, e verificatore. Per es. gli studenti in possesso del titolo di studio emesso dall'università, lo mettono a disposizione per la verifica da parte di un selezionatore di risorse umane. La verifica del certificato avviene utilizzando la chiave pubblica dell'università, e non richiede altre informazioni che dipendono dalla piattaforma software o da terzi.
Registrando dei metadati nell'Indirizzo dello studente, le università li mettono a disposizione per la verifica del titolo di studio da compiersi con la chiave pubblica dell'università sull'Indirizzo con cui è stato creato il Mosaic dello studente, tale operazione è detta 'prova di appartenenza' (proof of ownership).
I casi d'uso sono molteplici, per es. biglietti da visita con prova di contatto.
