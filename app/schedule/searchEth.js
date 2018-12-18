const Web3 = require('web3');
const Tx = require('ethereumjs-tx');

const web3 = new Web3();
//创建ETH连接
//web3.setProvider(new web3.providers.HttpProvider('https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'));
web3.setProvider(new web3.providers.HttpProvider('https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'));
//合约地址和abi测试版本
//const contractAddress = '0x4f4ec57bfB53A71F43998Af2964AE65b42D18f36';
//const abi             = require('../public/keys/abi.js');

const contractAddress = '0x76f6e0d0efe275ddb00f8563168e2dfeaa98ab54';
const abi             = require('../public/keys/abiTrue.js');

const contract = new web3.eth.Contract(abi, contractAddress);

//加法
function accAdd(arg1, arg2) {
    var r1, r2, m, c;
    try {
        r1 = arg1.toString().split(".")[1].length;
    } catch (e) {
        r1 = 0;
    }
    try {
        r2 = arg2.toString().split(".")[1].length;
    } catch (e) {
        r2 = 0;
    }
    c = Math.abs(r1 - r2);
    m = Math.pow(10, Math.max(r1, r2));
    if (c > 0) {
        var cm = Math.pow(10, c);
        if (r1 > r2) {
            arg1 = Number(arg1.toString().replace(".", ""));
            arg2 = Number(arg2.toString().replace(".", "")) * cm;
        } else {
            arg1 = Number(arg1.toString().replace(".", "")) * cm;
            arg2 = Number(arg2.toString().replace(".", ""));
        }
    } else {
        arg1 = Number(arg1.toString().replace(".", ""));
        arg2 = Number(arg2.toString().replace(".", ""));
    }
    return (arg1 + arg2) / m;
}

module.exports = {
    schedule: {
        interval : '3m',       // 5 分钟间隔
        type     : 'worker',   // 指定所有的 worker 都需要执行
        immediate: false
    },
    async task(ctx) {
        //获取最新的区块高度
        const blockNum = await ctx.service.vtbService.getBlockNum();
        console.log(blockNum)
        //获取数据库的区块高度
        const blockNumSelf = await ctx.service.vtbService.getBlockNumSelf();
        console.log(blockNumSelf)

        //调用查询合约转账事件方法
        const transferList = await ctx.service.vtbService.transferEvent(blockNumSelf[0].blockNum, blockNum);
        //区块之间没有交易记录，为空，直接退出
        if (transferList.length == 0) {

            //更新区块高度
            const blockResult = await ctx.service.vtbService.updateBlockNum(blockNum);
            
            if (blockResult.success == true) {
                console.log('更新区块高度成功');
            }
            return
        }

        //获取公司所有的账户列表
        const userAddress = await ctx.service.user.userAddress();
        console.log(userAddress)
        let newUserAddress = [];
        userAddress.forEach(function (value, index, array) {
            // console.log(value);
            if (value.vtb_address != null) {
                let vtbAdressOld = new Buffer(value.vtb_address, 'base64');
                let vtbAdress    = vtbAdressOld.toString();
                newUserAddress.push(vtbAdress);
            }

        })

        if (newUserAddress.length != 0) {
        	//闭包循环取值
            (async function queryBlock(i) {
                if (i == transferList.length) {
                    return false
                }

                let transactionHash = transferList[i].transactionHash;
                let result          = transferList[i].returnValues;

                let fromPerson = result.from;
                let toAddress  = result.to;
                let value      = result.value;
                let nodeTime   = new Date();

                if (newUserAddress.indexOf(toAddress) != -1) {
                    const amount          = web3.utils.fromWei(value, 'ether');
                    let   toAddressBase64 = new Buffer(toAddress);
                    let   newToAddress    = toAddressBase64.toString('base64');
                    const userMsg         = await ctx.service.user.userAssetForAddress(newToAddress);
                    //用户的余额，用户的id
                    let personVitality = userMsg[0].vtb_active;
                    let userid         = userMsg[0].user_id;

                    let lastVitality = personVitality + parseFloat(amount);
                    //执行转账操作
                    const result = await ctx.service.user.updateUserForAddress(newToAddress, lastVitality);
                    //更新用户账户成功
                    if (result.success != true) {
                        ctx.logger.error(new Error('更新用户账户失败' + nodeTime));
                    }
                    //执行更新区块高度
                    const blockResult = await ctx.service.vtbService.updateBlockNum(blockNum);
                    if (blockResult.success == true) {
                        console.log('更新区块高度成功22');

                        const countObj = await ctx.service.vtbService.getOrderNum();

                        const ext = {
                            fromAddress: fromPerson,
                            toAddress  : toAddress,
                            hash       : transactionHash
                        }

                        const result = await ctx.service.vtbService.addjilu(null, userid, amount, 5, countObj[0].blockNum,JSON.stringify(ext),'用户VTB充值');

                        const result2 = await ctx.service.vtbService.updateOrderNum(countObj[0].blockNum + 1 );

                        if(result2.success == true ){
                            queryBlock(++i);
                        }
                        
                    }
                }

            })(0)
        }


    }
};