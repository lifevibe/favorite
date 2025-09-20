// Depends on tencentcloud-sdk-nodejs version 4.0.3 or higher

const tencentcloud = require("tencentcloud-sdk-nodejs-teo");

const TeoClient = tencentcloud.teo.v20220901.Client;

// 密钥信息从环境变量读取，需要提前在环境变量中设置 TENCENTCLOUD_SECRET_ID 和 TENCENTCLOUD_SECRET_KEY
// 使用环境变量方式可以避免密钥硬编码在代码中，提高安全性
// 生产环境建议使用更安全的密钥管理方案，如密钥管理系统 (KMS)、容器密钥注入等
// 请参见：https://cloud.tencent.com/document/product/1278/85305
// 密钥可前往官网控制台 https://console.cloud.tencent.com/cam/capi 进行获取
const clientConfig = {
  credential: {
    secretId: process.env.COS_SECRET_ID,
    secretKey: process.env.COS_SECRET_KEY,
  },
// 使用临时密钥示例
/*
  credential: {
    secretId: "SecretId",
    secretKey: "SecretKey",
    token: "Token",
  }
*/
  region: "",
  profile: {
    httpProfile: {
      endpoint: "teo.tencentcloudapi.com",
    },
  },
};

// 实例化要请求产品的 client 对象，clientProfile 是可选的
const client = new TeoClient(clientConfig);
const params = {
    "ZoneId": process.env.TEO_SITE_ID,
    "Type": "purge_host",
    "Targets": [
        "s.eallion.com"
    ]
};
client.CreatePurgeTask(params).then(
  (data) => {
    console.log(data);
  },
  (err) => {
    console.error("error", err);
  }
);