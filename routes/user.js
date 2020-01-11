const express = require('express');
const router = express.Router();
const Auth = require('../middlewares/auth');
const util = require('../common/util');
const moment = require('moment');
moment.locale('zh-cn');

/**
 * 用户登录页
 */
router.route('/login')
    .all(Auth.loggedIn)
    .get((req, res) => {
      res.render('user/login.ejs');
    })
    .post((req, res) => {
      const db = req.app.locals.db;
      let postData = req.body;
      let phone = postData.phone || null;
      let password = postData.password || null;

      function getUser() {
        return db.collection('user').findOne({'phone': phone, 'password': util.hashPassword(password)});
      }

      function getProfile() {
        return db.collection('profile').findOne({'phone': phone});
      }

      function getPremium() {
        return db.collection('premium').findOne({'phone': phone});
      }

      Promise.all([getUser(), getProfile(), getPremium()])
          .then(data => {
            let [user, profile, premium] = data;
            if (user != null) {
              req.session.regenerate((err) => {
                if (err) {
                  console.log(err);
                  res.send('登录失败，请稍后重试');
                }
                req.session.logined = true;
                req.session.phone = phone;
                req.session.user = profile ? profile.name : null;
                req.session.premium = premium;
                // 登录成功
                res.redirect('/mypage');
              });
            } else {
              res.render('user/login.ejs', {'err': '您的信息输入错误，请检查后重新输入', 'phone': phone});
            }
          })
          .catch((err) => {
            console.error(err);
            res.render('user/login.ejs', {'err': '登录失败，请稍后重试', 'phone': phone});
          });
    });

/**
 * 用户：我的主页
 */
router.get('/mypage', Auth.notLoggedIn, Auth.isPremium, (req, res) => {
    const db = req.app.locals.db;
    db.collection('profile').findOne({'phone': req.session.phone})
        .then(data => {
            if (data.email) {
                let emailArr = data.email.split('@');
                data.email = emailArr[0].slice(0, emailArr[0].length - 4) + '****@' + emailArr[1];
            }
            // if (data.birthday) {
            //     data.birthday = (new Date(data.birthday).toLocaleString()).slice(0, -3)
            // }
            if (req.session.premium) {
                premium = Object.assign({}, req.session.premium);
                premium.remain = moment(premium.expired_at).diff(moment(), 'days');
                premium.expired_at = moment(premium.expired_at).format('lll');
            }
            return new Promise(resolve => {
                console.log('get user info');
                resolve([data, db.collection('photos').find({'id': {$in: data.oshimen}}).project({
                    id: 1,
                    name: 1,
                    photo: 1,
                    _id: 0
                }).toArray()])
            })
                .then(async data => {
                    console.log('get user info & member info', data);
                    let oshimen = await data[1];
                    let user = data[0];
                    console.log('get member info');

                    // 用户推数据
                    if (oshimen) {
                        // 如果有推，推数据添加图片信息
                        for (let i = 0; i < oshimen.length; i++) {
                            console.log(Object.keys(oshimen));
                            // oshimen[i].photo = new Buffer(oshimen[i].photo.buffer, 'binary').toString('base64');
                            // 用户只填写一个推，根据user.oshimen的下标修改对应推信息
                            let index = user.oshimen.indexOf(oshimen[i].id);
                            if (index !== -1) {
                                user.oshimen[index] = oshimen[i];
                            }
                        }
                    }

                    res.render('user/mypage.ejs', {
                        'login': req.session.logined,
                        'user': user,
                        'premium': premium
                    });
                })
                .catch(err => {
                    console.log(err)
                })
        });
});

/**
 * 用户注册页
 */
router.route('/register')
    .all(Auth.loggedIn)
    .get((req, res) => {
      res.render('user/register.ejs');
    })
    .post((req, res) => {
      // 注册成功就将当前用户登录
      const db = req.app.locals.db;
      // 参数验证
      let postData = req.body;
      let phone = postData.phone || null;
      let password = postData.password || null;
      let pc = postData.password_confirmation || null;
      let agree = postData.agree || null;
      let err = {};
      if (!phone || phone.length < 11) {
        err.phoneHelpText = '请填写正确的手机号码';
      }
      if (password !== pc) {
        err.passwordHelpText = '输入密码 二次确认不匹配';
      }
      if (!password || password.length < 8) {
        err.passwordHelpText = '输入密码 的最小长度为 8 字符';
      }
      if (!pc || pc.length < 8) {
        err.passwordHelpText = '输入密码 的最小长度为 8 字符';
      }
      if (agree !== '1') {
        err.nameHelpText = '您必须同意《乃木坂46中国会员站用户协议后》';
      }

      if (Object.keys(err).length !== 0) {
        Object.assign(err, postData);
        res.render('user/register.ejs', err)
      } else {
        db.collection('user').findOne({'phone': phone})
            .then(data => {
              if (data === null) {
                // 创建用户
                db.collection('user').insertOne({'phone': phone, 'password': util.hashPassword(password)});
                // 用户登录
                req.session.logined = true;
                req.session.phone = phone;
                res.redirect('/user-info');
              } else {
                res.render('user/register.ejs', {'nameHelpText': '注册失败，请稍后重试'});
              }
            });
      }
    });

