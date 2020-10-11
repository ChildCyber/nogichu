const express = require('express');
const router = express.Router();
const Auth = require('../middlewares/auth');

// 停止邮件推送
router.get('/', Auth.requireLogin, (req, res) => {
    res.render('withdrawal', req.ev);
});

// 停止邮件推送完成
router.get('/save', Auth.requireLogin, (req, res) => {
    res.render('withdrawal-save', req.ev);
});

module.exports = router;
