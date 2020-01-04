const express = require('express');
const router = express.Router();

/**
 * 用户登录页
 */
router.route('/login')
    .all(Auth.loggedIn)
    .get((req, res) => {
      res.render('user/login.ejs');
    })
    .post((req, res) => {
      const db = req.app.locals.db;
      let postData = req.body;
      let phone = postData.phone || null;
      let password = postData.password || null;

      function getUser() {
        return db.collection('user').findOne({'phone': phone, 'password': util.hashPassword(password)});
      }

      function getProfile() {
        return db.collection('profile').findOne({'phone': phone});
      }

      function getPremium() {
        return db.collection('premium').findOne({'phone': phone});
      }

      Promise.all([getUser(), getProfile(), getPremium()])
          .then(data => {
            let [user, profile, premium] = data;
            if (user != null) {
              req.session.regenerate((err) => {
                if (err) {
                  console.log(err);
                  res.send('登录失败，请稍后重试');
                }
                req.session.logined = true;
                req.session.phone = phone;
                req.session.user = profile ? profile.name : null;
                req.session.premium = premium;
                // 登录成功
                res.redirect('/mypage');
              });
            } else {
              res.render('user/login.ejs', {'err': '您的信息输入错误，请检查后重新输入', 'phone': phone});
            }
          })
          .catch((err) => {
            console.error(err);
            res.render('user/login.ejs', {'err': '登录失败，请稍后重试', 'phone': phone});
          });
    });

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
