# 4.Transazioni

La scrittura sulla blockchain va fatta annunciando ogni transazione alla rete.

## 4.1 Le tappe di una transazione

Viene descritta la casistica delle possibili tappe nella vita di una transazione:

- Creazione della transazione
  - Va seguito necessariamente un formato accettato dalla blockchain.
- Firma
  - La transazione è firmata con la chiave privata dell'Indirizzo.
- Propagazione (notifica alla rete)
  - Una transazione firmata si annuncia a ciascun nodo della rete.
- Transazioni nello stato di 'non confermata'
  - Le transazioni che sono state accettate da un nodo vengono propagate a tutti i nodi, si trovano in stato di 'non confermata'.
    - Quando in una transazione è stato impostato il massimo valore accettabile di commissione e questo valore è inferiore al valore della commissione minima impostata da un nodo, quel nodo non propagherà la transazione.
- Transazione 'confermata'
  - Quando una transazione 'non confermata' viene inclusa nel blocco successivo della blockchain, la cui cadenza è approssimativamente un intervallo di 30 secondi, la transazione diventa 'approvata'.
- Rollback
  - Le transazioni che non ottengono il consenso per mancanza di accordo tra i nodi, vengono riportate allo stato di 'non confermata'.
    - Le transazioni scadute o scartate dalla cache vengono troncate.
- Finality (Irrevocabilità)
  - Un blocco della catena viene detto 'irrevocabile' quando è stato oggetto di finalizzazione da un nodo elettore, le transazioni di tale blocco sono dette 'final' e diventano irreversibili.

### Cos'è un blocco?

Nuovi blocchi vengono aggiunti ad intervalli di 30 secondi circa, quindi sincronizzati con gli altri
nodi facendo un confronto blocco a blocco, le transazioni da includere vengono ordinate
in modo decrescente per valore della commissione, quelle che pagano di più avranno priorità più alta.
Nel caso in cuil fallisca la sincronizzazione, il processo riparte e riprende in un ciclo che si conclude
al raggiungimento dell'accordo di consenso tra tutti i nodi della rete.

## 4.2 Inizializzazione

Per prima cosa, iniziare con la creazione di una semplice transazione di trasferimento.

### Trasferimento a Bob

Creare l'Indirizzo di Bob al quale inviare valore.

```js
bob = sym.Account.generateNewAccount(networkType);
console.log(bob.address);
```

```js
> Address {address: 'TDWBA6L3CZ6VTZAZPAISL3RWM5VKMHM6J6IM3LY', networkType: 152}
```

Creare la transazione.

```js
tx = sym.TransferTransaction.create(
  sym.Deadline.create(epochAdjustment), //Deadline: data di scadenza
  sym.Address.createFromRawAddress("TDWBA6L3CZ6VTZAZPAISL3RWM5VKMHM6J6IM3LY"),
  [],
  sym.PlainMessage.create("Hello Symbol!"), //Messaggio
  networkType, //indicazione della rete Testnet/Mainnet
).setMaxFee(100); //Commissioni
```

Descrizione dei parametri.

#### Data di scadenza

Il valore predefinito nell'SDK è impostato a 2 ore.
Il valore massimo assegnabile è di 6 ore.

```js
sym.Deadline.create(epochAdjustment, 6);
```

#### Messaggio

Il campo del messaggio della transazione, può contenere fino ad un massimo di 1023 Byte.
Nel messaggio sono ammessi anche caratteri binari (raw data).

##### Messaggio vuoto

```js
sym.EmptyMessage;
```

##### Messaggio di testo in chiaro

```js
sym.PlainMessage.create("Hello Symbol!");
```

##### Messaggio cifrato

```js
sym.EncryptedMessage(
  "294C8979156C0D941270BAC191F7C689E93371EDBC36ADD8B920CF494012A97BA2D1A3759F9A6D55D5957E9D",
);
```

Per inserire un messaggio cifrato, bisogna segnarlo con un marcatore (flag), che viene appeso e consente di distinguerlo
dai messaggi non cifrati. Le applicazioni, per es. Explorer e Wallet, useranno tale flag per trattarlo di conseguenza.
La cifratura non è calcolata all'interno del metodo.

##### Dati binari

```js
sym.RawMessage.create(uint8Arrays[i]);
```

#### Limite massimo sul valore delle commissioni

Sebbene pagare leggermente di più da' una maggior garanzia che la transazione venga convalidata,
è opportuno dare qualche dettaglio in più sull'argomento.
L'Indirizzo dichiara il valore massimo di commissioni che è disposto a pagare, nel momento della creazione di una transazione.
Per contro, i nodi perseguono la politica di raccogliere ed includere di volta in volta nel blocco, solo le transazioni che pagano di più.
Di conseguenza vi è competizione quando molte altre transazioni, offrendo commissioni più alte della nostra, scavalcano la coda con l'effetto di prolungare il tempo della nostra elaborazione.
Viceversa, se ci sono molte altre transazioni che offrono meno della nostra, il prezzo della commissione che pagheremo
non sarà quello dichiarato ma inferiore.

