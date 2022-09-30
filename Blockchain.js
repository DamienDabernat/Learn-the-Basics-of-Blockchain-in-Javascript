const Transaction = require("./Transaction");
const Block = require("./Block");
const Elliptic = require('elliptic').ec, Secp256k1 = new Elliptic('secp256k1');

/**
 * This class represent a blockchain
 */
class Blockchain {

    /**
     * Set the amount of money to reward the miner
     * @returns {number}
     */
    static get REWARD() {
        return 1;
    }

    /**
     * Get the current difficulty
     * @returns {number}
     */
    static get DIFFICULTY() {
        return Block.difficulty;
    }

    constructor() {
        this.REWARD = Blockchain.REWARD;
        this.MINT_KEY_PAIR =  Secp256k1.genKeyPair();
        this.MINT_PUBLIC_ADDRESS = this.MINT_KEY_PAIR.getPublic('hex');

        // The genesis block of the blockchain is the first block.
        const genesisBlock = new Block([]); // We create the genesis block.
        genesisBlock.hash = genesisBlock.calculateHash(); // We calculate the hash of the block.

        // Object.freeze() ensures that the block cannot be modified.
        Object.freeze(genesisBlock);

        this.chain = [genesisBlock]; // This property will contain all the blocks.

        this.mempool = []; // This property will contain the transactions pool.
    }

    /**
     * This method will try to add a new mined block to the chain.
     * @param {Block} block the block to add
     * @returns {boolean} wherever the block is added or not (valid or not)
     */
    addBlock(block) {
        // We check if the block is valid and if the blockchain is valid.
        if(!block.isValid(this)) {
            throw new Error("The block is not valid");
        }

        if(!this.isValid()) {
            throw new Error("The blockchain is not valid");
        }

        this.chain.push(Object.freeze(block));
        return true;
    }

    /**
     * Add a transaction to the transactions pool.
     * @param {Transaction} transaction the transaction to add
     */
    addTransaction(transaction) {
        if(Transaction.isValid(transaction, this, this.getLastBlock())) {
            this.mempool.push(transaction);
        } else {
            throw new Error("Invalid transaction");
        }
    }

    /**
     * This method will try to mine a new block.
     * @returns {Number} the number of second to mine block
     */
    mine(rewardAddress) {

        // We calculate the total amount of money to give to the miner from the transaction pool (the mempool).
        let gas = 0;
        this.mempool.forEach(transaction => {
            gas += transaction.gas;
        });

        // We reward the miner with the amount of money defined in the reward property.
        // This is called : minting coins.
        const rewardTransaction = new Transaction(this, this.MINT_PUBLIC_ADDRESS, rewardAddress, Blockchain.REWARD + gas);
        // We sign the transaction with the private key of the minting coin address.
        rewardTransaction.sign(this.MINT_KEY_PAIR);

        const block = new Block([rewardTransaction, ...this.mempool], this.getLastBlock().hash);

        const timeToMine = block.mine(); // We mine the block.
        this.addBlock(block);
        this.mempool = [];
        return timeToMine;
    }

    /**
     * This method will return the last block of the blockchain.
     * @returns {Block} the last block of the blockchain
     */
    getLastBlock() {
        return this.chain[this.chain.length - 1];
    }

    /**
     * This method will return the balance of the given address.
     * @param address the address to check
     * @param untilThisBlock the last block to check the balance
     * @returns {number} the balance of the given address
     */
    getBalanceOfAddress(address, untilThisBlock = this.getLastBlock()) {
        let balance = 0;

        // We loop through all the blocks of the blockchain.
        for(let i = 0; i < this.chain.length; i++) {
            const _block = this.chain[i];

            // We loop through all the transactions of the block.
            for(let j = 0; j < _block.data.length; j++) {
                const _transaction = _block.data[j];

                // If the transaction is made from the address, we subtract the amount from the balance and the gas fee.
                if(_transaction.from === address) {
                    balance -= _transaction.amount;
                    balance -= _transaction.gas;
                }

                // If the transaction is made to the address, we add the amount to the balance.
                if(_transaction.to === address) {
                    balance += _transaction.amount;
                }
            }

            // If the block is the block we want to reach, we stop the loop.
            if(_block.hash === untilThisBlock.hash) {
                return this.precisionRoundMod(balance, 2);
            }
        }

        return this.precisionRoundMod(balance, 2);
    }

    /**
     * Check if the blockchain is valid.
     * Check if the hash of the current block is correct and if the previous block is correct.
     * If not, the blockchain is not valid.
     * @returns {boolean}
     */
    isValid() {
        for(let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // Check if the hash of the current block is correct and if the previous block is correct.
            // If not, the blockchain is not valid.
            if(currentBlock.hash !== currentBlock.calculateHash()
                || currentBlock.previousHash !== previousBlock.hash
                || !currentBlock.isValid(this)) {
                return false;
            }
        }

        return true;
    }

    /**
     * See : https://stackoverflow.com/a/49729715
     * @param number
     * @param precision
     * @returns {number}
     */
    precisionRoundMod(number, precision) {
        let factor = Math.pow(10, precision);
        let n = precision < 0 ? number : 0.01 / factor + number;
        return Math.round( n * factor) / factor;
    }
}

module.exports = Blockchain;