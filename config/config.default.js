'use strict';

module.exports = appInfo => {
	const config = exports = {};

	// use for cookie sign key, should change to your own and keep security
	config.keys = appInfo.name + 'xxxxxxxxxxxxxxxx';

	// add your config here
	config.middleware = [];

	config.bodyParser = {
		enable: true
	};
	//关闭csrf
	config.security = {
		csrf: {
			enable: false,
			ignoreJSON: false
		},
		// 白名单
		domainWhiteList: ['http://xxxxxxxxxxxx', 'http://xxxxxxxxxxxxxxxxxxx']
	};

	config.cors = {
		allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
	};

	//配置mysql

	config.mysql = {
		client: {
			host: 'xxxxxxxxxxx',
			port: 'xxxx',
			user: 'xxx',
			password: 'xxx',
			database: 'xxxxx'
		}
	};
	//配置view
	config.view = {
		defaultViewEngine: 'nunjucks',
		mapping: {
			'.ejs': 'nunjucks',
		}
	};

	config.cluster = {
		listen: {
			port: 8080,
			hostname: '127.0.0.1'
			//hostname: '0.0.0.0'
		}
	}
    //redis
	config.redis = {
		client: {
			port: xxxx, // Redis port 
			host: '127.0.0.1', // Redis host 
			password: 'xxxxx',
			db: 0,
		}
	}

	return config;
};