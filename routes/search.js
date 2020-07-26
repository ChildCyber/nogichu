const express = require('express');
const router = express.Router();

/* Site search page. */
router.get('/', (req, res) => {
    res.render('search.ejs', req.ev);
});

module.exports = router;
