This page is a machine translation of the English text.
Please contact faunsu https://twitter.com/faunsu19000 or symbol-community.com/community for language proofreading of articles.

## table of contents

- overview
- Data backup for relocation in the old environment
- Building Symbol-boostrap environment in new environment
- Link

## overview

The procedure for moving a server running Symbol-bootstrap is described below. We will touch on the following points.

- Data backup for relocation in the old environment
- Building Symbol-boostrap environment in new environment
- Change DNS settings
- Relocation of delegator

## Data backup for relocation in the old environment

Take a backup of the following data

- Back up the Symbol account that operates the node
  - `~/custom-preset.yml`
  - `~/symbol-bootstrap/target/addresses.yml`
- Backing up the delegator information of the old node (implemented immediately before relocation work)
  - `~/symbol-bootstrap/target/nodes/node/data/harvesters.dat`

## Building Symbol-boostrap environment in new environment

Relocation work will be performed in the following order.

1. Back up in the old environment
2. Building a new environment
3. Start Symbol-Boostrap in the new environment (account information is temporary)
4. Synchronize all blocks in the new environment
5. Pause Symbol-Boostrap in new environment
6. Move related files from the old environment to the new environment
7. Read `~/custom-preset.yml` in the new environment
8. Start symbol-bootstrap to new environment
9. Rewrite A record of DNS settings from old environment to new environment
10. Stop old environment

As a point of caution, if the DNS server is also relocated, separate the work from the node relocation work.

### Server arrangements, new environment construction

Please follow the steps below to complete the setup in the new environment.

[How to build a Symbol node](https://symbol-community.com/docs/6)

### Synchronize all blocks in the new environment

It takes more than a day to synchronize all blocks, so leave it for a while after completing the procedure in the previous section. You can check the synchronized block height by the following method.

```bash
# execute the following command in the server
curl http://localhost:3000/chain/info
```

### Stop Symbol-Bootstrap in new environment

I will stop to work once. The operation is as follows.

```bash
symbol-bootstrap stop
```

### Move related files from the old environment to the new environment

Move the files backed up in the old environment to the new environment. In principle, the file path of the transfer source and transfer destination is the same, and the following files are targeted

`~/custom-preset.yml` (You may have changed the file name yourself)

`~/symbol-bootstrap/target/nodes/node/data/harvesters.dat`

Once the file is in place, let's apply the changes

```bash
symbol-bootstrap config -p mainnet -a dual -c custom-preset.yml --upgrade
symbol-bootstrap compose --upgrade
```

If there are no errors in the above, let's rewrite her A record in DNS to the IP address of the new environment at this time. After rewriting, start symbol-bootstrap in the new environment as follows

```bash
symbol-bootstrap run -d
symbol-bootstrap healthCheck
```

There is a time lag of 1 to 3 minutes until Let's Encrypt is recognized in symbol-bootstrap and converted to SSL. Try accessing the node's domain to see if you can access it correctly. If you can confirm that you can access without problems, check whether the delegation has been canceled in Symbol Wallet, and if there are no problems, stop symbol-bootstrap in the old environment.

All migration work is now complete. If a problem occurs during the process, stop the work and switch back to the old environment.

## Link

- [How to build a Symbol node](https://symbol-community.com/docs/6)
- [Symbol Tools - Symbol Node List](https://symbol-tools.com/symbolTools/view/tool/nodeList.html)
- [Symbol Nodes - nodes](https://symbol-tools.com/symbolTools/view/tool/nodeList.html)
- [Symbol documentation](https://docs.symbol.dev/en/guides/network/running-a-symbol-node.html)
- [Symbol bootstrap repository](https://github.com/fboucquez/symbol-bootstrap)
