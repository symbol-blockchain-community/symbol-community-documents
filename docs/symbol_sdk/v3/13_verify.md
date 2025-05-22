---
sidebar_position: 13
---

# 13.検証

ブロックチェーン上に記録されたさまざまな情報を検証します。
ブロックチェーンへのデータ記録は全ノードの合意を持って行われますが、
ブロックチェーンへの**データ参照**はノード単体からの情報取得であるため、
信用できないノードの情報を元にして新たな取引を行いたい場合は、ノードから取得したデータに対して検証を行う必要があります。

## 13.1 トランザクションの検証

トランザクションがブロックヘッダーに含まれていることを検証します。この検証が成功すれば、トランザクションがブロックチェーンの合意によって承認されたものとみなすことができます。

本章のサンプルスクリプトを実行する前に以下を実行して必要ライブラリを読み込んでおいてください。

```js
sha3_256 = (await import("https://cdn.skypack.dev/@noble/hashes/sha3"))
  .sha3_256;
```

### 検証するペイロード

今回検証するトランザクションペイロードとそのトランザクションが記録されているとされるブロック高です。

```js
payload =
  "2802000000000000A5151FD55D82351DD488DB5563DD328DA72B2AD25B513C1D0F7F78AFF4D35BA094ABF505C74E6D6BE1FA19F3E5AC60A85E1A4EDC4AC07DECC0E56C59D5D24F0B69A31A837EB7DE323F08CA52495A57BA0A95B52D1BB54CEA9A94C12A87B1CADB0000000002984141A0D70000000000000EEAD6810500000062E78B6170628861B4FC4FCA75210352ACDBD2378AC0A447A3DCF63F969366BB1801000000000000540000000000000069A31A837EB7DE323F08CA52495A57BA0A95B52D1BB54CEA9A94C12A87B1CADB000000000198544198A8D76FEF8382274D472EE377F2FF3393E5B62C08B4329D04000000000000000074783100000000590000000000000069A31A837EB7DE323F08CA52495A57BA0A95B52D1BB54CEA9A94C12A87B1CADB000000000198444198A8D76FEF8382274D472EE377F2FF3393E5B62C08B4329D6668A0DE72812AAE05000500746573743100000000000000590000000000000069A31A837EB7DE323F08CA52495A57BA0A95B52D1BB54CEA9A94C12A87B1CADB000000000198444198A8D76FEF8382274D472EE377F2FF3393E5B62C08B4329DBF85DADBFD54C48D050005007465737432000000000000000000000000000000662CEDF69962B1E0F1BF0C43A510DFB12190128B90F7FE9BA48B1249E8E10DBEEDD3B8A0555B4237505E3E0822B74BCBED8AA3663022413AFDA265BE1C55431ACAE3EA975AF6FD61DEFFA6A16CBA5174A16EF5553AE669D5803A0FA9D1424600";
height = 686312;
```

### payload確認

トランザクションの内容を確認します。

```js
tx = sdk.symbol.SymbolTransactionFactory.deserialize(
  sdk.core.utils.hexToUint8(payload),
);
hash = facade.hashTransaction(tx);
console.log(hash);
console.log(tx);
```

###### 出力例

```js
> Hash256 {bytes: Uint8Array(32)}
> AggregateCompleteTransactionV2
  > cosignatures: Array(1)
    > 0: Cosignature
        signature: Signature {bytes: Uint8Array(64)}
        signerPublicKey: PublicKey {bytes: Uint8Array(32)}
    deadline: Timestamp {size: 8, isSigned: false, value: 23653181966n}
    fee: Amount {size: 8, isSigned: false, value: 55200n}
    network: NetworkType {value: 152}
    signature: Signature {bytes: Uint8Array(64)}
    signerPublicKey: PublicKey {bytes: Uint8Array(32)}
    size: 552
  > transactions: Array(3)
      0: EmbeddedTransferTransactionV1 {_signerPublicKey: PublicKey, _version: 1, _network: NetworkType, _type: TransactionType, _recipientAddress: UnresolvedAddress, …}
      1: EmbeddedAccountMetadataTransactionV1 {_signerPublicKey: PublicKey, _version: 1, _network: NetworkType, _type: TransactionType, _targetAddress: UnresolvedAddress, …}
      2: EmbeddedAccountMetadataTransactionV1 {_signerPublicKey: PublicKey, _version: 1, _network: NetworkType, _type: TransactionType, _targetAddress: UnresolvedAddress, …}
    transactionsHash: Hash256 {bytes: Uint8Array(32)}
    type: TransactionType {value: 16705}
    version: 2
```

