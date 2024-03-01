# Summary of how to start Symbol Shoesstring β

symbol-shoestring has been released as a new node startup tool to replace symbol-bootstrap. At the moment, it is only compatible with the testnet, and there are various problems, but if you can verify it, please install it by referring to the following procedure and send us your feedback.

## Environment information at the time of verification

```
Ubuntu 20.04.6 LTS
Python 3.8.10
gettext (GNU gettext-runtime) 0.19.8.1
docker
docker compose
```

## table of contents

(a) Until wizard is started
(b) Modification to complete wizard setup
(c) Wizard setup execution
(d) Until node is started
(a) Until wizard is started

## (a) Until wizard is started

### If there is a previous remnant, delete it just in case

```shell
cds
rm -rf .local
```

### Add various middlewares in the following order

```shell
sudo apt install -y libssl-dev gettext
pip install PyOpenSSL --upgrade
pip install symbol-shoestring
```

### Get lang file from github (temporary workaround for bug)

```
cd .local/lib/python3.8/site-packages/shoestring/
mkdir -p lang/en/LC_MESSAGES
cd lang/en/LC_MESSAGES
wget raw.githubusercontent.com/symbol/product/dev/tools/shoestring/lang/en/LC_MESSAGES/messages.po
cp -p messages.po messages.po.org
```

### Added code to messages.po (temporary workaround for bug)

Add the following to line 6 of `messages.po`. I get an error with the following steps:

**Before correction**
```messages.po
# Translations for Shoestring.
# Copyright (C) 2023 Symbol Contributors
# This file is distributed under the same license as the Shoestring project.
msgid ""
msgid ""

#: shoestring/commands/announce_transaction.py:31
msgid "announce-transaction-announce-successful"
msgid "transaction was successfully sent to the network"
```

**Revised**
```messages.po
# Translations for Shoestring.
# Copyright (C) 2023 Symbol Contributors
# This file is distributed under the same license as the Shoestring project.
msgid ""
msgid ""
"Content-Type: text/plain; charset=UTF-8\n"

#: shoestring/commands/announce_transaction.py:31
msgid "announce-transaction-announce-successful"
msgid "transaction was successfully sent to the network"
```

### generation of mo from po

```
msgfmt messages.po -o messages.mo
```

### start wizard

```shell
cd ~/.local/lib/python3.8/site-packages/shoestring/
python3 -m shoestring.wizard
```

## (b) Modification to complete wizard setup

### Setting the size of the terminal (unnecessary depending on the environment)
If the screen is small and the following error occurs, please make the screen wider.

```
"Window too small..."
```

### Errors in the following files have been corrected.

```
cd ~/.local/lib/python3.8/site-packages/shoestring/
cp -p internal/PackageResolver.py internal/PackageResolver.py.org
vi internal/PackageResolver.py
```

**Fixes**
```PackageResolver.py
for file in subdir.glob('*'):
-shutil.move(file, destination_directory)
+ shutil.move(str(file), destination_directory)
      subdir.rmdir()
```

### Copy startup/templates directory to shoestring
https://github.com/symbol/product/tree/dev/tools/shoestring/startup
https://github.com/symbol/product/tree/dev/tools/shoestring/templates

```shell
cd ~/.local/lib/python3.8/site-packages/shoestring/
mkdir startup
cd startup
wget https://raw.githubusercontent.com/symbol/product/dev/tools/shoestring/startup/delayrestapi.sh
wget https://raw.githubusercontent.com/symbol/product/dev/tools/shoestring/startup/mongors.sh
wget https://raw.githubusercontent.com/symbol/product/dev/tools/shoestring/startup/startBroker.sh
wget https://raw.githubusercontent.com/symbol/product/dev/tools/shoestring/startup/startServer.sh
wget https://raw.githubusercontent.com/symbol/product/dev/tools/shoestring/startup/wait.sh

cd ~/.local/lib/python3.8/site-packages/shoestring/
mkdir templates
cd templates
wget https://raw.githubusercontent.com/symbol/product/dev/tools/shoestring/templates/docker-compose-dual.yaml
wget https://raw.githubusercontent.com/symbol/product/dev/tools/shoestring/templates/docker-compose-peer.yaml
wget https://raw.githubusercontent.com/symbol/product/dev/tools/shoestring/templates/nginx.conf.erb
```
 
## (c) Run wizard setup

### Create symbol directory

```
cd~
mkdir symbol
```

### start wizard

```
cd ~/.local/lib/python3.8/site-packages/shoestring/
python3 -m shoestring.wizard
```

### Select `<setup>` on the welcome screen and return
You can move the selection by tabbing

### Do the following in the Obligatory setting

1. Configuration destination directory is the directory created in (1)
   * If the above is in red, the directory was not created properly, so start over
2. CA PEM file path (main account)
   * Should be in deficit at first
3. Move to the place where "ca.key.pem" and the initial value are displayed with the tab.
4. Corrected to full path
   * Example: /home/pasomi/ca.key.pem
5. Tab to "* CA PEM file" in the third input field
6. Use the right arrow key (>) to move to the second "Generate random private key" (note that tabbing cannot be used) and press return.
7. Then tab to the "Specify output location of private key PEM file above" field.
8. Since the cursor is at `<Generate!>`, press return and it will display "Key generated and saved to file".
9. Tab to `<Next>` and do a return
10. Select testnet in Choose network type and click `<Next>`
11. For testnet, use the down arrow key to move to the testnet item and press space
12. Select Dual in Choose node type and press `<Next>`
13. Do not select anything for Havest settings and click `<Next>`.
14. Without selecting any Voter settings, click `<Next>`
15. Specify Node settings and `<Next>`
   * Set only IP or domain name for now
16. Leave CA name + node cert name as default `<Next>`
17. If the writing configuraion looks okay, `<Finish>`

## (d) Until node is started

### Install and start docker

```
curl https://get.docker.com | sh
sudo usermod -aG docker pasomi
sudo reboot
sudo systemctl start docker
sudo systemctl enable docker
```

### Install docker-compose

```
sudo curl -L "https://github.com/docker/compose/releases/download/v2.2.3/docker-compose-$(uname -s)-$(uname-m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### start node

```
cd ~/symbol
docker-compose up -d
```

that's all