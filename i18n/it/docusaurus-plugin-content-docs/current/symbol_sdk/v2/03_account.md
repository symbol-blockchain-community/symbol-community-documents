# 3. Indirizzo sulla catena di blocchi

Un indirizzo è una struttura dati di memorizzazione delle informazioni,
divenute beni di proprietà perchè associati ad una chiave privata.
Condizione necessaria e sufficiente per la loro registrazione e aggiornamento nella blockchain
è applicarvi l'operazione di firma con la chiave privata dell'Indirizzo.

## 3.1 Creazione di un indirizzo

L'Indirizzo contiene una coppia di chiavi, ovvero un insieme di chiavi pubbliche
e chiavi private, il nome dell'Indirizzo stesso e altre informazioni.
Per prima cosa, creeremo un Indirizzo casuale e controlleremo le informazioni ivi contenute.

### Creazione di un nuovo Indirizzo

```js
alice = sym.Account.generateNewAccount(networkType);
console.log(alice);
```

###### Output esemplificativo

```js
> Account
    address: Address {address: 'TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ', networkType: 152}
    keyPair: {privateKey: Uint8Array(32), publicKey: Uint8Array(32)}
```

###### indicazione dei valori per i tipi di rete (networkType).

```js
{104: 'MAIN_NET', 152: 'TEST_NET'}
```

### Estrarre la chiave privata e la chiave pubblica

```js
console.log(alice.privateKey);
console.log(alice.publicKey);
```

```
> 1E9139CC1580B4AED6A1FE110085281D4982ED0D89CE07F3380EB83069B1****
> D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2
```

#### Note

La perdita della chiave privata implica la perdita irrevocabile di ogni dato interno all'Indirizzo,
tutte le quantità finanziarie andranno perse. Inoltre la chiave privata non deve essere condivisa
con terze parti eccezzion fatta per i casi in cui sia necessario fornire il controllo completo dell'Indirizzo.
Nello sviluppo di web services generici, le password vengono memorizzate in un "account ID",
in modo da poter cambiare le password partendo dall'Indirizzo. Diversamente nella blockchain,
l'ID (Indirizzo) è univocamente legato alla chiave privata che svolge la funzione di password,
quindi non è possibile cambiare o rigenerare la chiave privata associata ad un Indirizzo partendo dal nome.

### Calcolo del nome dell'Indirizzo

```js
aliceRawAddress = alice.address.plain();
console.log(aliceRawAddress);
```

```js
> TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ
```

###### Quanto esposto prima costituisce le informazioni di base per operare con la blockchain. E' utile provare a creare Indirizzi dalla chiave privata ma anche creare classi che si istanziano dalla chiave pubblica o dal nome dell'Indirizzo.

### Creazione di un Indirizzo a partire dalla chiave privata

```js
alice = sym.Account.createFromPrivateKey(
  "1E9139CC1580B4AED6A1FE110085281D4982ED0D89CE07F3380EB83069B1****",
  networkType,
);
```

### Istanziare la classe Indirizzo pubblico partendo dalla chiave pubblica

```js
alicePublicAccount = sym.PublicAccount.createFromPublicKey(
  "D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2",
  networkType,
);
console.log(alicePublicAccount);
```

###### Output esemplificativo

```js
> PublicAccount
    address: Address {address: 'TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ', networkType: 152}
    publicKey: "D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2"

```

### Istanziare la classe Indirizzo

```js
aliceAddress = sym.Address.createFromRawAddress(
  "TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ",
);
console.log(aliceAddress);
```

###### Output esemplificativo

```js
> Address
    address: "TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ"
    networkType: 152
```

## 3.2 Trasferimento verso un Indirizzo

Creare un Indirizzo non è sufficiente a trasferire informazioni nella blockchain.
Le blockchain pubbliche obbligano a versare delle commissioni di trasferimento dati
quando si consumano risorse.
Nella blockchain Symbol, le commissioni si pagano con il token nativo chiamato XYM.
Una quantità di XYM sarà trasferita all'Indirizzo dopo averlo creato, a copertura delle commissioni
della transazione (come vedremo in seguito).

### Ricezione di XYM dal faucet

Monete XYM della rete di test (testnet) si possono ricevere senza costi dal rubinetto 'faucet'.
Per eseguire transazioni sulla rete di produzione (mainnet), gli XYM possono
essere acquistati nei siti di cambiovaluta (exchange), o dai servizi
di donazioni per prestazioni occasionali, quali NEMLOG e QUEST.