### 署名者の検証

トランザクションがブロックに含まれていることが確認できれば自明ですが、  
念のため、アカウントの公開鍵でトランザクションの署名を検証しておきます。

```js
res = facade.verifyTransaction(tx, tx.signature);
console.log(res);
```

```js
> true
```

### マークルコンポーネントハッシュの計算

トランザクションのハッシュ値には連署者の情報が含まれていません。  
一方でブロックヘッダーに格納されるマークルルートはトランザクションのハッシュに連署者の情報が含めたものが格納されます。  
そのためトランザクションがブロック内部に存在しているかどうかを検証する場合は、トランザクションハッシュをマークルコンポーネントハッシュに変換しておく必要があります。

```js
merkleComponentHash = hash;
if (tx.cosignatures !== undefined && tx.cosignatures.length > 0) {
  hasher = sha3_256.create();
  hasher.update(hash.bytes);
  for (cosignature of tx.cosignatures) {
    hasher.update(cosignature.signerPublicKey.bytes);
  }
  merkleComponentHash = sdk.core.utils.uint8ToHex(hasher.digest());
}
console.log(merkleComponentHash);
```

###### 出力例

```js
> C61D17F89F5DEBC74A98A1321DB71EB7DC9111CDF1CF3C07C0E9A91FFE305AC3
```

### InBlockの検証

ノードからマークルツリーを取得し、先ほど計算したmerkleComponentHashからブロックヘッダーのマークルルートが導出できることを確認します。

```js
//トランザクションから計算
leaf = new sdk.core.Hash256(merkleComponentHash);

//ノードから取得
HRoot = await fetch(new URL("/blocks/" + height, NODE), {
  method: "GET",
  headers: { "Content-Type": "application/json" },
})
  .then((res) => res.json())
  .then((json) => {
    return new sdk.core.Hash256(json.block.transactionsHash);
  });
merkleProof = await fetch(
  new URL("/blocks/" + height + "/transactions/" + leaf + "/merkle", NODE),
  {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  },
)
  .then((res) => res.json())
  .then((json) => {
    let paths = [];
    json.merklePath.forEach((path) =>
      paths.push({
        hash: new sdk.core.Hash256(path.hash),
        isLeft: path.position === "left",
      }),
    );
    return paths;
  });

result = sdk.symbol.proveMerkle(leaf, merkleProof, HRoot);
console.log(result);
```

###### 出力例

```js
> true
```

トランザクションの情報がブロックヘッダーに含まれていることが確認できました。

## 13.2 ブロックヘッダーの検証

既知のブロックハッシュ値（例：ファイナライズブロック）から、検証中のブロックヘッダーまでたどれることを検証します。

### normalブロックの検証

