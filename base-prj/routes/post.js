/**
 * routes/post.js
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Post, User, Hashtag, Comment } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

try {
  fs.readdirSync('uploads');
} catch (error) {
  console.error('uploads 폴더가 없어 uploads 폴더를 생성');
  fs.mkdirSync('uploads');
}

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {
  console.log(req.file);
  res.json({ url: `/img/${req.file.filename}` });
});

const upload2 = multer();
router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {
  try {
    console.log(req.user);
    const post = await Post.create({
      content: req.body.content,
      img: req.body.url,
      UserId: req.user.id,
    });
    const hashtags = req.body.content.match(/#[^\s#]*/g);
    if (hashtags) {
      const result = await Promise.all(
        hashtags.map(tag => {
          return Hashtag.findOrCreate({
            where: { title: tag.slice(1).toLowerCase() },
          })
        }),
      );
      await post.addHashtags(result.map(r => r[0]));
    }
    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.route('/:id', isLoggedIn)
  .post(upload2.none(), async (req, res, next) => {
    try {
      const post = await Post.findOne({ where: {id: req.params.id }});
      const hashtags = post.content.match(/#[^\s#]*/g);
      if (hashtags) {
        const result = await Promise.all(
          hashtags.map(tag => {
            return Hashtag.findOrCreate({
              where: { title: tag.slice(1).toLowerCase() },
            })
          }),
        );
        await post.removeHashtags(result.map(r => r[0]));
      }
      const up = await Post.update({
        content: req.body.content,
        img: req.body.url,
        updatedAt: new Date(),
      }, {
        where: { id: req.params.id },
      });
      const post1 = await Post.findOne({ where: { id: req.params.id } });
      const hashtags1 = req.body.content.match(/#[^\s#]*/g);
      if (hashtags1) {
        const result = await Promise.all(
          hashtags1.map(tag => {
            return Hashtag.findOrCreate({
              where: { title: tag.slice(1).toLowerCase() },
            })
          }),
        );
        await post1.addHashtags(result.map(r => r[0]));
      }
      res.redirect('/');
    } catch (error) {
      console.error(error);
      next(error);
    }
  })
  .delete(async (req, res, next) => {
    try {
      const result = await Post.update({
        flag: false,
        deletedAt: new Date(),
      }, {
        where: { id: req.params.id },
      });
      res.json(result);
    } catch (error) {
      console.error(error);
      next(error);
    }
  });

router.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { id: req.params.id },
      include: {
        model: User,
        attributes: ['id', 'nick'],
      },
    });
    const comments = await Comment.findAll({
      where: {
        PostId: req.params.id,
      },
      include: {
        model: User,
        attributes: ['id', 'nick'],
      },
      order: [['createdAt', 'DESC']],
    });
    res.render('twit', {
      title: 'prj-name',
      twit: post,
      comments: comments
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

const upload3 = multer();
router.post('/:id/comment', isLoggedIn, upload3.none(), async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.id } });
    if (!post) return res.status(404).send('포스트가 존재하지 않습니다.');
    const newComment = await Comment.create({
      PostId: req.params.id,
      UserId: req.user.id,
      content: req.body.content,
    });
    const comments = await Comment.findAll({
      where: {
        PostId: req.params.id,
      },
      include: {
        model: User,
        attributes: ['id', 'nick'],
      },
      order: [['createdAt', 'DESC']],
    });
    res.render('twit', {
      title: 'prj-name',
      twit: post,
      comments: comments
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.post('/:id/like', async (req, res, next) => {
  try{
    const post = await Post.findOne({ where: { id: req.params.id }});
    await post.addLiker(req.user.id); //comment처럼 테이블 만들기
    res.send ('success');
  } catch{
    console.error(error);
    next(error);
  }
});

router.delete('/:id/like', async (req, res, next) => {
  try{
    const post = await Post.findOne({ where: { id: req.params.id }});
    await post.removeLiker (req.user.id);
    res.send('success');
  } catch{
    console.error(error);
    next(error);
  }
});

module.exports = router;
