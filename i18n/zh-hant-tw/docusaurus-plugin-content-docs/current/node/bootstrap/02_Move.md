This page is a machine translation of the English text.
Please contact faunsu https://twitter.com/faunsu19000 or symbol-community.com/community for language proofreading of articles.

## 目錄
* 概述
* 舊環境搬遷數據備份
* 在新環境中構建 Symbol-boostrap 環境
* 關聯

## 概述

下面描述了移动运行 Symbol-bootstrap 的服务器的过程。 我们将涉及以下几点。

- 旧环境搬迁数据备份
- 在新环境中构建 Symbol-boostrap 环境
- 更改 DNS 设置
- 委托人搬迁

## 旧环境搬迁数据备份

备份以下数据

- 备份操作节点的Symbol账户
      -`~/custom-preset.yml`
      -`~/symbol-bootstrap/target/addresses.yml`
- 备份旧节点的委托人信息（在搬迁工作之前立即实施）
      -`~/symbol-bootstrap/target/nodes/node/data/harvesters.dat`

## 在新环境中构建 Symbol-boostrap 环境

搬迁工作将按以下顺序进行。

1.旧环境备份
2. 建设新环境
3.在新环境启动Symbol-Boostrap（账户信息是临时的）
4.同步新环境中的所有区块
5. 在新环境中暂停 Symbol-Boostrap
6.将相关文件从旧环境移动到新环境
7. 在新环境中读取`~/custom-preset.yml`
8.启动符号引导到新环境
9. 将DNS设置的A记录从旧环境改写到新环境
10.停止旧环境

需要注意的是，如果DNS服务器也被搬迁，则将这项工作与节点搬迁工作分开。

### 服务器布置，新环境搭建

请按照以下步骤完成新环境中的设置。

[如何搭建Symbol节点](https://symbol-community.com/zh-Hant-TW/docs/25)

### 同步新环境中的所有块

同步所有块需要一天多的时间，所以在完成上一节的过程后请稍等片刻。 您可以通过以下方法查看同步块高度。

``` 狂欢
# 在服务器中执行以下命令
卷曲 http://localhost:3000/chain/info
```

### 在新环境中停止 Symbol-Bootstrap

我会停下来工作一次。 操作如下。

``` 狂欢
符号引导停止
```

### 将相关文件从旧环境移动到新环境

将旧环境中备份的文件移动到新环境中。 原则上传输源和传输目的地的文件路径相同，针对以下文件

``~/custom-preset.yml``（您可能已经自己更改了文件名）

``~/symbol-bootstrap/target/nodes/node/data/harvesters.dat``

文件就位后，让我们应用更改

``` 狂欢
symbol-bootstrap config -p mainnet -a dual -c custom-preset.yml --upgrade
符号引导程序撰写--升级
```

如果以上都没有错误的话，我们这时候就把她在DNS中的A记录改写成新环境的IP地址。 改写后在新环境启动symbol-bootstrap如下

``` 狂欢
符号引导程序运行-d
符号引导健康检查
```

在符号引导程序中识别 Let's Encrypt 并将其转换为 SSL 之前，会有 1 到 3 分钟的时间延迟。 尝试访问节点的域，看看是否可以正确访问。 如果确认可以正常访问，检查Symbol Wallet中是否已经取消委托，如果没有问题，在旧环境中停止symbol-bootstrap。

所有迁移工作现已完成。 如果过程中出现问题，停止工作并切换回旧环境。

＃＃ 关联

- [如何构建符号节点](https://symbol-community.com/zh-Hant-TW/docs/25)
- [符号工具-符号节点列表](https://symbol-tools.com/symbolTools/view/tool/nodeList.html)
- [符号节点 - 节点](https://symbol-tools.com/symbolTools/view/tool/nodeList.html)
- [符号文档](https://docs.symbol.dev/en/guides/network/running-a-symbol-node.html)
- [符号引导存储库](https://github.com/fboucquez/symbol-bootstrap)