```js
blockInfo = await fetch(new URL("/blocks/" + height, NODE), {
  method: "GET",
  headers: { "Content-Type": "application/json" },
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
block = blockInfo.block;
previousBlockHash = await fetch(new URL("/blocks/" + (height - 1), NODE), {
  method: "GET",
  headers: { "Content-Type": "application/json" },
})
  .then((res) => res.json())
  .then((json) => {
    return json.meta.hash;
  });

if (block.type === sdk.symbol.models.BlockType.NORMAL.value) {
  hasher = sha3_256.create();
  hasher.update(Buffer.from(block.signature, "hex")); //signature
  hasher.update(Buffer.from(block.signerPublicKey, "hex")); //publicKey
  hasher.update(
    Buffer.from(
      block.version.toString(16).padStart(1 * 2, "0"),
      "hex",
    ).reverse(),
  );
  hasher.update(
    Buffer.from(
      block.network.toString(16).padStart(1 * 2, "0"),
      "hex",
    ).reverse(),
  );
  hasher.update(
    Buffer.from(block.type.toString(16).padStart(2 * 2, "0"), "hex").reverse(),
  );
  hasher.update(
    Buffer.from(
      BigInt(block.height)
        .toString(16)
        .padStart(8 * 2, "0"),
      "hex",
    ).reverse(),
  );
  hasher.update(
    Buffer.from(
      BigInt(block.timestamp)
        .toString(16)
        .padStart(8 * 2, "0"),
      "hex",
    ).reverse(),
  );
  hasher.update(
    Buffer.from(
      BigInt(block.difficulty)
        .toString(16)
        .padStart(8 * 2, "0"),
      "hex",
    ).reverse(),
  );
  hasher.update(Buffer.from(block.proofGamma, "hex"));
  hasher.update(Buffer.from(block.proofVerificationHash, "hex"));
  hasher.update(Buffer.from(block.proofScalar, "hex"));
  hasher.update(Buffer.from(previousBlockHash, "hex"));
  hasher.update(Buffer.from(block.transactionsHash, "hex"));
  hasher.update(Buffer.from(block.receiptsHash, "hex"));
  hasher.update(Buffer.from(block.stateHash, "hex"));
  hasher.update(Buffer.from(block.beneficiaryAddress, "hex"));
  hasher.update(
    Buffer.from(
      block.feeMultiplier.toString(16).padStart(4 * 2, "0"),
      "hex",
    ).reverse(),
  );
  hash = sdk.core.utils.uint8ToHex(hasher.digest());
  console.log(hash === blockInfo.meta.hash);
}
```

true が出力されればこのブロックハッシュは前ブロックハッシュ値の存在を認知していることになります。  
同様にしてn番目のブロックがn-1番目のブロックを存在を確認し、最後に検証中のブロックにたどり着きます。

これで、どのノードに問い合わせても確認可能な既知のファイナライズブロックが、  
検証したいブロックの存在に支えられていることが分かりました。

### importanceブロックの検証

importanceBlockは、importance値の再計算が行われるブロック(720ブロック毎、テストネットは180ブロック毎)です。  
NormalBlockに加えて以下の情報が追加されています。

- votingEligibleAccountsCount
- harvestingEligibleAccountsCount
- totalVotingBalance
- previousImportanceBlockHash

```js
// height = Importance Block のブロック高
blockInfo = await fetch(new URL("/blocks/" + height, NODE), {
  method: "GET",
  headers: { "Content-Type": "application/json" },
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
block = blockInfo.block;
previousBlockHash = await fetch(new URL("/blocks/" + (height - 1), NODE), {
  method: "GET",
  headers: { "Content-Type": "application/json" },
})
  .then((res) => res.json())
  .then((json) => {
    return json.meta.hash;
  });

if (block.type === sdk.symbol.models.BlockType.IMPORTANCE.value) {
  hasher = sha3_256.create();
  hasher.update(Buffer.from(block.signature, "hex")); //signature
  hasher.update(Buffer.from(block.signerPublicKey, "hex")); //publicKey
  hasher.update(
    Buffer.from(
      block.version.toString(16).padStart(1 * 2, "0"),
      "hex",
    ).reverse(),
  );
  hasher.update(
    Buffer.from(
      block.network.toString(16).padStart(1 * 2, "0"),
      "hex",
    ).reverse(),
  );
  hasher.update(
    Buffer.from(block.type.toString(16).padStart(2 * 2, "0"), "hex").reverse(),
  );
  hasher.update(
    Buffer.from(
      BigInt(block.height)
        .toString(16)
        .padStart(8 * 2, "0"),
      "hex",
    ).reverse(),
  );
  hasher.update(
    Buffer.from(
      BigInt(block.timestamp)
        .toString(16)
        .padStart(8 * 2, "0"),
      "hex",
    ).reverse(),
  );
  hasher.update(
    Buffer.from(
      BigInt(block.difficulty)
        .toString(16)
        .padStart(8 * 2, "0"),
      "hex",
    ).reverse(),
  );
  hasher.update(Buffer.from(block.proofGamma, "hex"));
  hasher.update(Buffer.from(block.proofVerificationHash, "hex"));
  hasher.update(Buffer.from(block.proofScalar, "hex"));
  hasher.update(Buffer.from(previousBlockHash, "hex"));
  hasher.update(Buffer.from(block.transactionsHash, "hex"));
  hasher.update(Buffer.from(block.receiptsHash, "hex"));
  hasher.update(Buffer.from(block.stateHash, "hex"));
  hasher.update(Buffer.from(block.beneficiaryAddress, "hex"));
  hasher.update(
    Buffer.from(
      block.feeMultiplier.toString(16).padStart(4 * 2, "0"),
      "hex",
    ).reverse(),
  );
  hasher.update(
    Buffer.from(
      block.votingEligibleAccountsCount.toString(16).padStart(4 * 2, "0"),
      "hex",
    ).reverse(),
  );
  hasher.update(
    Buffer.from(
      BigInt(block.harvestingEligibleAccountsCount)
        .toString(16)
        .padStart(8 * 2, "0"),
      "hex",
    ).reverse(),
  );
  hasher.update(
    Buffer.from(
      BigInt(block.totalVotingBalance)
        .toString(16)
        .padStart(8 * 2, "0"),
      "hex",
    ).reverse(),
  );
  hasher.update(Buffer.from(block.previousImportanceBlockHash, "hex")); //signature

  hash = sdk.core.utils.uint8ToHex(hasher.digest());
  console.log(hash === blockInfo.meta.hash);
}
```

