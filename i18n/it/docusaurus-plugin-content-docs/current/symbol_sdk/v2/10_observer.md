# 10. Monitoraggio

I nodi della rete Symbol ricevono o inviano notifiche di cambi di stato o eventi attraverso la tecnologia di comunicazione WebSocket. 

## 10.1 Configurazione del Listener

Creazione di un WebSocket e configurazione del listener.

```js
nsRepo = repo.createNamespaceRepository();
wsEndpoint = NODE.replace("http", "ws") + "/ws";
listener = new sym.Listener(wsEndpoint, nsRepo, WebSocket);
listener.open();
```

Segue il formato per collegarsi ad un endpoint.

- wss://{node url}:3001/ws

Il timeout per mantenere attiva la connessione è di 1 minuto, oltre il quale, se non c'è stato scambio di informazioni il listener viene scollegato.

## 10.2 Ricevere notifiche sulle ransazioni

Per essere notificati delle transazioni convalidate (`confirmed`) che interessano un Indirizzo specificato (per es. Alice), si chiamano i seguenti metodi. Similmente per quelle propagate e non ancora convalidate.

```js
listener.open().then(() => {
  //Sottoscrive per ricevere notifiche di transazioni convalidate
  listener.confirmed(alice.address).subscribe((tx) => {
    //Stampa il dettaglio alla ricezione della notifica
    console.log(tx);
  });
  //Sottoscrive per ricevere notifiche di transazioni propagate non ancora convalidate
  listener.unconfirmedAdded(alice.address).subscribe((tx) => {
    //Stampa il dettaglio alla ricezione della notifica
    console.log(tx);
  });
});
```

Dopo aver impostato il listener, propaghiamo una transazione di test all'Indirizzo di Alice ottenendo quanto segue come notifica.

###### Output esemplificativo

```js
> Promise {<pending>}
> TransferTransaction {type: 16724, networkType: 152, version: 1, deadline: Deadline, maxFee: UInt64, …}
    deadline: Deadline {adjustedValue: 12449258375}
    maxFee: UInt64 {lower: 32000, higher: 0}
    message: RawMessage {type: -1, payload: ''}
    mosaics: []
    networkType: 152
    payloadSize: undefined
    recipientAddress: Address {address: 'TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ', networkType: 152}
    signature: "914B625F3013635FA9C99B2F138C47CD75F6E1DF7BDDA291E449390178EB461AA389522FA126D506405163CC8BA51FA9019E0522E3FA9FED7C2F857F11FBCC09"
    signer: PublicAccount {publicKey: 'D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2', address: Address}
    transactionInfo: TransactionInfo
        hash: "3B21D8842EB70A780A662CCA19B8B030E2D5C7FB4C54BDA8B3C3760F0B35FECE"
        height: UInt64 {lower: 316771, higher: 0}
        id: undefined
        index: undefined
        merkleComponentHash: "3B21D8842EB70A780A662CCA19B8B030E2D5C7FB4C54BDA8B3C3760F0B35FECE"
    type: 16724
    version: 1
```

Come si può verificare dai dati al campo `height`, le transazioni non ancora convalidate sono valorizzate con l'altezza del blocco a 0.

## 10.3 Ricevere notifiche sui blocchi 

Per venire informati alla creazione dei nuovi blocchi.

```js
listener.open().then(() => {
  //sottoscrizione all'evento di nuovo blocco della blockchain
  listener.newBlock().subscribe((block) => console.log(block));
});
```

###### Output esemplificativo

```js
> Promise {<pending>}
> NewBlock
    beneficiaryAddress: Address {address: 'TAKATV2VSYBH3RX4JVCCILITWANT6JRANZI2AUQ', networkType: 152}
    blockReceiptsHash: "ABDDB66A03A270E4815C256A8125B70FC3B7EFC4B95FF5ECAD517CB1AB5F5334"
    blockTransactionsHash: "0000000000000000000000000000000000000000000000000000000000000000"
    difficulty: UInt64 {lower: 1316134912, higher: 2328}
    feeMultiplier: 0
    generationHash: "5B4F32D3F2CDD17917D530A6A967927D93F73F2B52CC590A64E3E94408D8CE96"
    hash: "E8294BDDDAE32E17242DF655805EC0FCAB3B628A331824B87A3CA7578683B09C"
    height: UInt64 {lower: 316759, higher: 0}
    networkType: 152
    previousBlockHash: "38382D616772682321D58046511DD942F36A463155C5B7FB0A2CBEE8E29B253C"
    proofGamma: "37187F1C8BD8C87CB4F000F353ACE5717D988BC220EFBCC25E2F40B1FB9B7D7A"
    proofScalar: "AD91A572E5D81EA92FE313CA00915E5A497F60315C63023A52E292E55345F705"
    proofVerificationHash: "EF58228B3EB3C422289626935DADEF11"
    signature: "A9481E5976EDA86B74433E8BCC8495788BA2B9BE0A50F9435AD90A14D1E362D934BA26069182C373783F835E55D7F3681817716295EC1EFB5F2375B6DE302801"
    signer: PublicAccount {publicKey: 'F2195B3FAFBA3DF8C31CFBD9D5BE95BB3F3A04BDB877C59EFB9D1C54ED2DC50E', address: Address}
    stateHash: "4A1C828B34DE47759C2D717845830BA14287A4EC7220B75494BDC31E9539FCB5"
    timestamp: UInt64 {lower: 3851456497, higher: 2}
    type: 33091
    version: 1
```

