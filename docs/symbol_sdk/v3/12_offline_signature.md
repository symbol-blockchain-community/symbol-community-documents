---
sidebar_position: 12
---

# 12.オフライン署名

ロック機構の章で、アナウンスしたトランザクションをハッシュ値指定でロックして、  
複数の署名（オンライン署名）を集めるアグリゲートトランザクションを紹介しました。  
この章では、トランザクションを事前に署名を集めてノードにアナウンスするオフライン署名について説明します。

## 手順

Aliceが起案者となりトランザクションを作成し、署名します。  
次にBobが署名してAliceに返します。  
最後にAliceがトランザクションを結合してネットワークにアナウンスします。

## 12.1 トランザクション作成

```js
// Bobアカウント生成
bobKey = facade.createAccount(sdk.core.PrivateKey.random());
bobAddress = facade.network.publicKeyToAddress(bobKey.publicKey);

// アグリゲートTxに含めるTxを作成
innerTx1 = facade.createEmbeddedTransactionFromTypedDescriptor(
  new sdk.symbol.descriptors.TransferTransactionV1Descriptor(
    bobAddress,
    [],
    new Uint8Array([0x00, ...new TextEncoder().encode("tx1")])
  ),
  aliceKey.publicKey
);

innerTx2 = facade.createEmbeddedTransactionFromTypedDescriptor(
  new sdk.symbol.descriptors.TransferTransactionV1Descriptor(
    aliceKey.address,
    [],
    new Uint8Array([0x00, ...new TextEncoder().encode("tx2")])
  ),
  bobKey.publicKey
);

// マークルハッシュの算出
embeddedTransactions = [innerTx1, innerTx2];
merkleHash = facade.static.hashEmbeddedTransactions(embeddedTransactions);

// アグリゲートTx作成
aggregateDescriptor = new sdk.symbol.descriptors.AggregateCompleteTransactionV2Descriptor(
  merkleHash,
  embeddedTransactions
);
aggregateTx = facade.createTransactionFromTypedDescriptor(
  aggregateDescriptor,
  aliceKey.publicKey,
  100,
  60 * 60 * 2
);

// 連署により追加される連署情報のサイズを考慮して手数料を算出
requiredCosignatures = 1; // 必要な連署者の数
sizePerCosignature = 8 + 32 + 64;
calculatedSize = aggregateTx.size + requiredCosignatures * sizePerCosignature;
aggregateTx.fee = new sdk.symbol.models.Amount(BigInt(calculatedSize * 100)); //手数料

// 署名
sig = aliceKey.signTransaction(aggregateTx);
jsonPayload = facade.transactionFactory.static.attachSignature(aggregateTx, sig);

signedHash = facade.hashTransaction(aggregateTx).toString();
signedPayload = JSON.parse(jsonPayload).payload;

console.log(signedPayload);
```

###### 出力例

```js
>580100000000000039A6555133357524A8F4A832E1E596BDBA39297BC94CD1D0728572EE14F66AA71ACF5088DB6F0D1031FF65F2BBA7DA9EE3A8ECF242C2A0FE41B6A00A2EF4B9020E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26000000000198414100AF000000000000D4641CD902000000306771D758886F1529F9B61664B0450ED138B27CC5E3AE579C16D550EDEE5791B00000000000000054000000000000000E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26000000000198544198A1BE13194C0D18897DD88FE3BC4860B8EEF79C6BC8C8720400000000000000007478310000000054000000000000003C4ADF83264FF73B4EC1DD05B490723A8CFFAE1ABBD4D4190AC4CAC1E6505A5900000000019854419850BF0FD1A45FCEE211B57D0FE2B6421EB81979814F629204000000000000000074783200000000
```

署名を行い、signedHash, signedPayloadを出力します。  
signedPayloadをBobに渡して署名を促します。

## 12.2 Bobによる連署

Aliceから受け取ったsignedPayloadでトランザクションを復元します。

```js
tx = sdk.symbol.SymbolTransactionFactory.deserialize(
  sdk.core.utils.hexToUint8(signedPayload)
);
console.log(tx);
```

