'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const {
    router,
    controller
  } = app;
  const token = app.middleware.token();
  //转奖品
  // router.get('/turnTable', controller.turnTable.index);
  router.post('/turnTable/run', controller.turnTable.run);
  // router.get('/turnTable/giftList/:id', controller.turnTable.myGift);
  //转活力果
  // router.get('/turnTableHlg', controller.turnTableHlg.index);
  router.post('/turnTableHlg/run', controller.turnTableHlg.run);
  // router.get('/turnTableHlg/giftList/:id', controller.turnTable.myGift);
  //猜数字
  // router.get('/guessNum', controller.guessNum.index);
  router.post('/guessNum/run', controller.guessNum.run);
  // router.get('/guessNum/giftList/:id', controller.guessNum.myGift);
  //获取公钥时间
  router.post('/publicKey', controller.guessNum.publicKey);
  //竞猜获取最新的时间和公钥
  router.post('/nodeTime', controller.guessNum.nodeTime);
  //vtb提现
  router.post('/vtbWithDraw', controller.vtbController.vtbWithDraw);
  //app调用
  router.post('/token', controller.token.token);
  router.post('/jiexitoken', controller.token.decodeToken);
  router.post('/checkToken', controller.token.checkToken);
  router.post('/VTB_CHAIN/api/getHtml', controller.token.createHtml);
  router.post('/setRedis', controller.token.setRedis);
  router.post('/jiami', controller.token.jiami);
  router.post('/newVtb', controller.vtbController.newToken);
  //转盘4
  router.post('/turnTableProduct', controller.turntableProduct.productList);
  /*****页面*****/
  //活力攻略页面
  router.get('/hlStrategy', controller.pages.hlStrategy);
  //帮助中心页面
  router.get('/helpCenter', controller.pages.helpCenter);
  //转盘1游戏页面
  router.get('/turntable',token, controller.pages.turntable);
  //转盘2活力果版游戏页面
  router.get('/turntableHlg',token, controller.pages.turntableHlg);
  //转盘3竞猜游戏页面
  router.get('/guessGame',token, controller.pages.guessNum);
  //转盘3个人历史记录页面
  router.get('/myGuess',token, controller.pages.myguess);
  //转盘1个人历史记录页面
  router.get('/mygift',token, controller.pages.myGift);
  //转盘2个人历史记录页面
  router.get('/mygiftHlg',token, controller.pages.myGiftHlg);
  //活力口袋页面
  router.get('/vtb', controller.vtbController.vtb);
  //活力口袋提现页面
  router.get('/vtb/vtbWithDraw', controller.vtbController.tixian);
  
  //活力口袋提现记录页面
  router.get('/vtb/withDrawHistory', controller.pages.withDrawHistory);
  //活力口袋充值记录页面
  router.get('/vtb/rechargeHistory', controller.pages.rechargeHistory);
  //娱乐列表页面
  router.get('/games', controller.pages.games);
  //文案及说明文字
  router.get('/helps/syxy', controller.pages.syxy);
  router.get('/helps/yszc', controller.pages.yszc);
  router.get('/helps/fwxy', controller.pages.fwxy);
  router.get('/helps/czxy', controller.pages.czxy);
  router.get('/helps/fwbz', controller.pages.fwbz);
  router.get('/helps/zhxxgl', controller.pages.zhxxgl);
  router.get('/helps/shrz', controller.pages.shrz);
  router.get('/helps/lxwm', controller.pages.lxwm);
  router.get('/helps/qt', controller.pages.qt);
  router.get('/helps/gxzgz', controller.pages.gxzgz);
  router.get('/helps/hlggz', controller.pages.hlggz);
  router.get('/helps/shgf', controller.pages.shgf);
  router.get('/helps/yhgf', controller.pages.yhgf);
  router.get('/404',controller.pages.errorPage);
  router.get('/weihu',controller.pages.weihu);


  router.get('/aboutMe', controller.pages.aboutUs);
  router.get('/lifeService', controller.pages.lifeService);
  router.get('/problem', controller.pages.qbCjwt);
  router.get('/contributionRebate', controller.pages.contributionRebate);
  router.get('/shopProblem', controller.pages.shopProblem);
};