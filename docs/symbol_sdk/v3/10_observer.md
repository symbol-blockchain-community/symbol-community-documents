---
sidebar_position: 10
---

# 10.監視

SymbolのノードはWebSocket通信でブロックチェーンの状態変化を監視することが可能です。

## 10.1 リスナー設定

WebSocketを生成してリスナーの設定を行います。

v2 におけるリスナーは rxjs に依存した機能であるため、 v3 ではリスナーの機能はありません。
したがって、実装者がWebSocketクライアントをプログラミングする必要があります。

```js
// チャンネル名
ListenerChannelName = {
  block: "block",
  confirmedAdded: "confirmedAdded",
  unconfirmedAdded: "unconfirmedAdded",
  unconfirmedRemoved: "unconfirmedRemoved",
  partialAdded: "partialAdded",
  partialRemoved: "partialRemoved",
  cosignature: "cosignature",
  modifyMultisigAccount: "modifyMultisigAccount",
  status: "status",
  finalizedBlock: "finalizedBlock",
};

// 各種設定
wsEndpoint = NODE.replace("http", "ws") + "/ws"; // WebSocketエンドポイント設定
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
listener.onmessage = function (e) {
  // 受信データをJSON変換
  data = JSON.parse(e.data);

  // WebSocket初期化後、ノードから uid を渡されるため保持しておく
  if (data.uid != undefined) {
    uid = data.uid;
    return;
  }

  // subscribe しているチャンネルであればコールバックを実行する
  if (funcs.hasOwnProperty(data.topic)) {
    funcs[data.topic].forEach((f) => {
      f(data.data);
    });
  }
};
// エラー時処理
listener.onerror = function (error) {
  console.error(error.data);
};
// クローズ時処理
listener.onclose = function (closeEvent) {
  uid = "";
  funcs = {};
  console.log(closeEvent);
};
```

## 10.2 受信検知

アカウントが受信したトランザクションを検知します。

```js
// 承認トランザクション検知時の処理
channelName =
  ListenerChannelName.confirmedAdded + "/" + aliceAddress.toString();
addCallback(channelName, (tx) => {
  console.log(tx);
});
// 承認トランザクション検知設定
listener.send(
  JSON.stringify({
    uid: uid,
    subscribe: channelName,
  }),
);

// 未承認トランザクション検知時の処理
channelName =
  ListenerChannelName.unconfirmedAdded + "/" + aliceAddress.toString();
addCallback(channelName, (tx) => {
  console.log(tx);
});
// 未承認トランザクション検知設定
listener.send(
  JSON.stringify({
    uid: uid,
    subscribe: channelName,
  }),
);
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

```js
// ブロック生成検知時の処理
addCallback(ListenerChannelName.block, (block) => {
  console.log(block);
});
// ブロック生成検知設定
listener.send(
  JSON.stringify({
    uid: uid,
    subscribe: ListenerChannelName.block,
  }),
);
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

