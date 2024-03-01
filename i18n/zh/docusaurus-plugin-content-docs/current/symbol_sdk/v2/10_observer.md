# 10. 监控

Symbol节点可以透过WebSocket通讯监视区块链状态的更改。

## 10.1 监听器配置

生成 WebSocket 并配置监听器。

```js
nsRepo = repo.createNamespaceRepository();
wsEndpoint = NODE.replace("http", "ws") + "/ws";
listener = new sym.Listener(wsEndpoint, nsRepo, WebSocket);
listener.open();
```

端点的格式如下。

- wss://{node url}:3001/ws

如果没有通信，监听器将在一分钟后断开连接。

## 10.2 接收交易

检测帐户收到的交易。

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

执行上述监听器后，宣告要发送给 Alice 的交易。

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

尚未确认的交易会显示transactionInfo.height=0。

## 10.3 区块监控

检测新生成的块。

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

如果使用 listener.newBlock()，则通信约每30秒发生一次，这使得 WebSocket 断开连接的可能性较小。

在罕见的情况下，区块生成可能超过一分钟，此时需要重新连接监听器。 （其他因素也可能导致断开连接，因此如果要确保，请按照下面的说明补充使用 onclose。）

## 10.4 签名请求

检测何时发生需要签名的交易。

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

检测到涉及指定地址的所有聚合交易。
是否需要共同签名由单独的筛选器决定。

## 10.5 使用提示

### 持续连接

从节点列表中随机选择并尝试连接。

##### 连接到节点

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

如果连接节点回应慢，设置超时值并重新选择节点。
检查端点/节点/健康状况，如果状态不正常则重新选择节点。

##### 创建存储库

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

在罕见的情况下，有些节点可能还没有释放 /network/properties 端点，因此会获取并检查 getEpochAdjustment() 资讯。如果无法获取该资讯，将会进行递归读取 createRepo。

##### 持续连接监听器

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

如果监听器关闭，它会重新连接。

##### 启动监听器。

```js
listener = await listenerKeepOpening(NODES);
```

### U未签署交易自动签署

检测未签名的交易，然后签名并向网络公布。
需要两种检测模式：在初始屏幕显示期间的接收和在屏幕观看期间的接收。

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
    op.mergeMap((page) => page.data)
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
    })
  );
};
//Cosignature execution
function exeAggregateBondedCosignature(tx) {
  txRepo
    .getTransactionsById(
      [tx.transactionInfo.hash],
      sym.TransactionGroup.Partial
    )
    .pipe(
      //Only if the transaction is detected
      op.filter((aggTx) => aggTx.length > 0)
    )
    .subscribe(async (aggTx) => {
      //If my account is designated as the signatory of the inner transaction
      if (
        aggTx[0].innerTransactions.find((inTx) =>
          inTx.signer.equals(bob.publicAccount)
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

##### 参考资料

为避免自动签署诈骗交易，请确保进行检查程序，例如检查发送方的帐户。
