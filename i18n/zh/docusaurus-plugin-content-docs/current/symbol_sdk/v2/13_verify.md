# 13. 验证

验证记录在区块链上的各种信息。
虽然在区块链上记录数据是在所有节点的同意下完成的，
**区块链上的引用数据**是通过从一个单一的获取信息来实现的节点。
为此，为避免根据来自不可信节点的信息进行新的交易，必须验证从该节点获取的数据。

## 13.1 交易验证

验证交易是否包含在区块头中。如果此验证成功，则可以认为该交易已通过区块链协议授权。

在运行本章中的示例脚本之前，请加载以下必要的资料库。

```js
Buffer = require("/node_modules/buffer").Buffer;
cat = require("/node_modules/catbuffer-typescript");
sha3_256 = require("/node_modules/js-sha3").sha3_256;

accountRepo = repo.createAccountRepository();
blockRepo = repo.createBlockRepository();
stateProofService = new sym.StateProofService(repo);
```

### 待验证的有效载荷(Payload)

在这种情况下要验证的交易有效载荷以及应该记录交易的区块高度。

```js
payload =
  "C00200000000000093B0B985101C1BDD1BC2BF30D72F35E34265B3F381ECA464733E147A4F0A6B9353547E2E08189EF37E50D271BEB5F09B81CE5816BB34A153D2268520AF630A0A0E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26000000000198414140770200000000002A769FB40000000076B455CFAE2CCDA9C282BF8556D3E9C9C0DE18B0CBE6660ACCF86EB54AC51B33B001000000000000DB000000000000000E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26000000000198544198205C1A4CE06C45B3A896B1B2360E03633B9F36BF7F22338B000000000000000066653465353435393833444430383935303645394533424446434235313637433046394232384135344536463032413837364535303734423641303337414643414233303344383841303630353343353345354235413835323835443639434132364235343233343032364244444331443133343139464435353438323930334242453038423832304100000000006800000000000000B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D000000000198444198205C1A4CE06C45B3A896B1B2360E03633B9F36BF7F2233BC089179EBBE01A81400140035383435344434373631364336433635373237396800000000000000B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D000000000198444198205C1A4CE06C45B3A896B1B2360E03633B9F36BF7F223345ECB996EDDB9BEB1400140035383435344434373631364336433635373237390000000000000000B2D4FD84B2B63A96AA37C35FC6E0A2341CEC1FD19C8FFC8D93CCCA2B028D1E9D5A71EBA9C924EFA146897BE6C9BB3DACEFA26A07D687AC4A83C9B03087640E2D1DDAE952E9DDBC33312E2C8D021B4CC0435852C0756B1EBD983FCE221A981D02";
height = 59639;
```

### 有效载荷验证

验证交易内容。

```js
tx = sym.TransactionMapping.createFromPayload(payload);
hash = sym.Transaction.createTransactionHash(
  payload,
  Buffer.from(generationHash, "hex")
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

### 签名验证

可以通过确认交易已包含在区块中来验证交易，但为了确保，可以使用帐户的公钥验证交易的签名。

```js
res = alice.publicAccount.verifySignature(
  tx.getSigningBytes(
    [...Buffer.from(payload, "hex")],
    [...Buffer.from(generationHash, "hex")]
  ),
  "93B0B985101C1BDD1BC2BF30D72F35E34265B3F381ECA464733E147A4F0A6B9353547E2E08189EF37E50D271BEB5F09B81CE5816BB34A153D2268520AF630A0A"
);
console.log(res);
```

```js
> true
```

getSigningBytes 会从待签名的有效载荷中提取需要签名的部分。
请注意，要提取的部分对于普通交易和聚合交易是不同的。

### 计算 Merkle 组件哈希值

交易的哈希值不包含与签名人有关的信息。
另一方面，存储在区块头中的 Merkle 根包含交易的哈希值，其中包含签名人的信息。
因此，在验证区块内是否存在交易时，必须将交易哈希转换为 Merkle 组件哈希。

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

### 块内验证

从节点检索 Merkle 树，并检查从计算出的 merkleComponentHash 可以导出区块标头的 Merkle 根。

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

经验证，交易信息包含在区块头中。

## 13.2 块头验证

验证已知的区块哈希值（例如最终区块）是否可以追溯到正在验证的区块头。

### 正常区块验证

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
    cat.GeneratorUtils.uint64ToBuffer([block.height.lower, block.height.higher])
  );
  hasher.update(
    cat.GeneratorUtils.uint64ToBuffer([
      block.timestamp.lower,
      block.timestamp.higher,
    ])
  );
  hasher.update(
    cat.GeneratorUtils.uint64ToBuffer([
      block.difficulty.lower,
      block.difficulty.higher,
    ])
  );
  hasher.update(Buffer.from(block.proofGamma, "hex"));
  hasher.update(Buffer.from(block.proofVerificationHash, "hex"));
  hasher.update(Buffer.from(block.proofScalar, "hex"));
  hasher.update(Buffer.from(previousBlock.hash, "hex"));
  hasher.update(Buffer.from(block.blockTransactionsHash, "hex"));
  hasher.update(Buffer.from(block.blockReceiptsHash, "hex"));
  hasher.update(Buffer.from(block.stateHash, "hex"));
  hasher.update(
    sym.RawAddress.stringToAddress(block.beneficiaryAddress.address)
  );
  hasher.update(cat.GeneratorUtils.uintToBuffer(block.feeMultiplier, 4));
  hash = hasher.hex().toUpperCase();
  console.log(hash === block.hash);
}
```

