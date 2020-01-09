const express = require('express');
const Auth = require('../middlewares/auth');
const util = require('../common/util');
const mail = require('../common/mail');
const router = express.Router();
const moment = require('moment');
moment.locale('zh-cn');

/**
 * 修改密码
 */
router.route('/user-password')
    .all(Auth.notLoggedIn)
    .get((req, res) => {
        const db = req.app.locals.db;
        db.collection('profile').findOne({'name': req.session.user})
            .then(data => {
                res.render('password/reset-password.ejs', {
                    'user': req.session.user,
                    'login': req.session.logined,
                    'premium': req.session.premium,
                    'email': data ? data.email : ''
                });
            })
    })
    .post((req, res) => {
        // 参数校验
        // todo 添加判断用户名和邮箱验证
        const db = req.app.locals.db;
        let postData = req.body;
        let password = postData.password || null;
        let pc = postData.password_confirmation || null;
        if (password !== pc) {
            return res.render('password/reset-password.ejs', {
                'passwordHelpText': '输入密码 二次确认不匹配',
                'user': req.session.user,
                'login': req.session.logined,
                'premium': req.session.premium,
                'email': ''
            });
        }
        // 官网未做该验证
        if (!password || password.length < 8) {
            return res.render('password/reset-password.ejs', {
                'passwordHelpText': '输入密码 的最小长度为 8 字符',
                'user': req.session.user,
                'login': req.session.logined,
                'premium': req.session.premium,
                'email': ''
            });
        }

        // 修改密码
        db.collection('user').updateOne({'phone': req.session.phone}, {$set: {'password': util.hashPassword(password)}})
            .then(data => {
                if (data.result.ok === 1 && data.result.n !== 0) {
                    // 密码修改成功
                    res.redirect('/user-info');
                } else {
                    res.render('password/reset-password.ejs', {
                        'passwordHelpText': '用户不存在',
                        'user': req.session.user,
                        'login': req.session.logined,
                        'premium': req.session.premium,
                        'email': ''
                    });
                }
            })
            .catch(err => {
                console.log(err);
                res.render('password/reset-password.ejs', {
                    'passwordHelpText': '密码修改失败 请稍后重试',
                    'user': req.session.user,
                    'login': req.session.logined,
                    'premium': req.session.premium,
                    'email': ''
                });
            });
    });

module.exports = router;
