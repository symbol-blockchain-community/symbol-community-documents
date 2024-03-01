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

#### v2

```js
Buffer = require("/node_modules/buffer").Buffer;
cat = require("/node_modules/catbuffer-typescript");
sha3_256 = require('/node_modules/js-sha3').sha3_256;

accountRepo = repo.createAccountRepository();
blockRepo = repo.createBlockRepository();
stateProofService = new sym.StateProofService(repo);
```

#### v3

```js
sha3_256 = (await import('https://cdn.skypack.dev/@noble/hashes/sha3')).sha3_256;
```

### 検証するペイロード

今回検証するトランザクションペイロードとそのトランザクションが記録されているとされるブロック高です。

```js
payload = '2802000000000000A5151FD55D82351DD488DB5563DD328DA72B2AD25B513C1D0F7F78AFF4D35BA094ABF505C74E6D6BE1FA19F3E5AC60A85E1A4EDC4AC07DECC0E56C59D5D24F0B69A31A837EB7DE323F08CA52495A57BA0A95B52D1BB54CEA9A94C12A87B1CADB0000000002984141A0D70000000000000EEAD6810500000062E78B6170628861B4FC4FCA75210352ACDBD2378AC0A447A3DCF63F969366BB1801000000000000540000000000000069A31A837EB7DE323F08CA52495A57BA0A95B52D1BB54CEA9A94C12A87B1CADB000000000198544198A8D76FEF8382274D472EE377F2FF3393E5B62C08B4329D04000000000000000074783100000000590000000000000069A31A837EB7DE323F08CA52495A57BA0A95B52D1BB54CEA9A94C12A87B1CADB000000000198444198A8D76FEF8382274D472EE377F2FF3393E5B62C08B4329D6668A0DE72812AAE05000500746573743100000000000000590000000000000069A31A837EB7DE323F08CA52495A57BA0A95B52D1BB54CEA9A94C12A87B1CADB000000000198444198A8D76FEF8382274D472EE377F2FF3393E5B62C08B4329DBF85DADBFD54C48D050005007465737432000000000000000000000000000000662CEDF69962B1E0F1BF0C43A510DFB12190128B90F7FE9BA48B1249E8E10DBEEDD3B8A0555B4237505E3E0822B74BCBED8AA3663022413AFDA265BE1C55431ACAE3EA975AF6FD61DEFFA6A16CBA5174A16EF5553AE669D5803A0FA9D1424600';
height = 686312;
```


### payload確認

トランザクションの内容を確認します。

#### v2

```js
tx = sym.TransactionMapping.createFromPayload(payload);
hash = sym.Transaction.createTransactionHash(payload,Buffer.from(generationHash, 'hex'));
console.log(hash);
console.log(tx);
```
###### 出力例
```js
> 4A1C88BBFE6EB46111C2B02F7C7355DAE186E54132197C2CD6D51297846A1824
> AggregateTransaction
    > cosignatures: Array(1)
      0: AggregateTransactionCosignature
        signature: "EDD3B8A0555B4237505E3E0822B74BCBED8AA3663022413AFDA265BE1C55431ACAE3EA975AF6FD61DEFFA6A16CBA5174A16EF5553AE669D5803A0FA9D1424600"
        signer: PublicAccount
          address: Address {address: "TCUNO37PQOBCOTKHF3RXP4X7GOJ6LNRMBC2DFHI", networkType: 152}
          publicKey: "662CEDF69962B1E0F1BF0C43A510DFB12190128B90F7FE9BA48B1249E8E10DBE"
      deadline: Deadline {adjustedValue: 23653181966}
    > innerTransactions: Array(3)
        0: TransferTransaction {type: 16724, networkType: 152, version: 1, deadline: Deadline, maxFee: UInt64, …}
        1: AccountMetadataTransaction {type: 16708, networkType: 152, version: 1, deadline: Deadline, maxFee: UInt64, …}
        2: AccountMetadataTransaction {type: 16708, networkType: 152, version: 1, deadline: Deadline, maxFee: UInt64, …}
      maxFee: UInt64 {lower: 55200, higher: 0}
      networkType: 152
      signature: "A5151FD55D82351DD488DB5563DD328DA72B2AD25B513C1D0F7F78AFF4D35BA094ABF505C74E6D6BE1FA19F3E5AC60A85E1A4EDC4AC07DECC0E56C59D5D24F0B"
    > signer: PublicAccount
        address: Address {address: 'TAVSVIRJLNOCGUUK3XXH6KPWKIMUJ2PSGQCCRKY', networkType: 152}
        publicKey: "69A31A837EB7DE323F08CA52495A57BA0A95B52D1BB54CEA9A94C12A87B1CADB"
      transactionInfo: undefined
      type: 16705
      version: 2
```

#### v3

