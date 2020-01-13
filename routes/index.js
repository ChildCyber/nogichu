const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    db.collection('user').updateOne({'name': '斋藤飞鸟'}, {$set: {'first_name': '234'}})
        .then(data=>{
            console.log(data);
            res.render('index.ejs', {
                'login': req.session.logined,
                'user': req.session.user,
                'premium': req.session.premium,
                'csrf': req.csrfToken()
            });
        })
    // res.render('index.ejs', {
    //     'login': req.session.logined,
    //     'user': req.session.user,
    //     'premium': req.session.premium,
    //     'csrf': req.csrfToken()
    // });
});

module.exports = router;