後述するアカウントやメタデータの検証のために、stateHashSubCacheMerkleRootsを検証しておきます。

### stateHashの検証

```js
console.log(blockInfo);
```

```js
> {meta: {…}, block: {…}, id: '64C908592F7CE156B01247ED'}
  > meta:
      generationHash: "FEA8C05F666D3738C7D482ACC596A0C525DB9D1F4BDFF52DAA8EE58FB6D493DC"
      hash: "B075A54EF02CE1E4DDCBD22769903B06B2CED92053CB8D02A542598D0E79BC65"
    > stateHashSubCacheMerkleRoots: Array(9)
        0: "EBA99DC4BBF6A6482DA27660FED8BFECE5BCE13007B8A8DBF4C34E0C50A11A73"
        1: "5C2891A9D9F6B3B0959F0AAA8B95F03EC94028D6A672B5D6A2C5C129D55B876F"
        2: "C772768B23FCD844465A6A73D414216D25AF0E6F197EA22FD0DDAF8FBBBFCD3B"
        3: "33A7871B1AE93D32EA881E57788FC60EC2BA1C57E11AAC45E75B20CFFD6DF7CB"
        4: "0000000000000000000000000000000000000000000000000000000000000000"
        5: "FD4207BD7EB7A3F89DC69D55F1B10F9962C58851715F7BE5655C90208FA39792"
        6: "8FBA918CFC7E117219102957780DE13CA9D86E5FAB0FB5CF14E352778E4D6EC1"
        7: "AB41382FB77EC86B6C4467FD67E1F8DBEEA6DD8A5DD0119B10D61F6FECC63F9C"
        8: "0B17D3ACE8263539809FDE95874339CEF1D5372134AADCE02D68EC5BB8A7B6EF"
      statementsCount: 1
      totalFee: "73500"
      totalTransactionsCount: 5
      transactionsCount: 2
```

