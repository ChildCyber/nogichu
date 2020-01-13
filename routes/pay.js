const express = require('express');
const router = express.Router();
const Auth = require('../middlewares/auth');
const util = require('../common/util');
const moment = require('moment');
moment.locale('zh-cn');

/**
 * 支付宝支付
 */
router.get('/pay-alipay', Auth.notLoggedIn, (req, res) => {
    const db = req.app.locals.db;

    db.collection('premium').findOne({'phone': req.session.phone, 'user': req.session.user})
        .then(data => {
            if (data) {
                let now = new Date();
                if (now < data.expired_at) {
                    return res.redirect('/mypage');
                } else {
                    let expiredAt = new Date(now.getTime());
                    expiredAt.setFullYear(expiredAt.getFullYear() + 1);
                    return db.collection('premium').updateOne({
                        'phone': req.session.phone,
                        'user': req.session.user
                    }, {$set: {'expired_at': expiredAt}})
                }
            } else {
                let createdAt = new Date();
                let expiredAt = new Date(createdAt.getTime());
                expiredAt.setFullYear(expiredAt.getFullYear() + 1);
                return db.collection('premium').insertOne({
                    'phone': req.session.phone,
                    'user': req.session.user,
                    'created_at': createdAt,
                    'expired_at': expiredAt,
                    'point': 0,
                    'id': util.randomString()
                });
            }
        })
        .then(data => {
            if (data) {
                console.log(data.ops[0]);
                req.session.premium = data.ops[0];
                res.redirect('/mypage');
            }
        })
        .catch(err => {
            console.error(err);
            res.send('充值失败，请稍后重试')
        });
});

/**
 * 支付
 */
router.get('/pay', Auth.notLoggedIn, (req, res) => {
    res.render('pay.ejs', {
        'login': req.session.logined,
        'user': req.session.user,
        'premium': req.session.premium,
        'csrf': req.csrfToken()
    });
});

module.exports = router;
