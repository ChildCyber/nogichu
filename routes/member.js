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
            // todo 不用binary存储
            for (let i = 0; i < members.length; i++) {
                members[i].photo = new Buffer(members[i].photo.buffer, 'binary').toString('base64');
            }
            for (let i = 0; i < yonKiSei.length; i++) {
                yonKiSei[i].photo = new Buffer(yonKiSei[i].photo.buffer, 'binary').toString('base64');
            }
            res.render('member/member-index.ejs', {
                'user': req.session.user,
                'login': req.session.logined,
                'premium': req.session.premium,
                'yonKiSei': yonKiSei,
                'members': members
            });
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
            if (data) {
                let member = Object.assign({}, data);
                member.photo = new Buffer(data.photo.buffer, 'binary').toString('base64');
                res.render('member/member-detail.ejs', {
                    'member': member,
                    'user': req.session.user,
                    'login': req.session.logined,
                    'premium': req.session.premium
                });
            } else {
                res.status(404).render('404.ejs', {
                    'login': req.session.logined,
                    'user': req.session.user,
                    'premium': req.session.premium
                });
            }
        })
        .catch(err => {
            console.error(err);
            res.send('error')
        });
});

module.exports = router;
