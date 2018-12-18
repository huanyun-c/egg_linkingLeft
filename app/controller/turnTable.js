'use strict';

const Controller = require('egg').Controller;
const crypto     = require('crypto');
let   md5        = function(str) {
	let crypto_md5 = crypto.createHash('md5');
	crypto_md5.update(str, 'utf8'); // 加入编码
	return crypto_md5.digest('hex');
}
const Token     = require('../public/keys/token.js');
let   sign_host = 'http://www.saintenjoy.top';

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
//号码解析
function Changephone(phone) {
	var a = phone;
	var f = a.substr(0, 3);
	var l = a.substr(7, 4);

	return f + "****" + l

}

function accAdd(arg1, arg2) {
	var r1, r2, m, c;
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
	c = Math.abs(r1 - r2);
	m = Math.pow(10, Math.max(r1, r2));
	if(c > 0) {
		var cm = Math.pow(10, c);
		if(r1 > r2) {
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
	return(arg1 + arg2) / m;
}

class TurntableController extends Controller {

	async run() {
		const ctx = this.ctx;
		//获取传参 
		const body = ctx.request.body;
		console.log(body)
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
		
		/**token开始**/
		//获取useridToken
		const Uhdid = ctx.cookies.get('LH_YH_0797Uhdid', {
        	signed : false,
        	encrypt: true
        });

        let UhdidOld = new Buffer(Uhdid, 'base64');
        let useridMi = UhdidOld.toString();

        //解密token和用户id
        let userid = private_key.decrypt(useridMi, 'utf8');

		/**token结束**/
		//查询用户信息，用户余额
		const userMsg   = await ctx.service.user.user(userid);
		const userAsset = await ctx.service.user.userAsset(userid);
		let   phone     = userMsg.user[0].phone_number;
		let   money     = userAsset.userAsset[0].money;
		let vtb_unlock = userAsset.userAsset[0].vtb_unlock;
		console.log(vtb_unlock);
		let vtbUnlock =accAdd(parseFloat(vtb_unlock),0.05);
		console.log(vtbUnlock);
		if(userMsg.user[0].level < 2) {
			ctx.body = {
				'res'   : 205,
				'resMsg': "白银以上才能参与转盘"
			};
			return;
		}
		if(userAsset.userAsset[0].vtb_active < 1 || userAsset.userAsset[0].vtb_active == null) {
			ctx.body = {
				'res'   : 204,
				'resMsg': "余额不足"
			};
			return;
		}
		//设置概率
		/*奖励	    概率	        概率/%	  奖励           id
		 *	1	      0.088399	   8.8399	   1元红包         8
		 *	5	      0.1	         10	       5元红包         7
		 *	10	    0.7	         70	       8元红包         6
		 *	20	    0.1	         10	       10元红包        5
		 *	50	    0.01	       1	       5个活力果       4
		 *	100	    0.001	       0.1	     80元红包        3
		 *	500	    0.0005	     0.05	     10个活力果      2
		 *	1000	  0.0001	     0.01	     100个活力果     1
		 *	10000	  0.000001	   0.0001	   iPhoneX        0
		 */
		var random = Math.random();
		let id;
		let lable;
		let number;
		if(random < 0)
			id = 0;
		else if(random < 0)
			id = 1;
		else if(random < 0)
			id = 2;
		else if(random < 0)
			id = 3
		else if(random < 0.02)
			id = 4;
		else if(random < 0.05)
			id = 5;
		else if(random < 0.1)
			id = 6;
		else if(random < 0.15)
			id = 7;
		else if(random < 1)
			id = 8;
		//通过id判断奖品类型

		switch(id) {
			case 0: 
				lable  = '1';
				number = 1;
				break;
			case 1: 
				lable  = '2';
				number = 100;
				break;
			case 2: 
				lable  = '2';
				number = 10;
				break;
			case 3: 
				lable  = '3';
				number = 80;
				break;
			case 4: 
				lable  = '2';
				number = 5;
				break;
			case 5: 
				lable  = '3';
				number = 10;
				break;
			case 6: 
				lable  = '3';
				number = 8;
				break;
			case 7: 
				lable  = '3';
				number = 5;
				break;
			case 8: 
				lable  = '3';
				number = 1;
				break;
		}
		//执行转盘操作,先计算数据 
		let   vitalityLast = parseFloat(userAsset.userAsset[0].vtb_active) - 1;
		const result       = await ctx.service.turnTable.run(userid, phone, lable, number, vitalityLast, money,vtbUnlock);

		if(result.success != true) {
			ctx.body = {
				'res'   : 202,
				'resMsg': "抽奖失败"
			};
			return;
		}

		//传给service端
		ctx.status = 200;
		ctx.body   = {
			'res'   : 200,
			'resMsg': "抽奖成功",
			data    : {
				id       : id,
				time     : nodetime,
				phone    : Changephone(phone),
				lastCount: parseInt(vitalityLast)
			}
		};

	}

	//查询用户的夺奖纪录
	async myGift() {
		const ctx = this.ctx;

		const myGift = await ctx.service.turnTable.myGift(ctx.params.id);

		if(myGift == undefined || myGift == null) {
			ctx.body = {
				'res'   : 201,
				'resMsg': '查询失败',
			}
			return;
		}

		//数据处理
		let lastGiftList = [];
		myGift.myGift.forEach(function(value, index, array) {
			//console.log(value);
			lastGiftList[index] = {
				lable : value.lable,
				number: value.number,
				unit  : value.lable == '1' ? 'iphoneX'         : (value.lable == '2' ? '活力果' : '红包'),
				number: value.lable == '1' ? value.number + '台': (value.lable == '2' ? value.number + '个' : value.number + '元'),
				status: value.status,
				time  : value.create_time
			}
		})

		ctx.status = 200;
		ctx.body   = {
			'res'   : 200,
			'resMsg': '查询成功',
			'data'  : {
				giftList: lastGiftList
			}
		}
	}
}

module.exports = TurntableController;