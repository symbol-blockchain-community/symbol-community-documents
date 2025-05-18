# 11. Impostare restrizioni

Questa sezione descrive come imporre delle restrizioni sugli Indirizzi e restrizioni globali sui Mosaic.
In questo capitolo limiteremo i permessi di Indirizzi, quindi creiamo un nuovo Indirizzo per lo scopo.

```js
//Creazione di un Indirizzo Carol
carol = sym.Account.generateNewAccount(networkType);
console.log(carol.address);

//URL del faucet
console.log(
  "https://testnet.symbol.tools/?recipient=" +
    carol.address.plain() +
    "&amount=100",
);
```

## 11.1 Restrizioni sugli Indirizzi

### Specificare gli indirizzi a cui applicare le restrizioni per transazioni in entrata e in uscita

```js
bob = sym.Account.generateNewAccount(networkType);

tx =
  sym.AccountRestrictionTransaction.createAddressRestrictionModificationTransaction(
    sym.Deadline.create(epochAdjustment),
    sym.AddressRestrictionFlag.BlockIncomingAddress, //flag delle restrizioni per gli indirizzi
    [bob.address], //Indirizzo che compie l'operazione
    [], //Indirizzo su cui applicare l'operazione di cancellazione
    networkType,
  ).setMaxFee(100);
signedTx = carol.sign(tx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

Per `AddressRestrictionFlag` i valori ammessi sono:

```js
{1: 'AllowIncomingAddress', 16385: 'AllowOutgoingAddress', 32769: 'BlockIncomingAddress', 49153: 'BlockOutgoingAddress'}
```

Descrizione dei flag che possono essere specificati quando si usa `AddressRestrictionFlag`:

- `AllowIncomingAddress`：Accetta transazioni solo dagli Indirizzi specificati
- `AllowOutgoingAddress`：Esegue transazioni in uscita solo verso gli Indirizzi specificati
- `BlockIncomingAddress`：Rifiuta transazioni che provengono dagli Indirizzi specificati
- `BlockOutgoingAddress`：Impedisce transazioni in uscita verso gli Indirizzi specificati

### Restrizioni sul ricevimento di determinati Mosaic

```js
mosaicId = new sym.MosaicId("72C0212E67A08BCE"); //XYM della rete Testnet
tx =
  sym.AccountRestrictionTransaction.createMosaicRestrictionModificationTransaction(
    sym.Deadline.create(epochAdjustment),
    sym.MosaicRestrictionFlag.BlockMosaic, //flag che specifica restrizioni su Mosaic
    [mosaicId], //Mosaic di interesse
    [], //Mosaic per operazioni di cancellazione
    networkType,
  ).setMaxFee(100);
