const path = require('path');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const util = require('../common/util');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/images/upload'))
    },
    filename: (req, file, cb) => {
        cb(null, util.randomToken(16).toString('hex') + '.' + file.originalname.split('.').slice(-1)[0])
    }
});

const upload = multer({
    storage: storage
});

// admin index模板页
router.get('/index', (req, res) => {
    // db查询，获取page & blog以及其下的更多页面
    const db = req.app.locals.db;

    function getPage() {
        return db.collection('page').find().limit(10).toArray()
    }

    function getBlog() {
        return db.collection('blog').find().limit(10).toArray()
    }

    Promise.all([getPage(), getBlog()])
        .then(data => {
            let [pages, blogs] = data;
            res.render('admin/index', {'pages': pages, 'blogs': blogs});
        })
        .catch(err => {
            console.error(err);
            res.send('程序异常，请稍后重试');
        });
});

// admin 修改模板页
router.get('/edit/:title', (req, res) => {
    const db = req.app.locals.db;
    db.collection('admin_data').findOne({'title': req.params.title})
        .then(data => {
            if (data) {
                res.render('admin/admin-edit', data);
            } else {
                res.status(404).render('404');
            }
        })
        .catch(err => {
            console.error(err);
            res.send('程序异常，请稍后重试');
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
    postData.updated_at = new Date();
    db.collection(name).update({'title': postData.title}, {$set: postData}, {upsert: true})
        .then(data => {
            if (data.result.ok === 1 && data.result.n !== 0) {
                res.send('success');
            } else {
                res.send('fail');
            }
        });
});

/**
 * 创建
 */
router.post('/insert/:name', (req, res) => {
    // created_at, title, content, created_by, updated_at
    // 校验参数
    let name = req.params.name || null;
    if (!name || !['page', 'blog'].includes(name)) {
        return res.send('wrong params');
    }
    const db = req.app.locals.db;
    let postData = req.body;
    if (Object.keys(postData).length === 0) {
        return res.send('wrong params')
    }
    if (postData.title && postData.title.includes('/')) {
        return res.send('标题不可以包含"/"')
    }
    console.log(postData);
    let now = new Date();
    db.collection(name).insertOne({
        'title': postData.title,
        'content': postData.content,
        'user': req.session.user,
        'created_at': now,
        'updated_at': now
    })
        .then(data => {
            if (data) {
                res.send('success')
            } else {
                res.send('fail')
            }
        });
});

// 图片上传接口
router.post('/up', upload.single('filedata'), (req, res) => {
    let minetype = req.file.mimetype;
    let types = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
    if (types.indexOf(minetype.split('/')[1]) === -1) {
        return res.send('wrong file type')
    }
    let url = `/images/upload/${req.file.filename}`;
    res.send({err: 0, msg: url, img: url});
});

/**
 * blog列表模板页
 */
router.get('/blog', (req, res) => {
    // 分页
    const db = req.app.locals.db;
    db.collection('blog').find().toArray()
        .then(data => {
            res.render('admin/blog-index', {'data': data});
        })
});

/**
 * 新建blog模板页
 */
router.get('\^/blog/add\$', (req, res) => {
    res.render('admin/admin-edit')
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
                res.render('admin/admin-edit', data);
            } else {
                res.status(404).render('404');
            }
        })
        .catch(err => {
            console.error(err);
            res.send('程序异常，请稍后重试');
        });
});

// admin 会员列表模板页
router.get('/page', (req, res) => {
    // 分页
    const db = req.app.locals.db;
    db.collection('page').find().toArray()
        .then(data => {
            res.render('admin/page-index', {'data': data});
        });
});

/**
 * 新建page模板页
 */
router.get('\^/page/add\$', (req, res) => {
    res.render('admin/admin-edit')
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
                res.render('admin/admin-edit', data);
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