如果输出为 true，则此区块哈希确认了前一个区块哈希值的存在。以相同的方式，第 "n" 个区块确认了 "n-1" 区块的存在，最终到达要验证的区块。

现在我们有了一个已知的最终区块，可以通过查询任何节点来验证是否支持要验证的区块的存在。

### 重要性块验证

ImportanceBlocks 是重新计算重要性值的区块。在主网上，每 720 个区块出现一个 ImportanceBlock，在测试网上则是每 180 个区块。除了 NormalBlock 的资讯外，还会添加以下资讯。

- votingEligibleAccountsCount (有投票权的帐户数量)
- harvestingEligibleAccountsCount (可进行收获的帐户数量)
- totalVotingBalance (总投票权重)
- previousImportanceBlockHash (先前的重要性区块杂凑值)

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
    cat.GeneratorUtils.uint64ToBuffer([block.height.lower, block.height.higher])
  );
  hasher.update(
    cat.GeneratorUtils.uint64ToBuffer([
      block.timestamp.lower,
      block.timestamp.higher,
    ])
  );
  hasher.update(
    cat.GeneratorUtils.uint64ToBuffer([
      block.difficulty.lower,
      block.difficulty.higher,
    ])
  );
  hasher.update(Buffer.from(block.proofGamma, "hex"));
  hasher.update(Buffer.from(block.proofVerificationHash, "hex"));
  hasher.update(Buffer.from(block.proofScalar, "hex"));
  hasher.update(Buffer.from(previousBlock.hash, "hex"));
  hasher.update(Buffer.from(block.blockTransactionsHash, "hex"));
  hasher.update(Buffer.from(block.blockReceiptsHash, "hex"));
  hasher.update(Buffer.from(block.stateHash, "hex"));
  hasher.update(
    sym.RawAddress.stringToAddress(block.beneficiaryAddress.address)
  );
  hasher.update(cat.GeneratorUtils.uintToBuffer(block.feeMultiplier, 4));
  hasher.update(
    cat.GeneratorUtils.uintToBuffer(block.votingEligibleAccountsCount, 4)
  );
  hasher.update(
    cat.GeneratorUtils.uint64ToBuffer([
      block.harvestingEligibleAccountsCount.lower,
      block.harvestingEligibleAccountsCount.higher,
    ])
  );
  hasher.update(
    cat.GeneratorUtils.uint64ToBuffer([
      block.totalVotingBalance.lower,
      block.totalVotingBalance.higher,
    ])
  );
  hasher.update(Buffer.from(block.previousImportanceBlockHash, "hex"));

  hash = hasher.hex().toUpperCase();
  console.log(hash === block.hash);
}
```

验证下列帐户和元数据的 stateHashSubCacheMerkleRoots。

### 重要性区块状态哈希验证

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

可以看出，用于验证区块头的九个状态是由stateHashSubCacheMerkleRoots组成的。

## 13.3 帐户元数据验证

Merkle Patricia Tree 用于验证与交易相关的帐户和元数据的存在。
如果服务提供商提供了 Merkle Patricia 树，用户可以使用自己选择的节点来验证其真实性。

### 验证常用函数

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
    sym.Convert.uint8ToHex(new Uint8Array(32))
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

### 13.3.1 账户信息验证

帐户资讯是一个叶子
通过地址追踪Merkle树上的分支，确认路由是否可达。

```js
stateProofService = new sym.StateProofService(repo);

aliceAddress = sym.Address.createFromRawAddress(
  "TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ"
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

### 13.3.2 验证注册到马赛克的元数据

元数据值以叶子节点的形式注册在马赛克中。通过由元数据键组成的哈希值跟踪 Merkle 树上的分支，并确认是否可以到达根节点。

```js
srcAddress = Buffer.from(
  sym.Address.createFromRawAddress(
    "TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ"
  ).encoded(),
  "hex"
);

targetAddress = Buffer.from(
  sym.Address.createFromRawAddress(
    "TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ"
  ).encoded(),
  "hex"
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

### 13.3.3 验证注册到帐户的元数据

元数据值以叶节点的形式在账户中注册。通过由元数据键组成的哈希值跟踪 Merkle 树的分支，并确认是否可以到达根节点。

```js
srcAddress = Buffer.from(
  sym.Address.createFromRawAddress(
    "TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ"
  ).encoded(),
  "hex"
);

targetAddress = Buffer.from(
  sym.Address.createFromRawAddress(
    "TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ"
  ).encoded(),
  "hex"
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

### 可信网络

对“可信网络”的简单解释是实现一个一切都与平台无关且无需验证的网络。

本章节所展示的验证方法表明，区块链中的所有信息都可以通过区块头的哈希值进行验证。区块链基于共享每个人都同意的区块头和可以重现它们的全节点的存在。然而，在想要利用区块链的每种情况下维护验证环境是具有挑战性的。

如果最新的区块头不断由多个可信机构广播，这可以大大减少验证的需求。这样的基础设施将允许在区块链能力之外的地方，如人口密集的城市地区或无法适当部署基站的偏远地区，甚至在灾难期间的广域网络中断期间，获得可信信息的访问。

