'use strict';
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
//号码解析
function Changephone(phone) {
    var a = phone;
    var f = a.substr(0, 3);
    var l = a.substr(7, 4);

    return f + "****" + l

}
//除掉一个数据
function curtail(arr) {
    var m = arr.slice(1);
    return m;
}
//时间转换
function Changetime(value) {

    let date = new Date(value);  //时间戳为10位需*1000，时间戳为13位的话不需乘1000

    let Y = date.getFullYear() + '-';
    let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) + '-': date.getMonth() + 1) + '-';
    let D = parseInt(date.getDate()) < 10 ? '0' + date.getDate() + ' ' : date.getDate() + ' ';
    let h = parseInt(date.getHours()) < 10 ? '0' + date.getHours() + ':' : date.getHours() + ':';
    let m = parseInt(date.getMinutes()) < 10 ? '0' + date.getMinutes() + ':' : date.getMinutes() + ':';
    let s = parseInt(date.getSeconds()) < 10 ? '0' + date.getSeconds() : date.getSeconds();
    return Y + M + D + h + m + s;
}

const Controller = require('egg').Controller;

class PagesController extends Controller {
    async hlStrategy() {
        const {
            ctx
        } = this;
        await ctx.render('rule/hlStrategy.ejs', {
            title: '链活活力攻略'
        });
    }
    async games() {
        const {
            ctx
        } = this;
        
        const userid = ctx.query.content;

       // console.log(userid)
        //简单的转码
        let useridOld = new Buffer(userid, 'base64');
        let useridNew = useridOld.toString();
        let user_id   = private_key.decrypt(useridNew, 'utf8');
        //通过用户id获取token，存到cookies
        const redisToken = await this.app.redis.get(user_id+'tokenKey');

        let redisTokenNew = public_key.encrypt(redisToken, 'base64');
        //设置cookies
        ctx.cookies.set('LH_YH_0797facyenhxsdg',redisTokenNew,{
        	httpOnly: true,   // 默认就是 true
        	encrypt : true,   // 加密传输
        });

        ctx.cookies.set('LH_YH_0797Uhdid',userid,{
        	httpOnly: true,   // 默认就是 true
        	encrypt : true,   // 加密传输
        });

        await ctx.render('inApp/game.ejs', {
            title: '娱乐中心'
        });

    }
    async turntable() {
        const {
            ctx
        } = this;
        /**token开始**/
        //获取useridToken
        const useridToken = ctx.cookies.get('LH_YH_0797facyenhxsdg', {
        	signed : false,
        	encrypt: true
        });

        const Uhdid = ctx.cookies.get('LH_YH_0797Uhdid', {
        	signed : false,
        	encrypt: true
        });

        let UhdidOld = new Buffer(Uhdid, 'base64');
        let useridMi = UhdidOld.toString();

        //解密token和用户id
        let userid = private_key.decrypt(useridMi, 'utf8');

        /**token结束**/
        //获取服务器时间
        const nodeTime = new Date().getTime();
        //先获取用户id,再获取用户的余额
        const userAsset = await ctx.service.user.userAsset(userid);
        const user      = await ctx.service.user.user(userid);
        if (userAsset.userAsset.length == 0 || user.user.length == 0) {
            await ctx.render('inApp/404.ejs', {
                title : '错误页面',
                msg   : '用户不存在',
                status: 402
            });
            return false;
        }
        //设置轮播信息
        const luckList = [{
                gift  : "80元红包",
                person: "136****5899"
            },
            {
                gift  : "100个活力果",
                person: "135****3732"
            },
            {
                gift  : "80元红包",
                person: "189****8682"
            },
            {
                gift  : "10个活力果",
                person: "139****8578"
            },
            {
                gift  : "80元红包",
                person: "158****8899"
            }
        ];
        //查询最新的抽奖记录

        const lucklyList = await ctx.service.turnTable.lucklyList();

        if (lucklyList == undefined || lucklyList == null) {
            await ctx.render('inApp/404.ejs', {
                title : '错误页面',
                msg   : '用户不存在',
                status: 402
            });
            return false;
        }

        //数据处理
        let giftList = [];
        lucklyList.luckList.forEach(function (value, index, array) {

            giftList[index] = {
                lable : value.lable,
                number: value.number,
                gift  : value.lable == '1' ? 'iphoneX'         : (value.lable == '2' ? '活力果' : '红包'),
                unit  : value.lable == '1' ? value.number + '台': (value.lable == '2' ? value.number + '个' : value.number + '元'),
                status: value.status,
                time  : value.create_time,
                phone : Changephone(value.phone_number)
            }
        })
        //设置cookies
        //ctx.cookies.set('nodeTime', nodeTime);

        await ctx.render('inApp/turntable.ejs', {
            title         : '活力大转盘',
            personVitality: parseInt(userAsset.userAsset[0].vtb_active),
            lucklyList    : luckList,
            giftList      : giftList,
            level         : parseInt(user.user[0].level),
            nodeTime      : nodeTime
        });
    }

