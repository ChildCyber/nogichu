const path = require('path');
const express = require('express');
const multer = require('multer');
const router = express.Router();
const util = require('../common/util');

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(__dirname, '../public/images/upload'))
        },
        filename: (req, file, cb) => {
            cb(null, util.randomToken(16) + '.' + file.originalname.split('.').slice(-1)[0])
        }
    })
});

// admin index模板页
router.get('/index', (req, res) => {
    const db = req.app.locals.db;

    function getPage() {
        return db.collection('page').find().sort({created_at: -1}).limit(10).toArray();
    }

    function getBlog() {
        return db.collection('blog').find().sort({created_at: -1}).limit(10).toArray();
    }

    Promise.all([getPage(), getBlog()])
        .then(data => {
            let [pages, blogs] = data;
            res.render('admin/index', {'pages': pages, 'blogs': blogs});
        })
        .catch(err => {
            console.error(err);
            res.status(500).render('500');
        });
});

/**
 * 更新
 */
router.post('/update/:name', (req, res) => {
    // 校验参数
    let name = req.params.name || null;
    if (!name || !['page', 'blog'].includes(name)) {
        return res.send('wrong params');
    }
    // 修改更新时间
    const db = req.app.locals.db;
    let postData = req.body;
    delete postData._csrf;
    postData.updated_at = new Date();
    db.collection(name).update({'title': postData.title}, {$set: postData}, {upsert: true})
        .then(data => {
            if (data.result.ok === 1 && data.result.n !== 0) {
                res.redirect('/admin/index');
            } else {
                res.send('fail');
            }
        });
});

/**
 * 创建
 */
router.post('/insert/:name', (req, res) => {
    const db = req.app.locals.db;

    // created_at, title, content, created_by, updated_at
    // 校验参数
    let name = req.params.name || null;
    if (!name || !['page', 'blog'].includes(name)) {
        return res.send('wrong params');
    }

    let postData = req.body;
    if (Object.keys(postData).length === 0) {
        return res.send('wrong params');
    }
    if (postData.title && postData.title.includes('/')) {
        return res.send('标题不可以包含"/"');
    }

    let now = new Date();
    db.collection(name).insertOne({
        'title': postData.title,
        'slug': postData.slug,
        'content': postData.content,
        'premium': Boolean(postData.premium),
        'category': postData.category,
        'user': req.session.user,
        'created_at': now,
        'updated_at': now
    })
        .then(data => {
            if (data) {
                res.redirect("/admin/" + name);
            } else {
                res.send('fail');
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).render('500');
        });
});

// 图片上传接口
router.post('/up', upload.single('filedata'), (req, res) => {
    let minetype = req.file.mimetype;
    let types = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
    if (types.indexOf(minetype.split('/')[1]) === -1) {
        return res.send('wrong file type');
    }

    let url = `/images/upload/${req.file.filename}`;
    res.send({err: 0, msg: url, img: url});
});

/**
 * blog列表模板页
 */
router.get('/blog', (req, res) => {
    // todo 分页
    const db = req.app.locals.db;
    db.collection('blog').find().sort({created_at: -1}).toArray()
        .then(data => {
            res.render('admin/blog-index', {'data': data});
        })
        .catch(err => {
            console.error(err);
            res.status(500).render('500');
        });
});

/**
 * 新建blog模板页
 */
router.get('\^/blog/add\$', (req, res) => {
    res.render('admin/admin-edit', req.ev);
});

/**
 * 渲染blog详情页
 */
router.get('/blog/:title', (req, res) => {
    // 查看 & 修改
    const db = req.app.locals.db;
    db.collection('blog').findOne({'title': req.params.title})
        .then(data => {
            if (data) {
                let ev = Object.assign({}, req.ev);
                ev.data = data;
                console.log(ev);
                res.render('admin/admin-edit', ev);
            } else {
                res.status(404).render('404');
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).render('500');
        });
});

// admin 会员列表模板页
router.get('/page', (req, res) => {
    // 分页
    const db = req.app.locals.db;
    db.collection('page').find().toArray()
        .then(data => {
            res.render('admin/page-index', {'data': data});
        })
        .catch(err => {
            console.error(err);
            res.status(500).render('500');
        });
});

/**
 * 新建page模板页
 */
router.get('\^/page/add\$', (req, res) => {
    res.render('admin/admin-edit', req.ev);
});

/**
 * 渲染会员详情页
 */
router.get('/page/:title', (req, res) => {
    // 查看 & 修改
    const db = req.app.locals.db;
    db.collection('page').findOne({'title': req.params.title})
        .then(data => {
            if (data) {
                let ev = Object.assign({}, req.ev);
                ev.data = data;
                res.render('admin/admin-edit', ev);
            } else {
                res.status(404).render('404');
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).render('500');
        });
});

module.exports = router;
