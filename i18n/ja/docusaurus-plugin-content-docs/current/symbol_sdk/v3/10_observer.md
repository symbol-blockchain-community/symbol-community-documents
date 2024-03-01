---
sidebar_position: 10
---

# 10.監視
SymbolのノードはWebSocket通信でブロックチェーンの状態変化を監視することが可能です。  

## 10.1 リスナー設定

WebSocketを生成してリスナーの設定を行います。

#### v2

```js
nsRepo = repo.createNamespaceRepository();
wsEndpoint = NODE.replace('http', 'ws') + "/ws";
listener = new sym.Listener(wsEndpoint,nsRepo,WebSocket);
listener.open();
```

エンドポイントのフォーマットは以下の通りです。
- wss://{node url}:3001/ws

何も通信が無ければ、listenerは1分で切断されます。

#### v3

v2 におけるリスナーは rxjs に依存した機能であるため、 v3 ではリスナーの機能はありません。
したがって、実装者がWebSocketクライアントをプログラミングする必要があります。
本章では、 v2 の実装を参考にした一例を示します。

```js
// チャンネル名
ListenerChannelName = {
  block: 'block',
  confirmedAdded: 'confirmedAdded',
  unconfirmedAdded: 'unconfirmedAdded',
  unconfirmedRemoved: 'unconfirmedRemoved',
  partialAdded: 'partialAdded',
  partialRemoved: 'partialRemoved',
  cosignature: 'cosignature',
  modifyMultisigAccount: 'modifyMultisigAccount',
  status: 'status',
  finalizedBlock: 'finalizedBlock',
}

// 各種設定
wsEndpoint = NODE.replace('http', 'ws') + "/ws";  // WebSocketエンドポイント設定
uid = "";
funcs = {};

// チャンネルへのコールバック追加
addCallback = (channel, callback) => {
  if (!funcs.hasOwnProperty(channel)) {
    funcs[channel] = [];
  }
  funcs[channel].push(callback);
};

// WebSocket初期化
listener = new WebSocket(wsEndpoint);
// メッセージ受信時処理
listener.onmessage = function(e) {
  // 受信データをJSON変換
  data = JSON.parse(e.data);

  // WebSocket初期化後、ノードから uid を渡されるため保持しておく
  if (data.uid != undefined) {
    uid = data.uid;
    return;
  }

  // subscribe しているチャンネルであればコールバックを実行する
  if (funcs.hasOwnProperty(data.topic)) {
    funcs[data.topic].forEach(f => {
      f(data.data);
    });
  }
};
// エラー時処理
listener.onerror = function(error) {
  console.error(error.data);
};
// クローズ時処理
listener.onclose = function(closeEvent) {
  uid = "";
  funcs = {};
  console.log(closeEvent);
};
```

## 10.2 受信検知

アカウントが受信したトランザクションを検知します。

#### v2

```js
listener.open().then(() => {

    //承認トランザクションの検知
    listener.confirmed(alice.address)
    .subscribe(tx=>{
        //受信後の処理を記述
        console.log(tx);
    });

    //未承認トランザクションの検知
    listener.unconfirmedAdded(alice.address)
    .subscribe(tx=>{
        //受信後の処理を記述
        console.log(tx);
    });
});
```
上記リスナーを実行後、aliceへの送信トランザクションをアナウンスしてください。

###### 出力例
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

#### v3

```js
// 承認トランザクション検知時の処理
channelName = ListenerChannelName.confirmedAdded + "/" + aliceAddress.toString();
addCallback(channelName, (tx) => {
  console.log(tx);
});
// 承認トランザクション検知設定
listener.send(JSON.stringify({
  uid: uid,
  subscribe: channelName,
}));

// 未承認トランザクション検知時の処理
channelName = ListenerChannelName.unconfirmedAdded + "/" + aliceAddress.toString();
addCallback(channelName, (tx) => {
  console.log(tx);
});
// 未承認トランザクション検知設定
listener.send(JSON.stringify({
  uid: uid,
  subscribe: channelName,
}));
```

###### 出力例

