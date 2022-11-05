# Créer sa blockchain simplement en JavaScript

Nb: Cet article est une traduction de l'article écrit par [FreakCdev](https://dev.to/freakcdev297/creating-a-blockchain-in-60-lines-of-javascript-5fka) vous pouvez retrouver [le repo git plus complet ici](https://github.com/nguyenphuminh/JeChain)

## Qu'est-ce qu'une blockchain ?
Techniquement, une blockchain est au minimum une liste d'objets contenant des informations de base comme l'heure, des transactions, un hash... 
Ce sont des données qui doivent sont immuables et inviolables. 

Les plateformes modernes comme Ethereum, Cardano, Polkadot,... sont beaucoup plus complexes, mais il nécéssaire de rester simple pour en comprendre les bases.

## Installation
Nous allons utiliser Node.js pour plus de simplicité. 
Pensez à faire un petit `npm init` avant de commencé ;)
 
De plus, nous utiliserons la syntaxe orienté objet pour le reste des exercices

## Créer son 1er block

Un bloc est simplement un objet qui contient des informations, nous devrions donc avoir une classe `Bloc` comme celle-ci :

```js
class Block {
    constructor(timestamp = "", data = []) {
        this.timestamp = timestamp;
        // this.data should contain information like transactions.
        this.data = data;
    }
}
```

Nous avons donc notre horodatage et nos données, mais une blockchain a besoin d'immuabilité.
Nous pouvons obtenir cet effet en utilisant une fonction de hachage qui hachera toutes nos propriétés dans le bloc.
Je vous suggère de vous renseigner sur le hasing sur wikipedia, il joue un rôle essentiel dans une blockchain.

Fondamentalement, il prend un message et en sort un "hash" avec une longueur fixe, une légère modification du message rendra la sortie complètement différente.

Nous utiliserons l'algorithme `sha256`  intégré de Nodejs pour implémenter sa fonction de hachage.
Voici comment l'utiliser :

```js
// Get the sha256 hash function.
const crypto = require("crypto"), SHA256 = message => crypto.createHash("sha256").update(message).digest("hex");
```

### Le hachage : 

Une fonction de hachage prend en entrée une chaîne de caractères de taille variable et retourne une chaîne de caractères de taille fixe généralement (beaucoup) plus petite.
Le hachage est une fonction qui est facile à calculer, mais qui est difficile à inverser.

Voici le code nécéssaire pour calculer le hash d'un `Block` :

```js
class Block {
    constructor(timestamp = "", data = []) {
        this.timestamp = timestamp;
        this.data = data;
        this.hash = this.getHash();
        this.prevHash = ""; // previous block's hash
    }

    // Our hash function.
    getHash() {
        return SHA256(this.prevHash + this.timestamp + JSON.stringify(this.data));
    }
}
```

Que ce passe-t-il au niveau de la fonction de hachage si nous venons changer une information dans le block ?
C'est ce qu'on appel l'immuabilité. Le block ne change pas tant que les informations qu'il contient n'ont pas changé.

La propriété `prevHash` joue également un rôle important dans l'immuabilité de la blockchain.
En effet si le block précédent change, alors le hash change aussi et donc les block suivant ne sont plus valide.

## La blockchain

Intéressons nous à la classe `Blockchain`.
Une blockchain est simplement... Une suite block.

```js
class Blockchain {
    constructor() {
        // This property will contain all the blocks.
        this.chain = [];
    }
}
```

Le 1er block est le block de génèse, nous allons l'inclure d'office dans notre blockchain.


```js
class Blockchain {
    constructor() {
        // Create our genesis block
        this.chain = [new Block(Date.now().toString())];
    }
}
```

Nous allons créer une fonction pour obtenir le dernier bloc :

```js
    getLastBlock() {
        return this.chain[this.chain.length - 1];
    }
```

Maintenant, nous devrions avoir un moyen d'ajouter un bloc à la blockchain.

```js
    addBlock(block) {
        // Since we are adding a new block, prevHash will be the hash of the old latest block
        block.prevHash = this.getLastBlock().hash;
        // Since now prevHash has a value, we must reset the block's hash
        block.hash = block.getHash();

        // Object.freeze ensures immutability in our code
        this.chain.push(Object.freeze(block));
    }
```

## Validation

Nous devons savoir si la chaîne est toujours valide ou non, et nous avons donc besoin d'une méthode pour vérifier la validation.

