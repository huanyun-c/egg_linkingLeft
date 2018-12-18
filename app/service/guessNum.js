const Service = require('egg').Service;

class guessNumService extends Service {

    async indexList() {
        // 获取开奖列表
        const indexList = await this.app.mysql.select('tguessnum_list', {
            orders: [
                ['buy_id', 'desc']
            ],
            limit: 21
        });
        return {
            indexList
        };
    }

    async run(userid, phone, lable, number, vitalityLast, money) {
        const changeTime = new Date().getTime();
        //update的参数
        const options = {
            where: {
                user_id: userid
            }
        }
        let row;
        //发奖lable=2为活力果，lable=3为钱
        switch (lable) {
            case '2': 
                row = {
                    vtb_active: parseInt(number) + parseFloat(vitalityLast)
                }
                break;
            case '3': 
                row = {
                    vtb_active: parseFloat(vitalityLast),
                    money     : parseInt(number) + parseFloat(money)
                }
                break;
        }

        const result = await this.app.mysql.beginTransactionScope(async conn => {
            await conn.insert('turntable_Detail', {
                phone_number: phone,
                lable       : lable,
                number      : number,
                status      : '2',
                user_id     : userid,
                create_time : changeTime
            });
            await conn.update('user_asset', row, options);

            return {
                success: true
            };

        });

        return result;
    }

    async getNumHistory(number, lable, buyId, userid) {
        const numHistory = await this.app.mysql.select('tguessnum_detail', {
            where: {
                buy_id : buyId,
                user_id: userid,
                lable  : lable,
                number : number
            }
        })
        return {
            numHistory
        };
    }

    async getTotalHlg(buyId) {
        const totalHlg = await this.app.mysql.select('tguessnum_list', {
            where: {
                buy_id: buyId
            },
            columns: ['total_hlg','endTime']
        })
        return {
            totalHlg
        };
    }

    async createNum(buyId, lable, number, userid, count, beforeVitality, afterVitality, afterTotalHlg,vtbUnlock) {
        const changeTime = new Date().getTime();
        const time       = new Date();
        const options    = {
            where: {
                user_id: userid
            }
        }
        const row = {
            vtb_active: afterVitality,
            vtb_unlock: vtbUnlock
        }
        const result = await this.app.mysql.beginTransactionScope(async conn => {
            //添加购买记录
            await conn.insert('tguessnum_detail', {
                buy_id        : buyId,
                lable         : lable,
                number        : number,
                count         : count,
                beforeVitality: beforeVitality,
                afterVitality : afterVitality,
                rate          : lable == '1' ? '9.5': '1.9',
                user_id       : userid,
                operation_time: changeTime
            });
            //更新资金池
            await conn.update('tguessnum_list', {
                total_hlg: afterTotalHlg
            }, {
                where: {
                    buy_id: buyId
                }
            });
            //更新用户的余额
            await conn.update('user_asset', row, options);
            await conn.insert('action_detail',{
                user_id         : userid,
                bewrite         : '参与全员竞猜小游戏',
                vte_codex_id    : 9,
                action_id       : 3,
                vte_value       : 0.05,
                vtb_unlock_after: vtbUnlock,
                action_time     : time
              });
            return {
                success: true
            };

        });

        return result;
    }
    async updateNum(buyId, lable, number, userid, count, afterVitality, afterTotalHlg,vtbUnlock) {
        const changeTime = new Date().getTime();
        const time       = new Date();
        //更新购买记录的参数
        const optionsNum = {
            where: {
                user_id: userid,
                lable  : lable,
                number : number,
                buy_id : buyId
            }
        }
        const rowNum = {
            count         : count,
            afterVitality : afterVitality,
            operation_time: changeTime
        }
        //更新用户余额的参数
        const optionsUser = {
            where: {
                user_id: userid
            }
        }
        const rowUser = {
            vtb_active: afterVitality,
            vtb_unlock: vtbUnlock
        }
        const result = await this.app.mysql.beginTransactionScope(async conn => {
            //更新购买记录
            await conn.update('tguessnum_detail', rowNum, optionsNum);
            //更新资金池
            await conn.update('tguessnum_list', {
                total_hlg: afterTotalHlg
            }, {
                where: {
                    buy_id: buyId
                }
            });
            //更新用户的余额
            await conn.update('user_asset', rowUser, optionsUser);
            await conn.insert('action_detail',{
                user_id         : userid,
                bewrite         : '参与全员竞猜小游戏',
                vte_codex_id    : 9,
                action_id       : 2,
                vte_value       : 0.05,
                vtb_unlock_after: vtbUnlock,
                action_time     : time
              });
            return {
                success: true
            };

        });

        return result;
    }
    async myGift(userid) {
        // 获取用户竞猜记录
        const myGift = await this.app.mysql.select('tguessnum_detail', {
            where: {
                user_id: userid
            },
            orders: [
                ['operation_time', 'desc']
            ],
            limit: 100
        });
        return {
            myGift
        };
    }