```js
> {transaction: {…}, meta: {…}}
  > meta: 
      hash: "A95F2E59D22EDA24D1E82515D452F106B93D7C869B601CCA63A46D0EB2CFB182"
      height: "0"
      merkleComponentHash: "A95F2E59D22EDA24D1E82515D452F106B93D7C869B601CCA63A46D0EB2CFB182"
  > transaction: 
      deadline: "22961573427"
      maxFee: "25168"
    > mosaics: Array(1)
        0: {id: '72C0212E67A08BCE', amount: '1000000'}
        length: 1
      network: 152
      recipientAddress: "98223AF34A98119217DC2427C6DE7F577A33D8242A2F54C3"
      signature: "926C1474D285D9C3022ED250A0E3B43096BF94D70036D8FB68CEED56A05B5DFFD75250FE57B1390A4BAFBE9517126F6E109AF156CB5B1E9FC23F433E6FC11E0F"
      signerPublicKey: "69A31A837EB7DE323F08CA52495A57BA0A95B52D1BB54CEA9A94C12A87B1CADB"
      type: 16724
      version: 1
```

未承認トランザクションは transactionInfo.height=0　で受信します。

##### 注意事項
受信先アドレスやモザイクIDで受信検知をする場合は送信者がネームスペースを利用して送信している場合もあるのでご注意ください。
たとえば、メインネットでXYMのモザイクIDは`6BED913FA20223F8`ですが、ユーザーがネームスペースID(symbol.xym)で送信した場合はトランザクションには
`E74B99BA41F4AFEE`というIDが記録されています。


## 10.3 ブロック監視

新規に生成されたブロックを検知します。

#### v2

```js
listener.open().then(() => {

    //ブロック生成の検知
    listener.newBlock()
    .subscribe(block=>console.log(block));
});
```
###### 出力例
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

listener.newBlock()をしておくと、約30秒ごとに通信が発生するのでWebSocketの切断が起こりにくくなります。  
まれに、ブロック生成が1分を超える場合があるのでその場合はリスナーを再接続する必要があります。
（その他の事象で切断される可能性もあるので、万全を期したい場合は後述するoncloseで補足しましょう）

#### v3

```js
// ブロック生成検知時の処理
addCallback(ListenerChannelName.block, (block) => {
  console.log(block);
});
// ブロック生成検知設定
listener.send(JSON.stringify({
  uid: uid,
  subscribe: ListenerChannelName.block,
}));
```

###### 出力例

```js
> {block: {…}, meta: {…}}
  > block: 
      beneficiaryAddress: "98BE9AC4CD3E833736762A12A63065FF42E476744E6FC597"
      difficulty: "11527429947328"
      feeMultiplier: 0
      height: "663306"
      network: 152
      previousBlockHash: "511D2E9940130E3F58875D9FAF0ACABAEA85094B2CF2BE4FE8785B81294BEC5D"
      proofGamma: "A6FE7FE258D37448C33357EFE2A66E93895FAA38C8AF219CA7DECE6186D44754"
      proofScalar: "BC71B55808169D3A245CC1818C47B5ECDAB29ED02BF98916144CA52BDC06C403"
      proofVerificationHash: "C027383E6ED8937242FCE3CC439B52D4"
      receiptsHash: "69CB5A2E56E51812065187CC61AEAB6B5E413CFB34B0CBB9ADBDB588986A1624"
      signature: "21C31EF3019A4D888A34FE1EE3864B66FBA818EFB53CA72CEB50001393527D766FD2897C428867C3421F472FA9546B57E6856076FD522AF3CE9D3CD618C2170E"
      signerPublicKey: "87EEE5E3D69BAA60C093FC2080BA5D36E623C5C0BCDC529B8712A9B6212420D7"
      stateHash: "DF47AA56BBB3D74088342A9DFFB6DB164F5699BB9D607789B7016A55DE5D15C9"
      timestamp: "22953836986"
      transactionsHash: "0000000000000000000000000000000000000000000000000000000000000000"
      type: 33091
      version: 1
  > meta: 
      generationHash: "B76DE01D89CC6672F30AC183BCEA601DE019AD7D37C84CAE723814A59AED253F"
      hash: "88277C8A9B45D075BF554DA5DAA24667DAE844DE1C583DFB4A5891822BE9A0DB"
```

## 10.4 署名要求

署名が必要なトランザクションが発生すると検知します。

#### v2

```js
listener.open().then(() => {
    //署名が必要なアグリゲートボンデッドトランザクション発生の検知
    listener.aggregateBondedAdded(alice.address)
    .subscribe(async tx=>console.log(tx));
});
```
###### 出力例
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

#### v3

