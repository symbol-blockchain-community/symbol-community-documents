# 6. Sinonimi

I Sinonimi sono stringhe di testo leggibili, acquisite in affitto, associate ad un Indirizzo o un Mosaic.
Il nome ha una lunghezza massima di 64 caratteri, sono ammesse solo le lettere dalla `a` alla `z`, le cifre da `0` a `9`, il carattere di sottolineato `_` e il trattino `-`.

## 6.1 Calcolo delle commissioni

Per la registrazione di un Sinonimo va versata una commissione di affitto oltre alla commissione di rete.
Le commissioni di affitto variano proporzionalmente all'utilizzo, il costo cresce con l'aumentare del traffico di rete,
pertanto si consiglia controllarne l'ammontare prima dell'esecuzione.

Nel seguente esempio, le commissioni sono calcolate per un periodo di affitto di 365 giorni e Sinonimo di primo livello.


```js
nwRepo = repo.createNetworkRepository();

rentalFees = await nwRepo.getRentalFees().toPromise();
rootNsperBlock = rentalFees.effectiveRootNamespaceRentalFeePerBlock.compact();
rentalDays = 365;
rentalBlock = rentalDays * 24 * 60 * 60 / 30;
rootNsRenatalFeeTotal = rentalBlock * rootNsperBlock;
console.log("rentalBlock:" + rentalBlock);
console.log("rootNsRenatalFeeTotal:" + rootNsRenatalFeeTotal);
```
###### Output esemplificativo
```js
> rentalBlock:1051200
> rootNsRenatalFeeTotal:210240000 //Approximately 210XYM
```

L'intervallo di tempo è misurato in numero di blocchi; un blocco conta per 30 secondi.
Il periodo minimo di affitto è limitato inferiormente a 30 giorni, il periodo massimo di affitto è di 1825 giorni. 

A seguire viene calcolata la commissione per affittare un Sinonimo di secondo livello.

```js
childNamespaceRentalFee = rentalFees.effectiveChildNamespaceRentalFee.compact()
console.log(childNamespaceRentalFee);
```
###### Output esemplificativo
```js
> 10000000 //10XYM
```

I Sinonimi di secondo livello non sono vincolati ad un intervallo di durata, la loro
esistenza dipende dalla durata del relativo Sinonimo di primo livello.

## 6.2 Affitto

Affitto di un Sinonimo di primo livello il cui nome è per esempio:`xembook`
```js

tx = sym.NamespaceRegistrationTransaction.createRootNamespace(
    sym.Deadline.create(epochAdjustment),
    "xembook",
    sym.UInt64.fromUint(86400),
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

Affitto di un Sinonimo di secondo livello (per esempio:`xembook.tomato`)
```js
subNamespaceTx = sym.NamespaceRegistrationTransaction.createSubNamespace(
    sym.Deadline.create(epochAdjustment),
    "tomato",  //Subnamespace to be created
    "xembook", //Route namespace to be linked to
    networkType,
).setMaxFee(100);
signedTx = alice.sign(subNamespaceTx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

Si possono creare ulteriori sottolivelli del Sinonimo dato, per esempio `xembook.tomato.morning`:

```js
subNamespaceTx = sym.NamespaceRegistrationTransaction.createSubNamespace(
    ,
    "morning",  //Subnamespace to be created
    "xembook.tomato", //Route namespace to be linked to
    ,
)
```

### Calcolo della data di scadenza

Calcolo della data di scadenza di un Sinonimo in affitto.

```js
nsRepo = repo.createNamespaceRepository();
chainRepo = repo.createChainRepository();
blockRepo = repo.createBlockRepository();

namespaceId = new sym.NamespaceId("xembook");
nsInfo = await nsRepo.getNamespace(namespaceId).toPromise();
lastHeight = (await chainRepo.getChainInfo().toPromise()).height;
lastBlock = await blockRepo.getBlockByHeight(lastHeight).toPromise();
remainHeight = nsInfo.endHeight.compact() - lastHeight.compact();

endDate = new Date(lastBlock.timestamp.compact() + remainHeight * 30000 + epochAdjustment * 1000)
console.log(endDate);
```

ecuperando la data di scadenza del Sinonimo si calcola la differenza tra il numero di blocchi a scadenza e 
il blocco corrente (block height della blockchain), moltiplicandolo per 30 secondi (tempo medio di un blocco).
Si prega di notare che per la rete di test (testnet), la scadenza è differita di un giorno.

###### Output esemplificativo
```js
> Tue Mar 29 2022 18:17:06 GMT+0900 (JST)
```
## 6.3 Link

### Collegare un Indirizzo
```js
namespaceId = new sym.NamespaceId("xembook");
address = sym.Address.createFromRawAddress("TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ");
tx = sym.AliasTransaction.createForAddress(
    sym.Deadline.create(epochAdjustment),
    sym.AliasAction.Link,
    namespaceId,
    address,
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```
Per collegare un Indirizzo, non è necessario esserne i proprietari.

### Collegare un Mosaic
```js
namespaceId = new sym.NamespaceId("xembook.tomato");
mosaicId = new sym.MosaicId("3A8416DB2D53xxxx");
tx = sym.AliasTransaction.createForMosaic(
    sym.Deadline.create(epochAdjustment),
    sym.AliasAction.Link,
    namespaceId,
    mosaicId,
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

Un Mosaic è collegabile con il Sinonimo esclusivamente all'Indirizzo di creazione del Mosaic.


## 6.4 Richiesta di Link formale

Impostare l'Indirizzo di destinazione in modalità `UnresolvedAccount` firmando
una transazione da propagare senza specificare l'Indirizzo.
La transazione verrà eseguita per l'Indirizzo determinato lato blockchain.
```js
namespaceId = new sym.NamespaceId("xembook");
tx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment),
    namespaceId, //Unresolved Account: Indirizzo non specificato
    [],
    sym.EmptyMessage,
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```
Impostare il Mosaic come `UnresolvedMosaic` in una transazione firmata da propagare.

```js
namespaceId = new sym.NamespaceId("xembook.tomato");
tx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment),
    address, 
    [
        new sym.Mosaic(
          namespaceId,//Unresolved Mosaic:Mosaic non specificato
          sym.UInt64.fromUint(1) //Quantità
        )
    ],
    sym.EmptyMessage,
    networkType
).setMaxFee(100);
signedTx = alice.sign(tx,generationHash);
await txRepo.announce(signedTx).toPromise();
```

Se si vogliono utilizzare monete XYM, nel campo `namespace`, specificare quanto segue:

```js
namespaceId = new sym.NamespaceId("symbol.xym");
```
```js
> NamespaceId {fullName: 'symbol.xym', id: Id}
    fullName: "symbol.xym"
    id: Id {lower: 1106554862, higher: 3880491450}
