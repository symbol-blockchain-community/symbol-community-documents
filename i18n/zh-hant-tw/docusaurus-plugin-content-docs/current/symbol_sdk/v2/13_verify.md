# 13.驗證

驗證記錄在區塊鏈上的各種信息。
雖然在區塊鏈上記錄數據是在所有節點的同意下完成的，
**區塊鏈上的引用數據**是通過從一個單一的獲取信息來實現的節點。
為此，為避免根據來自不可信節點的信息進行新的交易，必須驗證從該節點獲取的數據。

## 13.1 交易驗證

驗證交易是否包含在區塊頭中。 如果此驗證成功，則可以認為該交易已通過區塊鏈協議授權。

在運行本章中的示例腳本之前，請加載以下必要的資料庫。

```js
Buffer = require("/node_modules/buffer").Buffer;
cat = require("/node_modules/catbuffer-typescript");
sha3_256 = require("/node_modules/js-sha3").sha3_256;

accountRepo = repo.createAccountRepository();
blockRepo = repo.createBlockRepository();
stateProofService = new sym.StateProofService(repo);
```

### 待驗證的有效載荷(Payload)

在這種情況下要驗證的交易有效載荷以及應該記錄交易的區塊高度。

```js
payload =
  "C00200000000000093B0B985101C1BDD1BC2BF30D72F35E34265B3F381ECA464733E147A4F0A6B9353547E2E08189EF37E50D271BEB5F09B81CE5816BB34A153D2268520AF630A0A0E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26000000000198414140770200000000002A769FB40000000076B455CFAE2CCDA9C282BF8556D3E9C9C0DE18B0CBE6660ACCF86EB54AC51B33B001000000000000DB000000000000000E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26000000000198544198205C1A4CE06C45B3A896B1B2360E03633B9F36BF7F22338B000000000000000066653465353435393833444430383935303645394533424446434235313637433046394232384135344536463032413837364535303734423641303337414643414233303344383841303630353343353345354235413835323835443639434132364235343233343032364244444331443133343139464435353438323930334242453038423832304100000000006800000000000000B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D000000000198444198205C1A4CE06C45B3A896B1B2360E03633B9F36BF7F2233BC089179EBBE01A81400140035383435344434373631364336433635373237396800000000000000B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D000000000198444198205C1A4CE06C45B3A896B1B2360E03633B9F36BF7F223345ECB996EDDB9BEB1400140035383435344434373631364336433635373237390000000000000000B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D5A71EBA9C924EFA146897BE6C9BB3DACEFA26A07D687AC4A83C9B03087640E2D1DDAE952E9DDBC33312E2C8D021B4CC0435852C0756B1EBD983FCE221A981D02";
height = 59639;
```

### 有效載荷驗證

驗證交易內容。

```js
tx = sym.TransactionMapping.createFromPayload(payload);
hash = sym.Transaction.createTransactionHash(
  payload,
  Buffer.from(generationHash, "hex"),
);
console.log(hash);
console.log(tx);
```

###### 市例演示

```js
> 257E2CAECF4B477235CA93C37090E8BE58B7D3812A012E39B7B55BA7D7FFCB20
> AggregateTransaction
    > cosignatures: Array(1)
      0: AggregateTransactionCosignature
        signature: "5A71EBA9C924EFA146897BE6C9BB3DACEFA26A07D687AC4A83C9B03087640E2D1DDAE952E9DDBC33312E2C8D021B4CC0435852C0756B1EBD983FCE221A981D02"
        signer: PublicAccount
          address: Address {address: 'TAQFYGSM4BWELM5IS2Y3ENQOANRTXHZWX57SEMY', networkType: 152}
          publicKey: "B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D"
      deadline: Deadline {adjustedValue: 3030349354}
    > innerTransactions: Array(3)
        0: TransferTransaction {type: 16724, networkType: 152, version: 1, deadline: Deadline, maxFee: UInt64, …}
        1: AccountMetadataTransaction {type: 16708, networkType: 152, version: 1, deadline: Deadline, maxFee: UInt64, …}
        2: AccountMetadataTransaction {type: 16708, networkType: 152, version: 1, deadline: Deadline, maxFee: UInt64, …}
      maxFee: UInt64 {lower: 161600, higher: 0}
      networkType: 152
      signature: "93B0B985101C1BDD1BC2BF30D72F35E34265B3F381ECA464733E147A4F0A6B9353547E2E08189EF37E50D271BEB5F09B81CE5816BB34A153D2268520AF630A0A"
    > signer: PublicAccount
        address: Address {address: 'TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ', networkType: 152}
        publicKey: "0E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26"
      transactionInfo: undefined
      type: 16705
```