```js
tx = symbolSdk.symbol.TransactionFactory.deserialize(symbolSdk.utils.hexToUint8(payload));
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

#### v2

```js
res = alice.publicAccount.verifySignature(
    tx.getSigningBytes([...Buffer.from(payload,'hex')],[...Buffer.from(generationHash,'hex')]),
    "A5151FD55D82351DD488DB5563DD328DA72B2AD25B513C1D0F7F78AFF4D35BA094ABF505C74E6D6BE1FA19F3E5AC60A85E1A4EDC4AC07DECC0E56C59D5D24F0B"
);
console.log(res);
```
```js
> true
```

getSigningBytesで署名の対象となる部分だけを取り出しています。  
通常のトランザクションとアグリゲートトランザクションでは取り出す部分が異なるので注意が必要です。  

#### v3
```js
res = facade.verifyTransaction(tx, tx.signature);
console.log(res);
```
```js
> true
```

v3 でも `verifyTransaction()` で署名の対象となる部分だけを取り出しています。  

### マークルコンポーネントハッシュの計算

トランザクションのハッシュ値には連署者の情報が含まれていません。  
一方でブロックヘッダーに格納されるマークルルートはトランザクションのハッシュに連署者の情報が含めたものが格納されます。  
そのためトランザクションがブロック内部に存在しているかどうかを検証する場合は、トランザクションハッシュをマークルコンポーネントハッシュに変換しておく必要があります。

#### v2

```js
merkleComponentHash = hash;
if( tx.cosignatures !== undefined && tx.cosignatures.length > 0){
  
  const hasher = sha3_256.create();
  hasher.update(Buffer.from(hash, 'hex'));
  for (cosignature of tx.cosignatures ){
    hasher.update(Buffer.from(cosignature.signer.publicKey, 'hex'));
  }
  merkleComponentHash = hasher.hex().toUpperCase();
}
console.log(merkleComponentHash);
```

#### v3

```js
merkleComponentHash = hash;
if (tx.cosignatures !== undefined && tx.cosignatures.length > 0) {
  hasher = sha3_256.create();
  hasher.update(hash.bytes);
  for (cosignature of tx.cosignatures){
    hasher.update(cosignature.signerPublicKey.bytes);
  }
  merkleComponentHash = symbolSdk.utils.uint8ToHex(hasher.digest());
}
console.log(merkleComponentHash);
```

###### 出力例

```js
> C61D17F89F5DEBC74A98A1321DB71EB7DC9111CDF1CF3C07C0E9A91FFE305AC3
```

### InBlockの検証

ノードからマークルツリーを取得し、先ほど計算したmerkleComponentHashからブロックヘッダーのマークルルートが導出できることを確認します。

#### v2

```js
function validateTransactionInBlock(leaf,HRoot,merkleProof){

  if (merkleProof.length === 0) {
    // There is a single item in the tree, so HRoot' = leaf.
    return leaf.toUpperCase() === HRoot.toUpperCase();
  }

  const HRoot0 = merkleProof.reduce((proofHash, pathItem) => {
    const hasher = sha3_256.create();
    if (pathItem.position === sym.MerklePosition.Left) {
      return hasher.update(Buffer.from(pathItem.hash + proofHash, 'hex')).hex();
    } else {
      return hasher.update(Buffer.from(proofHash + pathItem.hash, 'hex')).hex();
    }
  }, leaf);
  return HRoot.toUpperCase() === HRoot0.toUpperCase();
}

//トランザクションから計算
leaf = merkleComponentHash.toLowerCase();//merkleComponentHash

//ノードから取得
HRoot = (await blockRepo.getBlockByHeight(height).toPromise()).blockTransactionsHash;
merkleProof = (await blockRepo.getMerkleTransaction(height, leaf).toPromise()).merklePath;

result = validateTransactionInBlock(leaf,HRoot,merkleProof);
console.log(result);
```

#### v3

```js
//トランザクションから計算
leaf = new symbolSdk.Hash256(merkleComponentHash);

//ノードから取得
HRoot = await fetch(
  new URL('/blocks/' + height, NODE),
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }
)
.then((res) => res.json())
.then((json) => {
  return new symbolSdk.Hash256(json.block.transactionsHash);
});
merkleProof = await fetch(
  new URL('/blocks/' + height + '/transactions/' + leaf + '/merkle', NODE),
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }
)
.then((res) => res.json())
.then((json) => {
  let paths = [];
  json.merklePath.forEach(path => paths.push({
    "hash": new symbolSdk.Hash256(path.hash),
    "isLeft": path.position === "left"
  }));
  return paths;
});

result = symbolSdk.symbol.proveMerkle(leaf, merkleProof, HRoot);
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

#### v2

```js
block = await blockRepo.getBlockByHeight(height).toPromise();
previousBlock = await blockRepo.getBlockByHeight(height - 1).toPromise();
if(block.type ===  sym.BlockType.NormalBlock){
    
  hasher = sha3_256.create();
  hasher.update(Buffer.from(block.signature,'hex')); //signature
  hasher.update(Buffer.from(block.signer.publicKey,'hex')); //publicKey
  hasher.update(cat.GeneratorUtils.uintToBuffer(   block.version, 1));
  hasher.update(cat.GeneratorUtils.uintToBuffer(   block.networkType, 1));
  hasher.update(cat.GeneratorUtils.uintToBuffer(   block.type, 2));
  hasher.update(cat.GeneratorUtils.uint64ToBuffer([block.height.lower    ,block.height.higher]));
  hasher.update(cat.GeneratorUtils.uint64ToBuffer([block.timestamp.lower ,block.timestamp.higher]));
  hasher.update(cat.GeneratorUtils.uint64ToBuffer([block.difficulty.lower,block.difficulty.higher]));
  hasher.update(Buffer.from(block.proofGamma,'hex'));
  hasher.update(Buffer.from(block.proofVerificationHash,'hex'));
  hasher.update(Buffer.from(block.proofScalar,'hex'));
  hasher.update(Buffer.from(previousBlock.hash,'hex'));
  hasher.update(Buffer.from(block.blockTransactionsHash,'hex'));
  hasher.update(Buffer.from(block.blockReceiptsHash,'hex'));
  hasher.update(Buffer.from(block.stateHash,'hex'));
  hasher.update(sym.RawAddress.stringToAddress(block.beneficiaryAddress.address));
  hasher.update(cat.GeneratorUtils.uintToBuffer(   block.feeMultiplier, 4));
  hash = hasher.hex().toUpperCase();
  console.log(hash === block.hash);
}
```

