# Nogichu
![avatar](./public/images/logo.png)  

仿[乃木坂46中国会员站](https://www.nogizaka46-cn.com)  
采用 Express 实现  
移除原站点的会员支付、短信验证功能  

**本项目仅供学习交流，严禁用于商业用途**

## 项目依赖
* Node.js
* MongoDB

## 安装
```shell script
npm install
```

## 数据导入
```shell script
mongoimport -d nogi -c member --drop --jsonArray < ./data/members.json
mongoimport -d nogi -c photos --drop --jsonArray < ./data/member-photo.json
```

## 运行
```shell script
node app.js

浏览器访问:
http://localhost:3000
```

## ChangeLog
### v20200111
* 初始版本
* 完成用户系统
* 麻衣様卒業おめでとう

## Todo
移除MongoDB binary存储  
admin页面

## License
Licensed under The MIT License