### 簽名驗證

可以通過確認交易已包含在區塊中來驗證交易，但為了確保，可以使用帳戶的公鑰驗證交易的簽名。

```js
res = alice.publicAccount.verifySignature(
  tx.getSigningBytes(
    [...Buffer.from(payload, "hex")],
    [...Buffer.from(generationHash, "hex")],
  ),
  "93B0B985101C1BDD1BC2BF30D72F35E34265B3F381ECA464733E147A4F0A6B9353547E2E08189EF37E50D271BEB5F09B81CE5816BB34A153D2268520AF630A0A",
);
console.log(res);
```

```js
> true
```

getSigningBytes 會從待簽名的有效載荷中提取需要簽名的部分。
請注意，要提取的部分對於普通交易和聚合交易是不同的。

### 計算 Merkle 組件哈希值

交易的哈希值不包含與簽名人有關的信息。
另一方面，存儲在區塊頭中的 Merkle 根包含交易的哈希值，其中包含簽名人的信息。
因此，在驗證區塊內是否存在交易時，必須將交易哈希轉換為 Merkle 組件哈希。

```js
merkleComponentHash = hash;
if (tx.cosignatures !== undefined && tx.cosignatures.length > 0) {
  const hasher = sha3_256.create();
  hasher.update(Buffer.from(hash, "hex"));
  for (cosignature of tx.cosignatures) {
    hasher.update(Buffer.from(cosignature.signer.publicKey, "hex"));
  }
  merkleComponentHash = hasher.hex().toUpperCase();
}
console.log(merkleComponentHash);
```

```js
> C8D1335F07DE05832B702CACB85B8EDAC2F3086543C76C9F56F99A0861E8F235
```

### 塊內驗證

從節點檢索 Merkle 樹，並檢查從計算出的 merkleComponentHash 可以導出區塊標頭的 Merkle 根。

```js
function validateTransactionInBlock(leaf, HRoot, merkleProof) {
  if (merkleProof.length === 0) {
    // There is a single item in the tree, so HRoot' = leaf.
    return leaf.toUpperCase() === HRoot.toUpperCase();
  }

  const HRoot0 = merkleProof.reduce((proofHash, pathItem) => {
    const hasher = sha3_256.create();
    if (pathItem.position === sym.MerklePosition.Left) {
      return hasher.update(Buffer.from(pathItem.hash + proofHash, "hex")).hex();
    } else {
      return hasher.update(Buffer.from(proofHash + pathItem.hash, "hex")).hex();
    }
  }, leaf);
  return HRoot.toUpperCase() === HRoot0.toUpperCase();
}

//Calculate from transaction
leaf = merkleComponentHash.toLowerCase(); //merkleComponentHash

//Retrieve from node
HRoot = (await blockRepo.getBlockByHeight(height).toPromise())
  .blockTransactionsHash;
merkleProof = (await blockRepo.getMerkleTransaction(height, leaf).toPromise())
  .merklePath;

result = validateTransactionInBlock(leaf, HRoot, merkleProof);
console.log(result);
```

```js
> true
```

經驗證，交易信息包含在區塊頭中。

## 13.2 塊頭驗證

驗證已知的區塊哈希值（例如最終區塊）是否可以追溯到正在驗證的區塊頭。

### 正常區塊驗證

