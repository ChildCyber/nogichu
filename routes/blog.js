const express = require('express');
const router = express.Router();

/**
 * 新闻资讯
 */
router.get('/', (req, res) => {
    res.render('blog/blog.ejs', {
        'user': req.session.user,
        'login': req.session.logined,
        'premium': req.session.premium
    });
});

/**
 * 资讯详情
 */
router.get(/.*/, (req, res) => {
    res.render('blog/blog-detail.ejs', {
        'user': req.session.user,
        'login': req.session.logined,
        'premium': req.session.premium
    });
});

module.exports = router;