```js
// 署名が必要なアグリゲートボンデッドトランザクション発生検知時の処理
channelName = ListenerChannelName.partialAdded + "/" + aliceAddress.toString();
addCallback(channelName, (tx) => {
  console.log(tx);
});
// 署名が必要なアグリゲートボンデッドトランザクション発生検知設定
listener.send(JSON.stringify({
  uid: uid,
  subscribe: channelName,
}));
```

###### 出力例

```js
> {transaction: {…}, meta: {…}}
  > meta: 
    hash: "D7DD269A6D6EDC6A1F95045609BBF645B5FD908ED540C312489261C2913955DB"
    height: "0"
    merkleComponentHash: "0000000000000000000000000000000000000000000000000000000000000000"
  > transaction: 
      deadline: "23127942600"
      maxFee: "47200"
      network: 152
      signature: "05FBC99BA33EA0DA79AB04D555645552DDDC66ABCFDF0FBAEEC0E84531F3CF52E3D8B76F45692B009421185C79993B3B41574E4B149D2931D08632318B7C610E"
      signerPublicKey: "69A31A837EB7DE323F08CA52495A57BA0A95B52D1BB54CEA9A94C12A87B1CADB"
    > transactions: Array(1)
      > 0: 
        > transaction: 
          > mosaics: Array(1)
              0: {id: '72C0212E67A08BCE', amount: '1000000'}
              length: 1
            network: 152
            recipientAddress: "98223AF34A98119217DC2427C6DE7F577A33D8242A2F54C3"
            signerPublicKey: "99687A9A5C5DA3EC97D0568781FE5AB5C4BB9D18F4BA9343AE5BBD1D2C0CA788"
            type: 16724
            version: 1
        length: 1
      transactionsHash: "5B59E92F56E78AB14E751177413807CEA7A4C8426F1A756DA43B74EEE1F32679"
      type: 16961
      version: 2
```

指定アドレスが関係するすべてのアグリゲートトランザクションが検知されます。
連署が必要かどうかは別途フィルターして判断します。


## 10.5 現場で使えるヒント
### 常時コネクション

一覧からランダムに選択し、接続を試みます。

##### ノードへの接続

#### v2, v3

