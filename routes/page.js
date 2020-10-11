const express = require('express');
const router = express.Router();

/**
 * banner部分，详情页
 */
router.get('/top-banner:id', (req, res) => {
    let id = req.params.id;
    if (id === '1' || id === '2' || id === '3') {
        res.render('page/top-banner' + id, req.ev);
    } else {
        res.status(404).render('404', req.ev);
    }
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
    if (req.baseUrl === "") {
        res.render('page/home-agreement', req.ev);
    } else {
        res.render('page/agreement', req.ev);
    }
});

module.exports = router;
