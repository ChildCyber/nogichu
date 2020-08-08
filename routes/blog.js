const express = require('express');
const router = express.Router();

/**
 * 新闻资讯
 */
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    let page = req.query.page || 0;
    let skip = 0;
    if (page > 1) {
        skip = (page - 1) * 12
    }
    db.collection('blog').find().limit(12).skip(skip).sort({created_at: -1}).toArray()
        .then(data => {
            res.render('blog/blog.ejs', {'data': data});
        })
        .catch(err => {
            console.error(err);
            res.send('程序异常，请稍后重试');
        });
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
