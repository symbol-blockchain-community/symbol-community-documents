# 1.Introduzione

## Sommario

Questo manuale è stato progettato per essere una  guida pratica alle persone 
desiderose di imparare e affidarsi ai concetti fondamentali e funzionalità native
della  blockchain Symbol.
Diversamente da altri documenti ufficiali che scendono nei dettagli di una tecnologia,
l'approccio scelto per questo documento è di introdurre la blockchain Symbol partendo
dalle componenti pronte all'uso e dalle funzionalità che essa incorpora,
al fine di offrire una panoramica concreta esponendo dettagliatamente i concetti chiave
accompagnati da frammenti di codice sorgente e rispettivi output.
Una lettura fatta seguendo l'ordine degli argomenti, consentirà di acquisire una comprensione
olistica della blockchain Symbol, inclusi gli strumenti di sviluppo necessari per produrre nuove applicazioni.
In questo documento non vengono esposti molti aspetti della blockchain Symbol e della interconnessione dei nodi
tra i quali: gestione di un nodo, algoritmo di consenso, economia monetaria, raccolta di commissioni, ecc. 

## Pubblico di riferimento

- Neofiti che gravitano nello spazio della tecnologia blockchain, desiderosi di comprendere più a fondo la blockchain Symbol ed al contempo sperimentarla
- Appassionati di blockchain alla ricerca di casi d'uso concreti ed esemplificati
- Docenti e produttori di contenuti che necessitano di capire e spiegare la blockchain Symbol o dettagli particolari
- Chiunque abbia la curiosità di verificare la semplicità di sviluppo software sulla blockchain Symbol 

## Un approccio pragmatico

Il mattone fondamentale di una blockchain è prova di esistenza (e paternità) 
con validazione temporale opponibile a terzi, non la moneta detta 'criptovaluta'. 
Avendo ben presente questo faro, possiamo addentrarci nelle aree di applicazione della blockchain 
quali l'autenticazione e la tracciabilità. **La fiducia è un elemento fondamentale** sul quale 
è cresciuta la società umana, tuttavia non possiamo ancora affidarci completamente ad un sistema o
un individuo esterno. Per sopperire a questa contraddizione, innumerevoli soluzioni sono state 
escogitate attribuendo significato al concetto di moneta.
La blockchain ha messo a disposizione interazioni che coinvolgono attori la cui fiducia è arbitraria,
un'opportunità nuova per ristrutturare i legami relativi alla fiducia e l'attribuzione di valore. 

La tecnologia blockchain ha consentito, in molti casi, la realizzazione di scambi tra parti arbitrariamente fidate,
eliminando la necessità della moneta o una terza parte. Questo documento è stato scritto in modo da 
consentire alle persone impegnate nei settori industriali, culturali e finanziari, di utilizzare, con profitto,
la potenza della blockchain nei rispettivi campi di applicazione.


## Disponibilità immediata all'impiego di casi d'uso concreti  

Si è diffusa l'idea che **"PoC (Proof of Concept) non è più necessario"** nei 
settori in cui le nuove tecnologie avanzano, ad esempio IoT (Internet of Things).
La componentistica hardware e software è migliorata al punto che i prototipi
vengono inseriti in ambienti di produzione esattamente come sono, saltando
lunghi cicli di sviluppo per la certificazione del codice.
La blockchain Symbol è stata progettata seguendo i principi per garantire
ampiamente la sicurezza, la scalabilità e la suddivisione in moduli. Le funzionalità
di Symbol quali l'Indirizzo (Account) e Token, sono native, e costituiscono
una base solida e altamente sicura delle informazioni all'interno dell'infrastruttura. 
Ne deriva una rete di nodi potente che forniscono API e assolvono alle richieste
degli strumenti sviluppati dalla comunità, mitigando la necessità di 
introdurre applicazioni ad-hoc autogestiti.

Con la speranza che le opportunità offerte dalla blockchain Symbol, risuonando,
si propaghino attraverso questo documento, abbiano manifestazione.
Per leggere le sezioni 'Consigli pratici' di ogni capitolo, è richiesta una comprensione
trasversale delle funzionalità di Symbol, pertanto non sono indispensabili in prima lettura.


## Su cosa differisce Symbol dalle altre blockchain 'smart'.

La blockchain Symbol non usa 'smart contracts'. Una infrastruttura 'smart' 
viene applicata al codice sorgente di Symbol. Gli scambi di informazioni e le
transazioni possibili mediante questa infrastruttura, la rendono simile
a molti 'smart contract eseguiti da altre piattaforme.
Gli 'smart contract' già predisposti all'interno della blockchain Symbol in forma nativa,
sono pronti all'uso hanno la forma stateless, talvolta descritti come 'deployless one-time smart contract'.

Essendo una catena di blocchi 'deployless', Symbol incoraggia le applicazioni 'off-chain'
e i contratti che interagiscono direttamente con le molte funzionalità che Symbol offre.
Queste applicazioni possono essere scritte usando un linguaggio di programmazione a propria scelta.
Avendo gli smart contract 'deployless one-time' termine dopo una esecuzione, non
sono soggetti a commissioni o sovraccarico di risorse da azioni involontarie quali errori o
loop infiniti. Ciò impedisce utenti o attori malevoli l'inserimento di contratti con
vulnerabilità impreviste o codice malevolo doloso.