```js
//ノード一覧
NODES = ["https://node.com:3001",...];

function connectNode(nodes) {
    const node = nodes[Math.floor(Math.random() * nodes.length)] ;
    console.log("try:" + node);

    return new Promise((resolve, reject) => {
        let req = new XMLHttpRequest();
        req.timeout = 2000; //タイムアウト値:2秒(=2000ms)
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

タイムアウト値を設定しておき、応答の悪いノードに接続した場合は選びなおします。
エンドポイント /node/health　を確認してステータス異常の場合はノードを選びなおします。


##### レポジトリの作成, ノードURLの取得

#### v2

```js
function createRepo(nodes){

    return connectNode(nodes).then(async function onFulfilled(node) {

        const repo = new sym.RepositoryFactoryHttp(node);

        try{
            epochAdjustment = await repo.getEpochAdjustment().toPromise();
        }catch(error){
          console.log("fail createRepo");
          return await createRepo(nodes);
        }
        return await repo;
    });
}
```
まれに /network/properties のエンドポイントが解放されていないノードが存在するため、
getEpochAdjustment() の情報を取得してチェックを行います。取得できない場合は再帰的にcreateRepoを読み込みます。

#### v3

v3 ではリポジトリがないため、接続できるノードのURLを返却します。

```js
function searchUrl(nodes){

  return connectNode(nodes).then(async function onFulfilled(node) {

    try{
        epochAdjustment = await fetch(
          new URL('/network/properties', node),
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        )
        .then((res) => res.json())
        .then((json) => {
          identifier = json.network.identifier;                   // v3 only
          facade = new symbolSdk.facade.SymbolFacade(identifier); // v3 only
          e = json.network.epochAdjustment;
          return Number(e.substring(0, e.length - 1));
        });
    }catch(error){
      console.error("fail searchUrl", error);
      return await searchUrl(nodes);
    }
    return node;
  });
}
```

##### リスナーの常時接続

#### v2

```js
async function listenerKeepOpening(nodes){

    const repo = await createRepo(NODES);
    let wsEndpoint = repo.url.replace('http', 'ws') + "/ws";
    const nsRepo = repo.createNamespaceRepository();
    const lner = new sym.Listener(wsEndpoint,nsRepo,WebSocket);
    try{
        await lner.open();
        lner.newBlock();
    }catch(e){
        console.log("fail websocket");
        return await listenerKeepOpening(nodes);
    }

    lner.webSocket.onclose = async function(){
        console.log("listener onclose");
        return await listenerKeepOpening(nodes);
    }
  return lner;
}
```

#### v3

```js
async function listenerKeepOpening(nodes){
  const url = await searchUrl(nodes);
  let wsEndpoint = url.replace('http', 'ws') + "/ws";
  // WebSocket初期化
  const lner = new WebSocket(wsEndpoint);
  try{
    // メッセージ受信時処理
    lner.onmessage = function(e) {
      // 受信データをJSON変換
      data = JSON.parse(e.data);
    
      // WebSocket初期化後、ノードから uid を渡されるため保持しておく
      if (data.uid != undefined) {
        uid = data.uid;
        return;
      }
    
      // subscribe しているチャンネルであればコールバックを実行する
      if (funcs.hasOwnProperty(data.topic)) {
        funcs[data.topic].forEach(f => {
          f(data.data);
        });
      }
    };
    // エラー時処理
    lner.onerror = function(error) {
      console.error(error.data);
    };
    // クローズ時処理
    lner.onclose = async function(closeEvent) {
      console.log("listener onclose");
      uid = "";
      funcs = {};
      listener = await listenerKeepOpening(nodes);
    };

    // WebSocket がオープンされるまで待機
    await new Promise((resolve, reject) => {
      interval = setInterval(() => {
        if (lner.readyState > 0) {
          clearInterval(interval);
          resolve();
        }
      }, 1000);      
    });

    // ブロック生成検知時の処理
    addCallback(ListenerChannelName.block, (block) => {
      console.log(block);
    });
    // ブロック生成検知設定
    lner.send(JSON.stringify({
      uid: uid,
      subscribe: ListenerChannelName.block,
    }));
  }catch(e){
    console.error("fail websocket", e);
    return await listenerKeepOpening(nodes);
  }
  console.log("listener connected : ", lner.url);
  return lner;
}
```

リスナーがcloseした場合は再接続します。

##### リスナー開始

#### v2, v3

```js
listener = await listenerKeepOpening(NODES);
```

### 未署名トランザクション自動連署

未署名のトランザクションを検知して、署名＆ネットワークにアナウンスします。  
初期画面表示時と画面閲覧中の受信と２パターンの検知が必要です。  

#### v2

```js
//rxjsの読み込み
op  = require("/node_modules/rxjs/operators");
rxjs = require("/node_modules/rxjs");

//アグリゲートトランザクション検知
bondedListener = listener.aggregateBondedAdded(bob.address);
bondedHttp = txRepo.search({address:bob.address,group:sym.TransactionGroup.Partial})
.pipe(
    op.delay(2000),
    op.mergeMap(page => page.data)
);

//選択中アカウントの完了トランザクション検知リスナー
const statusChanged = function(address,hash){

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
}

//連署実行
function exeAggregateBondedCosignature(tx){

    txRepo.getTransactionsById([tx.transactionInfo.hash],sym.TransactionGroup.Partial)
    .pipe(
        //トランザクションが抽出された場合のみ
        op.filter(aggTx => aggTx.length > 0)
    )
    .subscribe(async aggTx =>{

        //インナートランザクションの署名者に自分が指定されている場合
        if(aggTx[0].innerTransactions.find((inTx) => inTx.signer.equals(bob.publicAccount))!= undefined){
            //Aliceのトランザクションで署名
            const cosignatureTx = sym.CosignatureTransaction.create(aggTx[0]);
            const signedTx = bob.signCosignatureTransaction(cosignatureTx);
            const cosignedAggTx = await txRepo.announceAggregateBondedCosignature(signedTx).toPromise();
            statusChanged(bob.address,signedTx.parentHash).subscribe(res=>{
              console.log(res);
            });
        }
    });
}

bondedSubscribe = function(observer){
    observer.pipe(

        //すでに署名済みでない場合
        op.filter(tx => {
            return !tx.signedByAccount(sym.PublicAccount.createFromPublicKey(bob.publicKey ,networkType));
        })
    ).subscribe(tx=>{
        console.log(tx);
        exeAggregateBondedCosignature(tx);
    });
}

