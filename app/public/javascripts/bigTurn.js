var count = 1;
var count1 = 5;
var id;
var userid;
var token;
//本期的id
var buyId;
var bigOrSmall;
var number_lable;
var $mask    = $("#mask"),    //红包遮罩层
    $mask1   = $('#mask1'),
    $winning = $(".winning")  //红包
$(function() {
	var $blin   = $(".light p"),               //所有彩灯
	    $prize  = $(".play li").not("#btn"),   //含谢谢参与的所有奖品
	    $change = $("#change"),                //显示剩余机会
	    $btn    = $("#btn"),                   //开始抽奖按钮
	    bool    = true,                        //判断是否可点击,true为可点击
	    mark    = 0,                           //标记当前位置，区间为0-7
		timer; //定时器
	getNodeTime();
	init();
	$("#myWin").attr("href", "/myGuess");
	//默认动画效果
	function init() {

		timer = setInterval(function() {
			//不能调用animate函数，不然标记会有问题
			$blin.toggleClass("blin"); //彩灯动画
			//九宫格动画
			length++;
			
			length%= 10;

			$prize.eq(length - 1).removeClass("select");
			$prize.eq(length).addClass("select");
			$('.select > .p2').show()
			$('.select > .p1').hide()
			//位置标记的改变
			mark++;
			mark%= 10;
		}, 1000);
	}

	//动画效果
	function animate() {
		return function() {
			$blin.toggleClass("blin"); //彩灯动画
			//九宫格动画
			length++;
			length%= 8;
			$prize.eq(length - 1).removeClass("select");
			$prize.eq(length).addClass("select");
		}
	}

	$('.prize').on('click', function(e) {
		//获取数字ID
		id = parseInt(e.currentTarget.dataset.id);

		//弹出选择数量弹窗
		$('#thenumber').html('号码' + id);
		win();
	})

	$('.bsBtn').on('click', function(e) {
		id = parseInt(e.currentTarget.dataset.id);
		if(id == 14) {

			$('#thenumber1').html('大');
		} else if(id == 13) {

			$('#thenumber1').html('小');
		} else if(id == 11) {

			$('#thenumber1').html('单');
		} else if(id == 12) {

			$('#thenumber1').html('双');
		}

		win1();
	})

	$("#plus").on("click", function() {

		count++;

		$("#input").val(count);

		$('#count').html(count);

		$('#countTotal').html(count * 9.5);
		if(count >= 0) {
			$("#sub").removeAttr("disabled");
		}
	})

	$("#sub").on("click", function() {
		if(count <= 1) {
			$("#sub").attr("disabled", "disabled");
		} else {
			$("#sub").removeAttr("disabled");
			count--;

		}
		$("#input").val(count);

		$('#count').html(count);

		$('#countTotal').html(count * 9.5);
	})

	$("#plus1").on("click", function() {

		count1 += 5;

		$("#input1").val(count1);

		$('#count1').html(count1);

		$('#countTotal1').html(parseFloat(count1 * 1.9).toFixed(1));
		if(count1 >= 0) {
			$("#sub1").removeAttr("disabled");
		}
	})

	$("#sub1").on("click", function() {
		if(count1 <= 5) {
			$("#sub1").attr("disabled", "disabled");
		} else {
			$("#sub1").removeAttr("disabled");
			count1 -= 5;

		}
		$("#input1").val(count1);

		$('#count1').html(count1);

		$('#countTotal1').html(parseFloat(count1 * 1.9).toFixed(1));
	})
	//购买
	$('#buyBtn').on('click', function(e) {
		//获取thenumber,thecount,buyId	
		var thenumber = parseInt($('#input').val());
		var label     = '1';
		    buyId     = parseInt($('#NewbuyId').html());
		//前台判断
		if(thenumber > 100) {

			$('.alert').html('竞猜数量不能超过100');
			$('.alertBox').show();
			setTimeout(function() {
				$('.alertBox').hide();
			}, 1000)
			return
		}

		if(thenumber < 1) {

			$('.alert').html('输入正确的数量');
			$('.alertBox').show();
			setTimeout(function() {
				$('.alertBox').hide();
			}, 1000)

			return
		}

		buy(userid,id,thenumber,buyId,label);
	})
	//买大小单双
	$('#buyBtn1').on('click', function(e) {
		//获取thenumber,thecount,buyId	
		var thenumber = parseInt($('#input1').val());
		var label;
		buyId = parseInt($('#NewbuyId').html());
		if(id == 11 || id == 12) {
			label = '2';
		} else if(id == 13 || id == 14) {
			label = '3';
		}
		//前台判断
		if(thenumber > 100) {

			$('.alert').html('竞猜数量不能超过100');
			$('.alertBox').show();
			setTimeout(function() {
				$('.alertBox').hide();
			}, 1000)
			return
		}

		if(thenumber < 5) {

			$('.alert').html('输入正确的数量');
			$('.alertBox').show();
			setTimeout(function() {
				$('.alertBox').hide();
			}, 1000)

			return
		}
		//判断是买单双还是大小
		buy(userid,id,thenumber,buyId,label);
	})	
});