La chaîne est valide si le hachage d'un bloc est égal à ce que sa méthode de hachage renvoie, et la propriété prevHash d'un bloc doit être égale au hachage du bloc précédent.

```js
    isValid(blockchain = this) {
        // Iterate over the chain, we need to set i to 1 because there are nothing before the genesis block, so we start at the second block.
        for (let i = 1; i < blockchain.chain.length; i++) {
            const currentBlock = blockchain.chain[i];
            const prevBlock = blockchain.chain[i-1];

            // Check validation
            if (currentBlock.hash !== currentBlock.getHash() || prevBlock.hash !== currentBlock.prevHash) {
                return false;
            }
        }

        return true;
    }
```
  
Cette méthode jouera un rôle vraiment important lorsque notre blockchain sera exécutée sur un réseau p2p.

## Proof-of-work

Dans un réseau peer-to-peer, où il n'y a pas de système tiers pour approuver les actions des personnes, sans aucun mécanisme de consensus, les nœuds (les personnes pour être simple) seront d'accord avec la majorité, mais les personnes peuvent commencer à être des attaquants et prendre le contrôle de la majorité, nous avons donc besoin d'un mécanisme de consensus.

Un mécanisme de consensus n'existe pas entièrement pour arrêter les attaques, il existe pour que les gens ne soient pas des attaquants.
La preuve de travail est l'un d'entre eux.

Avant d'aller plus loin, le système fonctionne en vous faisant augmenter une valeur appelée nonce pour obtenir le hash qui commence par un nombre de zéros égal/lié à la difficulté.

Le PoW peut aider à deux choses : 
- Il empêche les attaquants parce qu'il est presque impossible de rattraper les autres nœuds seuls, 
- Il fournit des récompenses minières pour que les gens essaient d'être neutres plutôt que d'être des attaquants.

Nous implémenterons les récompenses minières dans le prochain article lorsque nous aurons un système de transaction.

Nous pouvons mettre en œuvre le système PoW en ajoutant une méthode mine et une propriété nonce à notre bloc :

```js
class Block {
    constructor(timestamp = "", data = []) {
        this.timestamp = timestamp;
        this.data = data;
        this.hash = this.getHash();
        this.prevHash = ""; // previous block's hash
        this.nonce = 0;
    }

    // Our hash function.
    getHash() {
        return SHA256(this.prevHash + this.timestamp + JSON.stringify(this.data) + this.nonce);
    }

    mine(difficulty) {
        // Basically, it loops until our hash starts with 
        // the string 0...000 with length of <difficulty>.
        while (!this.hash.startsWith(Array(difficulty + 1).join("0"))) {
            // We increases our nonce so that we can get a whole different hash.
            this.nonce++;
            // Update our new hash with the new nonce value.
            this.hash = this.getHash();
        }
    }
}
```

En effet, si nous modifions un petit détail dans notre bloc, le hachage sera complètement différent. Nous ne faisons donc qu'incrémenter le nonce encore et encore jusqu'à ce que le hachage corresponde à celui dont nous avons besoin.

(Note that Bitcoin and others normally use a different way to check difficulty, but we are staying simple)

Moving over to the Blockchain class, we should create a difficulty property:

```js
    this.difficulty = 1;
```

I will set it to 1, the difficulty should update based on how many blocks mined.

We must update the addBlock method from the Blockchain too:

```js
    addBlock(block) {
        block.prevHash = this.getLastBlock().hash;
        block.hash = block.getHash();
        block.mine(this.difficulty);
        this.chain.push(Object.freeze(block));
    }
```

Now, all blocks need to be mined before being added to the chain.

Quick note
Because we are staying simple, so I used the proof-of-work system for this blockchain. Note that most modern blockchains use a way better system called proof-of-stake (or many of its upgraded variations).

Testing out the chain!
Create a new file, that file will be the entry file.

Let's use our freshly created blockchain! I'll call it JeChain for now.

Export the needed classes first:
```js
module.exports = { Block, Blockchain };
const { Block, Blockchain } = require("./your-blockchain-file.js");

const JeChain = new Blockchain();
// Add a new block
JeChain.addBlock(new Block(Date.now().toString(), { from: "John", to: "Bob", amount: 100 }));
// (This is just a fun example, real cryptocurrencies often have some more steps to implement).

// Prints out the updated chain
console.log(JeChain.chain); 
```

It should look like this:

Image description

The first block is our genesis block, the second block is the added block.
