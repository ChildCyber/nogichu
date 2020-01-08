const express = require('express');
const router = express.Router();
const Auth = require('../middlewares/auth');
const util = require('../common/util');
const moment = require('moment');
moment.locale('zh-cn');

/**
 * 支付
 */
router.get('/pay', Auth.notLoggedIn, (req, res) => {
    res.render('pay.ejs', {'login': req.session.logined, 'user': req.session.user, 'premium': req.session.premium});
});

module.exports = router;
