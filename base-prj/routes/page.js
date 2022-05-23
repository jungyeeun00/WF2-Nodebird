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
  res.locals.likerIdList = req.user ? req.user.Liked.map(f => f.id) : [];
  console.log("!!! " +  res.locals.likerIdList)
  next();
});

router.get('/profile', isLoggedIn, async (req, res, next) => {
  try{
    like = await User.findOne({where: { id : req.user.id }})
    console.log('~~like'+like.id);
    likes = await like.getLiked()
    res.render('profile', {
      title: 'prj-name',
      likes: likes,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
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
      {
        model: User,
        attributes: ['id'],
        as: 'Liker',
        through: 'PostLike'
      },
    ],
      where: {
        flag: true,
      },
      order: [['createdAt', 'DESC']],
    });
    console.log('list : '+posts[0].Liker[0])
    res.render('main', {
      title: 'prj-name',
      twits: posts,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
 
});

router.get('/search', async (req, res, next) => {
  let query = req.query.search;
 
  if (!query) {
    return res.redirect('/');
  }
  try {
    let hashtag;
    let user;

    if(query.match(/@/)) {
        query = query.replace("@", "");
        user = await User.findOne({ where: { nick: query } })
      }
      else {
        hashtag = await Hashtag.findOne({ where: { title: query } });
      }
    console.log(user + hashtag);
    let posts = [];

    if (hashtag) {
      posts = await hashtag.getPosts({ include: [{ model: User }] });
    }
    else if (user) {
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