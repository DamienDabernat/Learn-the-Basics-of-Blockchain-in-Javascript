const crypto = require("crypto");
const Transaction = require("./Transaction");
const SHA256 = (data) => crypto.createHash("sha256").update(data).digest("hex");

class Block {

    /**
     * Set the difficulty to mine the block
     * The higher the difficulty is, the more difficult it is to mine the block
     * 0 mean the block is mined instantly
     * @returns {number}
     */
    static get difficulty() {
        return 3;
    }

    /**
     * The constructor of the block
     * @param {Array.<Transaction>} data should contain the transaction
     * @param {String} previousHash the hash of the previous block
     */
    constructor(data = null, previousHash = "") {
        this.timestamp = Date.now().toString(); // The time of the block creation
        this.data = data;
        this.previousHash = previousHash;
        this.hash = "";
        this.nonce = 0;
    }

    calculateHash() {
        return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce);
    }

    /**
     * Try to mine the block until it is mined
     * @returns {number} the time in second it took to mine the block
     */
    mine() {
        const startDate = new Date();

        while(!this.#mineOnce()) {
            this.#mineOnce()
        }

        console.log("Proof of work found ! ", this.hash);
        return (new Date().getTime() - startDate.getTime()) / 1000;
    }

    /**
     * Try to mine the block once
     * @returns {boolean} wherever the block is mined or not
     */
    #mineOnce() {
        this.hash = this.calculateHash();
        if(this.hash.substring(0, Block.difficulty) !== "0".repeat(Block.difficulty)) {
            this.nonce++;
            return false;
        }
        return true;
    }

    /**
     * This method will check if all the transactions are valid
     * @param {Blockchain} blockchain the blockchain to check
     * @return {boolean} the list of transactions that are not valid
     */
    #hasValidTransactions(blockchain) {

        let gas = 0, reward = 0;
        this.data.forEach(transaction => {
            if (transaction.from !== blockchain.MINT_PUBLIC_ADDRESS) {
                gas += transaction.gas;
            } else {
                reward = transaction.amount;
            }
        });

        return (
            reward - gas === blockchain.REWARD &&
            this.data.every(transaction => Transaction.isValid(transaction, blockchain, this)) &&
            this.data.filter(transaction => transaction.from === blockchain.MINT_PUBLIC_ADDRESS).length === 1
        );
    }

    /**
     * This method will check if the block is valid
     * @param {Blockchain} blockchain the blockchain to check
     * @returns {boolean} wherever the block is valid or not
     */
    isValid(blockchain) {
        if(this.previousHash === "") throw new Error("The previous hash is not set");
        if(!this.#hasValidTransactions(blockchain)) throw new Error("Transaction(s) are not valid");
        return this.hash.substring(0, Block.difficulty) === "0".repeat(Block.difficulty);
    }

}

module.exports = Block;