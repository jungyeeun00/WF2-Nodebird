/**
 * routes/page.js
 */

const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { Post, User, Hashtag } = require('../models');

const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.followerCount = req.user ? req.user.Followers.length : 0;
  res.locals.followingCount = req.user ? req.user.Followings.length : 0;
  res.locals.followerIdList = req.user ? req.user.Followings.map(f => f.id) : [];
  res.locals.likerIdList = req.twit ? req.twit.Liker.map(f => f.id) : [];
  next();
});

router.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile', { title: 'Profile - prj-name' });
});

router.get('/join', isNotLoggedIn, (req, res) => {
  res.render('join', { title: 'Join to - prj-name' });
});

router.get('/', async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      include: [{
        model: User,
        attributes: ['id', 'nick'],
      },
      where: {
        flag: true,
      },
      {
        model:User,
        attributes: ['id', 'nick'],
        as: 'Liker'
      }],
      order: [['createdAt', 'DESC']],
    });
    res.render('main', {
      title: 'prj-name',
      twits: posts,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.findOne({
      include: {
        model: User,
        attributes: ['id', 'nick'],
      },
    });
    res.render('twit', {
      title: 'prj-name',
      twit: post,
    });
    console.log(post);
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get('/hashtag', async (req, res, next) => {
  const query = req.query.hashtag;
  if (!query) {
    return res.redirect('/');
  }
  try {
    const hashtag = await Hashtag.findOne({ where: { title: query } });
    const user = await User.findOne({ where: { nick: query } })
    let posts = [];

    if (hashtag) {
      posts = await hashtag.getPosts({ include: [{ model: User }] });
    }
    else if(user) {
      posts = await user.getPosts({ include: [{ model: User }] });
    }
    return res.render('main', {
      title: `${query} | prj-name`,
      twits: posts,
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

module.exports = router;