const crypto = require("crypto");
const Elliptic = require('elliptic').ec, Secp256k1 = new Elliptic('secp256k1');
const SHA256 = (data) => crypto.createHash("sha256").update(data).digest("hex");

/**
 * This class represent a transaction
 */
class Transaction {

    /**
     * The constructor of the transaction
     * @param {Blockchain} blockchain the blockchain where the transaction is
     * @param {string} from the sender of the transaction
     * @param {string} to the receiver of the transaction
     * @param {number} amount the amount of the transaction
     * @param {number} gas the gas fee of the transaction
     * @param {string} smartContract the smart contract of the transaction (or an nft ;-) )
     */
    constructor(blockchain, from, to, amount, gas = 0.1, smartContract = null) {
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.signature = "";
        this.smartContract = smartContract;

        if(from === blockchain.MINT_PUBLIC_ADDRESS) {
            this.gas = 0;
        } else if(this.gas < 0.1) {
            throw new Error("The gas fee must be at least 0.1");
        } else {
            this.gas = gas;
        }
    }

    sign(keyPair) {
        if(keyPair.getPublic('hex') === this.from) {
            this.signature = keyPair.sign(SHA256(this.from + this.to + this.amount + this.gas), 'base64').toDER('hex');
        } else {
            throw new Error("The key pair is not the sender of the transaction");
        }
    }

    /**
     * Check if the transaction is valid if :
     * - From, to, amount and signature are not empty
     * - The sender has enough money or this is a mining transaction
     * - The receiver is not the sender
     * - The signature is valid
     * @param {Transaction} transaction the transaction to check
     * @param {Blockchain} blockchain the blockchain to check
     * @param {Block} block the current block to check
     * @returns {boolean} wherever the transaction is valid or not
     */
    static isValid(transaction, blockchain, block) {

        if(!transaction.from || !transaction.to || transaction.amount < 0 || !transaction.signature) {
            throw new Error("The transaction has an empty field" + JSON.stringify(transaction));
        }

        if(transaction.from === transaction.to) {
            throw new Error("The transaction is not valid : the sender and the receiver are the same");
        }

        //If the transaction is not a minting transaction, we check if the sender has enough money
        if(transaction.from !== blockchain.MINT_PUBLIC_ADDRESS) {
            let amountToRemove = parseFloat(transaction.amount) + parseFloat(transaction.gas);
            if(blockchain.getBalanceOfAddress(transaction.from, block) < amountToRemove) {
                throw new Error("The transaction is not valid : the sender " + transaction.from.slice(transaction.from.length - 4) + " has not enough money" +
                    " the sender has " + blockchain.getBalanceOfAddress(transaction.from, block) + " he wants to send " + amountToRemove + " (" + transaction.gas + " of gas fee).");
            }
        }

        if(!Secp256k1.keyFromPublic(transaction.from, 'hex').verify(SHA256(transaction.from + transaction.to + transaction.amount + transaction.gas), transaction.signature)) {
            throw new Error("The transaction is not valid : the signature is not valid");
        }

        return true;
    }
}

module.exports = Transaction;