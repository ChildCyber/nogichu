const express = require('express');
const router = express.Router();
const util = require('../common/util');
const moment = require('moment');
moment.locale('zh-cn');

/**
 * 先行门票抽选报名，活动列表
 */
router.get('/index', (req, res) => {
    const db = req.app.locals.db;
    let ev = Object.assign({}, req.ev);
    db.collection('ticket').find().sort({id: 1}).toArray()
        .then(data => {
            ev.data = data;
            res.render('ticket/ticket-index', ev);
        })
        .catch(err => {
            console.error(err.stack);
            res.status(500).render('500');
        });
});

/**
 * 先行门票抽选报名，特定活动
 */
router.get('/index-content/:mainId', (req, res) => {
    const db = req.app.locals.db;
    let ev = Object.assign({}, req.ev);

    function getTicketSessions() {
        return db.collection('ticket_session').find({'live_id': parseInt(req.params.mainId)}).sort({id: 1}).toArray()
    }

    function getUserTicketApplies() {
        return db.collection('ticket_apply').find({
            'user': req.ev.user,
            'ticket_main_id': req.params.mainId,
            'status': {$ne: 'canceled'}
        }).toArray()
    }

    Promise.all([getTicketSessions(), getUserTicketApplies()])
        .then(data => {
            let [sessions, applies] = data;
            if (sessions.length !== 0) {
                let m = new Map();
                for (let i = 0; i < applies.length; i++) {
                    if (applies[i].status === "applied") {
                        m.set(parseInt(applies[i].ticket_content_id), applies[i]);
                    }
                }
                for (let i = 0; i < sessions.length; i++) {
                    if (m.has(sessions[i].id)) {
                        sessions[i].status = "applied";
                    }
                }

                ev.data = sessions;
                ev.moment = moment;
                res.render('ticket/index-content', ev);
            } else {
                res.status(404).render('404', ev);
            }
        })
        .catch(err => {
            console.error(err.stack);
            res.status(500).render('500');
        });
});

/**
 * 特定活动下某一场次
 */
router.get('/page/:mainId/:contentId', (req, res) => {
    const db = req.app.locals.db;
    let ev = Object.assign({}, req.ev);
    let main_id = parseInt(req.params.mainId);
    let content_id = parseInt(req.params.contentId);
    ev.main_id = main_id;
    ev.content_id = content_id;

    db.collection('ticket').findOne({'id': main_id})
        .then(data => {
            if (data) {
                return new Promise(resolve => {
                    resolve([data, db.collection('ticket_apply').findOne({
                        'user': req.ev.user,
                        'ticket_main_id': req.params.mainId,
                        'ticket_content_id': req.params.contentId,
                        'status': {$ne: 'canceled'}
                    })])
                })
            } else {
                res.status(404).render('404', ev);
            }
        })
        .then(async data => {
            let live = await data[0];
            let applies = await data[1];
            if (applies === null) {
                ev.data = live;
                res.render('ticket/ticket-page', ev);
            } else {
                res.redirect('/ticket/view/' + main_id + '/' + content_id);
            }
        })
        .catch(err => {
            console.error(err.stack);
            res.status(500).render('500');
        });
});

/**
 * 指定场次报名，填写报名表单
 */
router.get('/form/:mainId/:contentId', (req, res) => {
    const db = req.app.locals.db;

    let ev = Object.assign({}, req.ev);
    ev.token = req.query._token || req.csrfToken();
    ev.agree = req.query.agree || 1;
    ev.main_id = req.params.mainId || req.query.ticket_main_id;
    ev.content_id = req.params.contentId || req.query.ticket_content_id;

    db.collection('ticket_apply').findOne({
        'user': req.ev.user,
        'ticket_main_id': req.params.mainId,
        'ticket_content_id': req.params.contentId,
        'status': {$ne: 'canceled'}
    }).then(data => {
        if (data) {
            res.redirect('/ticket/view/' + req.params.mainId + '/' + req.params.contentId);
        } else {
            return db.collection('profile').findOne({'phone': req.session.phone})
        }
    }).then(data => {
        if (data !== undefined) {
            ev.user = data;
            res.render('ticket/ticket-form', ev);
        }
    }).catch(err => {
        console.error(err.stack);
        res.status(500).render('500');
    });
});

/**
 * 确认报名信息
 */
router.get('/view/:mainId/:contentId', (req, res) => {
    const db = req.app.locals.db;
    let ev = Object.assign({}, req.ev);

    db.collection('ticket_apply').findOne({
        'user': req.ev.user,
        'ticket_main_id': req.params.mainId,
        'ticket_content_id': req.params.contentId
    }).then(async data => {
        if (data) {
            return new Promise(resolve => {
                resolve([data, db.collection('profile').findOne({'phone': req.session.phone})])
            });
        }
    }).then(async data => {
        if (data) {
            let apply = data[0];
            let user = await data[1];
            apply.phone = util.maskNumber(apply.phone);
            apply.email = util.maskNumber(apply.email);
            apply.created_at = moment(apply.created_at).format('YYYY-MM-DD HH:mm');
            ev.apply = apply;
            ev.user = user;
            ev.main_id = req.params.mainId;

            res.render('ticket/ticket-view', ev);
        } else {
            res.status(404).render('404', ev);
        }
    }).catch(err => {
        console.error(err.stack);
        res.status(500).render('500');
    });
});

/**
 * 修改报名信息
 */
router.route('/update')
    .get((req, res) => {
        res.render('ticket/ticket-update', req.ev);
    })
    .post((req, res) => {
        // 确认信息报名，修改报名信息
        const db = req.app.locals.db;

        let postData = req.body;
        delete postData._csrf;
        delete postData.agree;
        delete postData.passport_number_confirmation;
        postData.user = req.ev.user;
        postData.status = 'applied';
        let apply = Object.assign({}, postData);
        let now = new Date();
        apply.created_at = now;
        apply.updated_at = now;

        db.collection('ticket_apply').updateOne({
            'user': req.ev.user,
            'ticket_main_id': apply.ticket_main_id,
            'ticket_content_id': apply.ticket_content_id
        }, {$set: apply}, {upsert: true})
            .then(data => {
                if (data.result.ok === 1 && data.result.n !== 0) {
                    res.redirect('/ticket/index-content/' + postData.ticket_main_id);
                } else {
                    res.send('fail');
                }
            })
            .catch(err => {
                    console.error(err.stack);
                    res.status(500).render('500');
                }
            );
    });

/**
 * 取消报名
 */
router.post('/cancel/:mainId/:contentId', (req, res) => {
    const db = req.app.locals.db;

    db.collection('ticket_apply').updateOne({
        'user': req.ev.user,
        'ticket_main_id': req.params.mainId,
        'ticket_content_id': req.params.contentId
    }, {$set: {'status': 'canceled', 'updated_at': new Date()}})
        .then(data => {
            if (data.result.ok === 1 && data.result.n !== 0) {
                res.redirect('/ticket/index-content/' + req.params.mainId);
            } else {
                res.send('fail');
            }
        })
        .catch(err => {
            console.error(err.stack);
            res.status(500).render('500');
        });
});

module.exports = router;
