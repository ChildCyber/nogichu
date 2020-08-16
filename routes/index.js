const express = require('express');
const router = express.Router();

/* GET homepage. */
router.get('/', (req, res) => {
    const db = req.app.locals.db;

    db.collection('blog').find().limit(5).sort({created_at: -1}).toArray()
        .then(data => {
            let ev = Object.assign({}, req.ev);
            ev.data = data;
            res.render('index.ejs', ev);
        })
        .catch(err => {
            console.error(err);
            res.status(500).render('500');
        });
});

module.exports = router;
