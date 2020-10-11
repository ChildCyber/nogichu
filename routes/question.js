const express = require('express');
const router = express.Router();
const Auth = require('../middlewares/auth');

router.get('/', Auth.requirePremium, (req, res) => {
    res.render('user/question', req.ev);
});

module.exports = router;