La commissione pagata viene calcolata con la formula data dal prodotto tra la dimensione della transazione
e il fattore moltiplicativo di commissione.
Per esempio, una transazione di 176 Bytes, con commissione massima `maxFee` valorizzata a 100, otteniamo
17600µXYM = 0.0176XYM
essendo il valore massimo che si è disposti a pagare per questa transazione.
Ci sono due modi equivalenti di impostarlo, un primo modo è quello di valorizzare
`feeMultiplier` a 100, il secondo modo è di valorizzare direttamente `maxFee` a 17600.

##### Come dichiarare feeMultiprier = 100

```js
tx = sym.TransferTransaction.create(
  ,,,,
  networkType
).setMaxFee(100);
```

##### Come dichiarare maxFee = 17600

```js
tx = sym.TransferTransaction.create(
  ,,,,
  networkType,
  sym.UInt64.fromUint(17600)
);
```

Noi useremo il metodo che assegna `feeMultiplier = 100`.

## 4.3 Firma e propagazione (notifica alla rete)

Firmare la transazione creata con la chiave privata e propagarla a tutti i nodi.

### Firma

```js
signedTx = alice.sign(tx, generationHash);
console.log(signedTx);
```

###### Output esemplificativo

```js
> SignedTransaction
    hash: "3BD00B0AF24DE70C7F1763B3FD64983C9668A370CB96258768B715B117D703C2"
    networkType: 152
    payload:
"AE00000000000000CFC7A36C17060A937AFE1191BC7D77E33D81F3CC48DF9A0FFE892858DFC08C9911221543D687813ECE3D36836458D2569084298C09223F9899DF6ABD41028D0AD4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD20000000001985441F843000000000000879E76C702000000986F4982FE77894ABC3EBFDC16DFD4A5C2C7BC05BFD44ECE0E000000000000000048656C6C6F2053796D626F6C21"
    signerPublicKey: "D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2"
    type: 16724
```

Per firmare una transazionè vanno valorizzati l'Indirizzo e il campo `generationHash`

generationHash

- Testnet
  - `7FCCD304802016BEBBCD342A332F91FF1F3BB5E902988B352697BE245F48E836`
- Mainnet
  - `57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6`

Il valore del campo `generationHash` è unico e costante e dipende dal tipo di rete blockchain con cui si intende lavorare.
Una transazione firmata è legata all'istanza della rete, per mezzo dell'impronta digitale della rete e ciò impedisce
che la stessa transazione (stessa chiave privata) possa essere accettata in più di una rete.

### Propagazione (notifica alla rete)

```js
res = await txRepo.announce(signedTx).toPromise();
console.log(res);
```

```js
> TransactionAnnounceResponse {message: 'packet 9 was pushed to the network via /transactions'}
```

Come appena mostrato nell'esempio, l'operazione di propagazione ritorna la risposta
`packet n was pushed to the network`, quale conferma che la transazione è stata accettata dal nodo.
La conferma indica solamente che non ci sono errori di ricezione della transazione.
Per questioni di prestazioni, il nodo si disconnette subito dopo aver mandato la risposta di ricezione,
prima di verificare il contenuto della transazione. Perciò tale risposta ha il solo scopo
di notifica di ricezione.
In caso di errore nel contenuto, il messaggio di risposta sarà il seguente:

##### Output esemplificativo di una risposta di fallimento di propagazione

```js
Uncaught Error: {"statusCode":409,"statusMessage":"Unknown Error","body":"{\"code\":\"InvalidArgument\",\"message\":\"payload has an invalid format\"}"}
```

## 4.4 Convalida

### Stato di convalida

Controllo dello stato delle transazioni accettate dal nodo.

```js
tsRepo = repo.createTransactionStatusRepository();
transactionStatus = await tsRepo
  .getTransactionStatus(signedTx.hash)
  .toPromise();
console.log(transactionStatus);
```

###### Output esemplificativo

```js
> TransactionStatus
    group: "confirmed"
    code: "Success"
    deadline: Deadline {adjustedValue: 11989512431}
    hash: "661360E61C37E156B0BE18E52C9F3ED1022DCE846A4609D72DF9FA8A5B667747"
    height: undefined
```

In caso di convalida, l'output sarà ` group: "confirmed"`.

In caso di errore dopo l'accettazione della propagazione, l'output mostrato sarà il seguente.
Riscrivere la transazione e provare a propagarla di nuovo.

```js
> TransactionStatus
    group: "failed"
    code: "Failure_Core_Insufficient_Balance"
    deadline: Deadline {adjustedValue: 11990156766}
    hash: "A82507C6C46DF444E36AC94391EA2D0D7DD1A218948DED465A7A4F9D1B53CA0E"
    height: undefined
```

