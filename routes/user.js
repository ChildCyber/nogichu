const express = require('express');
const router = express.Router();

/**
 * 用户注册页
 */
router.route('/register')
    .all(Auth.loggedIn)
    .get((req, res) => {
      res.render('user/register.ejs');
    })
    .post((req, res) => {
      // 注册成功就将当前用户登录
      const db = req.app.locals.db;
      // 参数验证
      let postData = req.body;
      let phone = postData.phone || null;
      let password = postData.password || null;
      let pc = postData.password_confirmation || null;
      let agree = postData.agree || null;
      let err = {};
      if (!phone || phone.length < 11) {
        err.phoneHelpText = '请填写正确的手机号码';
      }
      if (password !== pc) {
        err.passwordHelpText = '输入密码 二次确认不匹配';
      }
      if (!password || password.length < 8) {
        err.passwordHelpText = '输入密码 的最小长度为 8 字符';
      }
      if (!pc || pc.length < 8) {
        err.passwordHelpText = '输入密码 的最小长度为 8 字符';
      }
      if (agree !== '1') {
        err.nameHelpText = '您必须同意《乃木坂46中国会员站用户协议后》';
      }

      if (Object.keys(err).length !== 0) {
        Object.assign(err, postData);
        res.render('user/register.ejs', err)
      } else {
        db.collection('user').findOne({'phone': phone})
            .then(data => {
              if (data === null) {
                // 创建用户
                db.collection('user').insertOne({'phone': phone, 'password': util.hashPassword(password)});
                // 用户登录
                req.session.logined = true;
                req.session.phone = phone;
                res.redirect('/user-info');
              } else {
                res.render('user/register.ejs', {'nameHelpText': '注册失败，请稍后重试'});
              }
            });
      }
    });

module.exports = router;
