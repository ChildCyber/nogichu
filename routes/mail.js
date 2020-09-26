const express = require('express');
const router = express.Router();

// 停止邮件推送
router.get('/', (req, res) => {
    res.render('withdrawal', req.ev);
});

router.get('/save', (req, res) => {
    res.render('withdrawal-save', req.ev);
});

module.exports = router;