    async turntableHlg() {
        const {
            ctx
        } = this;
       /**token开始**/
        //获取useridToken
        const useridToken = ctx.cookies.get('LH_YH_0797facyenhxsdg', {
        	signed : false,
        	encrypt: true
        });

        const Uhdid = ctx.cookies.get('LH_YH_0797Uhdid', {
        	signed : false,
        	encrypt: true
        });

        let UhdidOld = new Buffer(Uhdid, 'base64');
        let useridMi = UhdidOld.toString();
       // console.log(useridMi);
        //解密token和用户id
        let userid = private_key.decrypt(useridMi, 'utf8');
        // }
        /**token结束**/
        //获取服务器时间
        const nodeTime = new Date().getTime();
        //先获取用户id,再获取用户的余额
        const userAsset = await ctx.service.user.userAsset(userid);
        const user      = await ctx.service.user.user(userid);

        if (userAsset.userAsset.length == 0 || user.user.length == 0) {
            await ctx.render('inApp/404.ejs', {
                title : '错误页面',
                msg   : '用户不存在',
                status: 402
            });
            return false;
        }
        //设置轮播信息
        const luckList = [{
                gift  : "20个活力果",
                person: "177****3636"
            },
            {
                gift  : "20个活力果",
                person: "181****3632"
            },
            {
                gift  : "20个活力果",
                person: "136****8082"
            },
            {
                gift  : "20个活力果",
                person: "137****8588"
            },
            {
                gift  : "20个活力果",
                person: "188****8899"
            }
        ];
        //设置cookies
       // ctx.cookies.set('nodeTime', nodeTime);

        await ctx.render('inApp/turntableHlg.ejs', {
            title         : '活力大转盘(活力果)',
            personVitality: parseInt(userAsset.userAsset[0].vtb_active),
            lucklyList    : luckList,
            level         : parseInt(user.user[0].level),
            nodeTime      : nodeTime
        });
    }

    async guessNum() {
        const {
            ctx
        } = this;
       /**token开始**/
        //获取useridToken
        const useridToken = ctx.cookies.get('LH_YH_0797facyenhxsdg', {
        	signed : false,
        	encrypt: true
        });

        const Uhdid = ctx.cookies.get('LH_YH_0797Uhdid', {
        	signed : false,
        	encrypt: true
        });

        let UhdidOld = new Buffer(Uhdid, 'base64');
        let useridMi = UhdidOld.toString();
       // console.log(useridMi);
        //解密token和用户id
        let userid = private_key.decrypt(useridMi, 'utf8');

        /**token结束**/
        //获取服务器时间
        const nodeTime = new Date().getTime();

        const indexList = await ctx.service.guessNum.indexList();

        if (indexList.indexList.length == 0) {
            await ctx.render('inApp/404.ejs', {
                title : '错误页面',
                msg   : '查询失败',
                status: 402
            });
            return false;
        }
        //获取前20条记录,去除第一条
        let newList = curtail(indexList.indexList);

        //设置cookies
        ctx.cookies.set('nodeTime', nodeTime);

        await ctx.render('inApp/guessGame.ejs', {
            title    : '活力大竞猜',
            nodeTime : nodeTime,
            lastList : newList,
            lastBuyId: indexList.indexList[0].buy_id,
            fontBuyId: indexList.indexList[1].buy_id,
            fontNum  : indexList.indexList[1].luckly_number,
            startTime: indexList.indexList[0].startTime,
            endTime  : indexList.indexList[0].endTime
        });
    }

