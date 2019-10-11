var _ = require('lodash');
var url = require('url');
var crypto = require("crypto");
var request = require('request');
var AccessKeyId;
var AccessKeySecret;

//请求路由
var urlConfig = {
	detect:'https://dtplus-cn-shanghai.data.aliyuncs.com/face/detect',//人脸检测定位
	attribute:"https://dtplus-cn-shanghai.data.aliyuncs.com/face/attribute",//人脸属性
	verify:"https://dtplus-cn-shanghai.data.aliyuncs.com/face/verify",//人脸比对
	baseUrl:"https://face.cn-shanghai.aliyuncs.com/"//人脸搜索1:N基础路由
}

var md5 = function(buffer) {
	var hash;
	hash = crypto.createHash('md5');
	hash.update(buffer);
	return hash.digest('base64');
};
     
var sha1 = function(stringToSign, secret) {
	return crypto.createHmac('sha1', secret).update(stringToSign).digest().toString('base64');
};

//获取格式化时间
function dateFormat(date, fmt) {
    if (null == date || undefined == date) return '';
    var o = {
        "M+": date.getMonth() + 1, //月份
        "d+": date.getDate(), //日
        "h+": date.getHours()-8, //小时
        "m+": date.getMinutes(), //分
        "s+": date.getSeconds(), //秒
        "S": date.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}


//获取头部验证参数
var getAuthorization = function(options){
	// step1: 组stringToSign [StringToSign = #{method}\\n#{accept}\\n#{data}\\n#{contentType}\\n#{date}\\n#{action}]
	var body = options.body || '';
	var bodymd5;
	if(body === void 0 || body === ''){
		bodymd5 = body;
	} else {
		bodymd5 = md5(new Buffer(body));
	}
	// console.log(bodymd5)
	var stringToSign = options.method + "\n" + options.headers.accept + "\n" + bodymd5 + "\n" + options.headers['content-type'] + "\n" + options.headers.date + "\n" + url.parse(options.url).path;
	// console.log("step1-Sign string:", stringToSign);
	// step2: 加密 [Signature = Base64( HMAC-SHA1( AccessSecret, UTF-8-Encoding-Of(StringToSign) ) )]
	var signature = sha1(stringToSign, AccessKeySecret);
	// console.log("step2-signature:", signature);
	// step3: 组authorization header [Authorization =  Dataplus AccessKeyId + ":" + Signature]
	var authHeader = "Dataplus " + AccessKeyId + ":" + signature;
	// console.log("step3-authorization Header:", authHeader);
	return authHeader;
	// console.log('authHeader', authHeader);
} 

//所有待签名参数按照字段名的ASCII 码从小到大排序（字典序）后，使用URL键值对的格式（即key1=value1&key2=value2…）拼接成字符串string1
function sortKey(info){
	var str = "";
	var keyArr = [];
	for (var key in info) {
		if(info[key]==""||!info[key]){
			continue;
		}
		keyArr.push(key);
	}
	keyArr.sort();
	for (var i = 0; i < keyArr.length; i++) {
		if(i>0){
			str += "&";
		}
		str += keyArr[i]+"="+info[keyArr[i]]

	}
	// str = str.replace(/%3A/g,"%253A")
	return  str;
};

//获取人脸检索的公共请求参数
var getRequryStr = function(options,body){
	//待签字符
	var readyStr;
	var obj = {
		Format:"JSON",
		Version:"2018-12-03",
		AccessKeyId:AccessKeyId,
		// Signature:getAuthorization(options),
		SignatureMethod:"HMAC-SHA1",
		// Timestamp:dateFormat(new Date(options.headers.date),'yyyy-MM-ddThh:mm:ssZ'),
		Timestamp:dateFormat(new Date(options.headers.date),'yyyy-MM-ddThh:mm:ssZ'),
		SignatureVersion:"1.0",
		SignatureNonce:Date.now()
	};
	// var obj = {
	// 	TimeStamp:"2016-02-23T12:46:24Z",
	// 	Format:"XML",
	// 	AccessKeyId:"testid",
	// 	Action:"DescribeRegions",
	// 	SignatureMethod:"HMAC-SHA1",
	// 	SignatureNonce:"3ee8c1b8-83d3-44af-a94f-4e0ad82fd6cf",
	// 	Version:"2014-05-26",
	// 	SignatureVersion:"1.0"
	// }
	for (var i in body) {
		obj[i] = encodeURIComponent(body[i]);
	}

	var str = sortKey(obj);
	readyStr = options.method + "&" + encodeURIComponent("/") + "&" + (encodeURIComponent(str)).replace(/%3A/g,"%253A");
	str += ("&Signature="+encodeURIComponent(sha1(readyStr,AccessKeySecret+"&")));
	str = str.toString();
	// console.log("readyStr");
	// console.log(readyStr);
	// console.log(sha1(readyStr,"testsecret&"));
	
	return  str;

}
   

/**
 * 人脸检测定位
 * @author penguinhj
 * @DateTime 2019-10-10T11:11:13+0800
 * @param    {[Number]}                 type [0: 通过url识别，参数image_url不为空；1: 通过图片content识别，参数content不为空]
 * @param    {[String]}                 image_url [输入图像URL]
 * @param    {[String]}                 content [图像内容，base64编码]
 * 注意：如使用JS调用，请在生成图片的base64编码前缀中去掉data:image/jpeg;base64
 */
var detect = function(opt){
	var body = {
		type:opt.type
	};
	switch(body.type){
		case 0:
			body.image_url = opt.image_url;
			break;
		case 1:
			body.content = opt.content;
			break;
	}

	var options = {
		url:urlConfig.detect,
		method:"POST",
		headers:{
			"accept": "application/json",
			"content-type":"application/json",
			"date": new Date().toUTCString(),
			"Authorization": ""
		},
		body:JSON.stringify(body)
	};
	options.headers.Authorization = getAuthorization(options);

	return new Promise(function(resolve,reject){
		request(options,function(error, response, body){
			if(error){
				return reject(error);
			}
			resolve(body);
		});
	});
};

/**
 * 人脸属性识别
 * @author penguinhj
 * @DateTime 2019-10-10T11:11:13+0800
 * @param    {[Number]}                 type [0: 通过url识别，参数image_url不为空；1: 通过图片content识别，参数content不为空]
 * @param    {[String]}                 image_url [输入图像URL]
 * @param    {[String]}                 content [图像内容，base64编码]
 * 注意：如使用JS调用，请在生成图片的base64编码前缀中去掉data:image/jpeg;base64
 */
var attribute = function(opt){
	var body = {
		type:opt.type
	};
	switch(body.type){
		case 0:
			body.image_url = opt.image_url;
			break;
		case 1:
			body.content = opt.content;
			break;
	}

	var options = {
		url:urlConfig.attribute,
		method:"POST",
		headers:{
			"accept": "application/json",
			"content-type":"application/json",
			"date": new Date().toUTCString(),
			"Authorization": ""
		},
		body:JSON.stringify(body)
	};
	options.headers.Authorization = getAuthorization(options);

	return new Promise(function(resolve,reject){
		request(options,function(error, response, body){
			if(error){
				return reject(error);
			}
			resolve(body);
		});
	});
};

/**
 * 人脸比对
 * @author penguinhj
 * @DateTime 2019-10-10T11:11:13+0800
 * @param    {[Number]}                 type [0: 通过url识别，参数image_url不为空；1: 通过图片content识别，参数content不为空]
 * @param    {[String]}                 image_url_1 [输入图片1的URL]
 * @param    {[String]}                 content_1 [输入图片2的内容，base64编码]
 * @param    {[String]}                 image_url_2 [输入图片2的URL]
 * @param    {[String]}                 content_2 [输入图片2的内容，base64编码]
 * 注意：如使用JS调用，请在生成图片的base64编码前缀中去掉data:image/jpeg;base64
 */
var verify = function(opt){
	var body = {
		type:opt.type
	};
	switch(body.type){
		case 0:
			body.image_url_1 = opt.image_url_1;
			body.image_url_2 = opt.image_url_2;
			break;
		case 1:
			body.content_1 = opt.content_1;
			body.content_2 = opt.content_2;
			break;
	}

	var options = {
		url:urlConfig.verify,
		method:"POST",
		headers:{
			"accept": "application/json",
			"content-type":"application/json",
			"date": new Date().toUTCString(),
			"Authorization": ""
		},
		body:JSON.stringify(body)
	};
	options.headers.Authorization = getAuthorization(options);

	return new Promise(function(resolve,reject){
		request(options,function(error, response, body){
			if(error){
				return reject(error);
			}
			resolve(body);
		});
	});
};

/**
 * 添加人脸
 * @author penguinhj
 * @DateTime 2019-10-10T16:27:22+0800
 * @param    {[String]}                 Group [新添加人脸的分组]
 * @param    {[String]}                 Image [新添加人脸的编号]
 * @param    {[String]}                 Person [新添加人脸的姓名]
 * @param    {[String]}                 ImageUrl [新添加人脸所在图片的URL地址，Content、ImageUrl同时存在取ImageUrl]
 * @param    {[String]}                 Content [新添加人脸所在图片的Base64内容，Content、ImageUrl同时存在取ImageUrl]
 */
var addFace = function(opt){
	var body = {
		Action:"AddFace",
		Group:opt.Group,
		Image:opt.Image,
		Person:opt.Person
	};

	if(opt.ImageUrl){
		body.ImageUrl = opt.ImageUrl;
	}else if(opt.Content){
		body.Content = opt.Content;
	}

	var options = {
		url:"",
		method:"POST",
		headers:{
			"accept": "application/json",
			"content-type":"application/json",
			"date": new Date().toUTCString()
		}
	};

	var url = urlConfig.baseUrl+"?";

	for (var i in body) {
		url += (i + "=" + body[i] + "&");
	}
	url += getRequryStr(options,body);

	options.url = url;

	// console.log(options);


	return new Promise(function(resolve,reject){
		request(options,function(error, response, body){
			if(error){
				return reject(error);
			}
			resolve(body);
		});
	});
}

/**
 * 删除人脸
 * @author penguinhj
 * @DateTime 2019-10-11T09:59:45+0800
 * @param    {[String]}                 Group [新添加人脸的分组]
 * @param    {[String]}                 Image [新添加人脸的编号]
 * @param    {[String]}                 Person [新添加人脸的姓名]
 */
var deleteFace = function(opt){
	var body = {
		Action:"DeleteFace",
		Group:opt.Group,
		Image:opt.Image,
		Person:opt.Person
	};

	var options = {
		url:"",
		method:"POST",
		headers:{
			"accept": "application/json",
			"content-type":"application/json",
			"date": new Date().toUTCString()
		}
	};

	var url = urlConfig.baseUrl+"?";

	for (var i in body) {
		url += (i + "=" + body[i] + "&");
	}
	url += getRequryStr(options,body);

	options.url = url;

	// console.log(options);


	return new Promise(function(resolve,reject){
		request(options,function(error, response, body){
			if(error){
				return reject(error);
			}
			resolve(body);
		});
	});
}

/**
 * 组内人脸列表
 * @author penguinhj
 * @DateTime 2019-10-11T10:22:24+0800
 * @param    {[String]}                 Group [新添加人脸的分组]
 */
var listFace = function(opt){
	var body = {
		Action:"ListFace",
		Group:opt.Group
	};

	var options = {
		url:"",
		method:"POST",
		headers:{
			"accept": "application/json",
			"content-type":"application/json",
			"date": new Date().toUTCString()
		}
	};

	var url = urlConfig.baseUrl+"?";

	for (var i in body) {
		url += (i + "=" + body[i] + "&");
	}
	url += getRequryStr(options,body);

	options.url = url;

	// console.log(options);


	return new Promise(function(resolve,reject){
		request(options,function(error, response, body){
			if(error){
				return reject(error);
			}
			resolve(body);
		});
	});
}

/**
 * 人脸组列表
 * @author penguinhj
 * @DateTime 2019-10-11T10:22:24+0800
 */
var listGroup = function(){
	var body = {
		Action:"ListGroup"
	};

	var options = {
		url:"",
		method:"POST",
		headers:{
			"accept": "application/json",
			"content-type":"application/json",
			"date": new Date().toUTCString()
		}
	};

	var url = urlConfig.baseUrl+"?";

	for (var i in body) {
		url += (i + "=" + body[i] + "&");
	}
	url += getRequryStr(options,body);

	options.url = url;

	// console.log(options);


	return new Promise(function(resolve,reject){
		request(options,function(error, response, body){
			if(error){
				return reject(error);
			}
			resolve(body);
		});
	});
}

/**
 * 人脸查找
 * @author penguinhj
 * @DateTime 2019-10-11T13:15:49+0800
 * @return   {[type]}                 [description]
 * @param    {[String]}                 ImageUrl [新添加人脸所在图片的URL地址，Content、ImageUrl同时存在取ImageUrl]
 * @param    {[String]}                 Content [新添加人脸所在图片的Base64内容，Content、ImageUrl同时存在取ImageUrl]
 */
var recognizeFace = function(opt){
	var body = {
		Action:"RecognizeFace",
		Group:opt.Group
	};

	if(opt.ImageUrl){
		body.ImageUrl = opt.ImageUrl;
	}else if(opt.Content){
		body.Content = opt.Content;
	}

	var options = {
		url:"",
		method:"POST",
		headers:{
			"accept": "application/json",
			"content-type":"application/json",
			"date": new Date().toUTCString()
		}
	};

	var url = urlConfig.baseUrl+"?";

	for (var i in body) {
		url += (i + "=" + body[i] + "&");
	}
	url += getRequryStr(options,body);

	options.url = url;

	console.log(options.url);


	return new Promise(function(resolve,reject){
		request(options,function(error, response, body){
			if(error){
				return reject(error);
			}
			resolve(body);
		});
	});
}

/**
 * 初始化人脸客户端
 * @author penguinhj
 * @DateTime 2019-10-10T11:20:54+0800
 * @param    {[Object]}                 opt [注册参数]
 * @param    {[String]}                 AccessKeyId [阿里云访问id]
 * @param    {[String]}                 AccessKeySecret [阿里云访问密钥]
 */
exports.init = function(opt){
	AccessKeyId = opt.AccessKeyId;
	AccessKeySecret = opt.AccessKeySecret;

	return {
		detect:detect,
		attribute:attribute,
		verify:verify,
		addFace:addFace,
		deleteFace:deleteFace,
		listFace:listFace,
		listGroup:listGroup,
		recognizeFace:recognizeFace
	}

}