Quando la transazione non è stata convalidata, l'output conterrà l'errore `ResourceNotFound` come di seguito.

```js
Uncaught Error: {"statusCode":404,"statusMessage":"Unknown Error","body":"{\"code\":\"ResourceNotFound\",\"message\":\"no resource exists with id '18AEBC9866CD1C15270F18738D577CB1BD4B2DF3EFB28F270B528E3FE583F42D'\"}"}
```

Questo errore, per esempio, indica che il valore massimo della commissione assegnato nella transazione,
è minore del minimo ammesso dal nodo, similmente, se una tansazione è nella forma aggregata, ma viene
propagata con l'indicazione di transazione singola (cfr. più oltre).

### Conferma di convalida

Sono richiesti 30 secondi per la convalida di una transazione e inserimento nel blocco.

#### Controllo con l'applicazione Explorer

Eseguire la ricerca nell'Explorer della blockchain, utilizzando il valore hash ritornato a seguito
dell'operazione di firma `signedTx.hash`.

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

#### Controllo con l'SDK

```js
txInfo = await txRepo
  .getTransaction(signedTx.hash, sym.TransactionGroup.Confirmed)
  .toPromise();
console.log(txInfo);
```

###### Output esemplificativo

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

Per completezza, si fa notare che qualsiasi transazione a convalida confermata e inserita in un blocco,
potrebbe, subire la revoca quando il nodo non ottiene il consenso (rollback).
Dopo l'approvazione di un blocco, la probabilità di un evento rollback per quel blocco diminuisce con l'avanzare dei blocchi nella catena.
La certezza assoluta che la transazione non subirà revoche avviene dopo il processo per l'irrevocabilità del blocco (finality),
eseguito con il contributo dei nodi elettori.

##### Codice esemplificativo

Dopo la propagazione della transazione, è utile tener traccia dello stato della blockchain.

```js
hash = signedTx.hash;
tsRepo = repo.createTransactionStatusRepository();
transactionStatus = await tsRepo.getTransactionStatus(hash).toPromise();
console.log(transactionStatus);
txInfo = await txRepo
  .getTransaction(hash, sym.TransactionGroup.Confirmed)
  .toPromise();
console.log(txInfo);
```

## 4.5 Cronologia delle transazioni

Per recuperare la lista delle transazioni ricevute ed inviate da Alice.

```js
result = await txRepo
  .search({
    group: sym.TransactionGroup.Confirmed,
    embedded: true,
    address: alice.address,
  })
  .toPromise();

txes = result.data;
txes.forEach((tx) => {
  console.log(tx);
});
```

###### Output esemplificativo

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

Il tipo della transazione è il seguente.

```js
{0: 'RESERVED', 16705: 'AGGREGATE_COMPLETE', 16707: 'VOTING_KEY_LINK', 16708: 'ACCOUNT_METADATA', 16712: 'HASH_LOCK', 16716: 'ACCOUNT_KEY_LINK', 16717: 'MOSAIC_DEFINITION', 16718: 'NAMESPACE_REGISTRATION', 16720: 'ACCOUNT_ADDRESS_RESTRICTION', 16721: 'MOSAIC_GLOBAL_RESTRICTION', 16722: 'SECRET_LOCK', 16724: 'TRANSFER', 16725: 'MULTISIG_ACCOUNT_MODIFICATION', 16961: 'AGGREGATE_BONDED', 16963: 'VRF_KEY_LINK', 16964: 'MOSAIC_METADATA', 16972: 'NODE_KEY_LINK', 16973: 'MOSAIC_SUPPLY_CHANGE', 16974: 'ADDRESS_ALIAS', 16976: 'ACCOUNT_MOSAIC_RESTRICTION', 16977: 'MOSAIC_ADDRESS_RESTRICTION', 16978: 'SECRET_PROOF', 17220: 'NAMESPACE_METADATA', 17229: 'MOSAIC_SUPPLY_REVOCATION', 17230: 'MOSAIC_ALIAS', 17232: 'ACCOUNT_OPERATION_RESTRICTION'
```

Il tipo del messaggio è il seguente.

```js
{0: 'PlainMessage', 1: 'EncryptedMessage', 254: 'PersistentHarvestingDelegationMessage', -1: 'RawMessage'}
```

## 4.6 Gruppo di transazioni

Più transazioni si possono raggruppare in una che le contiene.  
La rete blockchain pubblica Symbol, ammette che un gruppo di transazioni contenga fino a
100 transazioni, ciascuna con un massimo di 25 cointestatari.
Nei seguenti capitoli saranno mostrate funzionalità che prescrivono la comprensione del concetto
di gruppo di transazioni.
In questo capitolo introduciamo solo il caso più semplice di gruppo di transazioni.

