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

//人脸检测定位
var detect = function(){

};

module.exports = {
	url:url
}