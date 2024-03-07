# 5.馬賽克

本章介紹 Mosaic 設置及其生成方式。
在 Symbol 中，令牌被稱為馬賽克。

根據維基百科的描述，令牌（Token）是“各種形狀的泥製品，直徑約為1厘米，出土於公元前8000年至公元前3000年的美索不達米亞層。”另一方面，馬賽克（Mosaic）是“一種裝飾藝術技巧，通過將小塊材料組裝嵌入以形成圖像或圖案。石材、陶瓷（馬賽克瓷磚）、有色和無色玻璃、貝殼和木材用於裝飾建築或工藝品的地面和牆壁。”
在 Symbol 中，馬賽克可以被認為是代表 Symbol 區塊鏈創建的生態系統各個方面的各種組件。

## 5.1 馬賽克生成

對於馬賽克生成，定義要創建的馬賽克。

```js
supplyMutable = true; //Availability of supply changes
transferable = false; //Transferability to third parties
restrictable = true; //Availability of restriction settings
revokable = true; //Revocability from the issuer
//Mosaic definition
nonce = sym.MosaicNonce.createRandom();
mosaicDefTx = sym.MosaicDefinitionTransaction.create(
  undefined,
  nonce,
  sym.MosaicId.createFromNonce(nonce, alice.address), //Mosaic ID
  sym.MosaicFlags.create(supplyMutable, transferable, restrictable, revokable),
  2, //Divisibility:Divisibility
  sym.UInt64.fromUint(0), //Duration:Effective date
  networkType,
);
```

馬賽克標誌如下。

```js
MosaicFlags {
  supplyMutable: false, transferable: false, restrictable: false, revokable: false
}
```

可以指定供應變更的許可、向第三方的可轉讓性、Mosaic 全球限制的應用和發行人的可撤銷性。
一旦設置這些屬性，以後就不能更改。

#### 可分割性

可被整除性（Divisibility）決定了可以測量數量的小數位數。數據以整數值保存。

divisibility:0 = 1  
divisibility:1 = 1.0  
divisibility:2 = 1.00

#### 持續時間

如果指定為 0，則不能再細分為更小的單元。
如果設置了馬賽克有效期，有效期過後數據不會消失。
請注意，每個帳戶最多可以擁有 1,000 個馬賽克。

接下來，更改數量。

```js
//Mosaic change
mosaicChangeTx = sym.MosaicSupplyChangeTransaction.create(
  undefined,
  mosaicDefTx.mosaicId,
  sym.MosaicSupplyChangeAction.Increase,
  sym.UInt64.fromUint(1000000),
  networkType,
);
```

如果supplyMutable:false，只有當整個馬賽克的供應量在發行者的賬戶中時，數量才能被更改。
如果整除率 > 0，則將其定義為最小單位為 1 的整數值。
（如果要創建 1.00 可整除性，請指定 100：2）

馬賽克供應量更改操作如下所示。

```js
{0: 'Decrease', 1: 'Increase'}
```

如果要增加它，請指定增加。
將上面的兩個事務合併成一個聚合事務。

```js
aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [
    mosaicDefTx.toAggregate(alice.publicAccount),
    mosaicChangeTx.toAggregate(alice.publicAccount),
  ],
  networkType,
  [],
).setMaxFeeForAggregate(100, 0);
signedTx = alice.sign(aggregateTx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

請注意，聚合交易的一個特點是它會嘗試更改尚不存在的馬賽克的數量。
排列時，如果沒有不一致，則可以在單個塊內毫無問題的處理它們。

### 確認

確認創建馬賽克的賬戶持有的馬賽克信息。

```js
mosaicRepo = repo.createMosaicRepository();
accountInfo.mosaics.forEach(async (mosaic) => {
  mosaicInfo = await mosaicRepo.getMosaic(mosaic.id).toPromise();
  console.log(mosaicInfo);
});
```

###### 示例演示

```js
> MosaicInfo {version: 1, recordId: '622988B12A6128903FC10496', id: MosaicId, supply: UInt64, startHeight: UInt64, …}
> MosaicInfo
    divisibility: 2 //Divisibility
    duration: UInt64 {lower: 0, higher: 0} //Duration
  > flags: MosaicFlags
        restrictable: true //Availability of restriction settings
        revokable: true //Revocability from the issuer
        supplyMutable: true //Availability of supply changes
        transferable: false //Transferability to third parties
  > id: MosaicId
        id: Id {lower: 207493124, higher: 890137608} //MosaicID
    ownerAddress: Address {address: 'TBIL6D6RURP45YQRWV6Q7YVWIIPLQGLZQFHWFEQ', networkType: 152} //Issure address
    recordId: "62626E3C741381859AFAD4D5"
    supply: UInt64 {lower: 1000000, higher: 0} //Total supply
