const Service = require('egg').Service;

//const Web3 = require('web3');
//const Tx   = require('ethereumjs-tx');

//const web3 = new Web3();
//创建ETH连接
//web3.setProvider(new web3.providers.HttpProvider('https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'));
//web3.setProvider(new web3.providers.HttpProvider('https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'));
//合约地址和abi测试版本
//const contractAddress = '0x4f4ec57bfB53A71F43998Af2964AE65b42D18f36';
//const abi             = require('../public/keys/abi.js');

//const contractAddress = '0x76f6e0d0efe275ddb00f8563168e2dfeaa98ab54';
//const abi             = require('../public/keys/abiTrue.js');

//const contract = new web3.eth.Contract(abi, contractAddress);


function getOrderNo(count, time) {

    return time + '000' + count;

}

function Changetime(value) {

    let date = new Date(value);  //时间戳为10位需*1000，时间戳为13位的话不需乘1000

    let Y = date.getFullYear().toString();
    let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1).toString() : date.getMonth() + 1).toString();
    let D = parseInt(date.getDate()) < 10 ? '0' + date.getDate().toString() : date.getDate().toString();
    let h = parseInt(date.getHours()) < 10 ? '0' + date.getHours().toString() : date.getHours().toString();
    let m = parseInt(date.getMinutes()) < 10 ? '0' + date.getMinutes().toString() : date.getMinutes().toString();
    let s = parseInt(date.getSeconds()) < 10 ? '0' + date.getSeconds().toString() : date.getSeconds().toString();
    return Y + M + D + h + m + s;
}
class VtbService extends Service {

    async newVtb(vtb_address, vtb_private_key, userid) {
        const row = {
            vtb_address    : vtb_address,
            vtb_private_key: vtb_private_key,
            vtb_status     : 1
        };

        const options = {
            where: {
                user_id: userid
            }
        };
        const result = await this.app.mysql.update('user_asset', row, options);

        if (result.affectedRows != 1) {
            return {
                success: false
            };
        }

        return {
            success: true
        };
    }
    //代币转账
    async sendVtb(privateKey, name, amount) {
        let account = web3.eth.accounts.privateKeyToAccount(privateKey.indexOf('0x') === 0 ? privateKey : '0x' + privateKey);
        //正式环境chainId=1,测试为3
//      const parameter = {
//          from   : account.address,
//          chainId: 3,
//          to     : contractAddress
//      };
        
        const parameter = {
            from   : account.address,
            chainId: 1,
            to     : contractAddress
        };

        let amountNew = web3.utils.toWei(amount, 'ether');

        parameter.data = contract.methods.transfer(name, amountNew).encodeABI();

        const sign = await web3.eth.estimateGas(parameter).then(function (gasLimit) {
            parameter.gasLimit = web3.utils.toHex(gasLimit);
            return web3.eth.getGasPrice()
        })
            .then(function (gasPrice) {
                parameter.gasPrice = web3.utils.toHex(gasPrice);

                return web3.eth.getTransactionCount(account.address)
            })
            .then(function (count) {
                parameter.nonce = count;

                let transaction = new Tx(parameter);

                return transaction;
               

            })
            .catch(function (error) {
                console.log(error)
            })


        return sign;
    }
    async sendSignedTransaction(privateKey, transaction) {
        let account = web3.eth.accounts.privateKeyToAccount(privateKey.indexOf('0x') === 0 ? privateKey : '0x' + privateKey);
        transaction.sign(Buffer.from(account.privateKey.replace('0x', ''), 'hex'));
        console.log("103" + transaction)
        const hash = await web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'))
            .on('transactionHash', function (hash) {
                console.info('transactionHash', 'https://etherscan.io/tx/' + hash);

                return hash

            })
            .on('receipt', function (receipt) {
                console.info('receipt', receipt);
            })
            .on('confirmation', function (confirmationNumber, receipt) {
                console.info('confirmation', confirmationNumber, receipt);
            })
            .on('error', console.error);

        return { hash };
    }
    async getRechargeList(userid, type) {
        const rechargeList = await this.app.mysql.select('orders', {
            where: {
                income_user_id: userid,
                order_type    : type
            },
            orders: [
                ['create_time', 'desc']
            ],
            limit: 30
        });
        return {
            rechargeList
        };
    }

    async getwidthDrawList(userid, type) {
        const widthDrawList = await this.app.mysql.select('orders', {
            where: {
                expend_user_id: userid,
                order_type    : type
            },
            orders: [
                ['create_time', 'desc']
            ],
            limit: 30
        });
        return {
            widthDrawList
        };
    }

    async getBlockNum() {
        const blockNum = await web3.eth.getBlockNumber().then(function (num) {
            return num;
        });
        return blockNum;
    }

    async getBlockNumSelf() {
        const BlockNumSelf = await this.app.mysql.select('blocknum', {
            where: {
                id: 1
            }
        })

        return BlockNumSelf;
    }

    async transferEvent(oldBlockNum, blockNum) {
        const events = await contract.getPastEvents('Transfer', {
            fromBlock: oldBlockNum,
            toBlock  : blockNum
        }, function (error, event) {
            console.log('成功');
        })
            .then(function (events) {
                return events;
            })
            .catch(function (err) {
                console.log(err)
            })

        return events
    }

    async allAccounts() {
        const allAccounts = await web3.eth.getAccounts().then(function (list) {
            return list;
        });
        return allAccounts;
    }

    async updateBlockNum(blockNum) {
        const row = {
            blockNum: blockNum
        };

        const options = {
            where: {
                id: 1
            }
        };
        const result = await this.app.mysql.update('blockNum', row, options);

        if (result.affectedRows != 1) {
            return {
                success: false
            };
        }

        return {
            success: true
        };
    }

    async addjilu(userid, userid_to, number, type, count, ext,remarkes) {
        const changeTime = new Date();
        let   myDate     = new Date().getTime();
        let   time       = Changetime(myDate);


        let insertValue = {
            order_no      : getOrderNo(count, time),
            expend_user_id: userid,
            income_user_id: userid_to,
            total_number  : 1,
            order_status  : '3',
            total_money   : number,
            order_type    : type,
            create_time   : changeTime,
            finish_time   : changeTime,
            order_unit    : 0,
            ext           : ext,
            remarks:remarkes
        };

        const result = await this.app.mysql.insert('orders', insertValue);

        if (result.affectedRows != 1) {
            return {
                success: false
            };
        }

        return {
            success: true
        };
    }

    async getOrderNum() {
        const count = await this.app.mysql.select('blockNum', {
            where: {
                id: 2
            }
        });

        return count;
    }

    async updateOrderNum(blockNum) {
        const result = await this.app.mysql.update('blockNum',
        {
            blockNum: blockNum
        }
        , {
            where: {
                id: 2
            }
        });

        if (result.affectedRows != 1) {
            return {
                success: false
            };
        }

        return {
            success: true
        };
    }
}

module.exports = VtbService;