#### v3

```js
blockInfo = await fetch(
  new URL('/blocks/' + height, NODE),
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }
)
.then((res) => res.json())
.then((json) => {
  return json;
});
block = blockInfo.block;
previousBlockHash = await fetch(
  new URL('/blocks/' + (height - 1), NODE),
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }
)
.then((res) => res.json())
.then((json) => {
  return json.meta.hash;
});

if(block.type === symbolSdk.symbol.BlockType.NORMAL.value){
  hasher = sha3_256.create();
  hasher.update(Buffer.from(block.signature,'hex')); //signature
  hasher.update(Buffer.from(block.signerPublicKey,'hex')); //publicKey
  hasher.update(Buffer.from(block.version.toString(16).padStart(1 * 2, '0'),'hex').reverse());
  hasher.update(Buffer.from(block.network.toString(16).padStart(1 * 2, '0'),'hex').reverse());
  hasher.update(Buffer.from(block.type.toString(16).padStart(2 * 2, '0'),'hex').reverse());
  hasher.update(Buffer.from(BigInt(block.height).toString(16).padStart(8 * 2, '0'),'hex').reverse());
  hasher.update(Buffer.from(BigInt(block.timestamp).toString(16).padStart(8 * 2, '0'),'hex').reverse());
  hasher.update(Buffer.from(BigInt(block.difficulty).toString(16).padStart(8 * 2, '0'),'hex').reverse());
  hasher.update(Buffer.from(block.proofGamma,'hex'));
  hasher.update(Buffer.from(block.proofVerificationHash,'hex'));
  hasher.update(Buffer.from(block.proofScalar,'hex'));
  hasher.update(Buffer.from(previousBlockHash,'hex'));
  hasher.update(Buffer.from(block.transactionsHash,'hex'));
  hasher.update(Buffer.from(block.receiptsHash,'hex'));
  hasher.update(Buffer.from(block.stateHash,'hex'));
  hasher.update(Buffer.from(block.beneficiaryAddress,'hex'));
  hasher.update(Buffer.from(block.feeMultiplier.toString(16).padStart(4 * 2, '0'),'hex').reverse());
  hash = symbolSdk.utils.uint8ToHex(hasher.digest());
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

#### v2

```js
block = await blockRepo.getBlockByHeight(height).toPromise();
previousBlock = await blockRepo.getBlockByHeight(height - 1).toPromise();
if(block.type ===  sym.BlockType.ImportanceBlock){

  hasher = sha3_256.create();
  hasher.update(Buffer.from(block.signature,'hex')); //signature
  hasher.update(Buffer.from(block.signer.publicKey,'hex')); //publicKey
  hasher.update(cat.GeneratorUtils.uintToBuffer(   block.version, 1));
  hasher.update(cat.GeneratorUtils.uintToBuffer(   block.networkType, 1));
  hasher.update(cat.GeneratorUtils.uintToBuffer(   block.type, 2));
  hasher.update(cat.GeneratorUtils.uint64ToBuffer([block.height.lower    ,block.height.higher]));
  hasher.update(cat.GeneratorUtils.uint64ToBuffer([block.timestamp.lower ,block.timestamp.higher]));
  hasher.update(cat.GeneratorUtils.uint64ToBuffer([block.difficulty.lower,block.difficulty.higher]));
  hasher.update(Buffer.from(block.proofGamma,'hex'));
  hasher.update(Buffer.from(block.proofVerificationHash,'hex'));
  hasher.update(Buffer.from(block.proofScalar,'hex'));
  hasher.update(Buffer.from(previousBlock.hash,'hex'));
  hasher.update(Buffer.from(block.blockTransactionsHash,'hex'));
  hasher.update(Buffer.from(block.blockReceiptsHash,'hex'));
  hasher.update(Buffer.from(block.stateHash,'hex'));
  hasher.update(sym.RawAddress.stringToAddress(block.beneficiaryAddress.address));
  hasher.update(cat.GeneratorUtils.uintToBuffer(   block.feeMultiplier, 4));
  hasher.update(cat.GeneratorUtils.uintToBuffer(block.votingEligibleAccountsCount,4));
  hasher.update(cat.GeneratorUtils.uint64ToBuffer([block.harvestingEligibleAccountsCount.lower,block.harvestingEligibleAccountsCount.higher]));
  hasher.update(cat.GeneratorUtils.uint64ToBuffer([block.totalVotingBalance.lower,block.totalVotingBalance.higher]));
  hasher.update(Buffer.from(block.previousImportanceBlockHash,'hex'));

  hash = hasher.hex().toUpperCase();
  console.log(hash === block.hash);
}
```

#### v3

```js
// height = Importance Block のブロック高
blockInfo = await fetch(
  new URL('/blocks/' + height, NODE),
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }
)
.then((res) => res.json())
.then((json) => {
  return json;
});
block = blockInfo.block;
previousBlockHash = await fetch(
  new URL('/blocks/' + (height - 1), NODE),
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }
)
.then((res) => res.json())
.then((json) => {
  return json.meta.hash;
});