```js
block = await blockRepo.getBlockByHeight(height).toPromise();
previousBlock = await blockRepo.getBlockByHeight(height - 1).toPromise();
if (block.type === sym.BlockType.NormalBlock) {
  hasher = sha3_256.create();
  hasher.update(Buffer.from(block.signature, "hex")); //signature
  hasher.update(Buffer.from(block.signer.publicKey, "hex")); //publicKey
  hasher.update(cat.GeneratorUtils.uintToBuffer(block.version, 1));
  hasher.update(cat.GeneratorUtils.uintToBuffer(block.networkType, 1));
  hasher.update(cat.GeneratorUtils.uintToBuffer(block.type, 2));
  hasher.update(
    cat.GeneratorUtils.uint64ToBuffer([
      block.height.lower,
      block.height.higher,
    ]),
  );
  hasher.update(
    cat.GeneratorUtils.uint64ToBuffer([
      block.timestamp.lower,
      block.timestamp.higher,
    ]),
  );
  hasher.update(
    cat.GeneratorUtils.uint64ToBuffer([
      block.difficulty.lower,
      block.difficulty.higher,
    ]),
  );
  hasher.update(Buffer.from(block.proofGamma, "hex"));
  hasher.update(Buffer.from(block.proofVerificationHash, "hex"));
  hasher.update(Buffer.from(block.proofScalar, "hex"));
  hasher.update(Buffer.from(previousBlock.hash, "hex"));
  hasher.update(Buffer.from(block.blockTransactionsHash, "hex"));
  hasher.update(Buffer.from(block.blockReceiptsHash, "hex"));
  hasher.update(Buffer.from(block.stateHash, "hex"));
  hasher.update(
    sym.RawAddress.stringToAddress(block.beneficiaryAddress.address),
  );
  hasher.update(cat.GeneratorUtils.uintToBuffer(block.feeMultiplier, 4));
  hash = hasher.hex().toUpperCase();
  console.log(hash === block.hash);
}
```

如果輸出為 true，則此區塊哈希確認了前一個區塊哈希值的存在。以相同的方式，第 "n" 個區塊確認了 "n-1" 區塊的存在，最終到達要驗證的區塊。

現在我們有了一個已知的最終區塊，可以通過查詢任何節點來驗證是否支持要驗證的區塊的存在。

### 重要性塊驗證

ImportanceBlocks 是重新計算重要性值的區塊。在主網上，每 720 個區塊出現一個 ImportanceBlock，在測試網上則是每 180 個區塊。除了 NormalBlock 的資訊外，還會添加以下資訊。

- votingEligibleAccountsCount (有投票权的帳戶數量)
- harvestingEligibleAccountsCount (可進行收穫的帳戶數量)
- totalVotingBalance (總投票權重)
- previousImportanceBlockHash (先前的重要性區塊雜湊值)

```js
block = await blockRepo.getBlockByHeight(height).toPromise();
previousBlock = await blockRepo.getBlockByHeight(height - 1).toPromise();
if (block.type === sym.BlockType.ImportanceBlock) {
  hasher = sha3_256.create();
  hasher.update(Buffer.from(block.signature, "hex")); //signature
  hasher.update(Buffer.from(block.signer.publicKey, "hex")); //publicKey
  hasher.update(cat.GeneratorUtils.uintToBuffer(block.version, 1));
  hasher.update(cat.GeneratorUtils.uintToBuffer(block.networkType, 1));
  hasher.update(cat.GeneratorUtils.uintToBuffer(block.type, 2));
  hasher.update(
    cat.GeneratorUtils.uint64ToBuffer([
      block.height.lower,
      block.height.higher,
    ]),
  );
  hasher.update(
    cat.GeneratorUtils.uint64ToBuffer([
      block.timestamp.lower,
      block.timestamp.higher,
    ]),
  );
  hasher.update(
    cat.GeneratorUtils.uint64ToBuffer([
      block.difficulty.lower,
      block.difficulty.higher,
    ]),
  );
  hasher.update(Buffer.from(block.proofGamma, "hex"));
  hasher.update(Buffer.from(block.proofVerificationHash, "hex"));
  hasher.update(Buffer.from(block.proofScalar, "hex"));
  hasher.update(Buffer.from(previousBlock.hash, "hex"));
  hasher.update(Buffer.from(block.blockTransactionsHash, "hex"));
  hasher.update(Buffer.from(block.blockReceiptsHash, "hex"));
  hasher.update(Buffer.from(block.stateHash, "hex"));
  hasher.update(
    sym.RawAddress.stringToAddress(block.beneficiaryAddress.address),
  );
  hasher.update(cat.GeneratorUtils.uintToBuffer(block.feeMultiplier, 4));
  hasher.update(
    cat.GeneratorUtils.uintToBuffer(block.votingEligibleAccountsCount, 4),
  );
  hasher.update(
    cat.GeneratorUtils.uint64ToBuffer([
      block.harvestingEligibleAccountsCount.lower,
      block.harvestingEligibleAccountsCount.higher,
    ]),
  );
  hasher.update(
    cat.GeneratorUtils.uint64ToBuffer([
      block.totalVotingBalance.lower,
      block.totalVotingBalance.higher,
    ]),
  );
  hasher.update(Buffer.from(block.previousImportanceBlockHash, "hex"));

  hash = hasher.hex().toUpperCase();
  console.log(hash === block.hash);
}
```

