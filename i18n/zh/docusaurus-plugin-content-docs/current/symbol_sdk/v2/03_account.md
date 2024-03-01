# 3.帐户

帐户是一种资料存款结构，其中包含与私钥相关联的资讯和资产的记录。只有使用与帐户相关联的私钥进行签署，才能在区块链上更新资料。

## 3.1 创建帐户

帐户包含一对密钥，即私钥和公钥，以及地址和其他信息。首先，尝试随机创建一个帐户，并检查其中包含的信息。

### 创建一个新帐户
```js
alice = sym.Account.generateNewAccount(networkType);
console.log(alice);
```
###### 示例输出
```js
> Account
    address: Address {address: 'TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ', networkType: 152}
    keyPair: {privateKey: Uint8Array(32), publicKey: Uint8Array(32)}
```

网络类型如下。
```js
{104: 'MAIN_NET', 152: 'TEST_NET'}
```

### 生成公钥和私钥
```js
console.log(alice.privateKey);
console.log(alice.publicKey);
```
```
> 1E9139CC1580B4AED6A1FE110085281D4982ED0D89CE07F3380EB83069B1****
> D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2
```

#### 注意事项
如果私钥遗失，与该帐户相关的数据将无法更改，并且任何资金将会遗失。此外，私钥不得与他人分享，因为知道私钥将可完全存取该帐户。 
在一般的网路服务中，密码是分配给「帐户 ID」的，因此密码可以从帐户更改，但在区块链中，私钥是密码，因此唯一的 ID（位址）会分配给私钥，因此无法从帐户更改或重新产生与帐户关联的私钥。 


### 产生位址
```js
aliceRawAddress = alice.address.plain();
console.log(aliceRawAddress);
```
```js
> TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ
```

以上这些是操作区块链所需的最基本信息。建议进一步了解如何从私钥生成帐户，以及如何生成仅处理公钥和位址的类别。 

### 从私钥生成帐户
```js
alice = sym.Account.createFromPrivateKey(
  "1E9139CC1580B4AED6A1FE110085281D4982ED0D89CE07F3380EB83069B1****",
  networkType
);
```

### 公钥类别的生成
```js
alicePublicAccount = sym.PublicAccount.createFromPublicKey(
  "D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2",
  networkType
);
console.log(alicePublicAccount);
```
###### 示例输出
```js
> PublicAccount
    address: Address {address: 'TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ', networkType: 152}
    publicKey: "D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2"

```

### 地址生成
```js
aliceAddress = sym.Address.createFromRawAddress(
  "TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ"
);
console.log(aliceAddress);
```
###### 示例输出
```js
> Address
    address: "TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ"
    networkType: 152
```

## 3.2 转帐交易到另一个帐户

创建账户并不仅仅意味着数据可以在区块链上传输。
公共区块链需要数据传输费用才能有效利用资源。 
在 Symbol 区块链上，使用称为 XYM 的原生代币支付费用。  
生成帐户后，将 XYM 发送到该帐户以支付交易费用（在后面的章节中描述）。 

### 从水龙头接收 XYM

可以使用水龙头免费获得测试网 XYM。
对于主网交易，可以在交易所购买XYM，也可以使用NEMLOG、QUEST等打赏服务获得捐款。

测试网
- FAUCET
  - https://testnet.symbol.tools/

主网
- NEMLOG
  - https://nemlog.nem.social/
- QUEST
  - https://quest-bc.com/



### 使用区块链浏览器

从水龙头转账到您创建的账户后，可以在浏览器中查看交易。

- 测试网
  - https://testnet.symbol.fyi/
- 主网
  - https://symbol.fyi/

## 3.3 查看账户信息

检索节点存储的帐户信息

### 检索拥有的马赛克列表

```js
accountRepo = repo.createAccountRepository();
accountInfo = await accountRepo.getAccountInfo(aliceAddress).toPromise();
console.log(accountInfo);
```
###### 示例输出
```js
> AccountInfo
    address: Address {address: 'TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ', networkType: 152}
    publicKey: "0000000000000000000000000000000000000000000000000000000000000000"
  > mosaics: Array(1)
      0: Mosaic
        amount: UInt64 {lower: 10000000, higher: 0}
        id: MosaicId
          id: Id {lower: 760461000, higher: 981735131}
```

#### 公钥
客户端刚刚创建的、尚未参与区块链交易的账户信息不被记录。当地址首次出现在交易中时，帐户信息将存储在区块链上。因此，此时 publicKey 记为“00000...”。

#### UInt64
当数字太大时，JavaScript会溢出，因此ID和金额以UInt64的格式在SDK中进行管理。使用toString()将其转换为字符串，使用compact()将其转换为数字，使用toHex()将其转换为十六进制。

```js
console.log("addressHeight:"); //Block height at which the address is recorded
console.log(accountInfo.addressHeight.compact()); //Numerics
accountInfo.mosaics.forEach(mosaic => {
  console.log("id:" + mosaic.id.toHex()); //Hexadecimal
  console.log("amount:" + mosaic.amount.toString()); //String
});
```

使用COMPACT将一个太大的ID值反转为数值时，可能会导致错误。
`Compacted value is greater than Number.Max_Value.`


#### 显示位数的调整

将拥有的代币数量作为整数值处理，以避免出现舍入误差。我们可以从代币定义中获取可分割性(divisibility)，因此可以使用该值显示所拥有的代币的精确数量。