```js
hasher = sha3_256.create();
hasher.update(
  Buffer.from(blockInfo.meta.stateHashSubCacheMerkleRoots[0], "hex"),
); //AccountState
hasher.update(
  Buffer.from(blockInfo.meta.stateHashSubCacheMerkleRoots[1], "hex"),
); //Namespace
hasher.update(
  Buffer.from(blockInfo.meta.stateHashSubCacheMerkleRoots[2], "hex"),
); //Mosaic
hasher.update(
  Buffer.from(blockInfo.meta.stateHashSubCacheMerkleRoots[3], "hex"),
); //Multisig
hasher.update(
  Buffer.from(blockInfo.meta.stateHashSubCacheMerkleRoots[4], "hex"),
); //HashLockInfo
hasher.update(
  Buffer.from(blockInfo.meta.stateHashSubCacheMerkleRoots[5], "hex"),
); //SecretLockInfo
hasher.update(
  Buffer.from(blockInfo.meta.stateHashSubCacheMerkleRoots[6], "hex"),
); //AccountRestriction
hasher.update(
  Buffer.from(blockInfo.meta.stateHashSubCacheMerkleRoots[7], "hex"),
); //MosaicRestriction
hasher.update(
  Buffer.from(blockInfo.meta.stateHashSubCacheMerkleRoots[8], "hex"),
); //Metadata
hash = sdk.core.utils.uint8ToHex(hasher.digest());
console.log(blockInfo.block.stateHash === hash);
```

```js
> true
```

ブロックヘッダーの検証に利用した9個のstateがstateHashSubCacheMerkleRootsから構成されていることがわかります。

## 13.3 アカウント・メタデータの検証

マークルパトリシアツリーを利用して、トランザクションに紐づくアカウントやメタデータの存在を検証します。  
サービス提供者がマークルパトリシアツリーを提供すれば、利用者は自分の意志で選択したノードを使ってその真偽を検証することができます。

### 検証用共通関数

```js
//葉のハッシュ値取得関数
function getLeafHash(encodedPath, leafValue) {
  const hasher = sha3_256.create();
  return sdk.core.utils.uint8ToHex(
    hasher.update(sdk.core.utils.hexToUint8(encodedPath + leafValue)).digest(),
  );
}

//枝のハッシュ値取得関数
function getBranchHash(encodedPath, links) {
  const branchLinks = Array(16).fill(
    sdk.core.utils.uint8ToHex(new Uint8Array(32)),
  );
  links.forEach((link) => {
    branchLinks[parseInt(`0x${link.bit}`, 16)] = link.link;
  });
  const hasher = sha3_256.create();
  const bHash = sdk.core.utils.uint8ToHex(
    hasher
      .update(sdk.core.utils.hexToUint8(encodedPath + branchLinks.join("")))
      .digest(),
  );
  return bHash;
}

//ワールドステートの検証
function checkState(stateProof, stateHash, pathHash, rootHash) {
  merkleLeaf = undefined;
  merkleBranches = [];
  stateProof.tree.forEach((n) => {
    if (n.type === 255) {
      merkleLeaf = n;
    } else {
      merkleBranches.push(n);
    }
  });
  merkleBranches.reverse();

  const leafHash = getLeafHash(merkleLeaf.encodedPath, stateHash);

  let linkHash = leafHash; //最初のlinkHashはleafHash
  let bit = "";
  for (let i = 0; i < merkleBranches.length; i++) {
    const branch = merkleBranches[i];
    const branchLink = branch.links.find((x) => x.link === linkHash);
    linkHash = getBranchHash(branch.encodedPath, branch.links);
    bit =
      merkleBranches[i].path.slice(0, merkleBranches[i].nibbleCount) +
      branchLink.bit +
      bit;
  }

  const treeRootHash = linkHash; //最後のlinkHashはrootHash
  let treePathHash = bit + merkleLeaf.path;

  if (treePathHash.length % 2 == 1) {
    treePathHash = treePathHash.slice(0, -1);
  }

  //検証
  console.log(treeRootHash === rootHash);
  console.log(treePathHash === pathHash);
}
```

### 13.3.1 アカウント情報の検証

アカウント情報を葉として、
マークルツリー上の分岐する枝をアドレスでたどり、
ルートに到着できるかを確認します。

