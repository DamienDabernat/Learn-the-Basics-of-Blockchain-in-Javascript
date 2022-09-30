const Elliptic = require('elliptic').ec, Secp256k1 = new Elliptic('secp256k1');
const Transaction = require('./Transaction');
const Blockchain = require('./Blockchain');

const express = require('express')
const bodyParser = require("body-parser");

const app = express()
const port = 3000

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set('view engine', 'ejs')

app.listen(port, () => {
    const localIp = require('ip').address()
    console.log(`Example app listening at http://${localIp}:${port}`)
})

app.use(express.static(__dirname + '/public'));

const blockchain = new Blockchain();

const myWallet = Secp256k1.genKeyPair();

const othersWalletsList = [Secp256k1.genKeyPair().getPublic("hex"), Secp256k1.genKeyPair().getPublic("hex"), Secp256k1.genKeyPair().getPublic("hex")];

console.log("---\nInformation : The current reward to mine a block is : " + Blockchain.REWARD);
console.log("The minting public wallet is : " + blockchain.MINT_PUBLIC_ADDRESS);
console.log("The current difficulty is : " + Blockchain.DIFFICULTY);

app.get('/', (req, res) => {
    res.render('pages/index', {
        blockchain: blockchain,
        myWallet: myWallet.getPublic("hex"),
        coins: blockchain.getBalanceOfAddress(myWallet.getPublic("hex")),
        publicWallet: blockchain.MINT_PUBLIC_ADDRESS,
        othersWalletsList: othersWalletsList,
        slice: -12
    })
})

app.get('/mine', (req, res) => {
    blockchain.mine(myWallet.getPublic('hex'))
    res.redirect('/');
})

app.post('/transaction', function(req, res) {
    const from = req.body.from;
    const to = req.body.to;
    const amount = parseFloat(req.body.amount);

    // Create a transaction
    const transaction = new Transaction(blockchain, from, to, amount);
    // Sign the transaction
    transaction.sign(myWallet);
    // Add transaction to pool
    blockchain.addTransaction(transaction);

    res.redirect('/');
});

