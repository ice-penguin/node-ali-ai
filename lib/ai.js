var ViapiUtil = require('@alicloud/viapi-utils').default;
// 引入SDK
const Client = require('@alicloud/facebody-2019-12-30');
// 新版本ai客户端
let client;
let AccessKeyId;
let AccessKeySecret;

// 以下为新版本的接口，达摩院
// https://help.aliyun.com/document_detail/151969.html?spm=a2c4g.11186623.6.580.23ee6d98N0h1b9

async function upload(fileUrl){

    // 上传成功后，返回上传后的文件地址
    return await ViapiUtil.upload(AccessKeyId, AccessKeySecret, fileUrl);
  }

/**
 * 人脸检测定位
 * @param    {[String]}    ImageUrl [图片URL地址]
 */
var detectFace = function(opt){
	var body = {
		Action:"DetectFace",
		ImageURL:opt.ImageURL
	};
    const a = upload(opt.ImageURL)
    a
    .then(function(aa){
        console.log(aa)
    })
    .catch(function(err){
        console.log('err',err)
    })
    console.log(a)
    // console.log(ViapiUtil.upload(AccessKeyId, AccessKeySecret, opt.ImageURL))

	// return client.detectFace({
	// 	"ImageURL": await ViapiUtil.upload(AccessKeyId, AccessKeySecret, opt.ImageURL)
    // }, {timeout: 10000})
    // .then(function (data) {
	//     // console.log('Result:' + JSON.stringify(data)); 
	// }, function (err) {
    //     console.log('Error:' + err);
	// });

}
    
/**
 * 初始化AI客户端
 * @author penguinhj
 * @param    {[Object]}                 opt [注册参数]
 * @param    {[String]}                 AccessKeyId [阿里云访问id]
 * @param    {[String]}                 AccessKeySecret [阿里云访问密钥]
 */
exports.init = function(opt){
	AccessKeyId = opt.AccessKeyId;
	AccessKeySecret = opt.AccessKeySecret;

	// 创建新版本ai客户端
	client = new Client({
		accessKeyId: AccessKeyId,
		accessKeySecret: AccessKeySecret,
		securityToken: '', // 支持STS
		endpoint: 'https://facebody.cn-shanghai.aliyuncs.com'
	});

	return {
		face:{
            detectFace:detectFace
        }
	}

}