# 10.監控

Symbol節點可以透過WebSocket通訊監視區塊鏈狀態的更改。

## 10.1 監聽器配置

生成 WebSocket 並配置監聽器。

```js
nsRepo = repo.createNamespaceRepository();
wsEndpoint = NODE.replace("http", "ws") + "/ws";
listener = new sym.Listener(wsEndpoint, nsRepo, WebSocket);
listener.open();
```

端點的格式如下。

- wss://{node url}:3001/ws

如果沒有通信，監聽器將在一分鐘後斷開連接。

## 10.2 接收交易

檢測帳戶收到的交易。

```js
listener.open().then(() => {
  //Detection of approval transactions
  listener.confirmed(alice.address).subscribe((tx) => {
    //Describes the process after reception
    console.log(tx);
  });
  //Detection of unconfirmed transactions
  listener.unconfirmedAdded(alice.address).subscribe((tx) => {
    //Describes the process after reception
    console.log(tx);
  });
});
```

執行上述監聽器後，宣告要發送給 Alice 的交易。

###### 市例演示

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

尚未確認的交易會顯示transactionInfo.height=0。

## 10.3 區塊監控

檢測新生成的塊。

```js
listener.open().then(() => {
  //Detection of block generation
  listener.newBlock().subscribe((block) => console.log(block));
});
```

###### 市例演示

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

如果使用 listener.newBlock()，則通信約每30秒發生一次，這使得 WebSocket 斷開連接的可能性較小。

在罕見的情況下，區塊生成可能超過一分鐘，此時需要重新連接監聽器。 （其他因素也可能導致斷開連接，因此如果要確保，請按照下面的說明補充使用 onclose。）

## 10.4 簽名請求

檢測何時發生需要簽名的交易。

```js
listener.open().then(() => {
  //Detection of Aggregate Bonded Transaction occurrences requiring signatures
  listener
    .aggregateBondedAdded(alice.address)
    .subscribe(async (tx) => console.log(tx));
});
```

###### 市例演示

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

檢測到涉及指定地址的所有聚合交易。
是否需要共同簽名由單獨的篩選器決定。

## 10.5 使用提示

### 持續連接

從節點列表中隨機選擇並嘗試連接。

##### 連接到節點

```js
//Node list
NODES = ["https://node.com:3001",...];
function connectNode(nodes) {
    const node = nodes[Math.floor(Math.random() * nodes.length)] ;
    console.log("try:" + node);
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

如果連接節點回應慢，設置超時值並重新選擇節點。
檢查端點/節點/健康狀況，如果狀態不正常則重新選擇節點。

##### 創建存儲庫

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

在罕見的情況下，有些節點可能還沒有釋放 /network/properties 端點，因此會獲取並檢查 getEpochAdjustment() 資訊。如果無法獲取該資訊，將會進行遞歸讀取 createRepo。

##### 持續連接監聽器

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

如果監聽器關閉，它會重新連接。

##### 啟動監聽器。

```js
listener = await listenerKeepOpening(NODES);
```

### 未簽署交易自動簽署

檢測未簽名的交易，然後簽名並向網絡公佈。
需要兩種檢測模式：在初始屏幕顯示期間的接收和在屏幕觀看期間的接收。

```js
//read rxjs.operators
op = require("/node_modules/rxjs/operators");
rxjs = require("/node_modules/rxjs");

//Aggregate Transaction detection
bondedListener = listener.aggregateBondedAdded(bob.address);
bondedHttp = txRepo
  .search({ address: bob.address, group: sym.TransactionGroup.Partial })
  .pipe(
    op.delay(2000),
    op.mergeMap((page) => page.data),
  );
//Completed transaction detection listeners for selected accounts
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
    }),
  );
};
//Cosignature execution
function exeAggregateBondedCosignature(tx) {
  txRepo
    .getTransactionsById(
      [tx.transactionInfo.hash],
      sym.TransactionGroup.Partial,
    )
    .pipe(
      //Only if the transaction is detected
      op.filter((aggTx) => aggTx.length > 0),
    )
    .subscribe(async (aggTx) => {
      //If my account is designated as the signatory of the inner transaction
      if (
        aggTx[0].innerTransactions.find((inTx) =>
          inTx.signer.equals(bob.publicAccount),
        ) != undefined
      ) {
        //Sign with Alice transaction
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
      //If not already signed
      op.filter((tx) => {
        return !tx.signedByAccount(
          sym.PublicAccount.createFromPublicKey(bob.publicKey, networkType),
        );
      }),
    )
    .subscribe((tx) => {
      console.log(tx);
      exeAggregateBondedCosignature(tx);
    });
};
bondedSubscribe(bondedListener);
bondedSubscribe(bondedHttp);
```

##### 參考資料

為避免自動簽署詐騙交易，請確保進行檢查程序，例如檢查發送方的帳戶。
