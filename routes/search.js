const express = require('express');
const router = express.Router();

/* Site search page. */
router.get('/', (req, res) => {
    let ev = Object.assign({}, req.ev);
    ev.data = req.query.keywords;
    res.render('search', ev);
});

module.exports = router;
