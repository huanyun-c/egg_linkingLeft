'use strict';

const Controller = require('egg').Controller;
const Token      = require('../public/keys/token.js');
const fs         = require('fs');
const NodeRSA    = require('node-rsa');
var   crypto     = require("crypto");
let   privatePem = fs.readFileSync('app/public/keys/rsa_private_key.pem').toString();

let publicPem = fs.readFileSync('app/public/keys/rsa_public_key.pem').toString();

let public_key = new NodeRSA(publicPem);

let private_key = new NodeRSA(privatePem);

public_key.setOptions({
    encryptionScheme: 'pkcs1'
});

private_key.setOptions({
    encryptionScheme: 'pkcs1'
});


let getSha1 = function (str) {
    var sha1 = crypto.createHash("sha1");  //定义加密方式:md5不可逆,此处的md5可以换成任意hash加密的方法名称；
    sha1.update(str);
    var res = sha1.digest('hex');  //加密后的值d
    return res;
}

class TokenController extends Controller {

    async createHtml() {
        const { app } = this;
        const ctx     = this.ctx;
        const body    = ctx.request.body;
        let   userid  = body.userid;
        let   type    = body.type;
        let   time    = new Date().getTime();
        //获取前台传来的token签名
        let tokenSign  = ctx.request.header.sign;
        let personTime = ctx.request.header.stm;
        //1.先验证时间是否大于2秒
        if(time - parseInt(personTime) > 2000){
            ctx.body = {
                'code': 400,
                'msg' : '请求超时',
                'data': time
            }
            return
        }
        //2.验证签名是否正确
        /**先从redis里面获取用户的token
         * 进行sha1加密
         * 和前台加密进行比对验证 
         */
        const nodeToken = await app.redis.get(userid+'tokenKey');         // 根据id拿取token
        let   str       = 'xxxxxxxxxxxxxxxxxxxx';  //加密方式
		
        let nodeTokenSign = getSha1(str);

        if(nodeTokenSign != tokenSign){
            ctx.body = {
                'code': 204,
                'msg' : '签名错误'
            }
            return
        }

        /**页面状态type：1为娱乐的，2为活力口袋
         * 
         * 将加密后的token传给前台
         * encryted = public_key.encryted(content,'utf8');
         * 
         * */
        let user_id       = public_key.encrypt(userid,'base64');
        let user_idBase64 = new Buffer(user_id);
        let useridNew     = user_idBase64.toString('base64');
        // if (result.success == true) {
        //返回url
        switch (type) {
            case '1': 
                ctx.body = {
                    'code': 200,
                    'msg' : '获取成功',
                    'data': {
                        url: 'http://h5.saintenjoy.com/games?content='+useridNew
                    }
                }
                break;
            case '2': 
                ctx.body = {
                    'code': 200,
                    'msg' : '获取成功',
                    'data': {
                        url: 'http://h5.saintenjoy.com/vtb?content='+useridNew
                    }
                }
                break;
        }
    }
    async token() {
        const ctx = this.ctx;

        const userid = ctx.request.body.userid;

        let token = Token.createToken(userid);

        ctx.status = 200;

        ctx.body   = {
            'res'   : 200,
            'resMsg': '创建成功',
            'data'  : {
                token: token
            }
        }

    }

    async jiami() {
        const ctx = this.ctx;

        const token = ctx.request.body.token;

        let newToken       = public_key.encrypt(token,'base64');
        let newTokenBase64 = new Buffer(newToken);
        let Token          = newTokenBase64.toString('base64');
            ctx.status     = 200;

        ctx.body   = {
            'res'   : 200,
            'resMsg': '创建成功',
            'data'  : {
                Token: Token
            }
        }

    }


    async decodeToken() {
        const ctx = this.ctx;

        const body = ctx.request.body;

        let name = body.token;
        console.log(name);
        let msg = Token.decodeToken(name);

        ctx.status = 200;
        ctx.body   = {
            'res'   : 200,
            'resMsg': '解析成功',
            'data'  : {
                msg: msg
            }
        }
    }

    async checkToken() {

        const ctx = this.ctx;

        const body = ctx.request.body;

        let name = body.token;

        let msg = Token.checkToken(name);

        if (!msg) {
            ctx.body = {
                'res'   : 202,
                'resMsg': 'token过期',
            }

            return
        }

        ctx.body = {
            'res'   : 200,
            'resMsg': 'token未过期',
        }


    }

    async setRedis(){
        const {app}  = this;
        const ctx    = this.ctx;
        const body   = ctx.request.body;
        const userid = body.userid;
        const token  = body.token;
        app.redis.set(userid,token);

        ctx.body = {
            'res'   : 200,
            'resMsg': '成功'
        }
    }

}

module.exports = TokenController;