if(block.type === symbolSdk.symbol.BlockType.IMPORTANCE.value){
  hasher = sha3_256.create();
  hasher.update(Buffer.from(block.signature,'hex')); //signature
  hasher.update(Buffer.from(block.signerPublicKey,'hex')); //publicKey
  hasher.update(Buffer.from(block.version.toString(16).padStart(1 * 2, '0'),'hex').reverse());
  hasher.update(Buffer.from(block.network.toString(16).padStart(1 * 2, '0'),'hex').reverse());
  hasher.update(Buffer.from(block.type.toString(16).padStart(2 * 2, '0'),'hex').reverse());
  hasher.update(Buffer.from(BigInt(block.height).toString(16).padStart(8 * 2, '0'),'hex').reverse());
  hasher.update(Buffer.from(BigInt(block.timestamp).toString(16).padStart(8 * 2, '0'),'hex').reverse());
  hasher.update(Buffer.from(BigInt(block.difficulty).toString(16).padStart(8 * 2, '0'),'hex').reverse());
  hasher.update(Buffer.from(block.proofGamma,'hex'));
  hasher.update(Buffer.from(block.proofVerificationHash,'hex'));
  hasher.update(Buffer.from(block.proofScalar,'hex'));
  hasher.update(Buffer.from(previousBlockHash,'hex'));
  hasher.update(Buffer.from(block.transactionsHash,'hex'));
  hasher.update(Buffer.from(block.receiptsHash,'hex'));
  hasher.update(Buffer.from(block.stateHash,'hex'));
  hasher.update(Buffer.from(block.beneficiaryAddress,'hex'));
  hasher.update(Buffer.from(block.feeMultiplier.toString(16).padStart(4 * 2, '0'),'hex').reverse());
  hasher.update(Buffer.from(block.votingEligibleAccountsCount.toString(16).padStart(4 * 2, '0'),'hex').reverse());
  hasher.update(Buffer.from(BigInt(block.harvestingEligibleAccountsCount).toString(16).padStart(8 * 2, '0'),'hex').reverse());
  hasher.update(Buffer.from(BigInt(block.totalVotingBalance).toString(16).padStart(8 * 2, '0'),'hex').reverse());
  hasher.update(Buffer.from(block.previousImportanceBlockHash,'hex')); //signature

  hash = symbolSdk.utils.uint8ToHex(hasher.digest());
  console.log(hash === blockInfo.meta.hash);
}
```

後述するアカウントやメタデータの検証のために、stateHashSubCacheMerkleRootsを検証しておきます。

### stateHashの検証

#### v2

```js
console.log(block);
```
```js
> NormalBlockInfo
    height: UInt64 {lower: 59639, higher: 0}
    hash: "B5F765D388B5381AC93659F501D5C68C00A2EE7DF4548C988E97F809B279839B"
    stateHash: "9D6801C49FE0C31ADE5C1BB71019883378016FA35230B9813CA6BB98F7572758"
  > stateHashSubCacheMerkleRoots: Array(9)
        0: "4578D33DD0ED5B8563440DA88F627BBC95A174C183191C15EE1672C5033E0572"
        1: "2C76DAD84E4830021BE7D4CF661218973BA467741A1FC4663B54B5982053C606"
        2: "259FB9565C546BAD0833AD2B5249AA54FE3BC45C9A0C64101888AC123A156D04"
        3: "58D777F0AA670440D71FA859FB51F8981AF1164474840C71C1BEB4F7801F1B27"
        4: "C9092F0652273166991FA24E8B115ACCBBD39814B8820A94BFBBE3C433E01733"
        5: "4B53B8B0E5EE1EEAD6C1498CCC1D839044B3AE5F85DD8C522A4376C2C92D8324"
        6: "132324AF5536EC9AA85B2C1697F6B357F05EAFC130894B210946567E4D4E9519"
        7: "8374F46FBC759049F73667265394BD47642577F16E0076CBB7B0B9A92AAE0F8E"
        8: "45F6AC48E072992343254F440450EF4E840D8386102AD161B817E9791ABC6F7F"