    async updateDetail(id, number_lable, big_or_small, buyId) {
        //list表参数
        const row1 = {
            luckly_number: id,
            number_lable : number_lable,
            big_small    : big_or_small
        }
        const options1 = {
            where: {
                buy_id: buyId
            }
        }
        const result = await this.app.mysql.beginTransactionScope(async conn => {
            //更新list
            await conn.update('tguessnum_list', row1, options1);
            //更新记录表
            await conn.update('tguessnum_detail', {
                luckly_number: id
            }, {
                where: {
                    buy_id: buyId,
                    number: id,
                    lable : '1'
                }
            });
            await conn.update('tguessnum_detail', {
                luckly_number: number_lable
            }, {
                where: {
                    buy_id: buyId,
                    number: number_lable,
                    lable : '2'
                }
            });
            await conn.update('tguessnum_detail', {
                luckly_number: big_or_small
            }, {
                where: {
                    buy_id: buyId,
                    number: big_or_small,
                    lable : '3'
                }
            });

            return {
                success: true
            };

        });

        return result;
    }

    async lucklyId(id, buyId) {
        //查询号码中奖的人
        const lucklyId = await this.app.mysql.select('tguessnum_detail', {
            where: {
                lable : '1',
                number: id,
                buy_id: buyId
            }
        });
        return {
            lucklyId
        };
    }

    async lucklyLable(number_lable, buyId) {
        //查询单双中奖的人
        const lucklyLable = await this.app.mysql.select('tguessnum_detail', {
            where: {
                lable : '2',
                number: number_lable,
                buy_id: buyId
            }
        });
        return {
            lucklyLable
        };
    }

    async lucklyBigSmall(big_or_small, buyId) {
        //查询单双中奖的人
        const lucklyBigSmall = await this.app.mysql.select('tguessnum_detail', {
            where: {
                lable : '3',
                number: big_or_small,
                buy_id: buyId
            }
        });
        return {
            lucklyBigSmall
        };
    }
    //更新用户活力果
    async updateUser(userid,vitality) {
        const row = {
            vtb_active: vitality
        };

        const options = {
            where: {
                user_id: userid
            }
        };
        const result = await this.app.mysql.update('user_asset', row, options);
        // const resultMsg = await this.app.mysql.insert('user_asset', row, options);
        if(result.affectedRows != 1){
            return {
                success: false
            };
        }
        
        return {
            success: true
        };

        
    }

    async createList(buyId,startTime,endTime) {
        const dateTime = new Date();

        const result = await this.app.mysql.insert('tguessnum_list', { 
            buy_id   : buyId,
            startTime: startTime,
            endTime  : endTime,
            dateTime : dateTime
        });

        const insertSuccess = result.affectedRows === 1;

        if(insertSuccess != 1){
            return {
                success: false
            };
        }
        
        return {
            success: true
        };
        
    }

}

module.exports = guessNumService;