signedTx = carol.sign(tx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

`MosaicRestrictionFlag` viene definito come segue:

```js
{2: 'AllowMosaic', 32770: 'BlockMosaic'}
```

- `AllowMosaic`：Accetta solamente transazioni che contengono determinati Mosaic
- `BlockMosaic`：Rifiuta transazioni in entrata che contangono determinati Mosaic

Non ci sono funzioni di restrizione per Mosaic oggetto di transazioni in uscita.
Fare attenzione a non confondere quanto appena detto con le restrizioni di Mosaic globali, che invece sono descriti in seguito.

### Restrizioni di transazioni specifiche

```js
tx =
  sym.AccountRestrictionTransaction.createOperationRestrictionModificationTransaction(
    sym.Deadline.create(epochAdjustment),
    sym.OperationRestrictionFlag.AllowOutgoingTransactionType,
    [sym.TransactionType.ACCOUNT_OPERATION_RESTRICTION], //transazione in oggetto
    [], //transazione per l'operazione di cancellazione
    networkType,
  ).setMaxFee(100);
signedTx = carol.sign(tx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

`OperationRestrictionFlag` è definita come segue:

```js
{16388: 'AllowOutgoingTransactionType', 49156: 'BlockOutgoingTransactionType'}
```

- `AllowOutgoingTransactionType`：Permette solo i tipi di transazioni specificati
- `BlockOutgoingTransactionType`：Impedisce le transazioni del tipo specificato

Non ci sono restrizioni per le ricevute di transazioni. Le operazioni previste sono le seguenti:

`TransactionType` ammette i seguenti valori:

```js
{16705: 'AGGREGATE_COMPLETE', 16707: 'VOTING_KEY_LINK', 16708: 'ACCOUNT_METADATA', 16712: 'HASH_LOCK', 16716: 'ACCOUNT_KEY_LINK', 16717: 'MOSAIC_DEFINITION', 16718: 'NAMESPACE_REGISTRATION', 16720: 'ACCOUNT_ADDRESS_RESTRICTION', 16721: 'MOSAIC_GLOBAL_RESTRICTION', 16722: 'SECRET_LOCK', 16724: 'TRANSFER', 16725: 'MULTISIG_ACCOUNT_MODIFICATION', 16961: 'AGGREGATE_BONDED', 16963: 'VRF_KEY_LINK', 16964: 'MOSAIC_METADATA', 16972: 'NODE_KEY_LINK', 16973: 'MOSAIC_SUPPLY_CHANGE', 16974: 'ADDRESS_ALIAS', 16976: 'ACCOUNT_MOSAIC_RESTRICTION', 16977: 'MOSAIC_ADDRESS_RESTRICTION', 16978: 'SECRET_PROOF', 17220: 'NAMESPACE_METADATA', 17229: 'MOSAIC_SUPPLY_REVOCATION', 17230: 'MOSAIC_ALIAS'}
```

##### Note

17232: `ACCOUNT_OPERATION_RESTRICTION` restriction is not permitted.
Significa che quando si usa `AllowOutgoingTransactionType`, si deve specificare `ACCOUNT_OPERATION_RESTRICTION`, inoltre se si usa `BlockOutgoingTransactionType`, non si può specificare `ACCOUNT_OPERATION_RESTRICTION`.

### Convalida

Per controllare che le restrizioni impostate sono state recepite

```js
resAccountRepo = repo.createRestrictionAccountRepository();

res = await resAccountRepo.getAccountRestrictions(carol.address).toPromise();
console.log(res);
```

###### Output esemplificativo

```js
> AccountRestrictions
    address: Address {address: 'TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ', networkType: 152}
  > restrictions: Array(2)
      0: AccountRestriction
        restrictionFlags: 32770
        values: Array(1)
          0: MosaicId
            id: Id {lower: 1360892257, higher: 309702839}
      1: AccountRestriction
        restrictionFlags: 49153
        values: Array(1)
          0: Address {address: 'TCW2ZW7LVJMS4LWUQ7W6NROASRE2G2QKSBVCIQY', networkType: 152}
```

## 11.2 Restrizioni globali sul Mosaic

Le restrizioni globali si applicano ai trasferimenti di Mosaic.  
Si imposta un valore numerico nei metadati di ogni Indirizzo interessato.  
Sarà possibile inviare il Mosaic solo se le condizioni verranno soddisfatte dagli Indirizzi mittente e destinatario.

Impostiamo le librerie.

```js
nsRepo = repo.createNamespaceRepository();
resMosaicRepo = repo.createRestrictionMosaicRepository();
mosaicResService = new sym.MosaicRestrictionTransactionService(
  resMosaicRepo,
  nsRepo,
);
```

### Creazione di un Mosaic al quale applicare le restrizioni globali

Impostare la proprietà `restrictable` a `true` quando si crea il Mosaic nell'Indirizzo di Carol.

```js
supplyMutable = true; //Indica la possibilità di cambiare la quantità di monete
transferable = true; //Indica la possibilità di trasferire le monete
restrictable = true; //Indica la possibilità di restrizioni globali
revokable = true; //Indica la possibilità che l'emittente ha di revocare il Mosaic emesso

nonce = sym.MosaicNonce.createRandom();
mosaicDefTx = sym.MosaicDefinitionTransaction.create(
  undefined,
  nonce,
  sym.MosaicId.createFromNonce(nonce, carol.address),
  sym.MosaicFlags.create(supplyMutable, transferable, restrictable, revokable),
  0, //divisibility
  sym.UInt64.fromUint(0), //periodo di validità
  networkType,
);

//Modifica della quantità di monete del Mosaic
mosaicChangeTx = sym.MosaicSupplyChangeTransaction.create(
  undefined,
  mosaicDefTx.mosaicId,
  sym.MosaicSupplyChangeAction.Increase,
  sym.UInt64.fromUint(1000000),
  networkType,
);

//Impostazione delle restrizioni globali sul Mosaic
key = sym.KeyGenerator.generateUInt64Key("KYC"); // chiave di restrizione
mosaicGlobalResTx = await mosaicResService
  .createMosaicGlobalRestrictionTransaction(
    undefined,
    networkType,
    mosaicDefTx.mosaicId,
    key,
    "1",
    sym.MosaicRestrictionType.EQ,
  )
  .toPromise();

aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [
    mosaicDefTx.toAggregate(carol.publicAccount),
    mosaicChangeTx.toAggregate(carol.publicAccount),
    mosaicGlobalResTx.toAggregate(carol.publicAccount),
  ],
  networkType,
  [],
).setMaxFeeForAggregate(100, 0);