    async myguess() {
        const ctx = this.ctx;
        /**token开始**/
        //获取useridToken
        const useridToken = ctx.cookies.get('LH_YH_0797facyenhxsdg', {
        	signed : false,
        	encrypt: true
        });

        const Uhdid = ctx.cookies.get('LH_YH_0797Uhdid', {
        	signed : false,
        	encrypt: true
        });

        let UhdidOld = new Buffer(Uhdid, 'base64');
        let useridMi = UhdidOld.toString();
        //console.log(useridMi);
        //解密token和用户id
        let userid = private_key.decrypt(useridMi, 'utf8');
       
        /**token结束**/
        const myGift = await ctx.service.guessNum.myGift(userid);

        if (myGift == undefined || myGift == null) {
            await ctx.render('inApp/404.ejs', {
                title : '错误页面',
                msg   : '查询失败',
                status: 402
            });
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
                time     : Changetime(value.operation_time)
            }
        })


        await ctx.render('inApp/myGuessList.ejs', {
            title       : '我的竞猜',
            lastGiftList: lastGiftList
        });


    }

    async myGift() {
        const ctx = this.ctx;
        /**token开始**/
        //获取useridToken
        const useridToken = ctx.cookies.get('LH_YH_0797facyenhxsdg', {
        	signed : false,
        	encrypt: true
        });

        const Uhdid = ctx.cookies.get('LH_YH_0797Uhdid', {
        	signed : false,
        	encrypt: true
        });

        let UhdidOld = new Buffer(Uhdid, 'base64');
        let useridMi = UhdidOld.toString();
      //  console.log(useridMi);
        //解密token和用户id
        let userid = private_key.decrypt(useridMi, 'utf8');
        
        /**token结束**/
        const myGift = await ctx.service.turnTable.myGift(userid);

        if (myGift == undefined || myGift == null) {
            await ctx.render('inApp/404.ejs', {
                title : '错误页面',
                msg   : '查询失败',
                status: 402
            });
            return;
        }

        //数据处理
        let lastGiftList = [];
        myGift.myGift.forEach(function (value, index, array) {
            //console.log(value);
            lastGiftList[index] = {
                lable : value.lable,
                number: value.number,
                unit  : value.lable == '1' ? 'iphoneX'         : (value.lable == '2' ? '活力果' : '红包'),
                number: value.lable == '1' ? value.number + '台': (value.lable == '2' ? value.number + '个' : value.number + '元'),
                status: value.status,
                time  : Changetime(value.create_time)
            }
        })


        await ctx.render('inApp/myTurntableList.ejs', {
            title       : '我的抽奖',
            lastGiftList: lastGiftList
        });
    }

    async myGiftHlg() {
        const ctx = this.ctx;
        /**token开始**/
        //获取useridToken
        const useridToken = ctx.cookies.get('LH_YH_0797facyenhxsdg', {
        	signed : false,
        	encrypt: true
        });

        const Uhdid = ctx.cookies.get('LH_YH_0797Uhdid', {
        	signed : false,
        	encrypt: true
        });

        let UhdidOld = new Buffer(Uhdid, 'base64');
        let useridMi = UhdidOld.toString();

        //解密token和用户id
        let userid = private_key.decrypt(useridMi, 'utf8');

        
        /**token结束**/
        
        const myGift = await ctx.service.turnTableHlg.myGift(userid);

        if (myGift == undefined || myGift == null) {
            await ctx.render('inApp/404.ejs', {
                title : '错误页面',
                msg   : '查询失败',
                status: 402
            });
            return;
        }

        //数据处理
        let giftList = [];
        myGift.myGift.forEach(function (value, index, array) {

            giftList[index] = {
                lable : value.lable,
                number: value.number,
                gift  : '活力果',
                unit  : value.number + '个',
                status: value.status,
                time  : Changetime(value.create_time)
                // phone : Changephone(value.phone_number)
            }
        })

        await ctx.render('inApp/hlgHistory.ejs', {
            title       : '我的抽奖',
            lastGiftList: giftList
        });
    }

    async helpCenter() {
        const {
            ctx
        } = this;
        await ctx.render('rule/helpCenter.ejs', {
            title: '帮助中心'
        });
    }

    async withDrawHistory() {
        const {
            ctx
        } = this;

        /**token开始**/
        //获取useridToken
        const useridToken = ctx.cookies.get('LH_YH_0797facyenhxsdg', {
        	signed : false,
        	encrypt: true
        });

        const Uhdid = ctx.cookies.get('LH_YH_0797Uhdid', {
        	signed : false,
        	encrypt: true
        });

        let UhdidOld = new Buffer(Uhdid, 'base64');
        let useridMi = UhdidOld.toString();

        //解密token和用户id
        let userid = private_key.decrypt(useridMi, 'utf8');
        /**token结束**/
        const widthDrawList = await ctx.service.vtbService.getwidthDrawList(userid,4);
        
        //数据处理
        let newWidthDrawList = [];

        if (widthDrawList.widthDrawList.length == 0) {
            await ctx.render('vtb/chongzhiList.ejs', {
                title          : '充值记录',
                newRechargeList: newWidthDrawList
            });
        }

        
        widthDrawList.widthDrawList.forEach(function (value, index, array) {
			let extJson = JSON.parse(value.ext);
            newWidthDrawList[index] = {
            	order:value.order_no,
                from  : extJson.fromAddress,
                to    : extJson.toAddress,
                hash  : extJson.hash,
                account:value.total_money,
                status: value.order_status == 3 ? '成功' : '进行中',
                time  : Changetime(value.create_time)
            }
        })
        await ctx.render('vtb/tixianList.ejs', {
            title           : '提现记录',
            newWidthDrawList: newWidthDrawList
        });
    }

    async rechargeHistory() {
        const {
            ctx
        } = this;
        /**token开始**/
        //获取useridToken
        const useridToken = ctx.cookies.get('LH_YH_0797facyenhxsdg', {
        	signed : false,
        	encrypt: true
        });

        const Uhdid = ctx.cookies.get('LH_YH_0797Uhdid', {
        	signed : false,
        	encrypt: true
        });

        let UhdidOld = new Buffer(Uhdid, 'base64');
        let useridMi = UhdidOld.toString();
      //  console.log(useridMi);
        //解密token和用户id
        let userid = private_key.decrypt(useridMi, 'utf8');

        /**token结束**/
        const rechargeList = await ctx.service.vtbService.getRechargeList(userid, 5);

        //数据处理
        let newRechargeList = [];

        if (rechargeList.rechargeList.length == 0) {
            await ctx.render('vtb/chongzhiList.ejs', {
                title          : '充值记录',
                newRechargeList: newRechargeList
            });

            return
        }
        rechargeList.rechargeList.forEach(function (value, index, array) {
			let extJson = JSON.parse(value.ext);
            newRechargeList[index] = {
                order:value.order_no,
                from  : extJson.fromAddress,
                to    : extJson.toAddress,
                hash  : extJson.hash,
                account:value.total_money,
                status: value.order_status == 3 ? '成功' : '进行中',
                time  : Changetime(value.create_time)
            }
        })
        await ctx.render('vtb/chongzhiList.ejs', {
            title          : '充值记录',
            newRechargeList: newRechargeList
        });
    }
    //文案
    async syxy(){
        const {
            ctx
        } = this;

        await ctx.render('rule/syxy.ejs');
    }

    async yszc(){
        const {
            ctx
        } = this;

        await ctx.render('rule/yszc.ejs');
    }

    async fwxy(){
        const {
            ctx
        } = this;

        await ctx.render('rule/fwxy.ejs');
    }

    async czxy(){
        const {
            ctx
        } = this;

        await ctx.render('rule/czxy.ejs');
    }

    async fwbz(){
        const {
            ctx
        } = this;

        await ctx.render('rule/fwbz.ejs');
    }

    async zhxxgl(){
        const {
            ctx
        } = this;

        await ctx.render('rule/zhxxgl.ejs');
    }

    async shrz(){
        const {
            ctx
        } = this;

        await ctx.render('rule/shrz.ejs');
    }


    async lxwm(){
        const {
            ctx
        } = this;

        await ctx.render('rule/lxwm.ejs');
    }

    async qt(){
        const {
            ctx
        } = this;

        await ctx.render('rule/qt.ejs');
    }


    async gxzgz(){
        const {
            ctx
        } = this;

        await ctx.render('rule/gxzgz.ejs');
    }

    async hlggz(){
        const {
            ctx
        } = this;

        await ctx.render('rule/hlggz.ejs');
    }

    async shgf(){
        const {
            ctx
        } = this;

        await ctx.render('rule/shgf.ejs');
    }

    async yhgf(){
        const {
            ctx
        } = this;

        await ctx.render('rule/yhgf.ejs');
    }
    
    async errorPage(){
        const {
            ctx
        } = this;

        await ctx.render('inApp/404.ejs');
    }
    
    async weihu(){
        const {
            ctx
        } = this;

        await ctx.render('inApp/weihu.ejs');
    }
	
    async aboutUs(){
        const {
            ctx
        } = this;

        await ctx.render('rule/aboutUs.ejs');
    }

    async lifeService(){
        const {
            ctx
        } = this;

        await ctx.render('rule/lifeService.ejs');
    }

    async qbCjwt(){
        const {
            ctx
        } = this;

        await ctx.render('rule/qbCjwt.ejs');
    }

    async contributionRebate(){
        const {
            ctx
        } = this;

        await ctx.render('rule/contributionRebate.ejs');
    }

    async shopProblem(){
        const {
            ctx
        } = this;

        await ctx.render('rule/shopProblem.ejs');
    }

}



module.exports = PagesController;