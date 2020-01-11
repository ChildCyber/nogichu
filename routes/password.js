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

/**
 * 忘记密码
 */
// router.route('\^/password/reset\$',)
router.route(/^\/password\/reset?(?:\/(\d+)(?:\.\.(\d+))?)?/)
    .all(Auth.loggedIn)
    .get((req, res) => {
        // if (req.session.password_msg) {
        //     let password_msg = req.session.password_msg;
        //     // 删除session
        //     delete req.session.password_msg;
        //     res.render('forget-password.ejs', password_msg);
        // } else {
        //     res.render('forget-password.ejs');
        // }

        // 判断query中是否有token，页面中渲染token，验证token和邮箱是否对应
        let urlArr = req.originalUrl.split('/password/reset/');
        if (req.session.password_msg) {
            let password_msg = req.session.password_msg;
            // 删除session
            delete req.session.password_msg;
            res.render('password/forget-password.ejs', password_msg);
        } else if (urlArr.length === 1) {
            res.render('password/forget-password.ejs');
        } else {
            let token = urlArr[1].split('?')[0];
            res.render('password/email-password.ejs', {'token': token})
        }
    })
    .post((req, res) => {
        // todo 表单数据错误redirect本页面 url=req.originUrl+token+req.params 错误信息记录在session中
        const db = req.app.locals.db;
        // 验证参数
        let postData = req.body;
        let email = postData.email || null;
        let token = postData.token || null;
        let password = postData.password || null;
        let pc = postData.password_confirmation || null;
        // 错误信息
        let passwordHelpText = '';
        let passwordConfirmHelpText = '';
        let emailHelpText = '';
        if (!password || password.length < 8) {
            passwordHelpText = '输入密码 的最小长度为 8 字符';
        }
        if (!pc || pc.length < 8) {
            passwordConfirmHelpText = '输入密码 的最小长度为 8 字符';
        }
        if (password !== pc) {
            passwordHelpText = '输入密码 二次确认不匹配';
            passwordConfirmHelpText = '输入密码 二次确认不匹配';
        }
        db.collection('mail_token').findOne({'token': token})
            .then(data => {
                if (data && data.email !== email) {
                    // email和token对应不上
                    emailHelpText = '账号信息不存在！';
                    return res.render('email-password.ejs', {
                        'passwordHelpText': passwordHelpText,
                        'passwordConfirmHelpText': passwordConfirmHelpText,
                        'emailHelpText': emailHelpText,
                        'token': token
                    })
                } else if (moment().diff(data.created_at, "hour") > 1) {
                    // token过期
                    emailHelpText = '链接已失效！';
                    return res.render('email-password.ejs', {
                        'passwordHelpText': passwordHelpText,
                        'passwordConfirmHelpText': passwordConfirmHelpText,
                        'emailHelpText': emailHelpText,
                        'token': token
                    })
                } else {
                    return db.collection('profile').findOne({'email': email})
                }
            })
            .then(async data => {
                // todo 这部分逻辑有点问题
                let premium = await db.collection('premium').findOne({'phone': data.phone});
                // 修改密码&登录
                await db.collection('user').updateOne({'phone': data.phone}, {$set: {'password': util.hashPassword(password)}});
                req.session.logined = true;
                req.session.phone = data.phone;
                req.session.user = data.name;
                req.session.premium = premium;
                res.redirect('/mypage')
            })
            .catch(err => {
                console.error(err);
                res.render('email-password.ejs', {
                    'passwordHelpText': passwordHelpText,
                    'passwordConfirmHelpText': passwordConfirmHelpText,
                    'emailHelpText': '程序出错，请稍后重试',
                    'token': token
                })
            })
    });

/**
 * 发送重置密码邮件
 */
router.post('/password/email', (req, res) => {
    const db = req.app.locals.db;
    let postData = req.body;
    // 参数校验
    let email = postData.email || null;
    if (!email) {
        req.session.password_msg = {'emailHelpText': '账号信息不存在！'};
        return res.redirect('/password/reset')
    }

    // 根据email查询profile，根据email生成token，发送邮件
    let token = util.randomToken();
    db.collection('profile').findOne({'email': email})
        .then(data => {
            if (data) {
                return db.collection('mail_token').insertOne({
                    'email': email,
                    'token': token,
                    'created_at': new Date(),
                    'phone': data.phone,
                });
            } else {
                req.session.password_msg = {'emailHelpText': '账号信息不存在！'};
                return res.redirect('/password/reset')
            }
        })
        .then(data => {
            if (data) {
                req.session.password_msg = {'sendHelpText': '密码重置邮件已发送到您的邮箱！'};
                let port = req.app.get('env') === 'development' ? ':3000' : '';
                let url = req.protocol + '://' + req.hostname + port + '/password/reset/' + token + '?email=' + email;
                console.log(url);
                mail(email, url);
                res.redirect('/password/reset');
            } else {
                req.session.password_msg = {'sendHelpText': '邮件发送失败 请稍后重试！'};
                res.redirect('/password/reset');
            }
        })
        .catch(err => {
            console.warn(err);
            req.session.password_msg = {'sendHelpText': '邮件发送失败 请稍后重试！'};
            res.redirect('/password/reset');
        });
});

module.exports = router;