```

il valore del campo `Id` è mappato internamente come numero `{lower: 1106554862, higher: 3880491450}` di tipo `Uint64`.

## 6.5 Riferimenti al Sinonimo

Per ottenere il riferimento al Sinonimo associato all'Indirizzo.
```js
nsRepo = repo.createNamespaceRepository();

namespaceInfo = await nsRepo.getNamespace(new sym.NamespaceId("xembook")).toPromise();
console.log(namespaceInfo);
```
###### Output esemplificativo
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

`AliasType` è definito come segue:
```js
{0: 'None', 1: 'Mosaic', 2: 'Address'}
```

`NamespaceRegistrationType` è definito come segue:
```js
{0: 'RootNamespace', 1: 'SubNamespace'}
```

Per ottenere il riferimento al Sinonimo collegato al Mosaic:
```js
nsRepo = repo.createNamespaceRepository();

namespaceInfo = await nsRepo.getNamespace(new sym.NamespaceId("xembook.tomato")).toPromise();
console.log(namespaceInfo);
```
###### Output esemplificativo
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

### Ricerca inversa 

Recuperare tutti i Sinonimi collegati ad un Indirizzo:
```js
nsRepo = repo.createNamespaceRepository();

accountNames = await nsRepo.getAccountsNames(
  [sym.Address.createFromRawAddress("TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ")]
).toPromise();

namespaceIds = accountNames[0].names.map(name=>{
  return name.namespaceId;
});
console.log(namespaceIds);
```

Recuperare tutti i Sinonimi collegati ad un Mosaic:
```js
nsRepo = repo.createNamespaceRepository();

mosaicNames = await nsRepo.getMosaicsNames(
  [new sym.MosaicId("72C0212E67A08BCE")]
).toPromise();

namespaceIds = mosaicNames[0].names.map(name=>{
  return name.namespaceId;
});
console.log(namespaceIds);
```


### Ricevuta di associazione dalla blockchain 

Per verificare il tipo di associazione calcolato dalla blockchain, cioè se il Sinonimo
è stato associato ad un Indirizzo oppure ad un Mosaic
```js
receiptRepo = repo.createReceiptRepository();
state = await receiptRepo.searchAddressResolutionStatements({height:179401}).toPromise();
```
###### Output Esemplificativo
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

`ResolutionType` è definito come segue:
```js
{0: 'Address', 1: 'Mosaic'}
```

#### Note
Il Sinonimo, essendo concesso in affitto, potrebbe essere già stato associato (linked) da transazioni eseguite
precedentemente, quindi bisogna sempre verificare la ricevuta della blockchain per accertarsi
dell'Indirizzo o Mosaico collegato in un dato momento. Per es. nella consultazione di dati storici.

## 6.6 Consigli pratici

### Associazioni equivalenti con nomi di dominio esterni alla blockchain

Per definizione, il protocollo della blockchain non ammette l'esistenza di Sinonimi omonimi,
cioè non è possibile registrare un Sinonimo con lo stesso nome di uno già registrato nella blockchain.
Ciò permette agli utenti della blockchain di sviluppare un collegamento ad un marchio con un Indirizzo blockchain,
il cui Sinonimo ha lo stesso nome di un dominio Internet o un marchio registrato, avendo la garanzia
che l'associazione tra blockchain e mondo esterno (sito Internet, documento, opera d'arte, oggetto), rimarrà univoca
per tutta la durata dell'affitto del Sinonimo.
(Si consiglia di consultare un legale per i dettagli)
Fare attenzione all'affidabilità e sicurezza dei domini esterni, ed assicurarsi di rinnovare il Sinonimo in base
alle proprie necessità.

#### Note sugli Indirizzi che utilizzano i Sinonimi 
I Sinonimi sono in affitto a scadenza. L'implementazione per ora comprende solo due casi,
la scadenza per mancato rinnovo e il rinnovo.
Qualora si desiderasse utilizzare un Sinonimo in un sistema con trasferimenti di proprietà, si
consiglia di registrare il Sinonimo mediante Indirizzi cointestati (Capitolo 9).