```

## 5.2 馬賽克轉移

傳輸創建的馬賽克。
剛接觸區塊鏈的人常常把馬賽克傳輸想像成“將存儲在一個客戶端的馬賽克發送到另一個客戶端”，但馬賽克信息始終在所有節點之間共享和同步，而不是將馬賽克信息傳輸到目的地。
更準確地說，它是指通過向區塊鏈“發送交易”來重新組合賬戶之間代幣餘額的操作。

```js
//Creating a receiving account
bob = sym.Account.generateNewAccount(networkType);
tx = sym.TransferTransaction.create(
  sym.Deadline.create(epochAdjustment),
  bob.address, //Destination address
  // Transfer mosaic list
  [
    new sym.Mosaic(
      new sym.MosaicId("3A8416DB2D53B6C8"), //TestnetXYM
      sym.UInt64.fromUint(1000000), //1XYM(divisibility:6)
    ),
    new sym.Mosaic(
      mosaicDefTx.mosaicId, // Mosaic created in 5.1.
      sym.UInt64.fromUint(1), // Amount:0.01(InCaseDivisibility:2)
    ),
  ],
  sym.EmptyMessage,
  networkType,
).setMaxFee(100);
signedTx = alice.sign(tx, generationHash);
await txRepo.announce(signedTx).toPromise();
```

##### 傳輸馬賽克列表

可以在單個事務中傳輸多個馬賽克。
要傳輸 XYM，請指定以下馬賽克 ID。

- 主網：6BED913FA20223F8
- 測試網：3A8416DB2D53B6C8

#### 帳戶

所有小數點也指定為整數。
XYM 可整除 6，因此指定為 1XYM=1000000。

### 交易確認

```js
txInfo = await txRepo
  .getTransaction(signedTx.hash, sym.TransactionGroup.Confirmed)
  .toPromise();
console.log(txInfo);
```

###### 示例演示

```js
> TransferTransaction
    deadline: Deadline {adjustedValue: 12776690385}
    maxFee: UInt64 {lower: 19200, higher: 0}
    message: RawMessage {type: -1, payload: ''}
  > mosaics: Array(2)
      > 0: Mosaic
            amount: UInt64 {lower: 1, higher: 0}
          > id: MosaicId
                id: Id {lower: 207493124, higher: 890137608}
      > 1: Mosaic
            amount: UInt64 {lower: 1000000, higher: 0}
          > id: MosaicId
                id: Id {lower: 760461000, higher: 981735131}
    networkType: 152
    payloadSize: 192
    recipientAddress: Address {address: 'TAR6ERCSTDJJ7KCN4BJNJTK7LBBL5JPPVSHUNGY', networkType: 152}
    signature: "7C4E9E80D250C6D09352FB8EC80175719D59787DE67446896A73AABCFE6C420AF7DD707E6D4D2B2987B8BAD775F2989DCB6F738D39C48C1239FC8CC900A6740D"
    signer: PublicAccount {publicKey: '0E5C72B0D5946C1EFEE7E5317C5985F106B739BB0BC07E4F9A288417B3CD6D26', address: Address}
  > transactionInfo: TransactionInfo
        hash: "DE479C001E9736976BDA55E560AB1A5DE526236D9E1BCE24941CF8ED8884289E"
        height: UInt64 {lower: 326922, higher: 0}
        id: "626270069F1D5202A10AE93E"
        index: 0
        merkleComponentHash: "DE479C001E9736976BDA55E560AB1A5DE526236D9E1BCE24941CF8ED8884289E"
    type: 16724
    version: 1