Testnet

- FAUCET
  - https://testnet.symbol.tools/

Mainnet

- NEMLOG
  - https://nemlog.nem.social/
- QUEST
  - https://quest-bc.com/

### Ispezionare la blockchain con l'explorer

L'applicazione web 'explorer' ritorna l'elenco delle transazioni, compresa quella dal faucet al nostro Indirizzo
appena creato.

- Testnet
  - https://testnet.symbol.fyi/
- Mainnet
  - https://symbol.fyi/

## 3.3 Verifica dei dati di un indirizzo

Per la verifica è necessario recuperare le informazioni dell'Indirizzo memorizzate in un nodo della rete.

### Recuperare la lista dei Mosaic associati all'Indirizzo

```js
accountRepo = repo.createAccountRepository();
accountInfo = await accountRepo.getAccountInfo(aliceAddress).toPromise();
console.log(accountInfo);
```

###### Output esemplificativo

```js
> AccountInfo
    address: Address {address: 'TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ', networkType: 152}
    publicKey: "0000000000000000000000000000000000000000000000000000000000000000"
  > mosaics: Array(1)
      0: Mosaic
        amount: UInt64 {lower: 10000000, higher: 0}
        id: MosaicId
          id: Id {lower: 760461000, higher: 981735131}
```

#### publicKey

Tutte le informazioni di un Indirizzo appena creato dal client non verranno memorizzate nella blockchain
se l'Indirizzo non sarà oggetto di una transazione. Ciò spiega il valore `00000...` ritornato per la chiave pubblica.

#### UInt64

Per ovviare ai limiti dei tipi del linguaggio JavaScript e conseguenti overflow numerici, i campi `ID` e `amount`
sono definiti come tipo `UInt64` dichiarato nell'SDK . Usare `String()` per la conversione in stringa,
`compact()` per convertire in numero e `toHex()` per convertire in esadecimale.

```js
console.log("addressHeight:"); //Altezza del blocco in cui l'Indirizzo è memorizzato
console.log(accountInfo.addressHeight.compact()); //Numerici
accountInfo.mosaics.forEach((mosaic) => {
  console.log("id:" + mosaic.id.toHex()); //Esadecimale
  console.log("amount:" + mosaic.amount.toString()); //Stringa
});
```

Scambiare un valore di tipo `ID` grande con un valore numerico di tipo `COMPACT` potrebbe dare errore.

`La dimensione di un COMPACT è maggiore di  Number.Max_Value.`

#### Impostare il fattore di scala

Il numero di token che si possiedono è un numero intero per evitare errori di arrotondamento. Possiamo recuperare il fattore di scala dall'istanza di definizione del token per visualizzare il numero corretto di quanti se ne possiedono.

```js
mosaicRepo = repo.createMosaicRepository();
mosaicAmount = accountInfo.mosaics[0].amount.toString();
mosaicInfo = await mosaicRepo.getMosaic(accountInfo.mosaics[0].id).toPromise();
divisibility = mosaicInfo.divisibility; //fattore di scala
if (divisibility > 0) {
  displayAmount =
    mosaicAmount.slice(0, mosaicAmount.length - divisibility) || "0" +
    "." +
    mosaicAmount.slice(-divisibility);
} else {
  displayAmount = mosaicAmount;
}
console.log(displayAmount);
```

## 3.4 Consigli pratici

### Cifratura e firma

La chiave privata, ma anche la pubblica di un Indirizzo, possono essere usate per operazioni di
cifratura e firma digitale. Si possono verificare la segretezza e la paternità ai due estremi
di una comunicazione, persino in condizioni di applicazioni inaffidabili.

#### Prova avanzata: creare l'Indirizzo di Bob per un test di trasmissione

```js
bob = sym.Account.generateNewAccount(networkType);
bobPublicAccount = bob.publicAccount;
```

#### Cifratura

Cifrare un messaggio con la chiave privata di Alice, poi cifrarlo con la chiave pubblica di Bob,
il risultato ottenuto decifrarlo con la chiave privata di Bob, poi con la chiave pubblica di Alice (formato AES-GCM).

```js
message = "Hello Symbol!";
encryptedMessage = alice.encryptMessage(message, bob.publicAccount);
console.log(encryptedMessage);
```

```js
> 294C8979156C0D941270BAC191F7C689E93371EDBC36ADD8B920CF494012A97BA2D1A3759F9A6D55D5957E9D
```