```
```js
hasher = sha3_256.create();
hasher.update(Buffer.from(block.stateHashSubCacheMerkleRoots[0],'hex')); //AccountState
hasher.update(Buffer.from(block.stateHashSubCacheMerkleRoots[1],'hex')); //Namespace
hasher.update(Buffer.from(block.stateHashSubCacheMerkleRoots[2],'hex')); //Mosaic
hasher.update(Buffer.from(block.stateHashSubCacheMerkleRoots[3],'hex')); //Multisig
hasher.update(Buffer.from(block.stateHashSubCacheMerkleRoots[4],'hex')); //HashLockInfo
hasher.update(Buffer.from(block.stateHashSubCacheMerkleRoots[5],'hex')); //SecretLockInfo
hasher.update(Buffer.from(block.stateHashSubCacheMerkleRoots[6],'hex')); //AccountRestriction
hasher.update(Buffer.from(block.stateHashSubCacheMerkleRoots[7],'hex')); //MosaicRestriction
hasher.update(Buffer.from(block.stateHashSubCacheMerkleRoots[8],'hex')); //Metadata
hash = hasher.hex().toUpperCase();
console.log(block.stateHash === hash);
```
```js
> true
```

#### v3

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
hasher.update(Buffer.from(blockInfo.meta.stateHashSubCacheMerkleRoots[0],'hex')); //AccountState
hasher.update(Buffer.from(blockInfo.meta.stateHashSubCacheMerkleRoots[1],'hex')); //Namespace
hasher.update(Buffer.from(blockInfo.meta.stateHashSubCacheMerkleRoots[2],'hex')); //Mosaic
hasher.update(Buffer.from(blockInfo.meta.stateHashSubCacheMerkleRoots[3],'hex')); //Multisig
hasher.update(Buffer.from(blockInfo.meta.stateHashSubCacheMerkleRoots[4],'hex')); //HashLockInfo
hasher.update(Buffer.from(blockInfo.meta.stateHashSubCacheMerkleRoots[5],'hex')); //SecretLockInfo
hasher.update(Buffer.from(blockInfo.meta.stateHashSubCacheMerkleRoots[6],'hex')); //AccountRestriction
hasher.update(Buffer.from(blockInfo.meta.stateHashSubCacheMerkleRoots[7],'hex')); //MosaicRestriction
hasher.update(Buffer.from(blockInfo.meta.stateHashSubCacheMerkleRoots[8],'hex')); //Metadata
hash = symbolSdk.utils.uint8ToHex(hasher.digest());
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

#### v2

```js
//葉のハッシュ値取得関数
function getLeafHash(encodedPath, leafValue){
    const hasher = sha3_256.create();
    return hasher.update(sym.Convert.hexToUint8(encodedPath + leafValue)).hex().toUpperCase();
}

//枝のハッシュ値取得関数
function getBranchHash(encodedPath, links){
    const branchLinks = Array(16).fill(sym.Convert.uint8ToHex(new Uint8Array(32)));
    links.forEach((link) => {
        branchLinks[parseInt(`0x${link.bit}`, 16)] = link.link;
    });
    const hasher = sha3_256.create();
    const bHash = hasher.update(sym.Convert.hexToUint8(encodedPath + branchLinks.join(''))).hex().toUpperCase();
    return bHash;
}

//ワールドステートの検証
function checkState(stateProof,stateHash,pathHash,rootHash){

  const merkleLeaf = stateProof.merkleTree.leaf;
  const merkleBranches = stateProof.merkleTree.branches.reverse();
  const leafHash = getLeafHash(merkleLeaf.encodedPath,stateHash);

  let linkHash = leafHash; //最初のlinkHashはleafHash
  let bit="";
  for(let i = 0; i < merkleBranches.length; i++){
      const branch = merkleBranches[i];
      const branchLink = branch.links.find(x=>x.link === linkHash)
      linkHash = getBranchHash(branch.encodedPath,branch.links);
      bit = merkleBranches[i].path.slice(0,merkleBranches[i].nibbleCount) + branchLink.bit + bit ;
  }

  const treeRootHash = linkHash; //最後のlinkHashはrootHash
  let treePathHash = bit + merkleLeaf.path;

  if(treePathHash.length % 2 == 1){
    treePathHash = treePathHash.slice( 0, -1 );
  }
 
  //検証
  console.log(treeRootHash === rootHash);
  console.log(treePathHash === pathHash);
}
```

#### v3

```js
//葉のハッシュ値取得関数
function getLeafHash(encodedPath, leafValue){
    const hasher = sha3_256.create();
    return symbolSdk.utils.uint8ToHex(hasher.update(symbolSdk.utils.hexToUint8(encodedPath + leafValue)).digest());
}

//枝のハッシュ値取得関数
function getBranchHash(encodedPath, links){
    const branchLinks = Array(16).fill(symbolSdk.utils.uint8ToHex(new Uint8Array(32)));
    links.forEach((link) => {
        branchLinks[parseInt(`0x${link.bit}`, 16)] = link.link;
    });
    const hasher = sha3_256.create();
    const bHash = symbolSdk.utils.uint8ToHex(hasher.update(symbolSdk.utils.hexToUint8(encodedPath + branchLinks.join(''))).digest());
    return bHash;
}

