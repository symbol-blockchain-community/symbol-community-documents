# 5. Mosaic

Questo capitolo presenta le impostazioni Mosaic e come crearne.
Nella blockchain Symbol, i token si chiamano Mosaic.

> Per citare Wikipedia, i token sono 'oggetti di varie forme fatti di argilla con
un diametro di circa 1 cm, da ritrovamenti che risalgono ad 8000 anni a.C. fino a 3000 anni d.C.,
fatti negli scavi in Mesopotamia'. Per contro, un mosaico, è 'una tecnica decorativa artistica
costituita da tessere accostate e disposte per formare un disegno o un motivo. Le tessere
sono costituite di pietra e o ceramica colorata, vetro, conchiglie o legno ad adornare pavimenti e
pareti di edifici".
Nella blockchain Symbol, i Mosaic si possono pensare come tasselli che modellano il proprio ecosistema.

## 5.1 Generare un Mosaic

Per generare un Mosaic, prima valorizzarne le proprietà caratteristiche.
```js
supplyMutable = true; //Possibilità di modificare la quantità totale
transferable = false; //Possibilità di trasferimento a terzi
restrictable = true; //Limitazioni 
revokable = true; //Revocabile su ordine dell'emittente
//Definizione del Mosaic 
nonce = sym.MosaicNonce.createRandom();
mosaicDefTx = sym.MosaicDefinitionTransaction.create(
    undefined, 
    nonce,
    sym.MosaicId.createFromNonce(nonce, alice.address), //ID del Mosaic
    sym.MosaicFlags.create(supplyMutable, transferable, restrictable, revokable),
    2,//Fattore di scala (numero di cifre dopo la virgola): Divisibility
    sym.UInt64.fromUint(0), //Periodo di validità: Effective date
    networkType
);
```

Il tipo `MosaicFlags` è come segue.

```js
MosaicFlags {
  supplyMutable: false, transferable: false, restrictable: false, revokable: false
}
```
Si possono dichiarare facoltà di modiche alla quantità iniziale totale emessa, trasferibilità verso terzi, restrizioni globali, revocabilità lato emittente.
Questi valori non possono cambiare dopo la creazione dell'istanza Mosaic.

#### Fattore di scala: `divisibility`

Il fattore di scala consiste nel numero di cifre decimali della massa monetaria. E' un numero intero.

divisibility:0 = 1  
divisibility:1 = 1.0  
divisibility:2 = 1.00  

Se si specifica 0, non potrà essere fratto.

#### Periodo di validità: `duration`

Se in un Mosaic è impostata la data di scadenza, il Mosaico non scomparirà
prima di tale data.
Un Indirizzo può contenere fino ad un massimo di 1.000 Mosaic.


Modifichiamo la quantità (numero di token).
```js
//Modifiche al Mosaic
mosaicChangeTx = sym.MosaicSupplyChangeTransaction.create(
    undefined,
    mosaicDefTx.mosaicId,
    sym.MosaicSupplyChangeAction.Increase,
    sym.UInt64.fromUint(1000000),
    networkType
);
```
Quando la proprietà `sypplyMutable` è valorizzata a `false`, il numero di token totali si può modificare solo se tutti i token sono rimasti fermi nell'Indirizzo emittente, ossia non vi è stata alcuna transazione di trasferimento, anche parziale, ad un altro Indirizzo.
Se la proprietà `divisibility` è valorizzata con un numero maggiore di `0`, l'unità più piccola del token sarà 1. (Per es.: impostare `2` se si vuole che 100 token siano considerati come 1,00)

`MosaicSupplyChangeAction` è definita come segue.
```js
{0: 'Decrease', 1: 'Increase'}
```
Specificare `Increase` se si vuole aumentare.
Le due transazioni mostrate prima, vengono raggruppate in una sola.
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

Notare che in questa transazione di gruppo si sta eseguendo la modifica della quantità di un Mosaic che ancora non esiste.
Tuttavia la transazione avrà successo, a meno di inconsistenze sui valori delle proprietà del Mosaic, e verranno eseguite come fosse una operazione unica.

### Conferma

La conferma che le informazioni del Mosaico sono agganciate all'Indirizzo che l'ha creato.
```js
mosaicRepo = repo.createMosaicRepository();
accountInfo.mosaics.forEach(async mosaic => {
  mosaicInfo = await mosaicRepo.getMosaic(mosaic.id).toPromise();
  console.log(mosaicInfo);
});
```
###### Output esemplificativo
```js
> MosaicInfo {version: 1, recordId: '622988B12A6128903FC10496', id: MosaicId, supply: UInt64, startHeight: UInt64, …}
> MosaicInfo
    divisibility: 2 //Fattore di scala: Divisibility
    duration: UInt64 {lower: 0, higher: 0} //Periodo di validità: Duration
  > flags: MosaicFlags
        restrictable: true //Possibilità di restrizioni
        revokable: true //Revocabile dall'emittente
        supplyMutable: true //Quantità totale modificabile
        transferable: false //Trasferibilità a terzi
  > id: MosaicId
        id: Id {lower: 207493124, higher: 890137608} //MosaicID
    ownerAddress: Address {address: 'TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ', networkType: 152} //Issure address
    recordId: "62626E3C741381859AFAD4D5" 
    supply: UInt64 {lower: 1000000, higher: 0} //Quantità totale di monete
```

## 5.2 Trasferire un Mosaic

