/**
 * 已登录，跳转用户主页
 * @param req
 * @param res
 * @param next
 * @returns {void|never|Response}
 */
function loggedIn(req, res, next) {
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
function notLoggedIn(req, res, next) {
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
function isPremium(req, res, next) {
    if (!req.session.premium) {
        return res.redirect('/pay');
    }
    next();
}


module.exports = {
    'loggedIn': loggedIn,
    'notLoggedIn': notLoggedIn,
    'isPremium': isPremium,
};
