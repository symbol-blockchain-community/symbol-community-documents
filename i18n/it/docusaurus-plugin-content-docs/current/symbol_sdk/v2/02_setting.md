# 2.Impostare l'ambiente di sviluppo

Questa sezione descrive come leggere il documento

## 2.1 Linguaggio di programmazione

Tutto il codice sorgente riportato nel libro è scritto in JavaScript

### SDK

symbol-sdk-typescript-javascript v2.0.0  
https://github.com/symbol/symbol-sdk-typescript-javascript

Caricare l'SDK precedente come 'browserify' nella console di sviluppo del browser (F12)  
https://github.com/xembook/nem2-browserify

##### Nota

Al momento della scrittura di questo documento la versione corrente
dell'SDK symbol-sdk v3.0.0 è rilasciata in versione alpha,
la versione 2.0.3 è deprecata. La versione 3 ha eliminato molte delle dipendenze
con rxjs perciò è preferibile fare chiamate dirette alle API REST.

### Riferimenti alla documentazione

Symbol SDK for TypeScript and JavaScript  
https://symbol.github.io/symbol-sdk-typescript-javascript/1.0.3/

Catapult REST Endpoints (1.0.3)  
https://symbol.github.io/symbol-openapi/v1.0.3/

## 2.2 Codice sorgente degli esempi

### Dichiarazione di variabile

In questo documento, le dichiarazioni 'const' non vengono usate.
Ciò si deve alla necessità di riscrivere ripetendo sulla console
per eseguire la verifica del funzionamento.
Nello sviluppo di applicazioni, assicurarsi di utilizzare dichiarazioni const a scopo di sicurezza.

### Controllo del valore in uscita

Console.log() restituisce il contenuto della variabile. Provare le funzioni di output
a propria discrezione. L'output compare dopo '>' non includerlo dall'esempio.

### Modo sincrono e asincrono

Alcuni sviluppatori abituati con altri linguaggi potrebbero trovarsi scomodi
a scrivere processi asincroni, quindi a meno che non ci sia una ragione particolare,
le spiegazioni sono date in modalità sincrona.

### Indirizzi

#### Alice

Questo manuale si concentra sull'indirizzo di Alice. Continueremo ad utilizzare
l'indirizzo di Alice creato nel capitolo 3, anche nei capitoli successivi.
Per continuare la lettura di questo manuale, inviarci un quantitativo sufficiente di XYM.

#### Bob

Verrà creato un indirizzo di Bob per le transazioni con Alice, come richiesto nei successivi capitoli.
Altri, per esempio Carol, verrano usati nei capitoli dedicati alla cointestazione.

### Commissioni

In questo documento, le transazioni saranno create impostando il parametro 'moltiplicatore' valorizzato a 100.

## 2.3 Prescrizioni

Dalla lista dei nodi, apri con il browser la pagina relativa ad un nodo qualsiasi.
Questo manuale assume di lavorare con la rete di test "Testnet".

- Testnet
  - https://symbolnodes.org/nodes_testnet/
- Mainnet
  - https://symbolnodes.org/nodes/

Premere F12 per aprire la console di sviluppo del browser, e incollare lo script seguente.

```js
(script = document.createElement("script")).src =
  "https://xembook.github.io/nem2-browserify/symbol-sdk-pack-2.0.0.js";
document.getElementsByTagName("head")[0].appendChild(script);
```

Quindi, eseguire le istruzioni in comune a tutti i capitoli.

```js
NODE = window.origin; //The URL of the page is shown here.
sym = require("/node_modules/symbol-sdk");
repo = new sym.RepositoryFactoryHttp(NODE);
txRepo = repo.createTransactionRepository();
(async () => {
  networkType = await repo.getNetworkType().toPromise();
  generationHash = await repo.getGenerationHash().toPromise();
  epochAdjustment = await repo.getEpochAdjustment().toPromise();
})();
function clog(signedTx) {
  console.log(NODE + "/transactionStatus/" + signedTx.hash);
  console.log(NODE + "/transactions/confirmed/" + signedTx.hash);
  console.log("https://symbol.fyi/transactions/" + signedTx.hash);
  console.log("https://testnet.symbol.fyi/transactions/" + signedTx.hash);
}
```

L'ambiente è ora pronto.
Se il contenuto di questo manuale dovesse creare confusione, fare riferimento all'articolo di Qiita.

[Symbol ブロックチェーンのテストネットで送金を体験する](https://qiita.com/nem_takanobu/items/e2b1f0aafe7a2df0fe1b)
