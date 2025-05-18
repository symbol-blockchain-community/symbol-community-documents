This page is a machine translation of the English text.
Please contact faunsu https://twitter.com/faunsu19000 or symbol-community.com/community for language proofreading of articles.

## table of contents

\*About the Symbol node

- Node features and server basic specs
- Symbol Node construction procedure
  \*Tips

## About the Symbol node

Blockchain nodes record transaction data in chronological order, and past contents can be checked. As a distributed ledger, multiple nodes share the same data, and anyone can view transaction data. Symbol's blockchain is built and maintained by a network of nodes around the world. Nodes execute transactions, perform searches, and record that data in blocks to the ledger.

## Node features and basic server specs

There are three types of Symbol nodes: I will explain in order.

-Peer Node

- API Nodes
- Voting Nodes

### Peer Nodes

Also known as Harvester nodes, they support the network. It primarily validates transactions to add new blocks to the blockchain and collect fees in the process.

![symbol-build-node-peer-node](https://cms.symbol-community.com/uploads/symbol_build_node_peer_node_45ccd0a42e.png)

### API Nodes

The primary role of API nodes is to store data in MongoDB in a readable format.
API nodes are also responsible for collecting co-signatures for aggregate bond transactions, which are processed only when they are completed.

![symbol-build-node-api-node](https://cms.symbol-community.com/uploads/symbol_build_node_api_node_4deaa356b7.png)

- A single node can run both Peer Node and API Node at the same time. In that case, it is expressed as Dual Node.

### Voting Nodes

Symbol provides Voting Node as a means of finalization. Voting Nodes can only be built by users with her 3 million xym. A block is considered finalized when it is finalized. Finalization in Symbol is implemented based on [pBFT](https://pmg.csail.mit.edu/papers/osdi99.pdf) and is approved by more than 67% of Voting Nodes. For example, when a financial institution implements payment processing on a blockchain, it needs to guarantee that the generated blocks will not be changed. By using finalization, financial institutions can know that the block has been confirmed, and can implement payment processing smoothly.

Voting Node is optional in Symbol Blockchain. When building a new network, it can be turned off in the network settings, and it is positioned as a single plug-in. Even if finalization is stopped, blocks will continue to be generated based on PoS+ logic. As a use case for finalization, organizations and industries that want to do business on the Blockchain can operate and manage Voting Nodes to further activate the finalization function on the robust PoS+ chain and share the timing of block confirmation within the industry. You can use recognition and run a public consortium chain that is easy to operate.

## Symbol Node construction procedure

Please arrange a server with the following environment. If you are worried about server operation, please consider using the service [Allnode](https://www.allnodes.com/). Linux OS distributions other than Debian can also be used, but the sample script described below is based on Debian.

- Server with required hardware specs or higher (separate table)
- Debian OS 10 or higher
- PORT 80, 443, 3000, 3001, 7900

### (Appendix) Mandatory hardware specs

Here are the mandatory requirements:

| Minimum Specs | Peer Node     | API Node      | Dual / Voting |
| ------------- | ------------- | ------------- | ------------- |
| CPU           | 2 Cores       | 4 Cores       | 4 Cores       |
| RAM           | 8GB           | 16GB          | 16GB          |
| Disk Size     | 500 GB        | 750 GB        |
| Disk IOPS     | 1500 IOPS SSD | 1500 IOPS SSD | 1500 IOPS SSD |

The following table lists the recommended requirements. Using them will give you a smoother experience and provide some degree of future proofing.

| Recommended Specs | Peer Node     | API Node      | Dual / Voting |
| ----------------- | ------------- | ------------- | ------------- |
| CPU               | 4 Cores       | 8 Cores       | 8 Cores       |
| RAM               | 16GB          | 32GB          | 32GB          |
| Disk Size         | 500 GB        | 750 GB        |
| Disk IOPS         | 1500 IOPS SSD | 1500 IOPS SSD | 1500 IOPS SSD |

### Notes for those who do not usually build servers

Be sure to implement the following security measures before building a node. If security measures are inadequate, it may be accessed without permission by someone other than yourself.

- firewall settings
- For SSH communication, prohibit root login and authenticate with public key
- As a general rule, PORT should be closed except 22, 80, 3000, 3001, 7900

### Port Usage

**22**: SSH connection. For work
**80**: Let's Encrypt + Symbol Node List
**3000**: HTTP REST Gateway
**3001**: HTTPS REST Gateway
**7900**: Communication between nodes with catapult-client

### Server Initial Setup

Connect to the server and first create an operating account on the server.

```bash
adduser symbol
usermod -aG sudo symbol
su - symbol
```

### Installing Required Software

Execute the following script to build the environment.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/ymuichiro/symbol-node-builder/main/scripts/install.sh)"
```

Normally, the following work is required, but the above script will automatically set it.

- install nvm, node.js 16, npm
- Install docker, docker-compose
- install symbol-bootstrap via npm
- Create `~/symbol-bootstrap/**` folder

### Starting and setting up Symbol-Bootstrap

Start Symbol-bootstrap with the following command.

```bash
cd ~/symbol-bootstrap
symbol-bootstrap wizard
```

1. Network selection Select which network to build the node on.

```
Select a network: (Use arrow keys)
❯ Mainnet Nodes
     Testnet nodes
     Bootstrap Local Network
     Custom Network Node ('custom-network-preset.yml' file and 'nemesis-seed' folder are required)
```

2. Select a node type Select a node type

```
Select an assembly: (Use arrow keys)
❯ Dual Node
   Peer Node
   Api Nodes
   Demo Node. A dual node that includes a Faucet and Explorer.
```

3. Offline is recommended because it handles the private key. Since VPS etc. cannot be used if it is not connected to the Internet, press Y to proceed.

```
? Symbol Bootstrap is about to start working with sensitive information (private keys) so it is highly recommended that
you disconnect from the network before continuing. Say YES if you are offline or if you don't care. (Y/n)
```

4. Enter the password to use with Symbol bootstrap.

```
Enter the password used to encrypt and decrypt custom presets, addresses.yml, and preset.yml files.
password, private keys will be encrypted.
```

5. Four accounts are required for harvesting settings. Specify the main account among them. Create a new one or enter the private key of an existing account.

```
? How do you want to create the Main account: (Use arrow keys)
❯ Generating a new account
    Entering a private key
    Enter the 64 HEX private key of the Main account (or press enter to select the option again).
```

6. If you entered the private key in 5, the account address will be displayed. Select y if there is no difference.

```
? Is this the expected address TCDNP********************55KCQ to used as Main account? (y/N)
```

7. Specify Transport account as well as main.

```
? How do you want to create the Transport account: (Use arrow keys)
❯ Generating a new account
   Entering a private key
```

8. VRF accounts are similar.

```
? How do you want to create the VRF account: (Use arrow keys)
❯ Generating a new account
    Entering a private key
```

9. Remote accounts are similar.

```
? How do you want to create the Remote account: (Use arrow keys)
❯ Generating a new account
   Entering a private key
```

10. Configure HTTP settings. If you select the second Automatic ~ , you can set HTTPS automatically.

```
Your REST Gateway should be running on HTTPS (which is a secure protocol) so that it can be recognized by the Symbol Explorer.
? Select your HTTPS setup method: (Use arrow keys)
❯ Native support, I have the SSL certificate and key.
    Automatic, all of your keys and certs will be generated/renewed automatically, using letsencyrpt.
    None
```

11. Enter the host name. Specify an IP address or domain.

```
? Enter the public domain name(eg. node-01.mysymbolnodes.com) that's pointing to your outbound host IP This value is
required when you are running on HTTPS!
```

12. Enter your friendly name.

```
Enter the friendly name of your node.
```

13. Select how many of the 4 types of accounts (keys) to encrypt.

```
? Select the type of security you want to use: (Use arrow keys)
    PROMPT_MAIN: Bootstrap may ask for the Main private key when doing certificates upgrades. Other keys are encrypted.
❯ PROMPT_MAIN_TRANSPORT: Bootstrap may ask for the Main and Transport private keys when regenerating certificates.
keys are encrypted.
    ENCRYPT: All keys are encrypted, only password would be asked
```

15. Register or select a voting node. You can't be a voting node if you don't own 3 million xym.

```
Are you creating a Voting node? (y/N)
```

After answering all questions, `~/custom-preset.yml` will be completed. By default no benefitAddress is specified. Open the file and specify the correct values. A sample is shown below.

```yaml
assembly: dual
preset: mainnet
privateKeySecurityMode: PROMPT_MAIN_TRANSPORT
nodes:
  - host: example.org
    maxUnlockedAccounts: 30
    benefitAddress: ${your-symbol-address}
    voting: false
    friendlyName: ${your-name}
    mainPrivateKey: ${your-node-main-privatekey}
    vrfPrivateKey: ${your-node-vrf-privatekey}
    remotePrivateKey: ${your-node-remote-privatekey}
    transportPrivateKey: ${your-node-transport-privatekey}
httpsProxies:
  - excludeDockerService: false
```

**host** … Enter the IP address or domain assigned to the node.
**maxUnlockedAccounts** … Specifies the maximum number of addresses that can be delegated to a node.
**beneficiaryAddress** … Specifies the payment destination address of the harvesting reward received by the node
**friendlyName** … Specifies the name of any node.

### Start Symbol-Node

Execute the following command to load `~/custom-preset.yml` and start symbol-bootstrap.

```bash
cd ~/symbol-bootstrap
symbol-bootstrap config -p mainnet -a dual -c custom-preset.yml
symbol-bootstrap start -d
symbol-bootstrap healthCheck
```

Below is a list of start and stop commands by symbol-bootstrap.

`symbol-bootstrap start -d` Only specified on first boot.
`symbol-bootstrap run -d` Specify it for the second and subsequent boots.
`symbol-bootstrap stop` Specify when to pause. It can be restarted with the run command.

- If `-d` is specified, it will be possible to start it in the backend. Add `-d` in principle except when symbol-bootstrap gives an error and you have to debug.

This work completes the new construction of symbol-bootstrap. As of March 2023, a new symbol-bootstrap will be started and it will take about 1.5 to 2 days for all blocks to sync. When recruiting delegators, do so when all blocks are synchronized.

Hereafter, various tips will be described.

##Tips

### Update node certificate

A node certificate expires about a year after the node is built. Note that nodes that do not renew their node certificates will become invalid.

1. Check node SSL certificate expiration with healthCheck

```
symbol-bootstrap healthCheck

> he node.crt.pem certificate for node node will expire on Aug 2 14:30:34 2023 GMT. No need to renew it yet.
```

2. Renew your certificate

```
symbol-bootstrap renewCertificates
```

### Show node information in Symbol Node list

You can post your own node information to [Symbol node list](https://symbol-tools.com/symbolTools/view/tool/nodeList.html). There are two methods of posting.

1. Registration with payment (recommended)

Access the [Comment registration](https://symbol-tools.com/symbolTools/view/tool/nodeAdminManual.html) page, create posting information, and pay 10xym (fee amount as of 2023/03/09) It will be reflected by paying.

2. Register by setting nodeSetting.json on the node

You can specify it without charge. If you own your own server and can configure settings on the server, you can choose this method. If you do not know how to do the following steps, we recommend step 1.

**Installation method**

- Place the config file in the following path of the node
  - `http://xxx.xxx.xxx.xxx:80/nodeSetting.json`
- symbol-bootstrap is up and running, also listening on port 80, 443. Therefore, it is necessary to perform the following or equivalent operation.
  - Edit `~/symbol-bootstrap/target/docker/docker-compose.yml` and rewrite the volume information so that `nodeSetting.json` is mounted on his path in nginx
  - Rebuild the container with `symbol-bootstrap compose` etc. and start the node

* This procedure will overwrite the `docker-compose.yml` file when updating symbol-bootstrap or updating preset, so it is necessary to re-register each time.

* 2 cannot be used by Allnodes users

### MongoDB index review

References are posted below

[https://qiita.com/nem_takanobu/items/8e39cc02df1b7adccfee](https://qiita.com/nem_takanobu/items/8e39cc02df1b7adccfee)

### When custom-preset.yml is updated

`custom-preset.yml` may be changed while operating symbol-bootstrap. In that case, after updating the file, it is necessary to execute as follows to reflect the change.

```bash
symbol-bootstrap stop
symbol-bootstrap config -p mainnet -a dual -c custom-preset.yml --upgrade
symbol-bootstrap compose --upgrade
symbol-bootstrap run -d
```

### How to check the cause of a node error

When a node goes down for some reason, there are several ways to check the cause of the error.

1. Check the log output of symbol-bootstrap

By omitting the `-d` option when starting symbol-bootstrap, you can start while checking the log. You can view the log by executing the following.

```bash
symbol-bootstrap run
```

2. Use docker's log function

Step 1 outputs logs of all containers as a problem.
The amount is huge because it is You can check which container has the problem by running the following command.

```bash
symbol-bootstrap stop
symbol-bootstrap run -d
docker ps -a
```

In addition, if it is normal, the output will be as follows. Described as a sample.

```bash
symbol@xxxxxxxxxxxxxxxxxxx:~$ docker ps -a
CONTAINER ID IMAGE COMMAND CREATED STATUS PORTS NAMES
8d44313c93d6 steveltn/https-portal:1.19 "/init" 40 hours ago Up 40 hours 0.0.0.0:80->80/tcp, :::80->80/tcp, 0.0.0.0:3001->443/tcp, :::3001->443/tcp https-proxy
71fa6d455cf6 symbolplatform/symbol-server:gcc-1.0.3.5 "/bin/bash /symbol-c…" 40 hours ago Up 40 hours 0.0.0.0:7900->7900/tcp, :::7900->7900/tcp node
542ca6019607 symbolplatform/symbol-server:gcc-1.0.3.5 "/bin/bash /symbol-c…" 2 days ago Up 40 hours broker
5b6765426fd2 symbolplatform/symbol-rest:2.4.2 "docker-entrypoint.s…" 2 days ago Up 40 hours 0.0.0.0:3000->3000/tcp, :::3000->3000/tcp rest-gateway
19c9ac8edce9 mongo:4.4.3-bionic "docker-entrypoint.s…" 2 days ago Up 40 hours 27017/tcp db
```

If there is a container with a STATUS of Exec(0) then an error has occurred. If you want to check the log only for the corresponding container, execute as follows. `${CONTAINER ID}` specifies the ID of the container output by Exec(0).

```bash
docker logs ${CONTAINER ID}
```

## Link

- [How to move the Symbol node](https://symbol-community.com/docs/29)
- [Symbol Tools - Symbol Node List](https://symbol-tools.com/symbolTools/view/tool/nodeList.html)
- [Symbol Nodes - nodes](https://symbol-tools.com/symbolTools/view/tool/nodeList.html)
- [Symbol documentation](https://docs.symbol.dev/en/guides/network/running-a-symbol-node.html)
- [Symbol bootstrap repository](https://github.com/fboucquez/symbol-bootstrap)
