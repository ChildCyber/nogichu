// 动态配置信息
const uri = "mongodb://mongo-container:27017";
const dbName = "nogi";
const email = {
    service: "QQex",
    user: "",
    pass: "",
};

module.exports = {
    mongoUrl: uri,
    dbName: dbName,
    email: email
};