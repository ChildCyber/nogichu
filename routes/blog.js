const express = require('express');
const router = express.Router();

/**
 * 新闻资讯
 */
router.get('/', (req, res) => {
    res.render('blog/blog.ejs', req.ev);
});

/**
 * 资讯详情
 */
router.get(/.*/, (req, res) => {
    res.render('blog/blog-detail.ejs', req.ev);
});

module.exports = router;
