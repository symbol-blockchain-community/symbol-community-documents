### Ora facciamo pratica con la catena di blocchi Symbol iniziando con un programmino di prova

# Impariamo Symbol facilmente

## Autori

### XEMBook, quasarblue

## Prefazione

Questa traduzione è a beneficio di tutti i lettori italiani
con l'aiuto della comunità giapponese

## Sommario

### [1.Introduzione](./01_introduction.md)

### [2.Impostare l'ambiente di sviluppo](./02_setting.md)

### [3.Indirizzo sulla catena di blocchi](./03_account.md)

- [3.1 Creazione di un Indirizzo](03_account.md#31-creazione-di-un-indirizzo)
- [3.2 Trasferimento verso un Indirizzo](03_account.md#32-trasferimento-verso-un-indirizzo)
- [3.3 Verifica dei dati di un Indirizzo](03_account.md#33-verifica-dei-dati-di-un-indirizzo)
- [3.4 Consigli pratici](03_account.md#34-consigli-pratici)

### [4.Transazioni](./04_transaction.md)

- [4.1 Le tappe di una transazione](04_transaction.md#41-le-tappe-di-una-transazione)
- [4.2 Inizializzazione](04_transaction.md#42-inizializzazione)
- [4.3 Firma e propagazione (notifica alla rete)](04_transaction.md#43-firma-e-propagazione-notifica-alla-rete)
- [4.4 Convalida](04_transaction.md#44-convalida)
- [4.5 Cronologia delle transazioni](04_transaction.md#45-cronologia-delle-transazioni)
- [4.6 Gruppo di transazioni](04_transaction.md#46-gruppo-di-transazioni)
- [4.7 Consigli pratici](04_transaction.md#47-consigli-pratici)

### [5.Mosaic](./05_mosaic.md)

- [5.1 Generare un Mosaic](05_mosaic.md#51-generare-un-mosaic)
- [5.2 Trasferire un Mosaic](05_mosaic.md#52-trasferire-un-mosaic)
- [5.3 Consigli pratici](05_mosaic.md#53-consigli-pratici)

### [6.Sinonimi](./06_namespace.md)

- [6.1 Calcolo delle commissioni](06_namespace.md#61-calcolo-delle-commissioni)
- [6.2 Affitto](06_namespace.md#62-affitto)
- [6.3 Link](06_namespace.md#63-link)
- [6.4 Richiesta di Link formale](06_namespace.md#64-richiesta-di-link-formale)
- [6.5 Riferimenti al Sinonimo](06_namespace.md#65-riferimenti-al-sinonimo)
- [6.6 Consigli pratici](06_namespace.md#66-consigli-pratici)

### [7.Metadati](./07_metadata.md)

- [7.1 Registrare un Indirizzo](07_metadata.md#71-memorizzazione-nellindirizzo)
- [7.2 Registrare un Mosaic](07_metadata.md#72-memorizzazione-nel-mosaic)
- [7.3 Registrare un Sinonimo](07_metadata.md#73-memorizzazione-nel-sinonimo)
- [7.4 Conferma di esecuzione](07_metadata.md#74-convalida)
- [7.5 Consigli pratici](07_metadata.md#75-consigli-pratici)

### [8.Lock](./08_lock.md)

- [8.1 Transazione Hash Lock](08_lock.md#81-transazione-hash-lock)
- [8.2 Transazioni Secret Lock・e Secret Proof](08_lock.md#82-transazioni-secret-lock-e-secret-proof)
- [8.3 Consigli pratici](08_lock.md#83-consigli-pratici)

### [9.Intestatari delegati](./09_multisig.md)

- [9.1 Preparazione dell'Indirizzo Cointestato](09_multisig.md#91-preparazione-dellindirizzo-cointestato)
- [9.2 Registrazione dei cointestatari](09_multisig.md#92-registrazione-dei-cointestatari)
- [9.3 Convalida di un Indirizzo Cointestato](09_multisig.md#93-convalida-di-un-indirizzo-cointestato)
- [9.4 Eseguire una transazione dall'Indirizzo cointestato e firme dei cointestatari](09_multisig.md#94-eseguire-una-transazione-dallindirizzo-cointestato-e-firme-dei-cointestatari)
- [9.5 Convalida di una transazione a firma multipla](09_multisig.md#95-convalida-di-una-transazione-a-firma-multipla)
- [9.6 Modificare un Indirizzo Cointestato (numero minimo di firme)](09_multisig.md#96-modificare-un-indirizzo-cointestato-numero-minimo-di-firme)
- [9.7 Consigli pratici](09_multisig.md#97-consigli-pratici)

### [10.Monitoraggio](./10_observer.md)

- [10.1 Configurazione del Listener](10_observer.md#101-configurazione-del-listener)
- [10.2 Ricevere notifiche sulle transaczioni](10_observer.md#102-ricevere-notifiche-sulle-ransazioni)
- [10.3 Ricevere notifiche sui blocchi](10_observer.md#103-ricevere-notifiche-sui-blocchi)
- [10.4 Richieste di firma](10_observer.md#104-richieste-di-firma)
- [10.5 Consigli pratici](10_observer.md#105-consigli-pratici)

### [11.Impostare restrizioni](./11_restriction.md)

- [11.1 Restrizioni sugli Indirizzi](11_restriction.md#111-restrizioni-sugli-indirizzi)
- [11.2 Restrizioni globali sul Mosaic](11_restriction.md#112-restrizioni-globali-sul-mosaic)
- [11.3 Consigli pratici](11_restriction.md#113-consigli-pratici)

### [12.Firme a freddo](./12_offline_signature.md)

- [12.1 Creazione di una transazione](12_offline_signature.md#121-Creazione di una transazione)
- [12.2 Delega a Bob](12_offline_signature.md#122-Delega a Bob)
- [12.3 Propagazione da Alice](12_offline_signature.md#123-Propagazione da Alice)
- [12.4 Consigli pratici](12_offline_signature.md#124-Consigli pratici)

### [13.Verifica di validità](./13_verify.md)

- [13.1 Validità di una transazione](13_verify.md#131-Validità di una transazione)
- [13.2 Validità del blocco](13_verify.md#132-Validità del blocco)
- [13.3 Validità dell'Indirizzo](13_verify.md#133-Validità dell'Indirizzo)
- [13.4 Consigli pratici](13_verify.md#134-Consigli pratici)
