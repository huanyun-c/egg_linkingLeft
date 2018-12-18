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
        interval : '5m',       // 5 分钟间隔
        type     : 'all',   // 指定所有的 worker 都需要执行
        immediate: false
    },
    async task(ctx) {
        //获取竞猜列表
        const indexList = await ctx.service.guessNum.indexList();
        let   buyId     = indexList.indexList[0].buy_id;
        let   newBuyId  = indexList.indexList[0].buy_id + 1;
        //随机出竞猜数字
        const ids   = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const index = Math.floor((Math.random() * ids.length));
        let   id    = ids[index];
        //const id = 5;
        //单双号11单号  12双号
        let number_lable;
        if (id == 1 || id == 3 || id == 5 || id == 7 || id == 9) {
            number_lable = 11;
        } else if (id == 2 || id == 4 || id == 6 || id == 8 || id == 10) {
            number_lable = 12;
        }
        //猜大小 13小数  14大数
        let big_or_small;
        if (id == 1 || id == 2 || id == 3 || id == 4 || id == 5) {
            big_or_small = 13;
        } else if (id == 6 || id == 7 || id == 8 || id == 9 || id == 10) {
            big_or_small = 14;
        }

        console.log(id, number_lable, big_or_small);
        //通过开奖号码更新list和detail记录
        const updateDetail = await ctx.service.guessNum.updateDetail(id, number_lable, big_or_small, buyId);
        if (updateDetail.success != true) {
           
            ctx.logger.error('更新第'+ buyId+'期记录失败')
            //继续执行下去
        }

        let nodeTime = new Date().getTime();
        let endTime  = nodeTime + 5 * 60 * 1000
        //新建下一期竞猜list表
        const createList = await ctx.service.guessNum.createList(newBuyId,nodeTime,endTime);

        if (createList.success != true) {
          
            ctx.logger.error('创建第'+ newBuyId +'期失败')
           
        }

        //查询中奖用户，发放相应的活力果
        const lucklyId       = await ctx.service.guessNum.lucklyId(id, buyId);
        const lucklyLable    = await ctx.service.guessNum.lucklyLable(number_lable, buyId);
        const lucklyBigSmall = await ctx.service.guessNum.lucklyBigSmall(big_or_small, buyId);
        // 所有的中奖用户集中在一个数组
        const totalSelect = lucklyId.lucklyId.concat(lucklyLable.lucklyLable, lucklyBigSmall.lucklyBigSmall);

        if (totalSelect.length != 0) {

            (async function getIds(i) {

                if (i == totalSelect.length) {
                    return false;
                }
                const userAsset = await ctx.service.user.userAsset(totalSelect[i].user_id);
                //计算
                let addHlg = totalSelect[i].count;
                //倍率
                let   rate       = totalSelect[i].rate;
                let   newHlg     = accAdd((parseFloat(userAsset.userAsset[0].vtb_active)), (parseFloat(addHlg * rate).toFixed(1)));
                const updateUser = await ctx.service.guessNum.updateUser(totalSelect[i].user_id, newHlg);

                if (updateUser.success != true) {
                  
                    ctx.logger.error('更新'+ totalSelect[i].user_id + '账户，在第'+ buyId +'期失败')
                }

                getIds(++i);
            })(0)

        }


    }
};