```js
// 署名が必要なアグリゲートボンデッドトランザクション発生検知時の処理
channelName = ListenerChannelName.partialAdded + "/" + aliceAddress.toString();
addCallback(channelName, (tx) => {
  console.log(tx);
});
// 署名が必要なアグリゲートボンデッドトランザクション発生検知設定
listener.send(
  JSON.stringify({
    uid: uid,
    subscribe: channelName,
  }),
);
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

v3 ではリポジトリがないため、接続できるノードのURLを返却します。

```js
function searchUrl(nodes) {
  return connectNode(nodes).then(async function onFulfilled(node) {
    try {
      epochAdjustment = await fetch(new URL("/network/properties", node), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => res.json())
        .then((json) => {
          identifier = json.network.identifier; // v3 only
          facade = new sdk.symbol.facade.SymbolFacade(identifier); // v3 only
          e = json.network.epochAdjustment;
          return Number(e.substring(0, e.length - 1));
        });
    } catch (error) {
      console.error("fail searchUrl", error);
      return await searchUrl(nodes);
    }
    return node;
  });
}
```

##### リスナーの常時接続

```js
async function listenerKeepOpening(nodes) {
  const url = await searchUrl(nodes);
  let wsEndpoint = url.replace("http", "ws") + "/ws";
  // WebSocket初期化
  const lner = new WebSocket(wsEndpoint);
  try {
    // メッセージ受信時処理
    lner.onmessage = function (e) {
      // 受信データをJSON変換
      data = JSON.parse(e.data);

      // WebSocket初期化後、ノードから uid を渡されるため保持しておく
      if (data.uid != undefined) {
        uid = data.uid;
        return;
      }

      // subscribe しているチャンネルであればコールバックを実行する
      if (funcs.hasOwnProperty(data.topic)) {
        funcs[data.topic].forEach((f) => {
          f(data.data);
        });
      }
    };
    // エラー時処理
    lner.onerror = function (error) {
      console.error(error.data);
    };
    // クローズ時処理
    lner.onclose = async function (closeEvent) {
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
    lner.send(
      JSON.stringify({
        uid: uid,
        subscribe: ListenerChannelName.block,
      }),
    );
  } catch (e) {
    console.error("fail websocket", e);
    return await listenerKeepOpening(nodes);
  }
  console.log("listener connected : ", lner.url);
  return lner;
}
```

リスナーがcloseした場合は再接続します。

##### リスナー開始

```js
listener = await listenerKeepOpening(NODES);
```

### 未署名トランザクション自動連署

未署名のトランザクションを検知して、署名＆ネットワークにアナウンスします。  
初期画面表示時と画面閲覧中の受信と２パターンの検知が必要です。

```js
// 選択中アカウントの完了トランザクション検知リスナー
const statusChanged = function (address, hash) {
  // 承認トランザクション検知時の処理
  const confirmedChannelName =
    ListenerChannelName.confirmedAdded + "/" + address.toString();
  addCallback(confirmedChannelName, (tx) => {
    if (tx.meta.hash === hash.toString()) {
      console.log(tx);
    }
  });
  // 承認トランザクション検知設定
  listener.send(
    JSON.stringify({
      uid: uid,
      subscribe: confirmedChannelName,
    }),
  );

  // ステータス変更検知時の処理
  const statusChannelName =
    ListenerChannelName.status + "/" + address.toString();
  addCallback(statusChannelName, (status) => {
    if (status.hash === hash.toString()) {
      console.error(status);
    }
  });
  // ステータス変更検知設定
  listener.send(
    JSON.stringify({
      uid: uid,
      subscribe: statusChannelName,
    }),
  );
};

// 連署実行
async function exeAggregateBondedCosignature(aggTx) {
  // インナートランザクションの署名者に自分が指定されている場合
  if (
    aggTx.transaction.transactions.find(
      (inTx) =>
        inTx.transaction.signerPublicKey === bobKey.publicKey.toString(),
    ) !== undefined
  ) {
    // Aliceのトランザクションで署名
    cosignature = new sdk.symbol.symbol.DetachedCosignature();
    signTxHash = new sdk.symbol.symbol.Hash256(
      sdk.symbol.utils.hexToUint8(aggTx.meta.hash),
    );
    cosignature.parentHash = signTxHash;
    cosignature.version = 0n;
    cosignature.signerPublicKey = bobKey.publicKey;
    cosignature.signature = new sdk.symbol.symbol.Signature(
      bobKey.sign(signTxHash.bytes).bytes,
    );

    // アナウンス
    body = {
      parentHash: cosignature.parentHash.toString(),
      signature: cosignature.signature.toString(),
      signerPublicKey: cosignature.signerPublicKey.toString(),
      version: cosignature.version.toString(),
    };
    await fetch(new URL("/transactions/cosignature", NODE), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .then((json) => {
        return json;
      });
    statusChanged(bobAddress, signTxHash);
  }
}

bondedSubscribe = async function (tx) {
  // すでに署名済みか確認するため、トランザクション情報を取得
  body = {
    transactionIds: [tx.meta.hash],
  };
  partialTx = await fetch(new URL("/transactions/partial", NODE), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.length <= 0) {
        return undefined;
      }
      return json[0];
    });
  if (partialTx === undefined) {
    cosole.error("get tx info failed.");
    return;
  }

  // 署名済みか確認
  if (!partialTx.transaction.hasOwnProperty("cosignatures")) {
    cosole.log("not aggregate tx.");
    return;
  }
  bobCosignature = partialTx.transaction.cosignatures.find((c) => {
    return c.signerPublicKey === bobKey.publicKey.toString();
  });
  if (
    bobCosignature !== undefined &&
    partialTx.transaction.signerPublicKey === bobKey.publicKey.toString()
  ) {
    cosole.log("already signed.");
    return;
  }

  console.log(partialTx);
  exeAggregateBondedCosignature(partialTx);
};

// 署名が必要なアグリゲートボンデッドトランザクション発生検知時の処理
channelName = ListenerChannelName.partialAdded + "/" + bobAddress.toString();
addCallback(channelName, async (tx) => {
  bondedSubscribe(tx);
});
// 署名が必要なアグリゲートボンデッドトランザクション発生検知設定
listener.send(
  JSON.stringify({
    uid: uid,
    subscribe: channelName,
  }),
);

// 指定アドレスのパーシャルトランザクションを検索する
async function searchPartialTxes(address, page = 1) {
  query = new URLSearchParams({
    address: address.toString(),
    pageSize: 100,
    pageNumber: page,
  });
  bondedTxes = await fetch(
    new URL("/transactions/partial?" + query.toString(), NODE),
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
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
async function getAllPartialTxes(address) {
  return await searchPartialTxes(address);
}

// 初期表示時
(await getAllPartialTxes(bobAddress)).forEach((partialTx) => {
  bondedSubscribe(partialTx);
});
```

##### 注意事項

スキャムトランザクションを自動署名しないように、
送信元のアカウントを確認するなどのチェック処理を必ず実施するようにしてください。