```js
mosaicRepo = repo.createMosaicRepository();
mosaicAmount = accountInfo.mosaics[0].amount.toString();
mosaicInfo = await mosaicRepo.getMosaic(accountInfo.mosaics[0].id).toPromise();
divisibility = mosaicInfo.divisibility; //Divisibility
if(divisibility > 0){
  displayAmount = mosaicAmount.slice(0,mosaicAmount.length-divisibility)  
  + "." + mosaicAmount.slice(-divisibility);
}else{
  displayAmount = mosaicAmount;
}
console.log(displayAmount);
```

## 3.4 使用提示
### 加密和签名

为帐户生成的私钥和公钥均可用于常规加密和数字签名。即使应用程序存在可靠性问题，也可以在 p2p（端到端）的基础上验证数据的机密性和合法性。

#### 预先准备：为连通性测试生成Bob帐户
```js
bob = sym.Account.generateNewAccount(networkType);
bobPublicAccount = bob.publicAccount;
```

#### 加密

用Alice的私钥和Bob的公钥加密，用Alice的公钥和Bob的私钥解密（AES-GCM格式）。

```js
message = 'Hello Symol!';
encryptedMessage = alice.encryptMessage(message ,bob.publicAccount);
console.log(encryptedMessage);
```
```js
> 294C8979156C0D941270BAC191F7C689E93371EDBC36ADD8B920CF494012A97BA2D1A3759F9A6D55D5957E9D
```

#### 解密
```js
decryptMessage = bob.decryptMessage(
  new sym.EncryptedMessage(
    "294C8979156C0D941270BAC191F7C689E93371EDBC36ADD8B920CF494012A97BA2D1A3759F9A6D55D5957E9D"
  ),
  alice.publicAccount
).payload
console.log(decryptMessage);
```
```js
> "Hello Symol!"
```

#### 签名

使用 Alice 的私钥对消息进行签名，并使用 Alice 的公钥和签名验证消息。

```js
Buffer = require("/node_modules/buffer").Buffer;
payload = Buffer.from("Hello Symol!", 'utf-8');
signature = Buffer.from(sym.KeyPair.sign(alice.keyPair, payload)).toString("hex").toUpperCase();
console.log(signature);
```
```
> B8A9BCDE9246BB5780A8DED0F4D5DFC80020BBB7360B863EC1F9C62CAFA8686049F39A9F403CB4E66104754A6AEDEF8F6B4AC79E9416DEEDC176FDD24AFEC60E
```

#### 验证
```js
isVerified = sym.KeyPair.verify(
  alice.keyPair.publicKey,
  Buffer.from("Hello Symol!", 'utf-8'),
  Buffer.from(signature, 'hex')
)
console.log(isVerified);
```
```js
> true
```

请注意，不使用区块链的签名可能会被多次重复使用。

### 帐户管理

本节介绍如何管理您的帐户。  
私钥不应以纯文本形式存储。以下是使用symbol-qr-library对私钥进行加密并使用密码保护存储的方法。

#### 私钥加密

```js
qr = require("/node_modules/symbol-qr-library");

//Passphrase-Locked account generation
signerQR = qr.QRCodeGenerator.createExportAccount(
  alice.privateKey, networkType, generationHash, "Passphrase"
);

//QR code display
signerQR.toBase64().subscribe(x =>{

  //Example of displaying a QR code on an HTML body
  (tag= document.createElement('img')).src = x;
  document.getElementsByTagName('body')[0].appendChild(tag);
});

//Display accounts as encrypted JSON data
jsonSignerQR = signerQR.toJSON();
console.log(jsonSignerQR);
```
###### 示例输出
```js
> {"v":3,"type":2,"network_id":152,"chain_id":"7FCCD304802016BEBBCD342A332F91FF1F3BB5E902988B352697BE245F48E836","data":{"ciphertext":"e9e2f76cb482fd054bc13b7ca7c9d086E7VxeGS/N8n1WGTc5MwshNMxUiOpSV2CNagtc6dDZ7rVZcnHXrrESS06CtDTLdD7qrNZEZAi166ucDUgk4Yst0P/XJfesCpXRxlzzNgcK8Q=","salt":"54de9318a44cc8990e01baba1bcb92fa111d5bcc0b02ffc6544d2816989dc0e9"}}
```
此jsonSignerQR输出的QR码或文本可随时保存，以便恢复私钥。

#### 加密私钥解密

```js
//Assign stored text or text retrieved from a QR code scan into json signer QR
jsonSignerQR = '{"v":3,"type":2,"network_id":152,"chain_id":"7FCCD304802016BEBBCD342A332F91FF1F3BB5E902988B352697BE245F48E836","data":{"ciphertext":"e9e2f76cb482fd054bc13b7ca7c9d086E7VxeGS/N8n1WGTc5MwshNMxUiOpSV2CNagtc6dDZ7rVZcnHXrrESS06CtDTLdD7qrNZEZAi166ucDUgk4Yst0P/XJfesCpXRxlzzNgcK8Q=","salt":"54de9318a44cc8990e01baba1bcb92fa111d5bcc0b02ffc6544d2816989dc0e9"}}';

qr = require("/node_modules/symbol-qr-library");
signerQR = qr.AccountQR.fromJSON(jsonSignerQR,"Passphrase");
console.log(signerQR.accountPrivateKey);
```
###### 示例输出
```js
> 1E9139CC1580B4AED6A1FE110085281D4982ED0D89CE07F3380EB83069B1****
```
