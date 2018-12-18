'use strict';

// had enabled by egg
// exports.static = true;
//开启跨域
exports.cors = {
    enable : true,
    package: 'egg-cors',
};
//开启mysql
exports.mysql = {
    enable : true,
    package: 'egg-mysql',
};

//配置view插件
exports.nunjucks = {
    enable : true,
    package: 'egg-view-nunjucks',
};


exports.alinode = {
    enable : true,
    package: 'egg-alinode'
};
// plugin.js
// exports.session = true;

exports.redis = {
    enable : true,
    package: 'egg-redis',
};
// exports.sessionRedis = {
//     enable : true,
//     package: 'egg-session-redis',
// };