```js
aliceAddress = new sdk.symbol.symbol.Address(
  "TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ",
);

hasher = sha3_256.create();
alicePathHash = sdk.core.utils.uint8ToHex(
  hasher.update(aliceAddress.bytes).digest(),
);

hasher = sha3_256.create();
aliceInfo = await fetch(new URL("/accounts/" + aliceAddress.toString(), NODE), {
  method: "GET",
  headers: { "Content-Type": "application/json" },
})
  .then((res) => res.json())
  .then((json) => {
    return json.account;
  });

// アカウント情報から StateHash を導出
// catbuffer-typescript が使える場合はそちらを利用すると楽
format =
  parseInt(aliceInfo.importance) === 0 || aliceInfo.activityBuckets.length < 5
    ? 0x00
    : 0x01;
supplementalPublicKeysMask = 0x00;
linkedPublicKey = new Uint8Array([]);
if (aliceInfo.supplementalPublicKeys.linked !== undefined) {
  supplementalPublicKeysMask |= 0x01;
  linkedPublicKey = sdk.core.utils.hexToUint8(
    aliceInfo.supplementalPublicKeys.linked.publicKey,
  );
}
nodePublicKey = new Uint8Array([]);
if (aliceInfo.supplementalPublicKeys.node !== undefined) {
  supplementalPublicKeysMask |= 0x02;
  nodePublicKey = sdk.core.utils.hexToUint8(
    aliceInfo.supplementalPublicKeys.node.publicKey,
  );
}
vrfPublicKey = new Uint8Array([]);
if (aliceInfo.supplementalPublicKeys.vrf !== undefined) {
  supplementalPublicKeysMask |= 0x04;
  vrfPublicKey = sdk.core.utils.hexToUint8(
    aliceInfo.supplementalPublicKeys.vrf.publicKey,
  );
}
votingPublicKeys = new Uint8Array([]);
if (aliceInfo.supplementalPublicKeys.voting !== undefined) {
  aliceInfo.supplementalPublicKeys.voting.publicKeys.forEach((key) => {
    votingPublicKeys = new Uint8Array([
      ...votingPublicKeys,
      ...sdk.core.utils.hexToUint8(key.publicKey),
    ]);
  });
}
importanceSnapshots = new Uint8Array([]);
if (parseInt(aliceInfo.importance) !== 0) {
  importanceSnapshots = new Uint8Array([
    ...Buffer.from(
      BigInt(aliceInfo.importance)
        .toString(16)
        .padStart(8 * 2, "0"),
      "hex",
    ).reverse(),
    ...Buffer.from(
      BigInt(aliceInfo.importanceHeight)
        .toString(16)
        .padStart(8 * 2, "0"),
      "hex",
    ).reverse(),
  ]);
}
activityBuckets = new Uint8Array([]);
if (aliceInfo.importance > 0) {
  for (idx = 0; idx < aliceInfo.activityBuckets.length || idx < 5; idx++) {
    bucket = aliceInfo.activityBuckets[idx];
    activityBuckets = new Uint8Array([
      ...activityBuckets,
      ...Buffer.from(
        BigInt(bucket.startHeight)
          .toString(16)
          .padStart(8 * 2, "0"),
        "hex",
      ).reverse(),
      ...Buffer.from(
        BigInt(bucket.totalFeesPaid)
          .toString(16)
          .padStart(8 * 2, "0"),
        "hex",
      ).reverse(),
      ...Buffer.from(
        bucket.beneficiaryCount.toString(16).padStart(4 * 2, "0"),
        "hex",
      ).reverse(),
      ...Buffer.from(
        BigInt(bucket.rawScore)
          .toString(16)
          .padStart(8 * 2, "0"),
        "hex",
      ).reverse(),
    ]);
  }
}
balances = new Uint8Array([]);
if (aliceInfo.mosaics.length > 0) {
  aliceInfo.mosaics.forEach((mosaic) => {
    balances = new Uint8Array([
      ...balances,
      ...sdk.core.utils.hexToUint8(mosaic.id).reverse(),
      ...Buffer.from(
        BigInt(mosaic.amount)
          .toString(16)
          .padStart(8 * 2, "0"),
        "hex",
      ).reverse(),
    ]);
  });
}
accountInfoBytes = new Uint8Array([
  ...Buffer.from(
    aliceInfo.version.toString(16).padStart(2 * 2, "0"),
    "hex",
  ).reverse(),
  ...sdk.core.utils.hexToUint8(aliceInfo.address),
  ...Buffer.from(
    BigInt(aliceInfo.addressHeight)
      .toString(16)
      .padStart(8 * 2, "0"),
    "hex",
  ).reverse(),
  ...sdk.core.utils.hexToUint8(aliceInfo.publicKey),
  ...Buffer.from(
    BigInt(aliceInfo.publicKeyHeight)
      .toString(16)
      .padStart(8 * 2, "0"),
    "hex",
  ).reverse(),
  ...Buffer.from(
    aliceInfo.accountType.toString(16).padStart(1 * 2, "0"),
    "hex",
  ).reverse(),
  ...Buffer.from(format.toString(16).padStart(1 * 2, "0"), "hex").reverse(),
  ...Buffer.from(
    supplementalPublicKeysMask.toString(16).padStart(1 * 2, "0"),
    "hex",
  ).reverse(),
  ...Buffer.from(
    votingPublicKeys.length.toString(16).padStart(1 * 2, "0"),
    "hex",
  ).reverse(),
  ...linkedPublicKey,
  ...nodePublicKey,
  ...vrfPublicKey,
  ...votingPublicKeys,
  ...importanceSnapshots,
  ...activityBuckets,
  ...Buffer.from(
    aliceInfo.mosaics.length.toString(16).padStart(2 * 2, "0"),
    "hex",
  ).reverse(),
  ...balances,
]);
aliceStateHash = sdk.core.utils.uint8ToHex(
  hasher.update(accountInfoBytes).digest(),
);

//サービス提供者以外のノードから最新のブロックヘッダー情報を取得
query = new URLSearchParams({
  order: "desc",
});
blockInfo = await fetch(new URL("/blocks?" + query.toString(), NODE), {
  method: "GET",
  headers: { "Content-Type": "application/json" },
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
rootHash = blockInfo.data[0].meta.stateHashSubCacheMerkleRoots[0];

//サービス提供者を含む任意のノードからマークル情報を取得
stateProof = await fetch(
  new URL("/accounts/" + aliceAddress.toString() + "/merkle", NODE),
  {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  },
)
  .then((res) => res.json())
  .then((json) => {
    return json;
  });

//検証
checkState(stateProof, aliceStateHash, alicePathHash, rootHash);
```

