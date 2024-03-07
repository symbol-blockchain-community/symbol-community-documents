This page is a machine translation of the English text.
Please contact faunsu https://twitter.com/faunsu19000 or symbol-community.com/community for language proofreading of articles.

## 目录

- 概述
- 旧环境搬迁数据备份
- 在新环境中构建 Symbol-boostrap 环境
- 关联

## 概述

下面描述了移动运行 Symbol-bootstrap 的服务器的过程。

- 旧环境搬迁数据备份
- 在新环境中构建 Symbol-boostrap 环境
- 更改 DNS 设置
- 代表搬迁

## 旧环境搬迁数据备份

备份以下数据

- 备份操作节点的Symbol账户 -`~/custom-preset.yml` -`~/symbol-bootstrap/target/addresses.yml`
- 备份旧节点的委托人信息（在搬迁工作之前立即实施）-`~/symbol-bootstrap/target/nodes/node/data/harvesters.dat`

## 在新环境中构建 Symbol-boostrap 环境

搬迁工作将按以下顺序进行。

1.旧环境备份2. 建设新环境3.在新环境启动Symbol-Boostrap（账户信息是临时的）4.同步新环境中的所有区块5. 在新环境中暂停 Symbol-Boost 6.将相关文件从旧环境移动到新环境7. 在新环境中读取`~/custom-preset.yml` 8.启动符号引导到新环境9. 将DNS设置的A记录从旧环境改写到新环境10.停止旧环境

需要注意的是，如果DNS服务器也被搬迁，则将这项工作与节点搬迁工作分开。

### 服务器布置，新环境搭建

请按照以下步骤完成新环境中的设置。

[如何搭建Symbol节点](https://symbol-community.com/zh/docs/20)

### 同步新环境中的所有块

同步所有区块需要一天多的时间，完成上一节的流程后请稍等片刻，您可以通过以下方法查看已同步的区块高度。

```狂欢
# 在服务器中执行以下命令
卷曲 http://localhost:3000/chain/info
```

### 停止符号 - 在新环境中引导

我会停下来工作一次。

```狂欢
符号引导停止
```

### 将相关文件从旧环境移动到新环境

将旧环境中备份的文件移动到新环境中。

`~/custom-preset.yml`（您可能已经自己更改了文件名）

`~/symbol-bootstrap/target/nodes/node/data/harvesters.dat`

文件就位后，让我们应用更改

```狂欢
symbol-bootstrap config -p mainnet -a dual -c custom-preset.yml --upgrade
符号引导程序撰写--升级
```

如果以上都没有错误的话，我们这时候就把她在DNS中的A记录改写成新环境的IP地址。

```狂欢
符号引导程序运行-d
符号引导健康检查
```

Let's Encrypt在symbol-bootstrap中被识别并转换为SSL有1到3分钟的时间延迟，尝试访问节点的域，看是否可以正确访问，如果可以确认可以正常访问，检查Symbol Wallet中是否已经取消委托，如果没有问题，在旧环境中停止symbol-bootstrap。

至此所有迁移工作已经完成，如果过程中出现问题，请停止工作，切换回旧环境。

## 链接

- [如何构建符号节点](https://symbol-community.com/zh/docs/20)
- [符号工具-符号节点列表](https://symbol-tools.com/symbolTools/view/tool/nodeList.html)
- [符号节点 - 节点](https://symbol-tools.com/symbolTools/view/tool/nodeList.html)
- [符号文档](https://docs.symbol.dev/en/guides/network/running-a-symbol-node.html)
- [符号引导存储库](https://github.com/fboucquez/symbol-bootstrap)
