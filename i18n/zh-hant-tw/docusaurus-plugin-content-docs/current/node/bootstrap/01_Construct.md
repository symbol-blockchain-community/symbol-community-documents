This page is a machine translation of the English text.
Please contact faunsu https://twitter.com/faunsu19000 or symbol-community.com/community for language proofreading of articles.

## 目錄

*關於符號節點
*節點功能和服務器基本規格

- 符號節點構建過程 \*尖端

## 關於符號節點

區塊鏈節點按時間順序記錄交易數據，過往內容可查。作為分佈式賬本，多個節點共享相同的數據，任何人都可以查看交易數據。Symbol的區塊鏈由遍布全球的節點網絡構建和維護。節點執行交易、執行搜索並將數據以塊的形式記錄到分類賬中。

## 節點特性和基本服務器規格

Symbol節點分為三種：我會按順序解釋。

-對等節點
-API 節點 -投票節點

### 對等節點

也稱為 Harvester 節點，它們支持網絡。它主要驗證交易以將新塊添加到區塊鏈並在此過程中收取費用。

![symbol-build-node-peer-node](https://cms.symbol-community.com/uploads/symbol_build_node_peer_node_45ccd0a42e.png)

### API 節點

API 節點的主要作用是以可讀格式將數據存儲在 MongoDB 中。
API 節點還負責收集聚合債券交易的共同簽名，這些交易僅在完成時進行處理。

![symbol-build-node-api-node](https://cms.symbol-community.com/uploads/symbol_build_node_api_node_4deaa356b7.png)

- 單個節點可以同時運行 Peer Node 和 API Node。

### 投票節點

Symbol提供了投票節點作為敲定的手段，投票節點只能由用戶自己擁有300萬xym來建立，一個區塊在敲定時就被認為是敲定的。Symbol的敲定採用[pBFT](https://pmg.csail. mit.edu/papers/osdi99.pdf），需要67%以上的投票節點同意。例如，金融機構在區塊鏈上實現支付處理時，需要保證生成的區塊不會被更改。通過finalization，金融機構可以知道區塊已經確認，可以順利的進行支付處理。

Voting Node在Symbol Blockchain中是可選的，在搭建新網絡時，可以在網絡設置中關閉，定位為單一插件，即使停止終結，也會繼續基於PoS+出塊作為敲定的用例，希望在區塊鏈上開展業務的組織和行業可以操作和管理投票節點，以進一步激活健壯的 PoS+ 鏈上的敲定功能，並在行業內共享塊確認的時間。使用識別和運行易於操作的公共聯盟鏈。

## 符號節點構建過程

請安排具有以下環境的服務器。如果您擔心服務器操作，請考慮使用服務[Allnode](https://www.allnodes.com/)。也可以使用Debian以外的Linux操作系統發行版，但下面描述的示例腳本基於 Debian。

- 具有所需硬件規格或更高規格的服務器（單獨的表格）
- Debian 操作系統 10 或更高版本
- 端口 80、443、3000、3001、7900

###（附錄）強制性硬件規格

以下是強制性要求：

| 最低規格  | 對等節點           | API 節點           | 雙重/投票          |
| --------- | ------------------ | ------------------ | ------------------ |
| CPU       | 2 核               | 4 核               | 4 核               |
| 內存      | 8GB                | 16GB               | 16GB               |
| 磁盤大小  | 500 GB             | 750 GB             |
| 磁盤 IOPS | 1500 IOPS 固態硬盤 | 1500 IOPS 固態硬盤 | 1500 IOPS 固態硬盤 |

下表列出了建議的要求。

| 推薦規格   | 對等節點           | API 節點           | 雙/投票            |
| ---------- | ------------------ | ------------------ | ------------------ |
| 中央處理器 | 4 核               | 8 核               |
| 內存       | 16GB               | 32GB               | 32GB               |
| 磁盤大小   | 500 GB             | 750 GB             |
| 磁盤 IOPS  | 1500 IOPS 固態硬盤 | 1500 IOPS 固態硬盤 | 1500 IOPS 固態硬盤 |

### 平時不搭建服務器的注意事項

在構建節點之前，請務必執行以下安全措施。

- 防火牆設置
- 對於 SSH 通信，禁止 root 登錄並使用公鑰進行身份驗證
- 作為一般規則，除 22、80、3000、3001、7900 外，端口應關閉

### 端口使用

**22**：SSH 連接。
**80**：Let's Encrypt + 符號節點列表
**3000**：HTTP REST 網關
**3001**：HTTPS REST 網關
**7900**：節點與彈射器客戶端之間的通信

### 服務器初始設置

連接到服務器，首先在服務器上創建一個操作賬號。

```狂歡
添加用戶符號
usermod -aG sudo 符號
su - 符號
```

### 安裝所需的軟件

執行以下腳本搭建環境。

```狂歡
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/ymuichiro/symbol-node-builder/main/scripts/install.sh)"
```

通常需要進行以下工作，但上面的腳本會自動設置它。

- 安裝 nvm、node.js 16、npm
- 安裝docker, docker-compose
- 通過 npm 安裝 symbol-bootstrap
- 創建 `~/symbol-bootstrap/**` 文件夾

### 啟動和設置 Symbol-Bootstrap

使用以下命令啟動 Symbol-bootstrap。

```狂歡
cd ~/符號引導程序
符號引導嚮導
```

1. 網絡選擇 選擇在哪個網絡上構建節點。

```
選擇一個網絡：（使用方向鍵）
❯ 主網節點
測試網節點
引導本地網絡
自定義網絡節點（需要“custom-network-preset.yml”文件和“nemesis-seed”文件夾）
```

2.選擇節點類型

```
選擇一個程序集：（使用箭頭鍵）
❯ 雙節點
對等節點
接口節點
演示節點。一個雙節點，包括水龍頭和資源管理器。
```

3.推薦離線，因為它處理私鑰。如果沒有連接到互聯網，VPS等將無法使用，請按Y繼續。

```
? Symbol Bootstrap 即將開始處理敏感信息（私鑰），因此強烈建議
你在繼續之前斷開與網絡的連接。如果你離線或者你不在乎，請說“是”。（是/否）
```

4. 輸入用於 Symbol bootstrap 的密碼。

```
輸入用於加密和解密自定義預設、addresses.yml 和 preset.yml 文件的密碼。
密碼，私鑰將被加密。
```

5. 收割設置需要四個賬戶，指定其中的主賬戶，新建一個或輸入已有賬戶的私鑰。

```
? 你想如何創建主帳戶：（使用箭頭鍵）
❯ 生成一個新帳戶
輸入私鑰
輸入主賬戶的 64 HEX 私鑰（或按回車鍵再次選擇該選項）。
```

6、如果你在5中輸入了私鑰，會顯示賬戶地址，如果沒有區別就選y。

```
? 這是用作主帳戶的預期地址 TCDNP********************55KCQ 嗎？（是/否）
```

7. 指定傳輸帳戶以及主要帳戶。

```
? 你想如何創建傳輸帳戶：（使用箭頭鍵）
❯ 生成一個新帳戶
輸入私鑰
```

8. VRF賬戶類似。

```
? 您想如何創建 VRF 帳戶：（使用方向鍵）
❯ 生成一個新帳戶
輸入私鑰
```

9. 遠程賬戶類似。

```
? 你想如何創建遠程帳戶：（使用箭頭鍵）
❯ 生成一個新帳戶
輸入私鑰
```

10、配置HTTP設置，如果選擇第二個Automatic~，可以自動設置HTTPS。

```
您的 REST 網關應該在 HTTPS（這是一種安全協議）上運行，以便 Symbol Explorer 可以識別它。
? 選擇您的 HTTPS 設置方法：（使用方向鍵）
❯ 本機支持，我有 SSL 證書和密鑰。
自動，您的所有密鑰和證書都將使用 letsencyrpt 自動生成/更新。
沒有任何
```

11. 輸入主機名。

```
? 輸入指向您的出站主機 IP 的公共域名（例如 node-01.mysymbolnodes.com）此值為
在 HTTPS 上運行時需要！
```

12. 輸入您的友好名稱。

```
輸入節點的友好名稱。
```

13. 從 4 種類型的帳戶（密鑰）中選擇要加密的數量。

```
? 選擇您要使用的安全類型：（使用方向鍵）
PROMPT_MAIN：Bootstrap 在進行證書升級時可能會要求提供 Main 私鑰。其他密鑰已加密。
❯ PROMPT_MAIN_TRANSPORT：Bootstrap 在重新生成證書時可能會要求提供 Main 和 Transport 私鑰。
密鑰已加密。
ENCRYPT：所有密鑰都已加密，只需要輸入密碼
```

15、註冊或選擇投票節點，沒有300萬xym不能成為投票節點。

```
您是否正在創建投票節點？（是/否）
```

回答完所有問題後，`~/custom-preset.yml`將完成。默認情況下不指定benefitsAddress。打開文件並指定正確的值。示例如下所示。

```yaml
組裝：雙
預設：主網
privateKeySecurityMode：PROMPT_MAIN_TRANSPORT
節點：
-
主機：example.org
最大解鎖賬戶：30
benefitAddress：${your-symbol-address}
投票：錯誤
friendlyName：${你的名字}
mainPrivateKey：${your-node-main-privatekey}
vrfPrivateKey：${your-node-vrf-privatekey}
remotePrivateKey：${your-node-remote-privatekey}
transportPrivateKey：${your-node-transport-privatekey}
https代理：
-
excludeDockerService: false
```

**host** … 輸入分配給節點的 IP 地址或域。
**maxUnlockedAccounts** ... 指定可以委託給節點的最大地址數。
**beneficiaryAddress** ... 指定節點收到的收穫獎勵的支付目的地地址
**friendlyName** … 指定任何節點的名稱。

### 啟動符號節點

執行以下命令加載 ~/custom-preset.yml 並啟動 symbol-bootstrap。

```狂歡
cd ~/符號引導程序
symbol-bootstrap config -p mainnet -a dual -c custom-preset.yml
符號引導啟動 -d
符號引導健康檢查
```

下面是 symbol-bootstrap 的啟動和停止命令列表。

`symbol-bootstrap start -d` 僅在首次啟動時指定。
`symbol-bootstrap run -d` 為第二次和後續引導指定它。
`symbol-bootstrap stop` 指定何時暫停。

- 如果指定了 `-d`，就可以在後端啟動它。

本次工作完成了新的symbol-bootstrap的搭建，2023年3月開始新的symbol-bootstrap，大概需要1.5-2天的時間所有區塊同步完成，招募委託人時，請等到所有區塊同步完成後進行.

以下，將描述各種提示。

＃＃尖端

###更新節點證書

節點證書在節點構建後約一年到期。

1.使用healthCheck檢查節點SSL證書是否過期

```
符號引導健康檢查

> node 節點的 node.crt.pem 證書將於 Aug 2 14:30:34 2023 GMT 到期，目前還不需要更新。
```

2.更新您的證書

```
符號引導更新證書
```

### 在符號節點列表中顯示節點信息

您可以將自己的節點信息發佈到[符號節點列表](https://symbol-tools.com/symbolTools/view/tool/nodeList.html)。

1.付費註冊（推薦）

進入【評論註冊】(https://symbol-tools.com/symbolTools/view/tool/nodeAdminManual.html)頁面，創建發布信息，支付10xym（截至2023/03/09的費用金額）即可通過付費體現。

2.通過在節點上設置nodeSetting.json進行註冊

您可以免費指定。如果您擁有自己的服務器，並且可以在服務器上配置設置，您可以選擇這種方式。如果您不知道如何進行以下步驟，我們建議您執行步驟1。

**安裝方法**

- 將配置文件放在節點的以下路徑中 -`http://xxx.xxx.xxx.xxx:80/nodeSetting.json`
- symbol-bootstrap 已啟動並正在運行，同時也在偵聽端口 80、443。因此，有必要執行以下或等效操作。
- 編輯`~/symbol-bootstrap/target/docker/docker-compose.yml`並重寫volume信息，使`nodeSetting.json`掛載在他在nginx中的路徑上
- 使用 `symbol-bootstrap compose` 等重建容器並啟動節點

* 此程序在更新symbol-bootstrap或更新preset時會覆蓋`docker-compose.yml`文件，所以每次都需要重新註冊。

* 2不能被Allnodes用戶使用

### MongoDB 索引回顧

參考資料貼在下面

[https://qiita.com/nem_takanobu/items/8e39cc02df1b7adccfee](https://qiita.com/nem_takanobu/items/8e39cc02df1b7adccfee)

### 當custom-preset.yml更新時

`custom-preset.yml` 可以在運行 symbol-bootstrap 時更改。

```狂歡
符號引導停止
symbol-bootstrap config -p mainnet -a dual -c custom-preset.yml --upgrade
符號引導程序撰寫--升級
符號引導程序運行-d
```

### 如何檢查節點錯誤的原因

當一個節點由於某種原因宕機時，有幾種方法可以檢查錯誤的原因。

1.查看symbol-bootstrap的日誌輸出

通過在啟動 symbol-bootstrap 時省略 `-d` 選項，您可以在檢查日誌時啟動。

```狂歡
符號引導運行
```

2.使用docker的日誌功能

第1步輸出所有容器的日誌作為問題。
數量巨大，因為它是您可以通過運行以下命令來檢查哪個容器有問題。

```狂歡
符號引導停止
符號引導程序運行-d
泊塢窗 ps -a
```

另外，如果正常的話，輸出結果如下。

```狂歡
符號@xxxxxxxxxxxxxxxxxxx:~$ docker ps -a
容器 ID 圖像命令創建狀態端口名稱
8d44313c93d6 steveltn/https-portal:1.19 "/init" 40 小時前 上升 40 小時 0.0.0.0:80->80/tcp, :::80->80/tcp, 0.0.0.0:3001->443/tcp, :::3001->443/tcp https-代理
71fa6d455cf6 symbolplatform/symbol-server:gcc-1.0.3.5 "/bin/bash /symbol-c ..." 40 小時前 上升 40 小時 0.0.0.0:7900->7900/tcp, :::7900->7900/tcp 節點
542ca6019607 symbolplatform/symbol-server:gcc-1.0.3.5 "/bin/bash /symbol-c ..." 2 天前 40 小時經紀人
5b6765426fd2 symbolplatform/symbol-rest:2.4.2 "docker-entrypoint.s ..." 2 天前 上升 40 小時 0.0.0.0:3000->3000/tcp, :::3000->3000/tcp rest-gateway
19c9ac8edce9 mongo:4.4.3-bionic "docker-entrypoint.s ..." 2 天前 Up 40 小時 27017/tcp db
```

如果存在STATUS為Exec(0)的容器則報錯，如果只想查看對應容器的日誌，執行如下 `${CONTAINER ID}` 指定Exec輸出的容器ID (0).

```狂歡
docker 日誌 ${CONTAINER ID}
```

## 鏈接

- [如何移动符号节点](https://symbol-community.com/zh-Hant-TW/docs/32)
- [符號工具-符號節點列表](https://symbol-tools.com/symbolTools/view/tool/nodeList.html)
- [符號節點 - 節點](https://symbol-tools.com/symbolTools/view/tool/nodeList.html)
- [符號文檔](https://docs.symbol.dev/en/guides/network/running-a-symbol-node.html)
- [符號引導存儲庫](https://github.com/fboucquez/symbol-bootstrap)
