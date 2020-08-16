const express = require('express');
const router = express.Router();

/**
 * 先行门票抽选报名，活动列表
 */
router.get('/index', (req, res) => {
    res.render('ticket/ticket-index.ejs', req.ev);
});

/**
 * 先行门票抽选报名，特定活动
 */
router.get('/index-content/:id', (req, res) => {
    res.render('ticket/index-content.ejs', req.ev);
});

/**
 * 特定活动下某一场次
 */
router.get('/page/:mainId/:contentId', (req, res) => {
    res.render('ticket/ticket-page.ejs', req.ev);
});

/**
 * 报名
 */
router.get('/form/:mainId/:contentId', (req, res) => {
    // todo
    res.send('todo');
});

module.exports = router;