###### 出力例

```js
> AggregateBondedTransactionV2
    _aggregateTransactionHeaderReserved_1: 0
    _cosignatures: []
    _deadline: Timestamp {size: 8, isSigned: false, value: 22883170004n}
    _entityBodyReserved_1: 0
    _fee: Amount {size: 8, isSigned: false, value: 44800n}
    _network: NetworkType {value: 152}
    _signature: Signature {bytes: Uint8Array(64)}
    _signerPublicKey: PublicKey {bytes: Uint8Array(32)}
  > _transactions: Array(2)
      0: EmbeddedTransferTransactionV1 {_signerPublicKey: PublicKey, _version: 1, _network: NetworkType, _type: TransactionType, _recipientAddress: UnresolvedAddress, …}
      1: EmbeddedTransferTransactionV1 {_signerPublicKey: PublicKey, _version: 1, _network: NetworkType, _type: TransactionType, _recipientAddress: UnresolvedAddress, …}
      length: 2
    _transactionsHash: Hash256 {bytes: Uint8Array(32)}
    _type: TransactionType {value: 16961}
    _verifiableEntityHeaderReserved_1: 0
    _version: 2
```

念のため、Aliceがすでに署名したトランザクション（ペイロード）かどうかを検証します。

```js
res = facade.verifyTransaction(tx, tx.signature);
console.log(res);
```

###### 出力例

```js
> true
```

ペイロードがsigner、つまりAliceによって署名されたものであることが確認できました。
次にBobが連署します。

```js
bobCosignature = sdk.symbol.SymbolFacade.cosignTransactionHash(bobKey.keyPair, tx._transactionsHash, true);
bobSignedTxSignature = bobCosignature.signature;
bobSignedTxSignerPublicKey = bobCosignature.signerPublicKey;
```

CosignatureTransactionで署名を行い、bobSignedTxSignature,bobSignedTxSignerPublicKeyを出力しAliceに返却します。  
Bobが全ての署名を揃えられる場合は、Aliceに返却しなくてもBobがアナウンスすることも可能です。

## 12.3 Aliceによるアナウンス

AliceはBobからbobSignedTxSignature,bobSignedTxSignerPublicKeyを受け取ります。  
また事前にAlice自身で作成したsignedPayloadを用意します。

```js
recreatedTx = sdk.symbol.SymbolTransactionFactory.deserialize(
  sdk.core.utils.hexToUint8(signedPayload)
);

// 連署者の署名を追加
cosignature = new sdk.symbol.models.Cosignature();
cosignature.parentHash = facade.hashTransaction(recreatedTx);
cosignature.version = 0n;
cosignature.signerPublicKey = bobSignedTxSignerPublicKey;
cosignature.signature = bobSignedTxSignature;
recreatedTx.cosignatures.push(cosignature);

signedPayloadWithCosig = sdk.core.utils.uint8ToHex(recreatedTx.serialize());

// アナウンス
await fetch(new URL("/transactions", NODE), {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ payload: signedPayloadWithCosig }),
})
  .then((res) => res.json())
  .then((json) => {
    return json;
  });
```

## 12.4 現場で使えるヒント

### マーケットプレイスレス

ボンデッドトランザクションと異なりハッシュロックのための手数料(10XYM)を気にする必要がありません。  
ペイロードを共有できる場が存在する場合、売り手は考えられるすべての買い手候補に対してペイロードを作成して交渉開始を待つことができます。
（複数のトランザクションが個別に実行されないように、1つしか存在しない領収書NFTをアグリゲートトランザクションに混ぜ込むなどして排他制御をしてください）。
この交渉に専用のマーケットプレイスを構築する必要はありません。
SNSのタイムラインをマーケットプレイスにしたり、必要に応じて任意の時間や空間でワンタイムマーケットプレイスを展開することができます。

ただ、オフラインで署名を交換するため、なりすましのハッシュ署名要求には気を付けましょう。  
（必ず検証可能なペイロードからハッシュを生成して署名するようにしてください）