### Caso della firma obbligatoria all'origine

```js
bob = sym.Account.generateNewAccount(networkType);
carol = sym.Account.generateNewAccount(networkType);

innerTx1 = sym.TransferTransaction.create(
  undefined, //Deadline
  bob.address, //Destinatario
  [],
  sym.PlainMessage.create("tx1"),
  networkType,
);

innerTx2 = sym.TransferTransaction.create(
  undefined, //Deadline
  carol.address, //Destinatario
  [],
  sym.PlainMessage.create("tx2"),
  networkType,
);

aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [
    innerTx1.toAggregate(alice.publicAccount), //Chiave pubblica del mittente
    innerTx2.toAggregate(alice.publicAccount), //Chiave pubblica del mittente
  ],
  networkType,
  [],
  sym.UInt64.fromUint(1000000),
);
signedTx = alice.sign(aggregateTx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

Come primo passo, creare le transazioni da includere nel gruppo di transazioni.
Non è necesserio dichiarare la scadenza in questa fase.
Quando si crea la lista, valorizzare il campo `toAggregate` nella transazione
di gruppo, con la chiave pubblica dell'Indirizzo del mittente.
Notare che il mittente e il firmatario **possono non coincidere**, ciò dipende dal caso d'uso.
Ad esempio il caso in cui, 'Alice firma una transazione che ha inviato Bob', verrà spiegato nei prossimi capitoli.
Tale concetto è il più importante per utilizzare le transazioni nella blockchain Symbol.
In questo capitolo le transazioni sono inviate e firmate da Alice, così anche la
firma nella transazione di gruppo è quella di Alice.

## 4.7 Consigli pratici

### Prova di paternità (Proof of existence), marca temporale

Il capitolo sugli Indirizzi ha descritto come firmare e verificare i dati di un Indirizzo.
Se tali dati ottengono la conferma di convalida con una transazione nella blockchain,
saranno impossibili da cancellare, quindi sarà impossibile negare che un Indirizzo
ne abbia la paternità in quel momento, assolvendo al contempo la funzione di marca temporale del documento o dato.
E' equivalente alla prova di paternità con marcatura temporale tra soggetti intestatari di firma digitale (firma eletrronica
avanzata a chiavi asimmetriche).
La blockchain registra/aggiorna i dati con le transazioni la cui esistenza è un fatto indelebile generato dall'Indirizzo.
Esponiamo due casi d'uso di prova di esistenza certificada da transazione.

#### Output del metodo che calcola l'impronta digitale con valore hash (SHA256)

Si può provare l'esistenza di un file registrandone l'impronta digitale (digest) nella blockchain.

Il calcolo del valore hash con il metodo SHA256 a seconda dal sistema operativo di origine, è il seguente.

```sh
#Windows
certutil -hashfile WINfilepath SHA256
#Mac
shasum -a 256 MACfilepath
#Linux
sha256sum Linuxfilepath
```

#### Suddividere grandi moli di dati

Essendo il carico del messaggio di una transazione, limitato a 1023 Byte,
Una sequenza lunga di informazioni potrebbe essere suddivisa in più transazioni
poi raggruppate in una sola.

```js
bigdata =
  "C00200000000000093B0B985101C1BDD1BC2BF30D72F35E34265B3F381ECA464733E147A4F0A6B9353547E2E08189EF37E50D271BEB5F09B81CE5816BB34A153D2268520AF630A0A0E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26000000000198414140770200000000002A769FB40000000076B455CFAE2CCDA9C282BF8556D3E9C9C0DE18B0CBE6660ACCF86EB54AC51B33B001000000000000DB000000000000000E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26000000000198544198205C1A4CE06C45B3A896B1B2360E03633B9F36BF7F22338B000000000000000066653465353435393833444430383935303645394533424446434235313637433046394232384135344536463032413837364535303734423641303337414643414233303344383841303630353343353345354235413835323835443639434132364235343233343032364244444331443133343139464435353438323930334242453038423832304100000000006800000000000000B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D000000000198444198205C1A4CE06C45B3A896B1B2360E03633B9F36BF7F2233BC089179EBBE01A81400140035383435344434373631364336433635373237396800000000000000B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D000000000198444198205C1A4CE06C45B3A896B1B2360E03633B9F36BF7F223345ECB996EDDB9BEB1400140035383435344434373631364336433635373237390000000000000000B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D5A71EBA9C924EFA146897BE6C9BB3DACEFA26A07D687AC4A83C9B03087640E2D1DDAE952E9DDBC33312E2C8D021B4CC0435852C0756B1EBD983FCE221A981D02";

let payloads = [];
for (let i = 0; i < bigdata.length / 1023; i++) {
  payloads.push(bigdata.substr(i * 1023, 1023));
}
console.log(payloads);
```