### 13.3.2 モザイクへ登録したメタデータの検証

モザイクに登録したメタデータValue値を葉として、
マークルツリー上の分岐する枝をメタデータキーで構成されるハッシュ値でたどり、
ルートに到着できるかを確認します。

```js
srcAddress = new sdk.symbol.symbol.Address(
  "TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ",
).bytes;

targetAddress = new sdk.symbol.symbol.Address(
  "TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ",
).bytes;

hasher = sha3_256.create();
hasher.update(srcAddress);
hasher.update(targetAddress);
hasher.update(sdk.core.utils.hexToUint8("CF217E116AA422E2").reverse()); // scopeKey
hasher.update(sdk.core.utils.hexToUint8("1275B0B7511D9161").reverse()); // targetId
hasher.update(Uint8Array.from([1])); // type: Mosaic 1
compositeHash = hasher.digest();

hasher = sha3_256.create();
hasher.update(compositeHash);

pathHash = sdk.core.utils.uint8ToHex(hasher.digest());

//stateHash(Value値)
hasher = sha3_256.create();
version = 1;
hasher.update(
  Buffer.from(version.toString(16).padStart(2 * 2, "0"), "hex").reverse(),
); //version
hasher.update(srcAddress);
hasher.update(targetAddress);
hasher.update(sdk.core.utils.hexToUint8("CF217E116AA422E2").reverse()); // scopeKey
hasher.update(sdk.core.utils.hexToUint8("1275B0B7511D9161").reverse()); // targetId
hasher.update(Uint8Array.from([1])); //mosaic

value = Buffer.from("test");

hasher.update(
  Buffer.from(value.length.toString(16).padStart(2 * 2, "0"), "hex").reverse(),
);
hasher.update(value);
stateHash = sdk.core.utils.uint8ToHex(hasher.digest());

//サービス提供者以外のノードから最新のブロックヘッダー情報を取得
query = new URLSearchParams({
  order: "desc",
});
blockInfo = await fetch(new URL("/blocks?" + query.toString(), NODE), {
  method: "GET",
  headers: { "Content-Type": "application/json" },
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
rootHash = blockInfo.data[0].meta.stateHashSubCacheMerkleRoots[8];

//サービス提供者を含む任意のノードからマークル情報を取得
stateProof = await fetch(
  new URL(
    "/metadata/" + sdk.core.utils.uint8ToHex(compositeHash) + "/merkle",
    NODE,
  ),
  {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  },
)
  .then((res) => res.json())
  .then((json) => {
    return json;
  });

//検証
checkState(stateProof, stateHash, pathHash, rootHash);
```

