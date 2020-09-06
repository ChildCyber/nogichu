const express = require('express');
const router = express.Router();
const moment = require('moment');
moment.locale('zh-cn');

/**
 * 新闻资讯
 */
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    let type = req.query.t;
    let page = Number(req.query.page) || 0;
    let skip = page > 1 ? (page - 1) * 12 : 0;
    let ev = Object.assign({}, req.ev);

    if (type === 'v' && req.session.premium) {
        db.collection('blog').find({'premium': true}).limit(12).skip(skip).sort({created_at: -1}).toArray()
            .then(data => {
                ev.data = data;
                res.render('blog/premium.ejs', ev);
            })
            .catch(err => {
                console.error(err);
                res.status(500).render('500');
            });
    } else {
        db.collection('blog').find({'premium': false}).limit(12).skip(skip).sort({created_at: -1}).toArray()
            .then(data => {
                ev.data = data;
                res.render('blog/blog.ejs', ev);
            })
            .catch(err => {
                console.error(err);
                res.status(500).render('500');
            });
    }
});

/**
 * 资讯详情
 */
router.get('/:slug', (req, res) => {
    const db = req.app.locals.db;
    let ev = Object.assign({}, req.ev);

    db.collection('blog').findOne({'slug': req.params.slug})
        .then(data => {
            if (data) {
                if (data.premium && !req.session.premium) {
                    res.render('need-premium', ev);
                }
                ev.data = data;
                ev.moment = moment;
                res.render('blog/blog-detail.ejs', ev);
            } else {
                res.status(404).render('404', ev);
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).render('500');
        });
});

module.exports = router;
