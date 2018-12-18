const Service = require('egg').Service;

/***生成订单号***/
let myDate = new Date().getTime();
let time   = Changetime(myDate)
//时间转换
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

function getOrderNo(count, time) {

  return time + '000' + count;

}


class TurntableService extends Service {
  async lucklyList() {
    // 获取用户奖励列表
    const luckList = await this.app.mysql.select('turntableHlg_detail', {
      orders: [
        ['create_time', 'desc']
      ],
      limit: 10
    });
    return {
      luckList
    };
  }

  async run(userid, phone, lable, number, vitalityLast, beforeVitality,vtbUnlock) {
    const changeTime = new Date();
    let   myDate     = new Date().getTime();
    let   time       = Changetime(myDate)
    //update的参数
    const options = {
      where: {
        user_id: userid
      }
    }
    const row = {
      vtb_active: parseFloat(vitalityLast),
      vtb_unlock: vtbUnlock
    };

    const count = await this.app.mysql.select('blockNum', {
      where: {
        id: 2
      }
    });
    
    let insertValue;
    switch (lable) {
      case '1': 
        insertValue = {
          order_no      : getOrderNo(count[0].blockNum, time),
          income_user_id: userid,
          total_number  : 1,
          order_status  : '3',
          total_money   : number,
          order_type    : 10,
          create_time   : changeTime,
          finish_time   : changeTime,
          order_unit    : 0
        }
        break;
      case '2': 
        insertValue = {
          order_no      : getOrderNo(count[0].blockNum, time),
          expend_user_id: userid,
          total_number  : 1,
          order_status  : '3',
          total_money   : number,
          order_type    : 10,
          create_time   : changeTime,
          finish_time   : changeTime,
          order_unit    : 0
        }
        break;
    }


    const result = await this.app.mysql.beginTransactionScope(async conn => {
      await conn.insert('turntableHlg_Detail', {
        phone_number  : phone,
        lable         : lable,
        number        : lable == '1' ? number: number * (-1),
        status        : '2',
        user_id       : userid,
        create_time   : changeTime,
        beforeVitality: beforeVitality,
        lastVitality  : vitalityLast
      });
      await conn.update('user_asset', row, options);
      await conn.insert('orders', insertValue);
      await conn.update('blockNum', {
        blockNum: count[0].blockNum + 1
      }, {
        where: {
          id: 2
        }
      });

      await conn.insert('action_detail',{
        user_id         : userid,
        bewrite         : '参与幸运大转盘小游戏',
        vte_codex_id    : 9,
        action_id       : 2,
        vte_value       : 0.05,
        vtb_unlock_after: vtbUnlock,
        action_time     : changeTime
      });
      return {
        success: true
      };
      return {
        success: true
      };

    });

    return result;
  }


  async myGift(userid) {
    // 获取用户抽奖记录
    const myGift = await this.app.mysql.select('turntableHlg_detail', {
      where: {
        user_id: userid
      },
      orders: [
        ['create_time', 'desc']
      ],
      limit: 30
    });
    return {
      myGift
    };
  }

}

module.exports = TurntableService;