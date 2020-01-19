const express = require('express');
const router = express.Router();

/**
 * 成员列表模板页
 */
router.get('/index', (req, res) => {
    const db = req.app.locals.db;

    function getYonKiSei() {
        return db.collection('member').find({'tags': '四期生'}).sort({id: 1}).project({
            photo: 1,
            name: 1,
            romaji: 1,
            id: 1,
            _id: 0
        }).toArray()
    }

    function getMembers() {
        return db.collection('member').find({'tags': {$ne: '四期生'}}).sort({id: 1}).project({
            photo: 1,
            name: 1,
            romaji: 1,
            id: 1,
            _id: 0
        }).toArray()
    }

    Promise.all([getYonKiSei(), getMembers()])
        .then(data => {
            let [yonKiSei, members] = data;
            let ev = Object.assign({}, req.ev);
            ev.yonKiSei = yonKiSei;
            ev.members = members;
            res.render('member/member-index.ejs', ev);
        })
        .catch(err => {
            console.error(err);
            res.send('程序异常，请稍后重试');
        });
});

/**
 * 成员详情模板页
 */
router.get('/view/:id', (req, res) => {
    const db = req.app.locals.db;
    db.collection('member').findOne({'id': parseInt(req.params.id)}, {projection: {_id: 0}})
        .then(data => {
            let ev= req.ev;
            if (data) {
                ev.member = Object.assign({}, data);
                res.render('member/member-detail.ejs', ev);
            } else {
                res.status(404).render('404.ejs', ev);
            }
        })
        .catch(err => {
            console.error(err);
            res.send('程序异常，请稍后重试')
        });
});

module.exports = router;
