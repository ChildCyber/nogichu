const moment = require('moment');
moment.locale('zh-cn');

/**
 * 已登录，跳转用户主页
 * @param req
 * @param res
 * @param next
 * @returns {void|never|Response}
 */
function loginRedirect(req, res, next) {
    if (req.session.logined) {
        return res.redirect('/mypage');
    }
    next();
}

/**
 * 未登录，跳转登录页
 * @param req
 * @param res
 * @param next
 * @returns {void|never|Response}
 */
function requireLogin(req, res, next) {
    if (!req.session.logined) {
        return res.redirect('/login');
    }
    next();
}

/**
 * 非会员，跳转充值页
 * @param req
 * @param res
 * @param next
 * @returns {void|never|Response}
 */
function requirePremium(req, res, next) {
    if (!req.session.logined) {
        return res.redirect('/login');
    }
    if (!req.session.premium) {
        return res.redirect('/pay');
    }
    if (moment(req.session.premium.expired_at).isBefore(moment.now())) {
        return res.redirect('/pay');
    }
    next();
}

/**
 * 模板变量
 * @param req
 * @param res
 * @param next
 */
function ejsVar(req, res, next) {
    req.ev = {
        'login': req.session.logined,
        'user': req.session.user,
        'premium': req.session.premium,
        'csrf': req.csrfToken()
    };
    next();
}


module.exports = {
    'loginRedirect': loginRedirect,
    'requireLogin': requireLogin,
    'requirePremium': requirePremium,
    'ejsVar': ejsVar,
};