Sottoscrivendo l'evento `listener.newBlock()`, la frequenza delle notifiche sarà di circa una ogni 30 secondi, e la probabilità di disconnessione per inattività sarà bassa.

In alcuni rari casi, il tempo per la generazione di un nuovo blocco potrebbe superare il minuto e il listener deve eseguire una riconnessione (Altri fattori potrebbero innescare la disconnessione perciò si consiglia di aggiungere altre chiamate di sottoscrizione come quelle descritte nella prossima sezione).

## 10.4 Richieste di firma

Notifica dell'evento di una transazione che richiede la firma.

```js
listener.open().then(() => {
  //Evento di transazione di gruppo bonded che necessita la firma
  listener
    .aggregateBondedAdded(alice.address)
    .subscribe(async (tx) => console.log(tx));
});
```

###### Output esemplificativo

```js
> AggregateTransaction
    cosignatures: []
    deadline: Deadline {adjustedValue: 12450154608}
  > innerTransactions: Array(2)
        0: TransferTransaction {type: 16724, networkType: 152, version: 1, deadline: Deadline, maxFee: UInt64, …}
        1: TransferTransaction {type: 16724, networkType: 152, version: 1, deadline: Deadline, maxFee: UInt64, …}
    maxFee: UInt64 {lower: 94400, higher: 0}
    networkType: 152
    signature: "972968C5A2FB70C1D644BE206A190C4FCFDA98976F371DBB70D66A3AAEBCFC4B26E7833BCB86C407879C07927F6882C752C7012C265C2357CAA52C29834EFD0F"
    signer: PublicAccount {publicKey: '0E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26', address: Address}
  > transactionInfo: TransactionInfo
        hash: "44B2CD891DA0B788F1DD5D5AB24866A9A172C80C1749DCB6EB62255A2497EA08"
        height: UInt64 {lower: 0, higher: 0}
        id: undefined
        index: undefined
        merkleComponentHash: "0000000000000000000000000000000000000000000000000000000000000000"
    type: 16961
    version: 1
```

Tutte le transazioni aggregate che fanno riferimento all'Indirizzo specificato verranno notificate.
L'evento relativo alla firma di un Indirizzo cointestato è distinto da questo e si userà un altro filtro apposito.

## 10.5 Consigli pratici

### Connessione perpetua

Scegliere dalla lista dei nodi uno che possa andar bene e tentare la connessione.

##### Collegamento ad un nodo 

```js
//lista dei nodi
NODES = ["https://node.com:3001",...];
function connectNode(nodes) {
    const node = nodes[Math.floor(Math.random() * nodes.length)] ;
    console.log("tentativo con:" + node);
    return new Promise((resolve, reject) => {
        let req = new XMLHttpRequest();
        req.timeout = 2000; //timeout value:2sec(=2000ms)
        req.open('GET', node + "/node/health", true);
        req.onload = function() {
            if (req.status === 200) {
                const status = JSON.parse(req.responseText).status;
                if(status.apiNode == "up" && status.db == "up"){
                    return resolve(node);
                }else{
                    console.log("fail node status:" + status);
                    return connectNode(nodes).then(node => resolve(node));
                }
            } else {
                console.log("fail request status:" + req.status)
                return connectNode(nodes).then(node => resolve(node));
            }
        };
        req.onerror = function(e) {
            console.log("onerror:" + e)
            return connectNode(nodes).then(node => resolve(node));
        };
        req.ontimeout = function (e) {
            console.log("ontimeout")
            return connectNode(nodes).then(node => resolve(node));
        };
    req.send();
    });
}
```