```

可以看到在TransferTransaction的馬賽克中轉了兩種類型的馬賽克。 您還可以在 TransactionInfo 中找到有關已批准區塊的信息。

## 5.3 使用提示

### 存在證明

上一章解釋了交易的存在證明。
一個賬戶創建的轉賬指令可以作為不可磨滅的記錄留下，這樣就可以創建一個絕對一致的賬本。
由於為所有賬戶累積了“絕對的、不可磨滅的交易指令”，因此每個賬戶可以證明自己擁有的馬賽克。
由於為所有賬戶累積了“不可磨滅的交易指令”，因此每個賬戶可以證明自己擁有的馬賽克。
（在本文檔中，擁有被定義為“有能力隨意放棄的狀態”。稍微離題，但“有能力隨意放棄的狀態”的意義在於，數字數據的所有權至少在日本尚未得到法律承認，而一旦您知道了這些數據，就無法向他人證明您已經自願遺忘了它。區塊鏈允許您清楚地指示放棄這些數據，但我將把詳細信息留給法律專家。）

#### NFT (非同質化代幣)

通過將代幣總供應量限制為 1 並將 supplyMutable 設置為 false，只能發行一個代幣，並且永遠不會再存在。

馬賽克存儲有關發出馬賽克的帳戶地址的信息，並且該數據不能被篡改。 因此，來自發出馬賽克的賬戶的交易可以被視為元數據。

請注意，還有一種方法可以將元數據註冊到 馬賽克，如第 7 章所述，可以通過註冊帳戶和 馬賽克 發布者的多重簽名來更新。

創建 NFT 的方法有很多種，下面給出了一個過程示例（執行時請適當設置 nonce 和 flag 信息）。

```js
supplyMutable = false; //Availability of supply changes
//Mosaic definition
mosaicDefTx = sym.MosaicDefinitionTransaction.create(
  undefined,
  nonce,
  mosaicId,
  sym.MosaicFlags.create(supplyMutable, transferable, restrictable, revokable),
  0, //Divisibility:Divisibility
  sym.UInt64.fromUint(0), //Duration:Indefinite
  networkType,
);
//Fixed mosaic quantity
mosaicChangeTx = sym.MosaicSupplyChangeTransaction.create(
  undefined,
  mosaicId,
  sym.MosaicSupplyChangeAction.Increase, //Increase
  sym.UInt64.fromUint(1), //Amount1
  networkType,
);
//NFTdata
nftTx = sym.TransferTransaction.create(
  undefined, //Deadline:Duration
  alice.address,
  [],
  sym.PlainMessage.create("Hello Symbol!"), //NFTdata
  networkType,
);
//Generating mosaic and aggregating NFT data and registering them in blocks.
aggregateTx = sym.AggregateTransaction.createComplete(
  sym.Deadline.create(epochAdjustment),
  [
    mosaicDefTx.toAggregate(alice.publicAccount),
    mosaicChangeTx.toAggregate(alice.publicAccount),
    nftTx.toAggregate(alice.publicAccount),
  ],
  networkType,
  [],
).setMaxFeeForAggregate(100, 0);
```

馬賽克信息中包含馬賽克生成時的區塊高度和創建賬戶，因此通過搜索同一區塊內的交易，可以檢索到與馬賽克關聯的NFT數據。
可以檢索與同一塊中的交易關聯的 NFT 數據。

##### 注意事項

如果馬賽克的創建者擁有全部數量，則可以更改總供應量。
如果將數據拆分成交易記錄，則不可篡改，但可以追加數據。
在管理 NFT 時，請注意妥善管理，例如嚴格管理或丟棄馬賽克創建者的私鑰。

#### 可撤銷的積分服務操作。

將 transferable 設置為 false 可以限制轉售，使得可以定義出更不易受到結算法律或規定影響的積分。
將 revokable 設置為 true 可以啟用集中管理的積分服務操作，用戶無需管理私鑰即可收集使用的金額。

```js
transferable = false; //Transferability to third parties
revokable = true; //Refundability from the issuer
```
