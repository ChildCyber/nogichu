const express = require('express');
const router = express.Router();

/**
 * 新闻资讯
 */
router.get('/', (req, res) => {
    // todo 分页
    let page = req.query.page || 0;
    res.render('blog/blog.ejs', req.ev);
});

/**
 * 资讯详情
 */
router.get('/:slug', (req, res) => {
    const db = req.app.locals.db;
    db.collection('blog').findOne({'slug': req.params.slug})
        .then(data => {
            if (data) {
                res.render('blog/blog-detail.ejs', data);
            } else {
                res.status(404).render('404');
            }
        })
        .catch(err => {
            console.error(err);
            res.send('程序异常，请稍后重试');
        });
});

module.exports = router;