驗證下列帳戶和元數據的 stateHashSubCacheMerkleRoots。

### 重要性區塊狀態哈希驗證

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
hasher.update(Buffer.from(block.stateHashSubCacheMerkleRoots[0], "hex")); //AccountState
hasher.update(Buffer.from(block.stateHashSubCacheMerkleRoots[1], "hex")); //Namespace
hasher.update(Buffer.from(block.stateHashSubCacheMerkleRoots[2], "hex")); //Mosaic
hasher.update(Buffer.from(block.stateHashSubCacheMerkleRoots[3], "hex")); //Multisig
hasher.update(Buffer.from(block.stateHashSubCacheMerkleRoots[4], "hex")); //HashLockInfo
hasher.update(Buffer.from(block.stateHashSubCacheMerkleRoots[5], "hex")); //SecretLockInfo
hasher.update(Buffer.from(block.stateHashSubCacheMerkleRoots[6], "hex")); //AccountRestriction
hasher.update(Buffer.from(block.stateHashSubCacheMerkleRoots[7], "hex")); //MosaicRestriction
hasher.update(Buffer.from(block.stateHashSubCacheMerkleRoots[8], "hex")); //Metadata
hash = hasher.hex().toUpperCase();
console.log(block.stateHash === hash);
```

```js
> true
```

可以看出，用於驗證區塊頭的九個狀態是由stateHashSubCacheMerkleRoots組成的。

## 13.3 帳戶元數據驗證

Merkle Patricia Tree 用於驗證與交易相關的帳戶和元數據的存在。
如果服務提供商提供了 Merkle Patricia 樹，用戶可以使用自己選擇的節點來驗證其真實性。

### 驗證常用函數

```js
//Function for obtaining the hash value of a leaf
function getLeafHash(encodedPath, leafValue) {
  const hasher = sha3_256.create();
  return hasher
    .update(sym.Convert.hexToUint8(encodedPath + leafValue))
    .hex()
    .toUpperCase();
}

//Function for obtaining the hash value of a branch
function getBranchHash(encodedPath, links) {
  const branchLinks = Array(16).fill(
    sym.Convert.uint8ToHex(new Uint8Array(32)),
  );
  links.forEach((link) => {
    branchLinks[parseInt(`0x${link.bit}`, 16)] = link.link;
  });
  const hasher = sha3_256.create();
  const bHash = hasher
    .update(sym.Convert.hexToUint8(encodedPath + branchLinks.join("")))
    .hex()
    .toUpperCase();
  return bHash;
}

//World State Verification
function checkState(stateProof, stateHash, pathHash, rootHash) {
  const merkleLeaf = stateProof.merkleTree.leaf;
  const merkleBranches = stateProof.merkleTree.branches.reverse();
  const leafHash = getLeafHash(merkleLeaf.encodedPath, stateHash);

  let linkHash = leafHash; //The first linkHash is a leafHash.
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

  const treeRootHash = linkHash; //The last linkHash is the rootHash
  let treePathHash = bit + merkleLeaf.path;

  if (treePathHash.length % 2 == 1) {
    treePathHash = treePathHash.slice(0, -1);
  }

  //verification
  console.log(treeRootHash === rootHash);
  console.log(treePathHash === pathHash);
}
```

### 13.3.1 賬戶信息驗證

帳戶資訊是一個葉子
通過地址追踪Merkle樹上的分支，確認路由是否可達。

```js
stateProofService = new sym.StateProofService(repo);

aliceAddress = sym.Address.createFromRawAddress(
  "TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ",
);

hasher = sha3_256.create();
alicePathHash = hasher
  .update(sym.RawAddress.stringToAddress(aliceAddress.plain()))
  .hex()
  .toUpperCase();

hasher = sha3_256.create();
aliceInfo = await accountRepo.getAccountInfo(aliceAddress).toPromise();
aliceStateHash = hasher.update(aliceInfo.serialize()).hex().toUpperCase();

//Obtaining up-to-date block header information from non-service provider nodes
blockInfo = await blockRepo.search({ order: "desc" }).toPromise();
rootHash = blockInfo.data[0].stateHashSubCacheMerkleRoots[0];

//Obtaining merkle information from any node, including service providers
stateProof = await stateProofService.accountById(aliceAddress).toPromise();

