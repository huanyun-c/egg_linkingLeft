let tips = ["红包1元", "红包5元", "红包8元", "红包10元", "活力果5个", "红包80元", "活力果10个", "活力果100个", "iPhoneX1台"], //中奖提示
	$ring   = $(".ring"),
	$prize  = $(".prize"),       //转盘
	$btn    = $("#btn"),         //按钮
	$change = $("#change"),      //显示剩余抽奖机会
	$li     = $(".scroll li"),   //中奖信息滚动的盒子
	$sNum   = $(".start-num"),   //手机头号，三位数
	$eNum   = $(".end-num"),     //手机尾号，四位数
	$info   = $(".info"),        //中奖提示信息   
	bool    = false,             //判断是否在旋转，true表示是，false表示否
	timer; //定时器

$(function () {
	$('#main').hide();
	getNodeTime();
	init();
	//中奖信息提示
	$("#close,.win,.btn").click(function () {
		$prize.addClass("running");
		$mask.hide();
		$winning.removeClass("reback");
		$card.removeClass("pull");
	})
	$("#myWin").attr("href", "/mygift");
});

function init() {
	timer = setInterval(function () {
		$ring.toggleClass("light");
	}, 1000);

	//点击抽奖
	$btn.click(function () {
		//console.log(bool);
		if (bool) return; // 如果在执行就退出
		bool = true;  // 标志为 在执行
		clickFn();

	});
}

function giftLevel(gift) {

	switch (gift) {
		case '0': 
			return "iphoneX";
			break;
		case '1': 
			return "100个活力果";
			break;
		case '2': 
			return "10个活力果";
			break;
		case '3': 
			return "80元红包";
			break;
		case '4': 
			return "5个活力果";
			break;
		case '5': 
			return "10元红包";
			break;
		case '6': 
			return "8元红包";
			break;
		case '7': 
			return "5元红包";
			break;
		case '8': 
			return "1元红包";
			break;
	}

}

//获取时间戳的方法
function getTimeS(time) {

	var theTime = localStorage.getItem("timestamp");

	if (theTime == null) {

		localStorage.setItem("timestamp", time);

	} else {

		localStorage.setItem("timestamp", time);
	}

}

function getNodeTime() {
	$.ajax({
		type   : "post",
		url    : "/publicKey",
		async  : false,
		success: function (data) {
			if (data.res == 200) {

				let nowTime    = data.data.nodeTime;
				let personTime = new Date().getTime();
				//当前服务器时间存缓存
				localStorage.setItem("nowTime", nowTime);
				//公钥存缓存
				localStorage.setItem("publicKey", data.data.publicKey);
				//存用户当前时间
				localStorage.setItem("personTime", personTime);

			}

		},
		error: function (error) {
			console.error(error);
		}
	});
}

//随机概率
function clickFn() {

	//前台判断次数是否足够
	var count = parseInt($change.html());
	console.log(count);
	if (count <= 0) {
		bool = false;
		$prize.addClass("running");
		alert("抽奖次数不足");
		return false;
	}

	//获取公钥加密
	let key     = localStorage.getItem('publicKey');
	let encrypt = new JSEncrypt();
	encrypt.setPublicKey(key);

	//签名操作
	let noncestr   = Math.random().toString(36).substr(2);
	let timeStamp  = localStorage.getItem("nowTime");
	let personTime = localStorage.getItem("personTime");
	let nowTime    = new Date().getTime();
	//计算经历的时间
	let timeOut = parseInt(nowTime) - parseInt(personTime);

	//类似服务器时间
	let NewtimeStamp = parseInt(timeStamp) + parseInt(timeOut);

	let sign_host = 'http://www.saintenjoy.top';
	let param     = {
		'timeStamp': NewtimeStamp,
		'noncestr' : noncestr,
		'signHost' : sign_host
	};
	//加密数据
	let params = {
		userid: '10003'
	}

	var sign = function (param) {

		var array = new Array();
		for (var key in param) {
			array.push(key);
		}
		array.sort();

		// 拼接有序的参数名-值串
		var paramArray = new Array();

		for (var index in array) {
			var key = array[index];
			paramArray.push(key + '=' + param[key]);
		}

		var md5Source = paramArray.join("&");

		return md5Source;
	}

	let Newsign = md5(sign(param)).toUpperCase();
	//参与加密
	let userMsg    = sign(params);
	let encryptKey = encrypt.encrypt(userMsg);  //使用公钥加密，得到密文

	//调用购买方法
	$.ajax({
		type : "post",
		url  : "/turnTable/run",
		async: false,
		data : {
			'timeStamp': NewtimeStamp,
			'noncestr' : noncestr,
			'sign'     : Newsign,
			'content'  : encryptKey
		},
		success: function (data) {
			// console.log(data);
			if (data.res == 200) {

				$prize.removeClass("running");
				audio.play();
				getTimeS(data.data.time);

				switch (data.data.id) {
					//中奖概率，可控。根据得到的随机数控制奖品
					case 0: 
						rotateFn(1, 0, tips[8], data.data.phone, data.data.lastCount);
						break;
					case 1: 
						rotateFn(1, 80, tips[7], data.data.phone, data.data.lastCount);
						break;
					case 2: 
						rotateFn(2, 280, tips[6], data.data.phone, data.data.lastCount);
						break;
					case 3: 
						rotateFn(3, 240, tips[5], data.data.phone, data.data.lastCount);
						break;
					case 4: 
						rotateFn(4, 200, tips[4], data.data.phone, data.data.lastCount);
						break;
					case 5: 
						rotateFn(5, 160, tips[3], data.data.phone, data.data.lastCount);
						break;
					case 6: 
						rotateFn(6, 120, tips[2], data.data.phone, data.data.lastCount);
						break;
					case 7: 
						rotateFn(7, 40, tips[1], data.data.phone, data.data.lastCount);
						break;
					case 8: 
						rotateFn(8, 320, tips[0], data.data.phone, data.data.lastCount);
						break;

				}

			} else {
				$("#alertBox").html(data.resMsg)
				$("#alertBox").show();
				setTimeout(function(){
					$("#alertBox").hide();
				},1500);
				bool = false;
				$prize.addClass("running");
				
			}

		},
		error: function (error) {
			console.error(error)
		}
	});

}


//选中函数。参数：奖品序号、角度、提示文字
function rotateFn(awards, angle, text, person, count) {

	bool = true;
	$prize.stopRotate();
	$prize.rotate({
		angle    : 0,              //旋转的角度数
		duration : 5000,           //旋转时间
		animateTo: angle + 1800,   //给定的角度,让它根据得出来的结果加上1440度旋转。也就是至少转5圈
		callback : function () {
			bool = false;  // 标志为 执行完毕
			$prize.addClass("running");
			win();
			show(text, person);
			$('#change').html(count);

		}
	});

}

//中奖信息滚动。前两个参数为手机号前三位和后四位手机尾号，text为中的什么奖品
function show(text, person) {
	//最新中奖信息

	var giftHtml = `				
			<li class="gift">
	                    恭喜<span class="start-num">${person}</span>
	                    获得<span class="info">${text}</span>
       		</li>
		`

	$(".gift").eq(0).before(giftHtml);

}