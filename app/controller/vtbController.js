'use strict';

const Controller = require('egg').Controller;
const crypto     = require('crypto');
//const Web3       = require('web3');
//const Tx         = require('ethereumjs-tx');

//const web3 = new Web3();
//创建ETH连接
//web3.setProvider(new web3.providers.HttpProvider('https://xxxxxxxxxxxxxxxxxxxxxxx'));//需要安装web3.js，测试的接口
//web3.setProvider(new web3.providers.HttpProvider('https://xxxxxxxxxxxxxxxxxxxxxxx'));
//合约地址和abi测试版本
//const contractAddress = '0x4f4ec57bfB53A71F43998Af2964AE65b42D18f36';
//const abi             = require('../public/keys/abi.js');

//const contractAddress = '0x76f6e0d0efe275ddb00f8563168e2dfeaa98ab54';
//const abi             = require('../public/keys/abiTrue.js');

//const contract = new web3.eth.Contract(abi, contractAddress);
let   md5      = function(str) {
	let crypto_md5 = crypto.createHash('md5');
	crypto_md5.update(str, 'utf8'); // 加入编码
	return crypto_md5.digest('hex');
}

let sign_host = 'http://www.saintenjoy.top';

const fs      = require('fs');
const NodeRSA = require('node-rsa');

let privatePem = fs.readFileSync('app/public/keys/rsa_private_key.pem').toString();

let publicPem = fs.readFileSync('app/public/keys/rsa_public_key.pem').toString();

let public_key = new NodeRSA(publicPem);

let private_key = new NodeRSA(privatePem);

public_key.setOptions({
	encryptionScheme: 'pkcs1'
});

private_key.setOptions({
	encryptionScheme: 'pkcs1'
});
const Token = require('../public/keys/token.js');
//md5签名
function signAA(param) {

	var array = new Array();
	for(var key in param) {
		array.push(key);
	}
	array.sort();

	// 拼接有序的参数名-值串
	var paramArray = new Array();

	for(var index in array) {
		var key = array[index];
		paramArray.push(key + '=' + param[key]);
	}

	var md5Source = paramArray.join("&");

	return md5Source;
}
//解析数据
function getMsgIWant(str) {
	var obj      = {};
	var queryArr = str.split("&");
	queryArr.forEach(function(item) {

		var value = item.split("=")[1];
		var key   = item.split("=")[0];
		obj[key]  = value;
	});
	return obj;
}

function curtail(arr) {
	var m = arr.slice(1);
	return m;
}

//减法
function accSub(arg1, arg2) {
	var r1, r2, m, n;
	try {
		r1 = arg1.toString().split(".")[1].length;
	} catch(e) {
		r1 = 0;
	}
	try {
		r2 = arg2.toString().split(".")[1].length;
	} catch(e) {
		r2 = 0;
	}
	m = Math.pow(10, Math.max(r1, r2));  //last modify by deeka //动态控制精度长度
	n = (r1 >= r2) ? r1 : r2;
	return((arg1 * m - arg2 * m) / m).toFixed(n);
}

class VtbController extends Controller {
	async vtb() {
		const {
			ctx
		} = this;

		/**token开始**/

		const user_id = ctx.query.content;

        //简单的转码
        let useridOld = new Buffer(user_id, 'base64');
        let useridNew = useridOld.toString();
        let userid    = private_key.decrypt(useridNew, 'utf8');
        //通过用户id获取token，存到cookies
        const redisToken = await this.app.redis.get(userid+'tokenKey');

        let redisTokenNew = public_key.encrypt(redisToken, 'base64');
       
		/**token结束**/
		
		//查询用户信息
		const userAsset = await ctx.service.user.userAsset(userid);
		const user      = await ctx.service.user.user(userid);
		//console.log(userAsset);
		if(userAsset.userAsset[0].vtb_status == 0) {
			//新建VTB账户
			let acountList = await web3.eth.accounts.create(web3.utils.randomHex(32));

			let account        = acountList.address;
			let accountPrivate = acountList.privateKey;
			//公钥
			let accountBase64 = new Buffer(account);
			let accountNew    = accountBase64.toString('base64');
			//私钥
			let accountPrivateBase64 = new Buffer(accountPrivate);
			let accountPrivateNew    = accountPrivateBase64.toString('base64');

			if(acountList != undefined) {
				//调用service
				const accountResult = await ctx.service.vtbService.newVtb(accountNew, accountPrivateNew, userid);

				if(accountResult.success == true) {
									
					 //设置cookies
					 ctx.cookies.set('LH_YH_0797facyenhxsdg',redisTokenNew,{
						httpOnly: true,   // 默认就是 true
						encrypt : true,   // 加密传输
					});
			
					ctx.cookies.set('LH_YH_0797Uhdid',user_id,{
						httpOnly: true,   // 默认就是 true
						encrypt : true,   // 加密传输
					});
					await ctx.render('vtb/index.ejs', {
						title          : '活力口袋',
						vtb_site       : acountList.address,
						vitality       : userAsset.userAsset[0].vtb_active,
						vitality_freeze: userAsset.userAsset[0].vtb_freeze,
						totalVitality  : parseFloat(userAsset.userAsset[0].vtb_active) + parseFloat(userAsset.userAsset[0].vtb_freeze),
						headImg        : user.user[0].head_url
					});

					return

				}
			}
		}
		//base64转码
		let accountOld = new Buffer(userAsset.userAsset[0].vtb_address, 'base64');
		let newaccount = accountOld.toString();
		
		//设置cookies
		 //设置cookies
		 ctx.cookies.set('LH_YH_0797facyenhxsdg',redisTokenNew,{
        	httpOnly: true,   // 默认就是 true
        	encrypt : true,   // 加密传输
        });

        ctx.cookies.set('LH_YH_0797Uhdid',user_id,{
        	httpOnly: true,   // 默认就是 true
        	encrypt : true,   // 加密传输
        });
		
		await ctx.render('vtb/index.ejs', {
			title          : '活力口袋',
			vtb_site       : newaccount,
			vitality       : userAsset.userAsset[0].vtb_active,
			vitality_freeze: userAsset.userAsset[0].vtb_freeze,
			totalVitality  : parseFloat(userAsset.userAsset[0].vtb_active) + parseFloat(userAsset.userAsset[0].vtb_freeze),
			headImg        : user.user[0].head_url
		});
	}

