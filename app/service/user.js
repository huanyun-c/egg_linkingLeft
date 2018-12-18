const Service = require('egg').Service;

class UserService extends Service {
  async user(id) {
    // 获取用户奖励列表
    const user = await this.app.mysql.select('users', {
      where: {
        user_id: id
      },
      columns: ['phone_number', 'level','head_url']
    });
    return {
      user
    };
  }

  async userAsset(id) {
    // 获取用户账户信息
    const userAsset = await this.app.mysql.select('user_asset', {
      where: {
        user_id: id
      },
      columns: ['vtb_active', 'money', 'vtb_freeze', 'vtb_address', 'vtb_private_key', 'pay_password','vtb_unlock','vtb_status']
    });
    return {
      userAsset
    };
  }

  async userAddress() {
    // 获取用户奖励列表
    const userAddress = await this.app.mysql.select('user_asset',{
        where:{
          vtb_status: 1
        },
      columns: ['vtb_address']
      
  });
    return userAddress;
  }

  async updateUserForAddress(address,vitality) {
    // 更新用户余额，通过地址
    const row = {
      vtb_active: vitality
    };

    const options = {
      where: {
        vtb_address: address
      }
    };
    const result = await this.app.mysql.update('user_asset', row, options);

    if (result.affectedRows != 1) {
      return {
        success: false
      };
    }

    return {
      success: true
    };
  }
  async userAssetForAddress(address) {
    const userMsg = await this.app.mysql.select('user_asset', {
      where: {
        vtb_address: address
      },
      columns: ['vtb_active', 'money', 'vtb_freeze', 'vtb_address', 'vtb_private_key', 'pay_password', 'user_id']
    });
    return userMsg;

  }

  async updateUser(userid, vitality) {
    const row = {
      vtb_active: vitality
    };

    const options = {
      where: {
        user_id: userid
      }
    };
    const result = await this.app.mysql.update('user_asset', row, options);

    if (result.affectedRows != 1) {
      return {
        success: false
      };
    }

    return {
      success: true
    };


  }

  async updateUserToken(userid,token) {
    const row = {
      vtb_token: token
    };

    const options = {
      where: {
        user_id: userid
      }
    };
    const result = await this.app.mysql.update('user_asset', row, options);

    if (result.affectedRows != 1) {
      return {
        success: false
      };
    }

    return {
      success: true
    };


  }

  async findUserToken(userid) {

    const myToken = await this.app.mysql.select('user_asset',{
      where:{
        user_id: userid
      },
      columns: ['vtb_token']
    });

    return  myToken;


  }

}

module.exports = UserService;