/**
 * 个人中心
 */
router.get('/user-info', Auth.notLoggedIn, (req, res) => {
    const db = req.app.locals.db;

    function getMember() {
        return db.collection('member').find().sort({id: 1}).project({id: 1, name: 1, _id: 0}).toArray();
    }

    function getUserInfo() {
        return db.collection('profile').findOne({'phone': req.session.phone});
    }

    Promise.all([getMember(), getUserInfo()])
        .then(data => {
            let [members, user] = data;
            if (user) {
                // 隐藏用户信息
                let email = user.email || '';
                let proof_number = user.proof_number || '';
                if (email) {
                    let emailArr = email.split('@');
                    user.email = emailArr[0].slice(0, emailArr[0].length - 4) + '****@' + emailArr[1];
                }
                if (proof_number) {
                    user.proof_number = proof_number.slice(0, 3) + '******' + proof_number.substring(9);
                }
            }

            // 验证修改页面传递过来的错误信息
            let nameErr = req.session.info_err || '';
            let nameHelpText = req.session.member_err || '';
            if (nameErr) {
                delete req.session.info_err;
                res.render('user/user-info.ejs', {
                    'user': user,
                    'members': members,
                    'err': nameErr,
                    'login': req.session.logined,
                    'premium': req.session.premium
                });
            }
            if (nameHelpText) {
                delete req.session.member_err;
                res.render('user/user-info.ejs', {
                    'user': user,
                    'members': members,
                    'member_err': nameHelpText,
                    'login': req.session.logined,
                    'premium': req.session.premium
                });
            }
            res.render('user/user-info.ejs', {
                'user': user,
                'members': members,
                'login': req.session.logined,
                'premium': req.session.premium
            })
        })
        .catch(err => {
            console.error(err);
            res.send('程序出错，请稍后重试')
        });
});

/**
 * 个人中心信息修改
 */
router.route('/user-info/update')
    .get((req, res) => {
        res.render('405.ejs');
    })
    .post(Auth.notLoggedIn, (req, res) => {
        const db = req.app.locals.db;
        let postData = req.body;
        // 参数验证
        let name = postData.name || req.session.user; // 必需字段
        // let email = postData.email || null;
        // let first_name = postData.first_name || null;
        // let last_name = postData.last_name || null;
        // let gender = postData.gender || null;
        // let birthday = postData.birthday || null;
        // let jobs = postData.jobs || null;
        // let country = postData.country || null;
        // let prefecture = postData.prefecture || null;
        // let city = postData.city || null;
        // let block = postData.block || null;
        // let proof = postData.proof || null;
        // let proof_number = postData.proof_number || null;
        // let proof_expiration = postData.proof_expiration || null;
        let like_1 = postData.like_1 || 0;
        let like_2 = postData.like_2 || -1;
        let like_3 = postData.like_3 || -2;

        // deep copy
        let profile = Object.assign({}, postData);
        let oshimen = [postData.like_1, postData.like_2, postData.like_3];
        profile.phone = req.session.phone;
        profile.oshimen = oshimen.map(item => {
            return parseInt(item)
        });
        // 删除多余属性
        delete profile.like_1;
        delete profile.like_2;
        delete profile.like_3;
        delete profile._token;

        // todo 把这里和模板里的傻逼逻辑改了
        if (!name) {
            req.session.info_err = '用户修改非本人信息';
            return res.redirect('/user-info');
        }
        if (like_1 === like_2) {
            req.session.member_err = '二推(喜欢成员) 必须不同于 首推(喜欢成员)';
            return res.redirect('/user-info');
        }
        if (like_1 === like_3) {
            req.session.member_err = '三推(喜欢成员) 必须不同于 首推(喜欢成员)';
            return res.redirect('/user-info');
        }
        if (like_2 === like_3) {
            req.session.member_err = '三推(喜欢成员) 必须不同于 二推(喜欢成员)';
            return res.redirect('/user-info');
        }
        db.collection('profile').findOne({'phone': req.session.phone})
            .then(data => {
                if (data) {
                    // 修改
                    if (data.name !== name) {
                        return new Promise((resolve, reject) => {
                            reject('帐号信息不匹配');
                        })
                    } else {
                        // 迷惑行为
                        if (!profile.email) {
                            delete profile.email;
                        }
                        return db.collection('profile').update({name: name}, {$set: profile}, {upsert: true});
                    }
                } else {
                    // 插入
                    return db.collection('profile').insert(profile);
                }
            })
            .then(data => {
                console.log(data.result);
                // 添加session.user，跳转用户主页
                req.session.user = name;
                res.redirect('/mypage');
            })
            .catch(err => {
                console.error('用户修改非本人信息');
                req.session.info_err = err;
                res.redirect('/user-info');
            });
    });

/**
 * 退出登录
 */
router.route('/logout')
    .get((req, res) => {
        res.status(405).render('405.ejs');
    })
    .post((req, res, next) => {
        if (req.session) {
            // delete session object
            req.session.destroy((err) => {
                if (err) {
                    next(err);
                } else {
                    res.redirect('/');
                }
            });
        }
    });

module.exports = router;