//ワールドステートの検証
function checkState(stateProof,stateHash,pathHash,rootHash){
  merkleLeaf = undefined;
  merkleBranches = [];
  stateProof.tree.forEach(n => {
    if (n.type === 255) {
      merkleLeaf = n;
    } else {
      merkleBranches.push(n);
    }
  });
  merkleBranches.reverse();

  const leafHash = getLeafHash(merkleLeaf.encodedPath,stateHash);

  let linkHash = leafHash; //最初のlinkHashはleafHash
  let bit="";
  for(let i = 0; i < merkleBranches.length; i++){
      const branch = merkleBranches[i];
      const branchLink = branch.links.find(x=>x.link === linkHash)
      linkHash = getBranchHash(branch.encodedPath,branch.links);
      bit = merkleBranches[i].path.slice(0,merkleBranches[i].nibbleCount) + branchLink.bit + bit ;
  }

  const treeRootHash = linkHash; //最後のlinkHashはrootHash
  let treePathHash = bit + merkleLeaf.path;

  if(treePathHash.length % 2 == 1){
    treePathHash = treePathHash.slice( 0, -1 );
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

#### v2

```js
stateProofService = new sym.StateProofService(repo);

aliceAddress = sym.Address.createFromRawAddress("TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ");

hasher = sha3_256.create();
alicePathHash = hasher.update(
  sym.RawAddress.stringToAddress(aliceAddress.plain())
).hex().toUpperCase();

hasher = sha3_256.create();
aliceInfo = await accountRepo.getAccountInfo(aliceAddress).toPromise();
aliceStateHash = hasher.update(aliceInfo.serialize()).hex().toUpperCase();

//サービス提供者以外のノードから最新のブロックヘッダー情報を取得
blockInfo = await blockRepo.search({order:"desc"}).toPromise();
rootHash = blockInfo.data[0].stateHashSubCacheMerkleRoots[0];

//サービス提供者を含む任意のノードからマークル情報を取得
stateProof = await stateProofService.accountById(aliceAddress).toPromise();

//検証
checkState(stateProof,aliceStateHash,alicePathHash,rootHash);
```

#### v3

```js
aliceAddress = new symbolSdk.symbol.Address("TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ");

hasher = sha3_256.create();
alicePathHash = symbolSdk.utils.uint8ToHex(hasher.update(aliceAddress.bytes).digest());

hasher = sha3_256.create();
aliceInfo = await fetch(
  new URL('/accounts/' + aliceAddress.toString(), NODE),
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }
)
.then((res) => res.json())
.then((json) => {
  return json.account;
});

// アカウント情報から StateHash を導出
// catbuffer-typescript が使える場合はそちらを利用すると楽
format = (parseInt(aliceInfo.importance) === 0 || aliceInfo.activityBuckets.length < 5 ? 0x00 : 0x01);
supplementalPublicKeysMask = 0x00;
linkedPublicKey = new Uint8Array([]);
if (aliceInfo.supplementalPublicKeys.linked !== undefined) {
  supplementalPublicKeysMask |= 0x01;
  linkedPublicKey = symbolSdk.utils.hexToUint8(aliceInfo.supplementalPublicKeys.linked.publicKey);
}
nodePublicKey = new Uint8Array([]);
if (aliceInfo.supplementalPublicKeys.node !== undefined) {
  supplementalPublicKeysMask |= 0x02;
  nodePublicKey = symbolSdk.utils.hexToUint8(aliceInfo.supplementalPublicKeys.node.publicKey);
}
vrfPublicKey = new Uint8Array([]);
if (aliceInfo.supplementalPublicKeys.vrf !== undefined) {
  supplementalPublicKeysMask |= 0x04;
  vrfPublicKey = symbolSdk.utils.hexToUint8(aliceInfo.supplementalPublicKeys.vrf.publicKey);
}
votingPublicKeys = new Uint8Array([]);
if (aliceInfo.supplementalPublicKeys.voting !== undefined) {
  aliceInfo.supplementalPublicKeys.voting.publicKeys.forEach(key => {
    votingPublicKeys = new Uint8Array([...votingPublicKeys, ...symbolSdk.utils.hexToUint8(key.publicKey)]);
  });
}
importanceSnapshots = new Uint8Array([]);
if (parseInt(aliceInfo.importance) !== 0) {
  importanceSnapshots = new Uint8Array([
    ...Buffer.from(BigInt(aliceInfo.importance).toString(16).padStart(8 * 2, '0'),'hex').reverse(),
    ...Buffer.from(BigInt(aliceInfo.importanceHeight).toString(16).padStart(8 * 2, '0'),'hex').reverse(),
  ]);
}
activityBuckets = new Uint8Array([]);
if (aliceInfo.importance > 0) {
  for (idx = 0; idx < aliceInfo.activityBuckets.length || idx < 5; idx++) {
    bucket = aliceInfo.activityBuckets[idx];
    activityBuckets = new Uint8Array([
      ...activityBuckets,
      ...Buffer.from(BigInt(bucket.startHeight).toString(16).padStart(8 * 2, '0'),'hex').reverse(),
      ...Buffer.from(BigInt(bucket.totalFeesPaid).toString(16).padStart(8 * 2, '0'),'hex').reverse(),
      ...Buffer.from(bucket.beneficiaryCount.toString(16).padStart(4 * 2, '0'),'hex').reverse(),
      ...Buffer.from(BigInt(bucket.rawScore).toString(16).padStart(8 * 2, '0'),'hex').reverse(),
    ]);
  }
}
balances = new Uint8Array([]);
if (aliceInfo.mosaics.length > 0) {
  aliceInfo.mosaics.forEach(mosaic => {
    balances = new Uint8Array([...balances, ...symbolSdk.utils.hexToUint8(mosaic.id).reverse(), ...Buffer.from(BigInt(mosaic.amount).toString(16).padStart(8 * 2, '0'),'hex').reverse()]);
  });
}
accountInfoBytes = new Uint8Array([
  ...Buffer.from(aliceInfo.version.toString(16).padStart(2 * 2, '0'),'hex').reverse(),
  ...symbolSdk.utils.hexToUint8(aliceInfo.address),
  ...Buffer.from(BigInt(aliceInfo.addressHeight).toString(16).padStart(8 * 2, '0'),'hex').reverse(),
  ...symbolSdk.utils.hexToUint8(aliceInfo.publicKey),
  ...Buffer.from(BigInt(aliceInfo.publicKeyHeight).toString(16).padStart(8 * 2, '0'),'hex').reverse(),
  ...Buffer.from(aliceInfo.accountType.toString(16).padStart(1 * 2, '0'),'hex').reverse(),
  ...Buffer.from(format.toString(16).padStart(1 * 2, '0'),'hex').reverse(),
  ...Buffer.from(supplementalPublicKeysMask.toString(16).padStart(1 * 2, '0'),'hex').reverse(),
  ...Buffer.from(votingPublicKeys.length.toString(16).padStart(1 * 2, '0'),'hex').reverse(),
  ...linkedPublicKey, ...nodePublicKey, ...vrfPublicKey, ...votingPublicKeys,
  ...importanceSnapshots, ...activityBuckets,
  ...Buffer.from(aliceInfo.mosaics.length.toString(16).padStart(2 * 2, '0'),'hex').reverse(), ...balances
]);
aliceStateHash = symbolSdk.utils.uint8ToHex(hasher.update(accountInfoBytes).digest());

//サービス提供者以外のノードから最新のブロックヘッダー情報を取得
query = new URLSearchParams({
  "order": "desc"
});
blockInfo = await fetch(
  new URL('/blocks?' + query.toString(), NODE),
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }
)
.then((res) => res.json())
.then((json) => {
  return json;
});
rootHash = blockInfo.data[0].meta.stateHashSubCacheMerkleRoots[0];

//サービス提供者を含む任意のノードからマークル情報を取得
stateProof = await fetch(
  new URL('/accounts/' + aliceAddress.toString() + '/merkle', NODE),
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }
)
.then((res) => res.json())
.then((json) => {
  return json;
});

//検証
checkState(stateProof,aliceStateHash,alicePathHash,rootHash);
```

### 13.3.2 モザイクへ登録したメタデータの検証

モザイクに登録したメタデータValue値を葉として、
マークルツリー上の分岐する枝をメタデータキーで構成されるハッシュ値でたどり、
ルートに到着できるかを確認します。

#### v2

```js
srcAddress = Buffer.from(
    sym.Address.createFromRawAddress("TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ").encoded(),
    'hex'
)

targetAddress = Buffer.from(
    sym.Address.createFromRawAddress("TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ").encoded(),
    'hex'
)

hasher = sha3_256.create();    
hasher.update(srcAddress);
hasher.update(targetAddress);
hasher.update(sym.Convert.hexToUint8Reverse("CF217E116AA422E2")); // scopeKey
hasher.update(sym.Convert.hexToUint8Reverse("1275B0B7511D9161")); // targetId
hasher.update(Uint8Array.from([sym.MetadataType.Mosaic])); // type: Mosaic 1
compositeHash = hasher.hex();

hasher = sha3_256.create();   
hasher.update( Buffer.from(compositeHash,'hex'));

pathHash = hasher.hex().toUpperCase();

//stateHash(Value値)
hasher = sha3_256.create(); 
hasher.update(cat.GeneratorUtils.uintToBuffer(1, 2)); //version
hasher.update(srcAddress);
hasher.update(targetAddress);
hasher.update(sym.Convert.hexToUint8Reverse("CF217E116AA422E2")); // scopeKey
hasher.update(sym.Convert.hexToUint8Reverse("1275B0B7511D9161")); // targetId
hasher.update(Uint8Array.from([sym.MetadataType.Mosaic])); //mosaic

value = Buffer.from("test");

hasher.update(cat.GeneratorUtils.uintToBuffer(value.length, 2)); 
hasher.update(value); 
stateHash = hasher.hex();

//サービス提供者以外のノードから最新のブロックヘッダー情報を取得
blockInfo = await blockRepo.search({order:"desc"}).toPromise();
rootHash = blockInfo.data[0].stateHashSubCacheMerkleRoots[8];

//サービス提供者を含む任意のノードからマークル情報を取得
stateProof = await stateProofService.metadataById(compositeHash).toPromise();

//検証
checkState(stateProof,stateHash,pathHash,rootHash);
```

#### v3

```js
srcAddress = (new symbolSdk.symbol.Address("TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ")).bytes;

targetAddress = (new symbolSdk.symbol.Address("TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ")).bytes;

hasher = sha3_256.create();    
hasher.update(srcAddress);
hasher.update(targetAddress);
hasher.update(symbolSdk.utils.hexToUint8("CF217E116AA422E2").reverse()); // scopeKey
hasher.update(symbolSdk.utils.hexToUint8("1275B0B7511D9161").reverse()); // targetId
hasher.update(Uint8Array.from([1])); // type: Mosaic 1
compositeHash = hasher.digest();

hasher = sha3_256.create();   
hasher.update(compositeHash);

pathHash = symbolSdk.utils.uint8ToHex(hasher.digest());

//stateHash(Value値)
hasher = sha3_256.create();
version = 1;
hasher.update(Buffer.from(version.toString(16).padStart(2 * 2, '0'),'hex').reverse()); //version
hasher.update(srcAddress);
hasher.update(targetAddress);
hasher.update(symbolSdk.utils.hexToUint8("CF217E116AA422E2").reverse()); // scopeKey
hasher.update(symbolSdk.utils.hexToUint8("1275B0B7511D9161").reverse()); // targetId
hasher.update(Uint8Array.from([1])); //mosaic

value = Buffer.from("test");

hasher.update(Buffer.from(value.length.toString(16).padStart(2 * 2, '0'),'hex').reverse());
hasher.update(value); 
stateHash = symbolSdk.utils.uint8ToHex(hasher.digest());

//サービス提供者以外のノードから最新のブロックヘッダー情報を取得
query = new URLSearchParams({
  "order": "desc"
});
blockInfo = await fetch(
  new URL('/blocks?' + query.toString(), NODE),
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }
)
.then((res) => res.json())
.then((json) => {
  return json;
});
rootHash = blockInfo.data[0].meta.stateHashSubCacheMerkleRoots[8];

//サービス提供者を含む任意のノードからマークル情報を取得
stateProof = await fetch(
  new URL('/metadata/' + symbolSdk.utils.uint8ToHex(compositeHash) + '/merkle', NODE),
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }
)
.then((res) => res.json())
.then((json) => {
  return json;
});

//検証
checkState(stateProof,stateHash,pathHash,rootHash);
```

### 13.3.3 アカウントへ登録したメタデータの検証

アカウントに登録したメタデータValue値を葉として、
マークルツリー上の分岐する枝をメタデータキーで構成されるハッシュ値でたどり、
ルートに到着できるかを確認します。

#### v2

```js
srcAddress = Buffer.from(
    sym.Address.createFromRawAddress("TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ").encoded(),
    'hex'
)

targetAddress = Buffer.from(
    sym.Address.createFromRawAddress("TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ").encoded(),
    'hex'
)

//compositePathHash(Key値)
hasher = sha3_256.create();    
hasher.update(srcAddress);
hasher.update(targetAddress);
hasher.update(sym.Convert.hexToUint8Reverse("9772B71B058127D7")); // scopeKey
hasher.update(sym.Convert.hexToUint8Reverse("0000000000000000")); // targetId
hasher.update(Uint8Array.from([sym.MetadataType.Account])); // type: Account 0
compositeHash = hasher.hex();

hasher = sha3_256.create();   
hasher.update( Buffer.from(compositeHash,'hex'));

pathHash = hasher.hex().toUpperCase();

//stateHash(Value値)
hasher = sha3_256.create(); 
hasher.update(cat.GeneratorUtils.uintToBuffer(1, 2)); //version
hasher.update(srcAddress);
hasher.update(targetAddress);
hasher.update(sym.Convert.hexToUint8Reverse("9772B71B058127D7")); // scopeKey
hasher.update(sym.Convert.hexToUint8Reverse("0000000000000000")); // targetId
hasher.update(Uint8Array.from([sym.MetadataType.Account])); //account
value = Buffer.from("test");
hasher.update(cat.GeneratorUtils.uintToBuffer(value.length, 2)); 
hasher.update(value); 
stateHash = hasher.hex();

//サービス提供者以外のノードから最新のブロックヘッダー情報を取得
blockInfo = await blockRepo.search({order:"desc"}).toPromise();
rootHash = blockInfo.data[0].stateHashSubCacheMerkleRoots[8];

//サービス提供者を含む任意のノードからマークル情報を取得
stateProof = await stateProofService.metadataById(compositeHash).toPromise();

//検証
checkState(stateProof,stateHash,pathHash,rootHash);
```

#### v3

```js
srcAddress = (new symbolSdk.symbol.Address("TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ")).bytes;

targetAddress = (new symbolSdk.symbol.Address("TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ")).bytes;

//compositePathHash(Key値)
hasher = sha3_256.create();    
hasher.update(srcAddress);
hasher.update(targetAddress);
hasher.update(symbolSdk.utils.hexToUint8("9772B71B058127D7").reverse()); // scopeKey
hasher.update(symbolSdk.utils.hexToUint8("0000000000000000").reverse()); // targetId
hasher.update(Uint8Array.from([0])); // type: Account 0
compositeHash = hasher.digest();

hasher = sha3_256.create();   
hasher.update( Buffer.from(compositeHash,'hex'));

pathHash = symbolSdk.utils.uint8ToHex(hasher.digest());

//stateHash(Value値)
hasher = sha3_256.create();
version = 1;
hasher.update(Buffer.from(version.toString(16).padStart(2 * 2, '0'),'hex').reverse()); //version
hasher.update(srcAddress);
hasher.update(targetAddress);
hasher.update(symbolSdk.utils.hexToUint8("9772B71B058127D7").reverse()); // scopeKey
hasher.update(symbolSdk.utils.hexToUint8("0000000000000000").reverse()); // targetId
hasher.update(Uint8Array.from([0])); //account
value = Buffer.from("test");
hasher.update(Buffer.from(value.length.toString(16).padStart(2 * 2, '0'),'hex').reverse());
hasher.update(value); 
stateHash = symbolSdk.utils.uint8ToHex(hasher.digest());

//サービス提供者以外のノードから最新のブロックヘッダー情報を取得
query = new URLSearchParams({
  "order": "desc"
});
blockInfo = await fetch(
  new URL('/blocks?' + query.toString(), NODE),
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }
)
.then((res) => res.json())
.then((json) => {
  return json;
});
rootHash = blockInfo.data[0].meta.stateHashSubCacheMerkleRoots[8];

//サービス提供者を含む任意のノードからマークル情報を取得
stateProof = await fetch(
  new URL('/metadata/' + symbolSdk.utils.uint8ToHex(compositeHash) + '/merkle', NODE),
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }
)
.then((res) => res.json())
.then((json) => {
  return json;
});

//検証
checkState(stateProof,stateHash,pathHash,rootHash);
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
