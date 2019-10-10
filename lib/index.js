var face = require('./face');

/**
 * 初始化阿里云客户端
 * @author penguinhj
 * @DateTime 2019-10-10T11:20:54+0800
 * @param    {[Object]}                 opt [注册参数]
 * @param    {[String]}                 AccessKeyId [阿里云访问id]
 * @param    {[String]}                 AccessKeySecret [阿里云访问密钥]
 */
exports.init = function(opt){
	return{
		face:face.init(opt)
	}
}