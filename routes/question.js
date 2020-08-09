const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('user/question.ejs', req.ev);
});

module.exports = router;