Come trasferire un Mosaic che abbiamo creato.
I neofiti della blockchain spesso immaginano un trasferimento di un Mosaic come un'operazione lato client, invece le informazioni del Mosaic sono sempre condivise e sincronizzate da tutti i nodi della rete, quindi non va pensata come un invio di dati al terminale del destinatario.
Più precisamente, l'operazione di trasferimento consiste nel ricondurre i saldi dei rispettivi Mosaic negli Indirizzi, eseguendo una transazione inclusa nella blockchain. 

```js
//Creazione dell'Indirizzo ricevente
bob = sym.Account.generateNewAccount(networkType);
tx = sym.TransferTransaction.create(
    sym.Deadline.create(epochAdjustment),
    bob.address,  //Indirizzo del destinatario
    // Lista di trasferimento di Mosaic 
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

##### Trasferire più di un Mosaic alla volta

Si possono trasferire più di un Mosaic con un'unica transazione.
Per trasferire il Mosaico di nome `XYM`,  valorizzare con il seguente ID di Mosaic.

- Rete blockchain pubblica Symbol detta Mainnet：6BED913FA20223F8
- Rete blockchain pubblica di test detta Testnet：3A8416DB2D53B6C8

#### Quantità di monete 
Il numero di cifre decimali sono indicate con numero intero.
Essendo il fattore di scala di `XYM` pari a 6, si ha che per trasferire `1XYM` dobbiamo valorizzare a `1000000`.

### Conferma della transazione

```js
txInfo = await txRepo.getTransaction(signedTx.hash,sym.TransactionGroup.Confirmed).toPromise();
console.log(txInfo); 
```
###### Output esemplificativo
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
Vediamo al campo `Mosaic` della transazione di trasferimento che due tipi di Mosaic sono stati trasferiti, inoltre si possono anche vedere l'altezza del blocco di approvazione al campo `TransactionInfo`.

## 5.3 Consigli Pratici

### Prova di esistenza (Proof of existence)

La prova di esistenza indotta da una transazione è stata spiegata nel capitolo precedente.
La traccia lasciata dal trasferimento eseguito con una transazione originata da un Indirizzo ne è la prova, e possiamo raccoglierla per ricostruire un registro consistente.
Procedendo in modo incrementale con l'elenco delle transazioni, le quali rappresentano istruzioni indelebili, ogni Indirizzo può provare il possesso dei propri Mosaic.
(In questo documento, di definisce possesso "la capacità di poterlo mandare volontariamente". Potrebbe sembrare fuoritema, ma vale la pena considerare che la proprietà dei dati digitali è una questione aperta, tanto quanto la prova della volontà di oblio. La blockchain permette al singolo di indicare tale volontà, i cui dettagli andrebbero approfonditi con un esperto legale.

#### NFT (non fungible token)

Il limite sul numero di token, se impostato a 1  quale quantità iniziale assieme alla proprietà `supplyMNutable` valorizzata a `false`, da' origine ad un solo token esistente di numero, non uno di più, per sempre fino alla eventuale scadenza del periodo di validità.

I Mosaic memorizzano informazioni sull'Indirizzo di creazione e questa associazione è irreversibile a chiunque. Quindi le transazioni da un Indirizzo di emissione di un Mosaic si possono considerare metadati.

Notare che è possibile registrare dei metadati nel Mosaic, come descritto al capitolo 7, per mezzo della firma multipla dei cointestatari e dell'emittente.

Ci sono molti modi di creare NFT, uno di questi viene descritto qui sotto (si faccia attenzione ad impostare il `nonce` e il flag in modo appropriato all'uso).
```js
supplyMutable = false; //Possibilità di modifica della quantità totale
//Definizione del Mosaic 
mosaicDefTx = sym.MosaicDefinitionTransaction.create(
    undefined, nonce,mosaicId,
    sym.MosaicFlags.create(supplyMutable, transferable, restrictable, revokable),
    0,//Fattore di scala: Divisibility
    sym.UInt64.fromUint(0), //Periodo di validità: Indefinite
    networkType
);
//La quantità totale del Mosaico è costante
mosaicChangeTx = sym.MosaicSupplyChangeTransaction.create(
    undefined,mosaicId,
    sym.MosaicSupplyChangeAction.Increase, //Aumentare
    sym.UInt64.fromUint(1), //Quantità unitaria (un solo token)
    networkType
);
//NFTdata
nftTx  = sym.TransferTransaction.create(
    undefined, //Periodo di validità: Duration
    alice.address, 
    [],
    sym.PlainMessage.create("Hello Symbol!"), //NFTdata
    networkType
)
//Generazione del Mosaic e incapsulazione dei dati NFT per la registrazione nel blocco.
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

Tra i dati del Mosaic verranno registrati anche l'altezza del blocco e l'Indirizzo di creazione al momento di generazione, per abilitare la ricerca dei dati NFT all'interno dello stesso blocco. 


##### Note
Quando il creatore del Mosaic possiede la totalità dei token, egli può compiere variazioni sulla quantità tottale.
I dati da registrare si possono suddividere in più transazioni in modo irrevocabile ed incrementale.
Un NFT va gestito in modo appropriato e con cura, considerandone con attenzione la conservazione o l'eliminazione della chiave privata. 

#### Operazioni a servizio revocabile 

Impostare il valore `false` nella proprietà di trasferimento a terzi, ne impedisce la rivendita.
Impostare il valore `true` consente ad un fornitore di servizi di evitare che l'utente debba incaricarsi di gestire la chiave privata per impossessarsi del token.

```js
transferable = false; //Transferability to third parties
revokable = true; //Refundability from the issuer
```
