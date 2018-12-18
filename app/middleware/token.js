const Token = require('../public/keys/token.js');
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

module.exports = (options, app) => {
    return async function token(ctx,next) {
        //用户的token
        const useridToken = ctx.cookies.get('LH_YH_0797facyenhxsdg', {
            signed : false,
            encrypt: true
        });
        //用户的id
        const Uhdid = ctx.cookies.get('LH_YH_0797Uhdid', {
            signed : false,
            encrypt: true
        });

        if (useridToken == undefined || useridToken == null || useridToken == '') {
            await ctx.render('inApp/404.ejs', {
                title : '错误页面',
                msg   : '发生错误,请退出重进',
                status: 402
            });
            return false;
        }

        if (Uhdid == undefined || Uhdid == null || Uhdid == '') {
            await ctx.render('inApp/404.ejs', {
                title : '错误页面',
                msg   : '发生错误,请退出重进',
                status: 402
            });
            return false;
        }

        //base64转码
        let UhdidOld = new Buffer(Uhdid, 'base64');
        let useridMi = UhdidOld.toString();

        //解密token和用户id
        let userid = private_key.decrypt(useridMi, 'utf8');

        let personToken = private_key.decrypt(useridToken, 'utf8');

        //从redis中读取用户token，对比是否通过
        let redis_token = await ctx.app.redis.get(userid+"tokenKey");

        
        if (personToken != redis_token) {
            await ctx.render('inApp/404.ejs', {
                title : '错误页面',
                msg   : '发生错误,请退出重进',
                status: 402
            });
            return false;
        }

        await next();


    };
};