signedTx = carol.sign(aggregateTx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

`MosaicRestrictionType` è definito come segue:

```js
{0: 'NONE', 1: 'EQ', 2: 'NE', 3: 'LT', 4: 'LE', 5: 'GT', 6: 'GE'}
```

| Operatore | Abbr. | significato       |
| --------- | ----- | ----------------- |
| `=`       | EQ    | uguaglianza       |
| `!=`      | NE    | disuguaglianza    |
| `<`       | LT    | minore            |
| `<=`      | LE    | minore o uguale   |
| `>`       | GT    | maggiore          |
| `<=`      | GE    | maggiore o uguale |

### Applicare le restrizioni dei Mosaic agli Indirizzi

Vediamo come connotare gli indirizzi di Carol e Bob e applicarvi le restrizioni globali per Mosaic.
Non ci sono restrizioni impostate per i Mosaic che un Indirizzo già possiede, essendo le restrizioni relative a transazioni in entrata e in uscita.
Un trasferimento avrà successo solo se il mittente e il destinatario soddisfano le condizioni specificate.
Le restrizioni possono essere attribuite ad ogni Indirizzo mediante la chiave privata del creatore del Mosaic, non è richiesta la firma di consenso.

```js
//Applichiamo le restrizioni a Carol
carolMosaicAddressResTx = sym.MosaicAddressRestrictionTransaction.create(
  sym.Deadline.create(epochAdjustment),
  mosaicDefTx.mosaicId, // mosaicId
  sym.KeyGenerator.generateUInt64Key("KYC"), // chiave di restrizione
  carol.address, // Indirizzo
  sym.UInt64.fromUint(1), // nuovo valore della restrizione
  networkType,
  sym.UInt64.fromHex("FFFFFFFFFFFFFFFF"), // vecchio valore della restrizione
).setMaxFee(100);
signedTx = carol.sign(carolMosaicAddressResTx, generationHash);
await txRepo.announce(signedTx).toPromise();

//Applichiamo le restrizioni a Bob
bob = sym.Account.generateNewAccount(networkType);
bobMosaicAddressResTx = sym.MosaicAddressRestrictionTransaction.create(
  sym.Deadline.create(epochAdjustment),
  mosaicDefTx.mosaicId, // id del Mosaic
  sym.KeyGenerator.generateUInt64Key("KYC"), // chiave di restrizione
  bob.address, // Indirizzo
  sym.UInt64.fromUint(1), // nuovo valore della restrizione
  networkType,
  sym.UInt64.fromHex("FFFFFFFFFFFFFFFF"), //vecchio valore della restrizione
).setMaxFee(100);
signedTx = carol.sign(bobMosaicAddressResTx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

### Convalida dell'applicazione delle restrizioni

Interrogazione al nodo sullo stato delle restrizioni del Mosaic

```js
res = await resMosaicRepo
  .search({ mosaicId: mosaicDefTx.mosaicId })
  .toPromise();
console.log(res);
```

###### Output esemplificativo

```js
> data
    > 0: MosaicGlobalRestriction
      compositeHash: "68FBADBAFBD098C157D42A61A7D82E8AF730D3B8C3937B1088456432CDDB8373"
      entryType: 1
    > mosaicId: MosaicId
        id: Id {lower: 2467167064, higher: 973862467}
    > restrictions: Array(1)
        0: MosaicGlobalRestrictionItem
          key: UInt64 {lower: 2424036727, higher: 2165465980}
          restrictionType: 1
          restrictionValue: UInt64 {lower: 1, higher: 0}
    > 1: MosaicAddressRestriction
      compositeHash: "920BFD041B6D30C0799E06585EC5F3916489E2DDF47FF6C30C569B102DB39F4E"
      entryType: 0
    > mosaicId: MosaicId
        id: Id {lower: 2467167064, higher: 973862467}
    > restrictions: Array(1)
        0: MosaicAddressRestrictionItem
          key: UInt64 {lower: 2424036727, higher: 2165465980}
          restrictionValue: UInt64 {lower: 1, higher: 0}
          targetAddress: Address {address: 'TAZCST2RBXDSD3227Y4A6ZP3QHFUB2P7JQVRYEI', networkType: 152}
  > 2: MosaicAddressRestriction
  ...
```

### Conferma di trasferimento

Controlliamo lo stato della restrizione trasferendo il Mosaic.

```js
//caso di transazione a buon fine (da Carol a Bob)
trTx = sym.TransferTransaction.create(
  sym.Deadline.create(epochAdjustment),
  bob.address,
  [new sym.Mosaic(mosaicDefTx.mosaicId, sym.UInt64.fromUint(1))],
  sym.PlainMessage.create(""),
  networkType,
).setMaxFee(100);
signedTx = carol.sign(trTx, generationHash);
await txRepo.announce(signedTx).toPromise();

//caso di transazione fallita (da Carol a Dave)
dave = sym.Account.generateNewAccount(networkType);
trTx = sym.TransferTransaction.create(
  sym.Deadline.create(epochAdjustment),
  dave.address,
  [new sym.Mosaic(mosaicDefTx.mosaicId, sym.UInt64.fromUint(1))],
  sym.PlainMessage.create(""),
  networkType,
).setMaxFee(100);
signedTx = carol.sign(trTx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

Il fallimento darà origine al seguente errore:

```js
{"hash":"E3402FB7AE21A6A64838DDD0722420EC67E61206C148A73B0DFD7F8C098062FA","code":"Failure_RestrictionMosaic_Account_Unauthorized","deadline":"12371602742","group":"failed"}
```

## 11.3 Consigli pratici

Un caso d'uso delle funzionalità di "Restrizioni sugli Indirizzi" e di "Restrizioni globali sui Mosaic", è il controllo
delle proprietà degli Indirizzi e Mosaic della blockchain Symbol. La loro flessibilità consente di impiegarle per risolvere situazioni d'uso della blockchain nel modo reale. Adempimenti normativi di legge, per esempio, potrebbero limitare o impedire gli scambi di un certo Mosaic emesso da una certa società. Potrebbe essere richiesco per questioni di sicurezza di impostare per certi Indirizzi il rifiuto di transazioni in entrata provenienti da utenti considerati "spam" o malevoli.

### Indirizzi "burn"

Se impostiamo in un Indirizzo la restrizione "AllowIncomingAddress" per limitare fondi che esso può ricevere e ne trasferiamo tutte le monete XYM lasciando il saldo a zero, l'operatività dell'Indirizzo diventerà difficile anche se si è in possesso della chiave privata. (Caso estremo, possibile solo se un nodo della rete blockchain Symbol è in esecuzione con la commissione minima valorizzata a 0.)

### Mosaic lock

Possiamo creare Mosaic non trasferibili e impostare una restrizione nell'Indirizzo di creazione del Mosaic che impedisce di ricevere transazioni. Dopo questa operazione il Mosaic è bloccato e non potrà più essere spostato dall'Indirizzo che lo contiene.

### Prova di appartenenza ad un circolo

Rivediamo il capitolo precedente sui Mosaic, utilizzando una restrizione globale possiamo limitare la circolazione delle monete esclusivamente tra Indirizzi particolari, per esempio solo quelli che abbiano eseguito la verifica di identità (KYC), dando luogo ad una zona economica esclusiva ai proprietari.
