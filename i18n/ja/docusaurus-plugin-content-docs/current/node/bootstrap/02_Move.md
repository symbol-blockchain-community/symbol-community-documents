## 目次

- 概要
- 旧環境での移設用データバックアップ
- 新環境での Symbol-boostrap 環境構築
- リンク

## 概要

Symbol-bootstrap 実行中のサーバーを移設する際の手順を以下に記述します。以下の点について触れていきます。

- 旧環境での移設用データバックアップ
- 新環境での Symbol-boostrap 環境構築
- DNS 設定の変更
- 委任者の移設

## 旧環境での移設用データバックアップ

以下のデータのバックアップを取得します

- ノードを運営するSymbolアカウントのバックアップ
  - `~/custom-preset.yml`
  - `~/symbol-bootstrap/target/addresses.yml`
- 旧ノードの委任者情報のバックアップ（移設作業直前に実施する事）
  - `~/symbol-bootstrap/target/nodes/node/data/harvesters.dat`

## 新環境での Symbol-boostrap 環境構築

以下順序により移設作業を行います

1. 旧環境でバックアップ
2. 新環境構築
3. 新環境で Symbol-Boostrap の起動（アカウント情報は仮のもので）
4. 新環境で全てのブロックの同期
5. 新環境でSymbol-Boostrap の一時停止
6. 旧環境より新環境へ関連ファイルの移設
7. 新環境で `~/custom-preset.yml` 読み込み
8. 新環境へ symbol-bootstrap の起動
9. DNS 設定を旧環境より新環境へ A レコード書き換え
10. 旧環境の停止

注意点として、もし DNS サーバーの移設も伴う場合は、ノードの移設作業とは作業を分けましょう。

### サーバー手配、新環境構築

以下の手順を参照し、新環境でセットアップを完了して下さい

[Symbol ノードの構築方法](https://symbol-community.com/ja/docs/5)

### 新環境で全てのブロックの同期

全てのブロックが同期されるまで1日以上かかる為、一旦前項の手順が終わった後は暫く放置します。同期されたブロック高の確認は以下の方法にて確認出来ます。

```bash
# サーバー内で以下のコマンドを実行
curl http://localhost:3000/chain/info
```

### 新環境で Symbol-Bootstrap の停止

一旦作業を行う為、停止します。以下の操作となります。

```bash
symbol-bootstrap stop
```

### 旧環境より新環境へ関連ファイルの移設

旧環境にてバックアップを取ったファイルを新環境へ移設しましょう。移設元、移設先のファイルパスは原則同じで以下のファイルが対象です

`~/custom-preset.yml`（ファイル名を自身で変更している場合があります）

`~/symbol-bootstrap/target/nodes/node/data/harvesters.dat`

ファイルを設置したら、変更を適用しましょう

```bash
symbol-bootstrap config -p mainnet -a dual -c custom-preset.yml --upgrade
symbol-bootstrap compose --upgrade
```

上記で特にエラーがなければ、このタイミングで DNS の Aレコードを新環境の IP アドレスへ書き換えましょう。書き換えができたら以下の通り新環境の symbol-bootstrap を開始します

```bash
symbol-bootstrap run -d
symbol-bootstrap healthCheck
```

symbol-bootstrap 内で Let’s Encrypt が認識されて SSL化されるまで 1~3分タイムラグがあります。ノードのドメインにアクセスしてみて正しくアクセスできるか確認しましょう。問題なくアクセスができた事を確認できたら、Symbol Wallet でも委任が解除されていないか確認し、問題がなければ旧環境の symbol-bootstrap を停止しておきましょう。

これにて全ての移行作業は完了となります。もし途中で問題が生じた場合は作業を中断し、旧環境への切り戻し作業を行なってください。

## リンク

- [Symbol ノードの構築方法](https://symbol-community.com/ja/docs/5)
- [Symbol Tools - Symbol Node List](https://symbol-tools.com/symbolTools/view/tool/nodeList.html)
- [Symbol Nodes - nodes](https://symbol-tools.com/symbolTools/view/tool/nodeList.html)
- [Symbol documentation](https://docs.symbol.dev/ja/guides/network/running-a-symbol-node.html)
- [Symbol bootstrap repository](https://github.com/fboucquez/symbol-bootstrap)