//Verification
checkState(stateProof, aliceStateHash, alicePathHash, rootHash);
```

### 13.3.2 驗證註冊到馬賽克的元數據

元數據值以葉子節點的形式註冊在馬賽克中。通過由元數據鍵組成的哈希值跟踪 Merkle 樹上的分支，並確認是否可以到達根節點。

```js
srcAddress = Buffer.from(
  sym.Address.createFromRawAddress(
    "TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ",
  ).encoded(),
  "hex",
);

targetAddress = Buffer.from(
  sym.Address.createFromRawAddress(
    "TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ",
  ).encoded(),
  "hex",
);

hasher = sha3_256.create();
hasher.update(srcAddress);
hasher.update(targetAddress);
hasher.update(sym.Convert.hexToUint8Reverse("CF217E116AA422E2")); // scopeKey
hasher.update(sym.Convert.hexToUint8Reverse("1275B0B7511D9161")); // targetId
hasher.update(Uint8Array.from([sym.MetadataType.Mosaic])); // type: Account 0
compositeHash = hasher.hex();

hasher = sha3_256.create();
hasher.update(Buffer.from(compositeHash, "hex"));

pathHash = hasher.hex().toUpperCase();

//stateHash(Value)
hasher = sha3_256.create();
hasher.update(cat.GeneratorUtils.uintToBuffer(1, 2)); //version
hasher.update(srcAddress);
hasher.update(targetAddress);
hasher.update(sym.Convert.hexToUint8Reverse("CF217E116AA422E2")); // scopeKey
hasher.update(sym.Convert.hexToUint8Reverse("1275B0B7511D9161")); // targetId
hasher.update(Uint8Array.from([sym.MetadataType.Mosaic])); //account

value = Buffer.from("test");

hasher.update(cat.GeneratorUtils.uintToBuffer(value.length, 2));
hasher.update(value);
stateHash = hasher.hex();

//Obtaining up-to-date block header information from non-service provider nodes
blockInfo = await blockRepo.search({ order: "desc" }).toPromise();
rootHash = blockInfo.data[0].stateHashSubCacheMerkleRoots[8];

//Obtaining merkle information from any node, including service providers
stateProof = await stateProofService.metadataById(compositeHash).toPromise();

//Verification
checkState(stateProof, stateHash, pathHash, rootHash);
```

### 13.3.3 驗證註冊到帳戶的元數據

元數據值以葉節點的形式在賬戶中註冊。通過由元數據鍵組成的哈希值跟踪 Merkle 樹的分支，並確認是否可以到達根節點。

```js
srcAddress = Buffer.from(
  sym.Address.createFromRawAddress(
    "TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ",
  ).encoded(),
  "hex",
);

targetAddress = Buffer.from(
  sym.Address.createFromRawAddress(
    "TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ",
  ).encoded(),
  "hex",
);

//compositePathHash(Key value)
hasher = sha3_256.create();
hasher.update(srcAddress);
hasher.update(targetAddress);
hasher.update(sym.Convert.hexToUint8Reverse("9772B71B058127D7")); // scopeKey
hasher.update(sym.Convert.hexToUint8Reverse("0000000000000000")); // targetId
hasher.update(Uint8Array.from([sym.MetadataType.Account])); // type: Account 0
compositeHash = hasher.hex();

hasher = sha3_256.create();
hasher.update(Buffer.from(compositeHash, "hex"));

pathHash = hasher.hex().toUpperCase();

//stateHash(Value)
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

//Obtaining up-to-date block header information from non-service provider nodes
blockInfo = await blockRepo.search({ order: "desc" }).toPromise();
rootHash = blockInfo.data[0].stateHashSubCacheMerkleRoots[8];

//Obtaining merkle information from any node, including service providers
stateProof = await stateProofService.metadataById(compositeHash).toPromise();

//Verification
checkState(stateProof, stateHash, pathHash, rootHash);
```

## 13.4 使用提示

### 可信網絡

對“可信網絡”的簡單解釋是實現一個一切都與平台無關且無需驗證的網絡。

本章節所展示的驗證方法表明，區塊鏈中的所有信息都可以通過區塊頭的哈希值進行驗證。區塊鏈基於共享每個人都同意的區塊頭和可以重現它們的全節點的存在。然而，在想要利用區塊鏈的每種情況下維護驗證環境是具有挑戰性的。

如果最新的區塊頭不斷由多個可信機構廣播，這可以大大減少驗證的需求。這樣的基礎設施將允許在區塊鏈能力之外的地方，如人口密集的城市地區或無法適當部署基站的偏遠地區，甚至在災難期間的廣域網絡中斷期間，獲得可信信息的訪問。
