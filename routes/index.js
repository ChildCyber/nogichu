const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    db.collection('blog').find().limit(5).sort({created_at: -1}).toArray()
        .then(data => {
            res.render('index.ejs', {'data': data});
        })
        .catch(err => {
            console.error(err);
            res.send('程序异常，请稍后重试');
        });
});

module.exports = router;
