var _ = require('lodash');
var crypto = require("crypto");
var request = require('request');
var AccessKeyId;
var AccessKeySecret;

//请求路由
var url = {
	detect:'https://dtplus-cn-shanghai.data.aliyuncs.com/face/detect',//人脸检测定位
	attribute:"https://dtplus-cn-shanghai.data.aliyuncs.com/face/attribute",//人脸属性
	verify:"https://dtplus-cn-shanghai.data.aliyuncs.com/face/verify",//人脸比对
	baseUrl:"https://face.cn-shanghai.aliyuncs.com/"//人脸搜索1:N基础路由
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
		url:url.detect,
		method:"post",
		headers:{"Content-Type":"application/json"},
		body:body
	};
	return new Promise(function(resolve,reject){
		request(options,function(error, response, body){
			if(error){
				return reject(error);
			}
			console.log(body);
			resolve(body);
		});
	});
};

/**
 * 初始化人脸客户端
 * @author penguinhj
 * @DateTime 2019-10-10T11:20:54+0800
 * @param    {[Object]}                 opt [注册参数]
 * @param    {[String]}                 AccessKeyId [阿里云访问id]
 * @param    {[String]}                 AccessKeySecret [阿里云访问密钥]
 */
exports.init = function(opt){
	if(opt){
		AccessKeyId = opt.AccessKeyId;
		AccessKeySecret = opt.AccessKeySecret;
	}
	return {
		detect:detect
	}

}