function change(value) {
	if(value < 1) {

		$('.alert').html('请输入正确的数量');
		$('.alertBox').show();
		setTimeout(function() {
			$('.alertBox').hide();
		}, 1000)

		return

	}

	count = value;

	$('#count').html(count);

	$('#countTotal').html(count * 9.5);

}

function getNodeTime() {
	$.ajax({
		type   : "post",
		url    : "/nodeTime",
		async  : false,
		success: function(data) {
			if(data.res == 200) {
				let startTime  = data.data.startTime;
				let endTime    = data.data.endTime;
				let nowTime    = data.data.nodeTime;
				let personTime = new Date().getTime();
				//当前服务器时间存缓存
				localStorage.setItem("nowTime", nowTime);
				//公钥存缓存
				localStorage.setItem("publicKey", data.data.publicKey);
				//存用户当前时间
				localStorage.setItem("personTime", personTime);

				let intDiff = (parseInt(endTime) - parseInt(nowTime)) / 1000;
				if(intDiff < 60) {
					//这里要显示遮盖层  方便每次系统调试
					$('.allAlert').html('待开奖，不允许购买')
					$('.allAlert').show();
				}
				//计算倒计时时间用结束时间  减去现在时间
				timer(intDiff);
			}

		},
		error: function(error) {
			console.error(error);
		}
	});
}

function timer(intDiff) {

	var t1 = window.setInterval(function() {

		var day = 0,

			hour = 0,

			minute = 0,

			second = 0;  //时间默认值		

		if(intDiff > 0) {

			day = Math.floor(intDiff / (60 * 60 * 24));

			hour = Math.floor(intDiff / (60 * 60)) - (day * 24);

			minute = Math.floor(intDiff / 60) - (day * 24 * 60) - (hour * 60);

			second = Math.floor(intDiff) - (day * 24 * 60 * 60) - (hour * 60 * 60) - (minute * 60);

		} else {

			window.clearInterval(t1);

			window.location.href = '/guessGame';

		}

		if(minute <= 9) minute = '0' + minute;

		if(second <= 9) second = '0' + second;

		$('#minute_show').html('<s></s>' + minute + '分');

		$('#second_show').html('<s></s>' + second + '秒');

		if(intDiff < 60) {
			//刷新页面
			$('.allAlert').html('待开奖，不允许购买')
			$('.allAlert').show();
		}

		intDiff--;

	}, 1000);

}

//购买
function buy(userid,id,thenumber,buyId,lable) {
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
		'userid': '10003',
		'number': id,
		'count' : thenumber,
		'buyId' : buyId,
		'lable' : lable
	}
	
	var sign = function(param) {

		var array = new Array();
		for(var key in param) {
			array.push(key);
		}
		array.sort();

		// 拼接有序的参数名-值串
		var paramArray = new Array();

		for(var index in array) {
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
		url  : "/guessNum/run",
		async: false,
		data : {	
			'timeStamp': NewtimeStamp,
			'noncestr' : noncestr,
			'sign'     : Newsign,
			'content'  : encryptKey
		},
		success: function(data) {
			// console.log(data);
			if(data.res == 200) {

				$('.alert').html(data.resMsg);
				$('.alertBox').show();
				setTimeout(function() {
					$('.alertBox').hide();
				}, 1000)

			} else {

				$('.alert').html(data.resMsg);
				$('.alertBox').show();
				setTimeout(function() {
					$('.alertBox').hide();
				}, 1000)

			}

		},
		error: function(error) {
			console.error(error)
		}
	});
}

//获取时间戳的方法
function getTimeS(time) {

	var theTime = localStorage.getItem("nowTime");

	if(theTime == null) {

		localStorage.setItem("nowTime", time);

	} else {

		localStorage.setItem("nowTime", time);
	}

}