	async tixian() {
		const {
			ctx
		} = this;
		// ctx.redirect('/weihu');
        
        // return
		await ctx.render('vtb/tixian.ejs', {
			title: '提现'
		});
	}

	async newToken(){
		const {
			ctx
		} = this;
		let acountList = await web3.eth.accounts.create(web3.utils.randomHex(32));

		let account        = acountList.address;
		let accountPrivate = acountList.privateKey;

		ctx.body = {
			'res'   : 200,
			'resMsg': "成功",
			'data'  : {
				account       : account,
				accountPrivate: accountPrivate
			}
		};
		return;

	}
	async vtbWithDraw() {
		const ctx = this.ctx;
		//获取传参 
		const body = ctx.request.body;

		let nodetime = new Date().getTime();
		let time     = body.timeStamp;
		let noncestr = body.noncestr;
		let sign     = body.sign;
		let content  = body.content;

		let param = {
			timeStamp: time,
			noncestr : noncestr,
			signHost : sign_host
		};

		//先验证时间
		if((parseInt(nodetime) - parseInt(time)) / 1000 > 2) {
			ctx.body = {
				'res'   : 203,
				'resMsg': "验证超时"
			};
			return;
		}

		var NodeSign = md5(signAA(param)).toUpperCase();
		//console.log(NodeSign)
		//console.log(sign)
		if(NodeSign != sign) {
			ctx.body = {
				'res'   : 202,
				'resMsg': "签名错误"
			};
			return;
		}

		//获取useridToken
        const Uhdid = ctx.cookies.get('LH_YH_0797Uhdid', {
        	signed : false,
        	encrypt: true
        });

        let UhdidOld = new Buffer(Uhdid, 'base64');
        let useridMi = UhdidOld.toString();
        console.log(useridMi);
        //解密token和用户id
        let userid = private_key.decrypt(useridMi, 'utf8');
		//解析数据
		let decrypted = private_key.decrypt(content, 'utf8');
		let Iwant     = getMsgIWant(decrypted);

		//const userid = Iwant.userid;
		const toAddress = Iwant.toAddress;
		const num       = Iwant.num;
		let   shiji     = accSub(num, 0.5);
		const psw       = Iwant.psw;

		const pswMiwen = md5(userid + psw);

		const userAsset = await ctx.service.user.userAsset(userid);
		//数据库的密码
		const password    = userAsset.userAsset[0].pay_password;
		const vitality    = userAsset.userAsset[0].vtb_active;
		const vtb_address = userAsset.userAsset[0].vtb_address;
		let   accountOld  = new Buffer(vtb_address, 'base64');
		let   newaccount  = accountOld.toString();

		if(pswMiwen != password) {
			ctx.body = {
				'res'   : 202,
				'resMsg': "密码错误"
			};
			return;
		}

		if(num > vitality) {
			ctx.body = {
				'res'   : 204,
				'resMsg': "活力果不足"
			};
			return;
		}

		//const signVtb = await ctx.service.vtbService.sendVtb('0xD6FAF3A4EB8693AB98FD1CD01835B24A531FD26F341DEBDFF9248F5F3E990ACB', toAddress, shiji);

		//const hash = await ctx.service.vtbService.sendSignedTransaction('0xD6FAF3A4EB8693AB98FD1CD01835B24A531FD26F341DEBDFF9248F5F3E990ACB',signVtb);

		const signVtb = await ctx.service.vtbService.sendVtb('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', toAddress, shiji);//通过私钥转账
 
		const hash = await ctx.service.vtbService.sendSignedTransaction('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',signVtb);//通过私钥转账
		//更新用户余额
		const newYue = accSub(vitality, num);
		const result = await ctx.service.user.updateUser(userid, newYue);
		if(result.success == true) {

			const countObj = await ctx.service.vtbService.getOrderNum();

			const ext = {
				fromAddress: '公账',
				toAddress  : toAddress,
				hash       : hash.hash.transactionHash
			}
			//添加订单记录
			const result = await ctx.service.vtbService.addjilu(userid,null, num,4, countObj[0].blockNum,JSON.stringify(ext),'用户VTB提现');
			
			if(result.success != true){
				ctx.body = {
					'res'   : 202,
					'resMsg': "提交失败"
				};
			}
			
			ctx.body = {
				'res'   : 200,
				'resMsg': "提交成功"
			};
		}

	}
}

module.exports = VtbController;