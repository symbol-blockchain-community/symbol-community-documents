---
sidebar_position: 3
---

# 3.Account

An account is a data deposit structure in which information and assets associated with a private key is recorded. Only by signing with the private key associated with the account is the data updated on the blockchain.

## 3.1 Creating an account

The account contains a key pair, which is a set of private and public keys, an address and other information. First of all, try creating an account  randomly and check the information that is contained.  

### Create a new account 
```js
alice = sym.Account.generateNewAccount(networkType);
console.log(alice);
```
###### Sample output
```js
> Account
    address: Address {address: 'TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ', networkType: 152}
    keyPair: {privateKey: Uint8Array(32), publicKey: Uint8Array(32)}
```

networkType is the following.
```js
{104: 'MAIN_NET', 152: 'TEST_NET'}
```

### Deriving private and public key.
```js
console.log(alice.privateKey);
console.log(alice.publicKey);
```
```
> 1E9139CC1580B4AED6A1FE110085281D4982ED0D89CE07F3380EB83069B1****
> D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2
```

#### Notes
If the private key is lost, the data associated with that account can never be changed and any funds will be lost. In addition, the private key must not be shared with others since knowledge of the private key will give full access to the account. 
In general web services, passwords are allocated to an "account ID", so passwords can be changed from the account, but in blockchain, a unique ID (address) is allocated to the private key that is the password, thus it is not possible to change or re-generate the private key associated with an account from the account.  


### Deriving of address
```js
aliceRawAddress = alice.address.plain();
console.log(aliceRawAddress);
```
```js
> TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ
```

These things above are the most basic information for operating the blockchain. It is also better to check how to generate accounts from a private key and how to generate classes that only deal with publickey and addresses.  

### Account generation from private key.
```js
alice = sym.Account.createFromPrivateKey(
  "1E9139CC1580B4AED6A1FE110085281D4982ED0D89CE07F3380EB83069B1****",
  networkType
);
```

### Public key class generation
```js
alicePublicAccount = sym.PublicAccount.createFromPublicKey(
  "D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2",
  networkType
);
console.log(alicePublicAccount);
```
###### Sample output
```js
> PublicAccount
    address: Address {address: 'TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ', networkType: 152}
    publicKey: "D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2"

```

### Address class generation
```js
aliceAddress = sym.Address.createFromRawAddress(
  "TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ"
);
console.log(aliceAddress);
```
###### Sample output
```js
> Address
    address: "TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ"
    networkType: 152
```

## 3.2 A TransferTransaction to another account

Creating an account does not simply mean that data can be transferred on the blockchain.  
Public blockchains require fees for data transfer in order to utilise resources effectively.  
On the Symbol blockchain, fees are paid with a native token which is called XYM.  
Once you have generated an account, send XYM to the account to cover transaction fees (described in later chapters).   

### Receive XYM from the faucet

Testnet XYM can be obtained for free using the faucet.  
For Mainnet transactions, you can buy XYM on exchanges, or use tipping services such as NEMLOG and QUEST to have obtain donations.   

Testnet
- FAUCET
  - https://testnet.symbol.tools/

Mainnet
- NEMLOG
  - https://nemlog.nem.social/
- QUEST
  - https://quest-bc.com/



### Using the explorer

Transactions can be viewed in the explorer after transferring from the faucet to the account you have created.

- Testnet
  - https://testnet.symbol.fyi/
- Mainnet
  - https://symbol.fyi/

## 3.3 Check account information

Retrieve the account information stored by the node.

### Retrieve a list of owned mosaics

```js
accountRepo = repo.createAccountRepository();
accountInfo = await accountRepo.getAccountInfo(aliceAddress).toPromise();
console.log(accountInfo);
```
###### Sample output
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

#### publicKey
Account information which has just been created on the client side and has not yet been involved in a transaction on the blockchain is not recorded. Account information will be stored on the blockchain when when the address first appears in a transaction. Therefore, the publicKey is noted as `00000...` at this moment.

#### UInt64
JavaScript will overflow when numbers are too large, so ID and amount are managed in the SDK's own format called UInt64. Use toString() to convert to string, compact() to convert to number and toHex()  to convert to a hexadecimal.