#### Decrypt

```js
decryptMessage = bob.decryptMessage(
  new sym.EncryptedMessage(
    "294C8979156C0D941270BAC191F7C689E93371EDBC36ADD8B920CF494012A97BA2D1A3759F9A6D55D5957E9D",
  ),
  alice.publicAccount,
).payload;
console.log(decryptMessage);
```

```js
> "Hello Symbol!"
```

#### Firma

Firma del messaggio con la chiave privata di Alice e verifica della firma con la chiave pubblica di Alice.

```js
Buffer = require("/node_modules/buffer").Buffer;
payload = Buffer.from("Hello Symol!", "utf-8");
signature = Buffer.from(sym.KeyPair.sign(alice.keyPair, payload))
  .toString("hex")
  .toUpperCase();
console.log(signature);
```

```
> B8A9BCDE9246BB5780A8DED0F4D5DFC80020BBB7360B863EC1F9C62CAFA8686049F39A9F403CB4E66104754A6AEDEF8F6B4AC79E9416DEEDC176FDD24AFEC60E
```

#### Verifica

```js
isVerified = sym.KeyPair.verify(
  alice.keyPair.publicKey,
  Buffer.from("Hello Symol!", "utf-8"),
  Buffer.from(signature, "hex"),
);
console.log(isVerified);
```

```js
> true
```

Notare che se le firme non usano la blockchain possono essere riutilizzate più volte.

### Gestione dell'Indirizzo

Questa sezione spiega come gestire il tuo Indirizzo.
Le chiavi private non dovrebbero essere memorizzate in chiaro; ecco come cifrare e
memorizzare la tua chiave privata con una password chiamando la libreria `symbol-qr-library`.

#### Cifratura della chiave privata

```js
qr = require("/node_modules/symbol-qr-library");

//Creazione di un Indirizzo protetto da password
signerQR = qr.QRCodeGenerator.createExportAccount(
  alice.privateKey,
  networkType,
  generationHash,
  "Passphrase",
);

//Mostra il QR code
signerQR.toBase64().subscribe((x) => {
  //Esempio per visualizzare il QR code per linguaggio HTML
  (tag = document.createElement("img")).src = x;
  document.getElementsByTagName("body")[0].appendChild(tag);
});

//Visualizzare un Indirizzo cifrato nel formato JSON
jsonSignerQR = signerQR.toJSON();
console.log(jsonSignerQR);
```

###### Output esemplificativo

```js
> {"v":3,"type":2,"network_id":152,"chain_id":"7FCCD304802016BEBBCD342A332F91FF1F3BB5E902988B352697BE245F48E836","data":{"ciphertext":"e9e2f76cb482fd054bc13b7ca7c9d086E7VxeGS/N8n1WGTc5MwshNMxUiOpSV2CNagtc6dDZ7rVZcnHXrrESS06CtDTLdD7qrNZEZAi166ucDUgk4Yst0P/XJfesCpXRxlzzNgcK8Q=","salt":"54de9318a44cc8990e01baba1bcb92fa111d5bcc0b02ffc6544d2816989dc0e9"}}
```

Il QR code o il testo di questo `jsonSignerQR` può essere salvato per estrarre la chiave privata in qualsiasi momento.

#### Decifrare una chiave privata cifrata

```js
//Assegnazione di testo o testo recuperato da una scansione di un QR code nel formato json signer QR
jsonSignerQR =
  '{"v":3,"type":2,"network_id":152,"chain_id":"7FCCD304802016BEBBCD342A332F91FF1F3BB5E902988B352697BE245F48E836","data":{"ciphertext":"e9e2f76cb482fd054bc13b7ca7c9d086E7VxeGS/N8n1WGTc5MwshNMxUiOpSV2CNagtc6dDZ7rVZcnHXrrESS06CtDTLdD7qrNZEZAi166ucDUgk4Yst0P/XJfesCpXRxlzzNgcK8Q=","salt":"54de9318a44cc8990e01baba1bcb92fa111d5bcc0b02ffc6544d2816989dc0e9"}}';

qr = require("/node_modules/symbol-qr-library");
signerQR = qr.AccountQR.fromJSON(jsonSignerQR, "Passphrase");
console.log(signerQR.accountPrivateKey);
```

###### Output esemplificativo

```js
> 1E9139CC1580B4AED6A1FE110085281D4982ED0D89CE07F3380EB83069B1****
```