Nel caso in cui i tempi di risposta del nodo siano alti, impostare un timeout e cambiare nodo.
Controllare anche il valore della risposta ad una richiesta `/node/health` e ricontrollare se lo stato del nodo non è normale.

##### Istanziare il repository

```js
function createRepo(nodes) {
  return connectNode(nodes).then(async function onFulfilled(node) {
    const repo = new sym.RepositoryFactoryHttp(node);
    try {
      epochAdjustment = await repo.getEpochAdjustment().toPromise();
    } catch (error) {
      console.log("fail createRepo");
      return await createRepo(nodes);
    }
    return await repo;
  });
}
```

Eventualmente, alcuni nodi potrebbero non aver liberato la connessione al servizio `/network/properties`, succede raramente, ma la chiamata `getEpochAdjustment()` andrebbe controllata. Se non va a buon fine, andare in ricorsione su `createRepo`.

##### listeners delle connessioni perpetue

```js
async function listenerKeepOpening(nodes) {
  const repo = await createRepo(NODES);
  let wsEndpoint = repo.url.replace("http", "ws") + "/ws";
  const nsRepo = repo.createNamespaceRepository();
  const lner = new sym.Listener(wsEndpoint, nsRepo, WebSocket);
  try {
    await lner.open();
    lner.newBlock();
  } catch (e) {
    console.log("fail websocket");
    return await listenerKeepOpening(nodes);
  }
  lner.webSocket.onclose = async function () {
    console.log("listener onclose");
    return await listenerKeepOpening(nodes);
  };
  return lner;
}
```

Alla disconnessione del listener, si ricollega.

##### Attivare il listener.

```js
listener = await listenerKeepOpening(NODES);
```

### Firma automatica di transazioni non firmate

Individuare transazioni non firmate e quindi firmarle e propagarle ai nodi della rete.
Sono necessari due pattern di notifica: il primo al caricamento della pagina il secondo durante visualizzazione.

```js
//legge rxjs.operators
op = require("/node_modules/rxjs/operators");
rxjs = require("/node_modules/rxjs");

//Aggancia le notifiche per transazioni aggregate
bondedListener = listener.aggregateBondedAdded(bob.address);
bondedHttp = txRepo
  .search({ address: bob.address, group: sym.TransactionGroup.Partial })
  .pipe(
    op.delay(2000),
    op.mergeMap((page) => page.data)
  );
//Imposta i listener per le transazioni confermate relative agli Indirizzi di interessse
const statusChanged = function (address, hash) {
  const transactionObservable = listener.confirmed(address);
  const errorObservable = listener.status(address, hash);
  return rxjs.merge(transactionObservable, errorObservable).pipe(
    op.first(),
    op.map((errorOrTransaction) => {
      if (errorOrTransaction.constructor.name === "TransactionStatusError") {
        throw new Error(errorOrTransaction.code);
      } else {
        return errorOrTransaction;
      }
    })
  );
};
//Esecuzione delle firme dei cofirmatari
function exeAggregateBondedCosignature(tx) {
  txRepo
    .getTransactionsById(
      [tx.transactionInfo.hash],
      sym.TransactionGroup.Partial
    )
    .pipe(
      //Solo nel caso di transazione notificata
      op.filter((aggTx) => aggTx.length > 0)
    )
    .subscribe(async (aggTx) => {
      //Se il mio Indirizzo è in firma
      if (
        aggTx[0].innerTransactions.find((inTx) =>
          inTx.signer.equals(bob.publicAccount)
        ) != undefined
      ) {
        //Transazione con la firma di Alice
        const cosignatureTx = sym.CosignatureTransaction.create(aggTx[0]);
        const signedTx = bob.signCosignatureTransaction(cosignatureTx);
        const cosignedAggTx = await txRepo
          .announceAggregateBondedCosignature(signedTx)
          .toPromise();
        statusChanged(bob.address, signedTx.parentHash).subscribe((res) => {
          console.log(res);
        });
      }
    });
}
bondedSubscribe = function (observer) {
  observer
    .pipe(
      //Se non è già stata firmata
      op.filter((tx) => {
        return !tx.signedByAccount(
          sym.PublicAccount.createFromPublicKey(bob.publicKey, networkType)
        );
      })
    )
    .subscribe((tx) => {
      console.log(tx);
      exeAggregateBondedCosignature(tx);
    });
};
bondedSubscribe(bondedListener);
bondedSubscribe(bondedHttp);
```

##### Note

E' molto importante, per evitare di firmare automaticamente con il nostro Indirizzo transazioni fraudolente, ricordarsi di impostare una logica di controllo/filtro, per esempio verificando l'Indirizzo di chi ha inviato/creato la transazione.
