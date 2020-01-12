const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index.ejs', {'login': req.session.logined, 'user': req.session.user, 'premium': req.session.premium});
});

module.exports = router;
