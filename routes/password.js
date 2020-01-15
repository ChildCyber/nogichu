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
                let ev = Object.assign({}, req.ev);
                ev.email = data ? data.email : '';
                res.render('password/reset-password.ejs', ev);
            })
    })
    .post((req, res) => {
        // 参数校验
        // todo 添加判断用户名和邮箱验证
        const db = req.app.locals.db;
        let postData = req.body;
        let password = postData.password || null;
        let pc = postData.password_confirmation || null;
        let ev = Object.assign({}, req.ev);
        ev.email = postData.email ? postData.email : '';
        if (password !== pc) {
            ev.passwordHelpText = '输入密码 二次确认不匹配';
            return res.render('password/reset-password.ejs', ev);
        }
        // 官网未做该验证
        if (!password || password.length < 8) {
            ev.passwordHelpText = '输入密码 的最小长度为 8 字符';
            return res.render('password/reset-password.ejs', ev);
        }

        // 修改密码
        db.collection('user').updateOne({'phone': req.session.phone}, {$set: {'password': util.hashPassword(password)}})
            .then(data => {
                if (data.result.ok === 1 && data.result.n !== 0) {
                    // 密码修改成功
                    res.redirect('/user-info');
                } else {
                    ev.passwordHelpText = '用户不存在';
                    res.render('password/reset-password.ejs', ev);
                }
            })
            .catch(err => {
                console.log(err);
                ev.passwordHelpText = '密码修改失败 请稍后重试';
                res.render('password/reset-password.ejs', ev);
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
            password_msg.csrf = req.csrfToken();
            // 删除session
            delete req.session.password_msg;
            res.render('password/forget-password.ejs', password_msg);
        } else if (urlArr.length === 1) {
            res.render('password/forget-password.ejs', {'csrf': req.csrfToken()});
        } else {
            let token = urlArr[1].split('?')[0];
            res.render('password/email-password.ejs', {'token': token, 'csrf': req.csrfToken()})
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
        let msg = Object.create(null);
        if (!password || password.length < 8) {
            msg.passwordHelpText = '输入密码 的最小长度为 8 字符';
        }
        if (!pc || pc.length < 8) {
            msg.passwordConfirmHelpText = '输入密码 的最小长度为 8 字符';
        }
        if (password !== pc) {
            msg.passwordHelpText = '输入密码 二次确认不匹配';
            msg.passwordConfirmHelpText = '输入密码 二次确认不匹配';
        }
        if (Object.keys(msg).length !== 0) {
            msg.token = token;
            msg.csrf = req.csrfToken();
            return res.render('password/email-password.ejs', msg)
        }
        db.collection('mail_token').findOne({'token': token})
            .then(data => {
                if (data && data.email !== email) {
                    // email和token对应不上
                    msg.emailHelpText = '账号信息不存在！';
                    msg.csrf = req.csrfToken();
                    msg.token = token;
                    throw msg;
                } else if (moment().diff(data.created_at, "hour") > 1) {
                    // token过期
                    msg.emailHelpText = '此密码重置令牌无效';
                    msg.csrf = req.csrfToken();
                    msg.token = token;
                    throw msg;
                } else {
                    return db.collection('profile').findOne({'email': email})
                }
            })
            .then(async data => {
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
                res.render('password/email-password.ejs', err)
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
    let token = util.randomToken(32);
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
