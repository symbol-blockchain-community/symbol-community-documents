This page is a machine translation of the English text.
Please contact faunsu https://twitter.com/faunsu19000 or symbol-community.com/community for language proofreading of articles.

## 目录

*关于符号节点
*节点功能和服务器基本规格

- 符号节点构建过程 \*尖端

## 关于符号节点

区块链节点按时间顺序记录交易数据，可以查看过去的内容。 作为分布式账本，多个节点共享相同的数据，任何人都可以查看交易数据。 Symbol 的区块链由世界各地的节点网络构建和维护。 节点执行交易、执行搜索并将数据以块的形式记录到分类账中。

## 节点特性和基本服务器规格

Symbol节点分为三种：我会按顺序解释。

-对等节点

- API 节点
- 投票节点

### 对等节点

也称为 Harvester 节点，它们支持网络。 它主要验证交易以向区块链添加新块并在此过程中收取费用。

![symbol-build-node-peer-node](https://cms.symbol-community.com/uploads/symbol_build_node_peer_node_45ccd0a42e.png)

### API 节点

API 节点的主要作用是以可读格式将数据存储在 MongoDB 中。
API 节点还负责收集聚合债券交易的共同签名，这些交易仅在完成时进行处理。

![symbol-build-node-api-node](https://cms.symbol-community.com/uploads/symbol_build_node_api_node_4deaa356b7.png)

- 单个节点可以同时运行 Peer Node 和 API Node。 在这种情况下，它表示为双节点。

### 投票节点

Symbol 提供投票节点作为最终确定的手段。 投票节点只能由拥有 300 万 xym 的用户建立。 当一个块被最终确定时，它被认为是最终确定的。 Symbol 的最终确定采用 [pBFT](https://pmg.csail.mit.edu/papers/osdi99.pdf)，并需要超过 67% 的投票节点的批准。 例如，金融机构在区块链上实现支付处理时，需要保证生成的区块不会被更改。 通过finalization，金融机构可以知道区块已经确认，可以顺利的进行支付处理。

Symbol Blockchain 中的投票节点是可选的。 新建网络时，可在网络设置中将其关闭，定位为单一插件。 即使停止终结，块仍将继续基于 PoS+ 逻辑生成。 作为敲定的用例，希望在区块链上开展业务的组织和行业可以运营和管理投票节点，以进一步激活健壮的 PoS+ 链上的敲定功能，并在行业内共享块确认时间。 您可以使用识别并运行易于操作的公共联盟链。

## 符号节点构建过程

请安排具有以下环境的服务器。 如果您担心服务器运行，请考虑使用服务[Allnode](https://www.allnodes.com/)。 也可以使用 Debian 以外的 Linux OS 发行版，但下面描述的示例脚本基于 Debian。

- 具有所需硬件规格或更高规格的服务器（单独的表格）
- Debian 操作系统 10 或更高版本
- 端口 80、443、3000、3001、7900

###（附录）强制性硬件规格

以下是强制性要求：

| 最低规格  | 对等节点           | API 节点           | 双重/投票          |
| --------- | ------------------ | ------------------ | ------------------ |
| CPU       | 2 核               | 4 核               | 4 核               |
| 内存      | 8GB                | 16GB               | 16GB               |
| 磁盘大小  | 500 GB             | 750 GB             |
| 磁盘 IOPS | 1500 IOPS 固态硬盘 | 1500 IOPS 固态硬盘 | 1500 IOPS 固态硬盘 |

下表列出了建议的要求。 使用它们会给您带来更流畅的体验，并提供一定程度的未来证明。

| 推荐规格   | 对等节点           | API 节点           | 双重/投票          |
| ---------- | ------------------ | ------------------ | ------------------ |
| 中央处理器 | 4 核               | 8 核               | 8 核               |
| 内存       | 16GB               | 32GB               | 32GB               |
| 磁盘大小   | 500 GB             | 750 GB             |
| 磁盘 IOPS  | 1500 IOPS 固态硬盘 | 1500 IOPS 固态硬盘 | 1500 IOPS 固态硬盘 |

### 平时不搭建服务器的注意事项

在构建节点之前，请务必执行以下安全措施。 如果安全措施不充分，可能会被除您以外的其他人未经许可访问。

- 防火墙设置
- 对于 SSH 通信，禁止 root 登录并使用公钥进行身份验证
- 作为一般规则，除 22、80、3000、3001、7900 外，端口应关闭

### 端口使用

**22**：SSH 连接。 为了工作
**80**：Let's Encrypt + 符号节点列表
**3000**：HTTP REST 网关
**3001**：HTTPS REST 网关
**7900**：节点与弹射器客户端之间的通信

### 服务器初始设置

连接到服务器，首先在服务器上创建一个操作账号。

```狂欢
添加用户符号
usermod -aG sudo 符号
su - 符号
```

### 安装所需的软件

执行以下脚本搭建环境。

```狂欢
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/ymuichiro/symbol-node-builder/main/scripts/install.sh)"
```

通常需要进行以下工作，但上面的脚本会自动设置它。

- 安装 nvm、node.js 16、npm
- 安装docker, docker-compose
- 通过 npm 安装 symbol-bootstrap
- 创建 `~/symbol-bootstrap/**` 文件夹

### 启动和设置 Symbol-Bootstrap

使用以下命令启动 Symbol-bootstrap。

```狂欢
光盘〜/
符号引导程序
符号引导向导
```

1. 网络选择 选择在哪个网络上构建节点。

```
选择一个网络：（使用方向键）
❯ 主网节点
      测试网节点
      引导本地网络
      自定义网络节点（需要“custom-network-preset.yml”文件和“nemesis-seed”文件夹）
```

2.选择节点类型选择节点类型

```
选择一个程序集：（使用箭头键）
❯ 双节点
    对等节点
    接口节点
    演示节点。 双节点，包括水龙头和资源管理器。
```

3.建议离线，因为它处理私钥。 如果未连接到 Internet，则无法使用 VPS 等，因此请按 Y 继续。

```
？ Symbol Bootstrap 即将开始处理敏感信息（私钥），因此强烈建议
在继续之前断开网络连接。 如果您离线或不在乎，请说“是”。 （是/否）
```

4. 输入用于 Symbol bootstrap 的密码。

```
输入用于加密和解密自定义预设、addresses.yml 和 preset.yml 文件的密码。
密码，私钥将被加密。
```

5.收割设置需要四个账号。 指定其中的主账户。 创建一个新帐户或输入现有帐户的私钥。

```
？ 您想如何创建主帐户：（使用箭头键）
❯ 生成一个新帐户
     输入私钥
     输入主账户的 64 HEX 私钥（或按回车键再次选择该选项）。
```

6.如果在5中输入了私钥，会显示账户地址。 如果没有区别，请选择 y。

```
？ 这是用作主帐户的预期地址 TCDNP********************55KCQ 吗？ （是/否）
```

7. 指定传输帐户以及主要帐户。

```
？ 你想如何创建传输帐户：（使用箭头键）
❯ 生成一个新帐户
    输入私钥
```

8. VRF账户类似。

```
？ 您想如何创建 VRF 帐户：（使用箭头键）
❯ 生成一个新帐户
     输入私钥
```

9. 远程账户类似。

```
？ 你想如何创建远程帐户：（使用箭头键）
❯ 生成一个新帐户
    输入私钥
```

10. 配置 HTTP 设置。 如果选择第二个 Automatic ~ ，则可以自动设置 HTTPS。

```
您的 REST 网关应该在 HTTPS（这是一种安全协议）上运行，以便 Symbol Explorer 可以识别它。
？ 选择您的 HTTPS 设置方法：（使用箭头键）
❯ 本机支持，我有 SSL 证书和密钥。
     自动，您的所有密钥和证书都将使用 letsencyrpt 自动生成/更新。
     没有任何
```

11. 输入主机名。 指定 IP 地址或域。

```
？ 输入指向您的出站主机 IP 的公共域名（例如 node-01.mysymbolnodes.com）此值为
在 HTTPS 上运行时需要！
```

12. 输入您的友好名称。

```
输入节点的友好名称。
```

13. 从 4 种类型的帐户（密钥）中选择要加密的数量。

```
？ 选择您要使用的安全类型：（使用箭头键）
     PROMPT_MAIN：Bootstrap 在进行证书升级时可能会要求提供 Main 私钥。 其他密钥已加密。
❯ PROMPT_MAIN_TRANSPORT：Bootstrap 在重新生成证书时可能会要求提供 Main 和 Transport 私钥。
密钥已加密。
     ENCRYPT：所有密钥都已加密，只需要输入密码
```

15. 注册或选择一个投票节点。 如果你没有 300 万个 xym，你就不能成为投票节点。

```
您要创建投票节点吗？ （是/否）
```

回答完所有问题后，`~/custom-preset.yml` 就完成了。 默认情况下没有指定 benefitAddress。 打开文件并指定正确的值。 示例如下所示。

```yaml
组装：双
预设：主网
privateKeySecurityMode：PROMPT_MAIN_TRANSPORT
节点：
      -
          主机：example.org
          最大解锁账户：30
          benefitAddress：${your-symbol-address}
          投票：错误
          friendlyName：${你的名字}
          mainPrivateKey：${your-node-main-privatekey}
          vrfPrivateKey：${your-node-vrf-privatekey}
          remotePrivateKey：${your-node-remote-privatekey}
          transportPrivateKey：${your-node-transport-privatekey}
https代理：
      -
          excludeDockerService: false
```

**host** … 输入分配给节点的 IP 地址或域。
**maxUnlockedAccounts** ... 指定可以委托给节点的最大地址数。
**beneficiaryAddress** ... 指定节点收到的收获奖励的支付目的地地址
**friendlyName** … 指定任何节点的名称。

### 启动符号节点

执行以下命令加载 ~/custom-preset.yml 并启动 symbol-bootstrap。

```狂欢
cd ~/符号引导程序
symbol-bootstrap config -p mainnet -a dual -c custom-preset.yml
符号引导启动 -d
符号引导健康检查
```

下面是 symbol-bootstrap 的启动和停止命令列表。

`符号引导启动 -
d` 仅在首次启动时指定。
`symbol-bootstrap run -d` 为第二次和后续引导指定它。
`symbol-bootstrap stop` 指定何时暂停。 可以用run命令重启。

- 如果指定了 `-d`，就可以在后端启动它。 原则上加上`-d`，除非symbol-bootstrap报错，必须debug。

这项工作完成了 symbol-bootstrap 的新构建。 截至 2023 年 3 月，将启动新的符号引导程序，所有区块同步大约需要 1.5 到 2 天。 招募委托人时，请在所有区块同步时进行。

以下，将描述各种提示。

＃＃尖端

###更新节点证书

节点证书在节点构建后约一年到期。 请注意，不更新其节点证书的节点将失效。

1.使用healthCheck检查节点SSL证书是否过期

```
符号引导健康检查

> 节点节点的 node.crt.pem 证书将于格林威治标准时间 2023 年 8 月 2 日 14:30:34 到期。 还不需要更新它。
```

2.更新您的证书

```
符号引导更新证书
```

### 在符号节点列表中显示节点信息

您可以将自己的节点信息发布到[符号节点列表](https://symbol-tools.com/symbolTools/view/tool/nodeList.html)。 发帖方式有两种。

1.付费注册（推荐）

进入【评论注册】(https://symbol-tools.com/symbolTools/view/tool/nodeAdminManual.html)页面，创建发布信息，支付10xym（截至2023/03/09的费用金额）即可 体现在付出上。

2.通过在节点上设置nodeSetting.json进行注册

您可以免费指定它。 如果您拥有自己的服务器并且可以在服务器上配置设置，则可以选择此方法。 如果您不知道如何执行以下步骤，我们建议您执行步骤 1。

**安装方法**

- 将配置文件放在节点的以下路径中 -`http://xxx.xxx.xxx.xxx:80/nodeSetting.json`
- symbol-bootstrap 已启动并正在运行，同时也在侦听端口 80、443。因此，有必要执行以下或等效操作。- 编辑`~/symbol-bootstrap/target/docker/docker-compose.yml`并重写volume信息，使`nodeSetting.json`挂载在他在nginx中的路径上 - 使用 `symbol-bootstrap compose` 等重建容器并启动节点

* 此程序在更新symbol-bootstrap或更新preset时会覆盖`docker-compose.yml`文件，所以每次都需要重新注册。

* 2不能被Allnodes用户使用

### MongoDB 索引回顾

参考资料贴在下面

[https://qiita.com/nem_takanobu/items/8e39cc02df1b7adccfee](https://qiita.com/nem_takanobu/items/8e39cc02df1b7adccfee)

### 当custom-preset.yml更新时

`custom-preset.yml` 可以在运行 symbol-bootstrap 时更改。 在这种情况下，更新文件后，需要执行如下操作以反映更改。

```狂欢
符号引导停止
symbol-bootstrap config -p mainnet -a dual -c custom-preset.yml --upgrade
符号引导程序撰写--升级
符号引导程序运行-d
```

### 如何检查节点错误的原因

当一个节点由于某种原因宕机时，有几种方法可以检查错误的原因。

1.查看symbol-bootstrap的日志输出

通过在启动 symbol-bootstrap 时省略 `-d` 选项，您可以在检查日志时启动。 您可以通过执行以下命令来查看日志。

```狂欢
符号引导运行
```

2.使用docker的日志功能

第1步输出所有容器的日志作为问题。
数量巨大，因为它是您可以通过运行以下命令来检查哪个容器有问题。

```狂欢
符号引导停止
符号引导程序运行-d
泊坞窗 ps -a
```

另外，如果正常的话，输出结果如下。 描述为样本。

```狂欢
符号@xxxxxxxxxxxxxxxxxxx:~$ docker ps -a
容器 ID 图像命令创建状态端口名称
8d44313c93d6 steveltn/https-portal:1.19 "/init" 40 小时前 上升 40 小时 0.0.0.0:80->80/tcp, :::80->80/tcp, 0.0.0.0:3001->443/tcp, :::3001->443/tcp https-代理
71fa6d455cf6 symbolplatform/symbol-server:gcc-1.0.3.5 "/bin/bash /symbol-c ..." 40 小时前 上升 40 小时 0.0.0.0:7900->7900/tcp, :::7900->7900/tcp 节点
542ca6019607 symbolplatform/symbol-server:gcc-1.0.3.5 "/bin/bash /symbol-c ..." 2 天前 40 小时经纪人
5b6765426fd2 symbolplatform/symbol-rest:2.4.2 "docker-entrypoint.s ..." 2 天前 上升 40 小时 0.0.0.0:3000->3000/tcp, :::3000->3000/tcp rest-gateway
19c9ac8edce9 mongo:4.4.3-bionic "docker-entrypoint.s ..." 2 天前 Up 40 小时 27017/tcp db
```

如果容器的状态为 Exec(0)，则发生错误。 如果只想查看对应容器的日志，执行如下。 ${CONTAINER ID} 指定 Exec(0) 输出的容器 ID。

```狂欢
docker 日志 ${CONTAINER ID}
```

## 关联

- [如何移动符号节点](https://symbol-community.com/zh/docs/31)
- [符号工具-符号节点列表](https://symbol-tools.com/symbolTools/view/tool/nodeList.html)
- [符号节点 - 节点](https://symbol-tools.com/symbolTools/view/tool/nodeList.html)
- [符号文档](https://docs.symbol.dev/en/guides/network/running-a-symbol-node.html)
- [符号引导存储库](https://github.com/fboucquez/symbol-bootstrap)
