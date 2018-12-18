'use strict';

const Controller = require('egg').Controller;
const crypto     = require('crypto');
let   md5        = function (str) {
    let crypto_md5 = crypto.createHash('md5');
    crypto_md5.update(str, 'utf8'); // 加入编码
    return crypto_md5.digest('hex');
}
const Token     = require('../public/keys/token.js');
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

//md5签名
function signAA(param) {

    var array = new Array();
    for (var key in param) {
        array.push(key);
    }
    array.sort();

    // 拼接有序的参数名-值串
    var paramArray = new Array();

    for (var index in array) {
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
    queryArr.forEach(function (item) {

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


class TurntableHlgController extends Controller {
    async index() {
        const ctx = this.ctx;

        const lucklyList = await ctx.service.turnTableHlg.lucklyList();

        if (lucklyList == undefined || lucklyList == null) {
            ctx.body = {
                'res'   : 201,
                'resMsg': '查询失败',
            }
            return;
        }
        //数据处理
        let giftList = [];
        lucklyList.luckList.forEach(function (value, index, array) {

            giftList[index] = {
                lable : value.lable,
                number: value.number,
                gift  : '活力果',
                unit  : value.number + '个',
                status: value.status,
                time  : value.create_time,
                phone : Changephone(value.phone_number)
            }
        })

        ctx.status = 200;
        ctx.body   = {
            'res'   : 200,
            'resMsg': '查询成功',
            'data'  : {
                giftList: giftList
            }
        }

    }

    async run() {
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
        if ((parseInt(nodetime) - parseInt(time)) / 1000 > 2) {
            ctx.body = {
                'res'   : 203,
                'resMsg': "验证超时"
            };
            return;
        }

        var NodeSign = md5(signAA(param)).toUpperCase();
        //console.log(NodeSign)
        //console.log(sign)
        if (NodeSign != sign) {
            ctx.body = {
                'res'   : 202,
                'resMsg': "签名错误"
            };
            return;
        }
       
        /**token结束**/
        //获取useridToken
		const Uhdid = ctx.cookies.get('LH_YH_0797Uhdid', {
        	signed : false,
        	encrypt: true
        });

        let UhdidOld = new Buffer(Uhdid, 'base64');
        let useridMi = UhdidOld.toString();

        //解密token和用户id
        let userid = private_key.decrypt(useridMi, 'utf8');

        //查询用户信息，用户余额
        const userMsg   = await ctx.service.user.user(userid);
        const userAsset = await ctx.service.user.userAsset(userid);
        let   phone     = userMsg.user[0].phone_number;
        let vtb_unlock = userAsset.userAsset[0].vtb_unlock;
		
		let vtbUnlock =accAdd(parseFloat(vtb_unlock),0.05);
		
        if (userMsg.user[0].level < 2) {
            ctx.body = {
                'res'   : 205,
                'resMSg': "白银以上才能参与转盘"
            };
            return;
        }
        if (parseFloat(userAsset.userAsset[0].vtb_active) < 20 || userAsset.userAsset[0].vtb_active == null) {
            ctx.body = {
                'res'   : 204,
                'resMSg': "活力果不足20"
            };
            return false;
        }
        //设置概率
        /*奖励	    概率	          概率/%	  id
         *	-2	    0.21	          21	     7      
         *	+2	    0.19	          19	     6       
         *	-5	    0.1575	          15.75	     5     
         *	+5	    0.1425	          14.25	     4    
         *	-10	    0.105	          10.5	     3        
         *	+10	    0.095	          9.5	     2  
         *	-20	    0.0525	          5.25	     1    
         *	+20	    0.0475	          4.75	     0							 
         */
        let id;
        let lable;
        let number;
        var random = Math.random();

        if (random < 0.02) {
            id     = "0";
            lable  = '1';
            number = 20;
        } else if (random < 0.1) {
            id     = "1";
            lable  = '2';
            number = 20;
        } else if (random < 0.18) {
            id     = "2";
            lable  = '1';
            number = 10;
        } else if (random < 0.3) {
            id     = "3";
            lable  = '2';
            number = 10;
        } else if (random < 0.435) {
            id     = "4";
            lable  = '1';
            number = 5;
        } else if (random < 0.6) {
            id     = "5";
            lable  = '2';
            number = 5;
        } else if (random < 0.78) {
            id     = "6";
            lable  = '1';
            number = 2;
        } else if (random < 1) {
            id     = "7";
            lable  = '2';
            number = 2;
        }
       
        //执行转盘操作,先计算数据 
        let lastVitality;
        if (lable == '1') {
            lastVitality = parseFloat(userAsset.userAsset[0].vtb_active) + parseInt(number);
        } else if (lable == '2') {
            lastVitality = parseFloat(userAsset.userAsset[0].vtb_active) - parseInt(number);
        }

        let beforeVitality = parseFloat(userAsset.userAsset[0].vtb_active);
        console.log(lastVitality)

        const result = await ctx.service.turnTableHlg.run(userid, phone, lable, number, lastVitality, beforeVitality,vtbUnlock);

        if (result.success != true) {
            ctx.body = {
                'res'   : 202,
                'resMSg': "抽奖失败"
            };
            return;
        }
        //传给service端
        ctx.status = 200;
        ctx.body   = {
            'res'   : 200,
            'resMSg': "抽奖成功",
            'data'  : {
                id   : id,
                time : nodetime,
                count: parseInt(lastVitality)
            }
        };

    }

    //查询用户的夺奖纪录
    async myGift() {
        const ctx = this.ctx;

        const myGift = await ctx.service.turnTableHlg.myGift(ctx.params.id);

        if (myGift == undefined || myGift == null) {
            ctx.body = {
                'res'   : 201,
                'resMsg': '查询失败',
            }
            return;
        }

        //数据处理
        let giftList = [];
        lucklyList.luckList.forEach(function (value, index, array) {

            giftList[index] = {
                lable : value.lable,
                number: value.number,
                gift  : '活力果',
                unit  : value.number + '个',
                status: value.status,
                time  : value.create_time,
                phone : Changephone(value.phone_number)
            }
        })

        ctx.status = 200;
        ctx.body   = {
            'res'   : 200,
            'resMsg': '查询成功',
            'data'  : {
                giftList: giftList
            }
        }
    }
}

module.exports = TurntableHlgController;