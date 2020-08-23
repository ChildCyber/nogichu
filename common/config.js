// 动态配置信息
const uri = "mongodb://mongo:27017";
const dbName = "nogi";
const dbConnTimeout = 5000;
const email = {
    service: "QQex",
    user: "",
    pass: "",
};

module.exports = {
    mongoUrl: uri,
    dbName: dbName,
    email: email,
    dbConnTimeout: dbConnTimeout,
};