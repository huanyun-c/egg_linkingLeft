'use strict';

const Controller = require('egg').Controller;
const crypto     = require('crypto');
let   md5        = function (str) {
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

function curtail(arr) {
  var m = arr.slice(1);
  return m;
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


class guessNumController extends Controller {
  //获取公钥和时间
  async publicKey() {
    const ctx = this.ctx;

    let nodeTime = new Date().getTime();

    ctx.body = {
      'res'   : 200,
      'resMsg': '查询成功',
      'data'  : {
        publicKey: publicPem,
        nodeTime : nodeTime
      }
    }
  }

  async nodeTime() {
    const ctx       = this.ctx;
    let   nodeTime  = new Date().getTime();
    const indexList = await ctx.service.guessNum.indexList();

    if (indexList.indexList.length == 0) {
      ctx.body = {
        'res'   : 202,
        'resMsg': '查询失败',
        'data'  : {
          time: nodeTime
        }
      }

      return;
    }

    ctx.body = {
      'res'   : 200,
      'resMsg': '查询成功',
      'data'  : {
        publicKey: publicPem,
        nodeTime : nodeTime,
        startTime: indexList.indexList[0].startTime,
        endTime  : indexList.indexList[0].endTime
      }
    }
  }

  async index() {
    let   nodeTime = new Date().getTime();
    const ctx      = this.ctx;

    const indexList = await ctx.service.guessNum.indexList();

    console.log(indexList)

    if (indexList == undefined || indexList == null) {
      ctx.body = {
        'res'   : 201,
        'resMsg': '查询失败',
        'data'  : {
          time: nodeTime
        }
      }
      return;
    }

    //数据处理
    let giftList = [];
    indexList.indexList.forEach(function (value, index, array) {

      giftList[index] = {
        lable   : value.number_label,
        number  : value.luckly_number,
        bigSmall: value.big_small,
        buyId   : value.buy_id
      }
    })

    ctx.status = 200;
    ctx.body   = {
      'res'   : 200,
      'resMsg': '查询成功',
      'data'  : {
        time    : nodeTime,
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
    if((parseInt(nodetime) - parseInt(time)) / 1000  > 2 ){
      ctx.body = {
        'res'   : 203,
        'resMsg': "验证超时"
      };
      return;
    }

    var NodeSign = md5(signAA(param)).toUpperCase();

    if (NodeSign != sign) {
      ctx.body = {
        'res'   : 202,
        'resMsg': "签名错误"
      };
      return;
    }
		/**token开始**/
		//获取useridToken
		// const useridToken = ctx.cookies.get('LH_YH_0797facyenhxsdg', {
		// 	signed : false,
		// 	encrypt: true
		// });

		// if(useridToken == undefined || useridToken == null || useridToken == '') {
		// 	ctx.body = {
		// 		'res'   : 202,
		// 		'resMsg': "请重新进入页面"
		// 	};
		// 	return;
		// }
		// //验证是否过期
		// if(!Token.checkToken(useridToken)) {
		// 	ctx.body = {
		// 		'res'   : 202,
		// 		'resMsg': "抽奖失败"
		// 	};
		// 	return;
		// };

		// //解析用户id
		// let useridBox = Token.decodeToken(useridToken);

		// let userid = useridBox.payload.data.userid;

		// const myToken = await ctx.service.user.findUserToken(userid);

		// if(myToken[0].vtb_token != useridToken) {
		// 	ctx.body = {
		// 		'res'   : 202,
		// 		'resMsg': "抽奖失败"
		// 	};
		// 	return;
			
		// }
		/**token结束**/
    //解析数据
    //获取useridToken
		const Uhdid = ctx.cookies.get('LH_YH_0797Uhdid', {
      signed : false,
      encrypt: true
    });

    let UhdidOld = new Buffer(Uhdid, 'base64');
    let useridMi = UhdidOld.toString();

    //解密token和用户id
    let userid    = private_key.decrypt(useridMi, 'utf8');
    let decrypted = private_key.decrypt(content,'utf8');
    let Iwant     = getMsgIWant(decrypted);

    //获取数字和数量，先定死期数为1，数字为8，数量为10
    const buyNumber = Iwant.number;
    const buyId     = Iwant.buyId;
    const buyCount  = Iwant.count;
    //lable为1买数字，lable为2买大小，lable为3买单双
    const lable = Iwant.lable;
    
    //查询用户信息，用户余额
    const userMsg    = await ctx.service.user.user(userid);
    const userAsset  = await ctx.service.user.userAsset(userid);
    let   vitality   = userAsset.userAsset[0].vtb_active;
    let   vtb_unlock = userAsset.userAsset[0].vtb_unlock;
		
		let vtbUnlock = accAdd(parseFloat(vtb_unlock),0.05);
    if (userMsg.user[0].level < 2) {
      ctx.body = {
        'res'   : 205,
        'resMsg': "白银以上才能参与转盘"
      };
      return;
    }

    if (vitality < buyCount || vitality == null) {
      ctx.body = {
        'res'   : 204,
        'resMsg': "余额不足"
      };
      return;
    }
    //查询号码是否有购买记录
    const numHistory = await ctx.service.guessNum.getNumHistory(buyNumber, lable, buyId, userid);
    console.log(numHistory);

    const getTotalHlg = await ctx.service.guessNum.getTotalHlg(buyId);
    //之前的资金池
    const afterTotalHlg = getTotalHlg.totalHlg[0].total_hlg + buyCount;
    const endTime       = getTotalHlg.totalHlg[0].endTime;
    //判断时间是否为1分钟
    if(endTime - nodetime < 60000){
      ctx.body = {
        'res'   : 208,
        'resMsg': "开奖一分钟内不支持购买"
      };
      return;
    }

    if (numHistory.numHistory.length == 0) {

      //执行购买操作
      if (buyCount > 100) {
        ctx.body = {
          'res'   : 205,
          'resMsg': "单个号码购买不能超过100"
        };
        return;
      }
      //计算活力果的数量
      var afterVitality = parseFloat(vitality) - parseInt(buyCount);
      console.log(afterVitality)
      const result = await ctx.service.guessNum.createNum(buyId, lable, buyNumber, userid, buyCount, vitality, afterVitality, afterTotalHlg,vtbUnlock);

      if (result.success != true) {
        ctx.body = {
          'res'   : 202,
          'resMsg': "购买失败"
        };
        return;
      }

      //传给反馈前台
      ctx.status = 200;
      ctx.body   = {
        'res'   : 200,
        'resMsg': "抽奖成功"
      };

      return;
    }

    //查询已经购买的数量
    let isCount    = numHistory.numHistory[0].count;
    let totalCount = isCount + parseInt(buyCount);
    console.log(totalCount)
    if (totalCount > 100) {
      ctx.body = {
        'res'   : 205,
        'resMsg': "单个号码购买不能超过100"
      };
      return;
    }


    var   afterVitality = parseFloat(vitality) - buyCount;
    const result        = await ctx.service.guessNum.updateNum(buyId, lable, buyNumber,userid, totalCount, afterVitality, afterTotalHlg,vtbUnlock);

    if (result.success != true) {
      ctx.body = {
        'res'   : 202,
        'resMsg': "购买失败"
      };
      return;
    }

    //传给反馈前台
    ctx.status = 200;
    ctx.body   = {
      'res'   : 200,
      'resMsg': "抽奖成功"
    };

  }

  //查询用户的竞猜记录
  async myGift() {
    const ctx = this.ctx;

    const myGift = await ctx.service.guessNum.myGift(ctx.params.id);

    if (myGift == undefined || myGift == null) {
      ctx.body = {
        'res'   : 201,
        'resMsg': '查询失败',
      }
      return;
    }

    //数据处理
    let lastGiftList = [];
    myGift.myGift.forEach(function (value, index, array) {
      //console.log(value);
      lastGiftList[index] = {
        lable    : value.label,
        number   : value.number,
        count    : value.count,
        buyId    : value.buy_id,
        lucklyNum: value.luckly_number,
        time     : value.operation_time
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

module.exports = guessNumController;