```js
console.log("addressHeight:"); //Block height at which the address is recorded
console.log(accountInfo.addressHeight.compact()); //Numerics
accountInfo.mosaics.forEach(mosaic => {
  console.log("id:" + mosaic.id.toHex()); //Hexadecimal
  console.log("amount:" + mosaic.amount.toString()); //String
});
```

Inverting an ID value that is too large into a numerical value with COMPACT may result in an error.  
`Compacted value is greater than Number.Max_Value.`


#### Adjustment of display digits

Treating the amount of owned tokens as an integer value to avoid rounding errors. We can get the divisibility from the token definition, so we can use that value to display the exact amount of owned tokens.  

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

## 3.4 Tips for use
### Encryption and signatures

Both private and public keys generated for an account can be used for conventional encryption and digital signatures. Data confidentiality and legitimacy can be verified on a p2p (end-to-end) basis, even if applications have reliability issues.   

#### Advance preparation: generating Bob account for connectivity test
```js
bob = sym.Account.generateNewAccount(networkType);
bobPublicAccount = bob.publicAccount;
```

#### Encryption

Encrypt with Alice's private key and Bob's public key and decrypt with Alice's public key and Bob's private key (AES-GCM format).

```js
message = 'Hello Symol!';
encryptedMessage = alice.encryptMessage(message ,bob.publicAccount);
console.log(encryptedMessage);
```
```js
> 294C8979156C0D941270BAC191F7C689E93371EDBC36ADD8B920CF494012A97BA2D1A3759F9A6D55D5957E9D
```

#### Decrypt
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

#### Signature

Sign the message with Alice's private key and verify the message with Alice's public key and signature.

```js
Buffer = require("/node_modules/buffer").Buffer;
payload = Buffer.from("Hello Symol!", 'utf-8');
signature = Buffer.from(sym.KeyPair.sign(alice.keyPair, payload)).toString("hex").toUpperCase();
console.log(signature);
```
```
> B8A9BCDE9246BB5780A8DED0F4D5DFC80020BBB7360B863EC1F9C62CAFA8686049F39A9F403CB4E66104754A6AEDEF8F6B4AC79E9416DEEDC176FDD24AFEC60E
```

#### Verification
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

Note that signatures that do not use the blockchain may be re-used many times.

### Account management

This section explains how to manage your account.  
Private keys should not be stored as plaintext; here is how to encrypt and store your private key with a passphrase using symbol-qr-library.  

#### Encryption of private key

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
###### Sample output
```js
> {"v":3,"type":2,"network_id":152,"chain_id":"7FCCD304802016BEBBCD342A332F91FF1F3BB5E902988B352697BE245F48E836","data":{"ciphertext":"e9e2f76cb482fd054bc13b7ca7c9d086E7VxeGS/N8n1WGTc5MwshNMxUiOpSV2CNagtc6dDZ7rVZcnHXrrESS06CtDTLdD7qrNZEZAi166ucDUgk4Yst0P/XJfesCpXRxlzzNgcK8Q=","salt":"54de9318a44cc8990e01baba1bcb92fa111d5bcc0b02ffc6544d2816989dc0e9"}}
```
The QR code or text output by this jsonSignerQR can be saved to recover the private key any time.

#### Decryption of encrypted private key

```js
//Assign stored text or text retrieved from a QR code scan into json signer QR
jsonSignerQR = '{"v":3,"type":2,"network_id":152,"chain_id":"7FCCD304802016BEBBCD342A332F91FF1F3BB5E902988B352697BE245F48E836","data":{"ciphertext":"e9e2f76cb482fd054bc13b7ca7c9d086E7VxeGS/N8n1WGTc5MwshNMxUiOpSV2CNagtc6dDZ7rVZcnHXrrESS06CtDTLdD7qrNZEZAi166ucDUgk4Yst0P/XJfesCpXRxlzzNgcK8Q=","salt":"54de9318a44cc8990e01baba1bcb92fa111d5bcc0b02ffc6544d2816989dc0e9"}}';

qr = require("/node_modules/symbol-qr-library");
signerQR = qr.AccountQR.fromJSON(jsonSignerQR,"Passphrase");
console.log(signerQR.accountPrivateKey);
```
###### Sample output
```js
> 1E9139CC1580B4AED6A1FE110085281D4982ED0D89CE07F3380EB83069B1****
```