### 13.3.3 アカウントへ登録したメタデータの検証

アカウントに登録したメタデータValue値を葉として、
マークルツリー上の分岐する枝をメタデータキーで構成されるハッシュ値でたどり、
ルートに到着できるかを確認します。

```js
srcAddress = new sdk.symbol.symbol.Address(
  "TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ",
).bytes;

targetAddress = new sdk.symbol.symbol.Address(
  "TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ",
).bytes;

//compositePathHash(Key値)
hasher = sha3_256.create();
hasher.update(srcAddress);
hasher.update(targetAddress);
hasher.update(sdk.core.utils.hexToUint8("9772B71B058127D7").reverse()); // scopeKey
hasher.update(sdk.core.utils.hexToUint8("0000000000000000").reverse()); // targetId
hasher.update(Uint8Array.from([0])); // type: Account 0
compositeHash = hasher.digest();

hasher = sha3_256.create();
hasher.update(Buffer.from(compositeHash, "hex"));

pathHash = sdk.core.utils.uint8ToHex(hasher.digest());

//stateHash(Value値)
hasher = sha3_256.create();
version = 1;
hasher.update(
  Buffer.from(version.toString(16).padStart(2 * 2, "0"), "hex").reverse(),
); //version
hasher.update(srcAddress);
hasher.update(targetAddress);
hasher.update(sdk.core.utils.hexToUint8("9772B71B058127D7").reverse()); // scopeKey
hasher.update(sdk.core.utils.hexToUint8("0000000000000000").reverse()); // targetId
hasher.update(Uint8Array.from([0])); //account
value = Buffer.from("test");
hasher.update(
  Buffer.from(value.length.toString(16).padStart(2 * 2, "0"), "hex").reverse(),
);
hasher.update(value);
stateHash = sdk.core.utils.uint8ToHex(hasher.digest());

//サービス提供者以外のノードから最新のブロックヘッダー情報を取得
query = new URLSearchParams({
  order: "desc",
});
blockInfo = await fetch(new URL("/blocks?" + query.toString(), NODE), {
  method: "GET",
  headers: { "Content-Type": "application/json" },
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
rootHash = blockInfo.data[0].meta.stateHashSubCacheMerkleRoots[8];

//サービス提供者を含む任意のノードからマークル情報を取得
stateProof = await fetch(
  new URL(
    "/metadata/" + sdk.core.utils.uint8ToHex(compositeHash) + "/merkle",
    NODE,
  ),
  {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  },
)
  .then((res) => res.json())
  .then((json) => {
    return json;
  });

//検証
checkState(stateProof, stateHash, pathHash, rootHash);
```

## 13.4 現場で使えるヒント

### トラステッドウェブ

トラステッドウェブを簡単に説明すると、全てをプラットフォーマーに依存せず、かつ全てを検証せずに済むWebの実現です。

本章の検証で分かることは、ブロックチェーンが持つすべての情報はブロックヘッダーのハッシュ値によって検証可能ということです。
ブロックチェーンはみんなが認め合うブロックヘッダーの共有とそれを再現できるフルノードの存在で成り立っています。
しかし、ブロックチェーンを活用したいあらゆるシーンでこれらを検証するための環境を維持しておくことは非常に困難です。
最新のブロックヘッダーが複数の信頼できる機関から常時ブロードキャストされていれば、検証の手間を大きく省くことができます
このようなインフラが整えば、都会などの数千万人が密集する超過密地帯、あるいは基地局が十分に配置できない僻地や災害時の広域ネットワーク遮断時など
ブロックチェーンの能力を超えた場所においても信頼できる情報にアクセスできるようになります。