bondedSubscribe(bondedListener);
bondedSubscribe(bondedHttp);
``` 

#### v3

```js
// 選択中アカウントの完了トランザクション検知リスナー
const statusChanged = function(address,hash){
  // 承認トランザクション検知時の処理
  const confirmedChannelName = ListenerChannelName.confirmedAdded + "/" + address.toString();
  addCallback(confirmedChannelName, (tx) => {
    if (tx.meta.hash === hash.toString()) {
      console.log(tx);
    }
  });
  // 承認トランザクション検知設定
  listener.send(JSON.stringify({
    uid: uid,
    subscribe: confirmedChannelName,
  }));

  // ステータス変更検知時の処理
  const statusChannelName = ListenerChannelName.status + "/" + address.toString();
  addCallback(statusChannelName, (status) => {
    if (status.hash === hash.toString()) {
      console.error(status);
    }
  });
  // ステータス変更検知設定
  listener.send(JSON.stringify({
    uid: uid,
    subscribe: statusChannelName,
  }));
}

// 連署実行
async function exeAggregateBondedCosignature(aggTx){
  // インナートランザクションの署名者に自分が指定されている場合
  if (aggTx.transaction.transactions.find(inTx => inTx.transaction.signerPublicKey === bobKey.publicKey.toString()) !== undefined) {
    // Aliceのトランザクションで署名
    cosignature = new symbolSdk.symbol.DetachedCosignature();
    signTxHash = new symbolSdk.symbol.Hash256(symbolSdk.utils.hexToUint8(aggTx.meta.hash));
    cosignature.parentHash = signTxHash;
    cosignature.version = 0n;
    cosignature.signerPublicKey = bobKey.publicKey;
    cosignature.signature = new symbolSdk.symbol.Signature(bobKey.sign(signTxHash.bytes).bytes);

    // アナウンス
    body= {
      "parentHash": cosignature.parentHash.toString(),
      "signature": cosignature.signature.toString(),
      "signerPublicKey": cosignature.signerPublicKey.toString(),
      "version": cosignature.version.toString()
    };
    await fetch(
      new URL('/transactions/cosignature', NODE),
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )
    .then((res) => res.json())
    .then((json) => {
      return json;
    });
    statusChanged(bobAddress, signTxHash);
  }
}

bondedSubscribe = async function(tx){
  // すでに署名済みか確認するため、トランザクション情報を取得
  body = {
    "transactionIds": [tx.meta.hash]
  };
  partialTx = await fetch(
    new URL('/transactions/partial', NODE),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
  .then((res) => res.json())
  .then((json) => {
    if (json.length <= 0) {
      return undefined;
    }
    return json[0];
  });
  if (partialTx === undefined){
    cosole.error("get tx info failed.");
    return;
  }

  // 署名済みか確認
  if (!partialTx.transaction.hasOwnProperty("cosignatures")){
    cosole.log("not aggregate tx.");
    return;
  }
  bobCosignature = partialTx.transaction.cosignatures.find(c => {
    return c.signerPublicKey === bobKey.publicKey.toString();
  });
  if (bobCosignature !== undefined && partialTx.transaction.signerPublicKey === bobKey.publicKey.toString()){
    cosole.log("already signed.");
    return;
  }

  console.log(partialTx);
  exeAggregateBondedCosignature(partialTx);
}

// 署名が必要なアグリゲートボンデッドトランザクション発生検知時の処理
channelName = ListenerChannelName.partialAdded + "/" + bobAddress.toString();
addCallback(channelName, async (tx) => {
  bondedSubscribe(tx);
});
// 署名が必要なアグリゲートボンデッドトランザクション発生検知設定
listener.send(JSON.stringify({
  uid: uid,
  subscribe: channelName,
}));

// 指定アドレスのパーシャルトランザクションを検索する
async function searchPartialTxes(address, page = 1){
  query = new URLSearchParams({
    "address": address.toString(),
    "pageSize": 100,
    "pageNumber": page,
  });
  bondedTxes = await fetch(
    new URL('/transactions/partial?' + query.toString(), NODE),
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  )
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
  if (bondedTxes.data.length === 0) {
    return [];
  }
  return bondedTxes.data.concat(await searchUnsignedBonded(address, page + 1));
}
// 指定アドレスの全てのパーシャルトランザクションを取得する
async function getAllPartialTxes(address){
  return await searchPartialTxes(address);
}

// 初期表示時
(await getAllPartialTxes(bobAddress)).forEach(partialTx => {
  bondedSubscribe(partialTx);
});
```

##### 注意事項
スキャムトランザクションを自動署名しないように、
送信元のアカウントを確認するなどのチェック処理を必ず実施するようにしてください。
