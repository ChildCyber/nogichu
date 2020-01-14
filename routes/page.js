const express = require('express');
const router = express.Router();

/**
 * banner部分，详情页
 */
router.get('/top-banner:id', (req, res) => {
    res.render('page/top-banner' + req.params.id, req.ev);
});

/**
 * 会员特典
 */
router.get('/member-benefits', (req, res) => {
    res.render('page/member-benefits', req.ev);
});

/**
 * 会员服务协议
 */
router.get('/agreement', (req, res) => {
    res.render('page/agreement', req.ev);
});

module.exports = router;
