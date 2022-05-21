/**
 * routes/user.js
 */

const express = require('express');

const { isLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

// 팔로우
router.post('/:id/follow', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    if (user) {
      await user.addFollowing(parseInt(req.params.id, 10));
      res.send('success');
    } else {
      res.status(404).send('no user');
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 언팔로우
router.delete('/:id/follow', isLoggedIn, async (req, res, next) => {
    try {
      const user = await User.findOne({ where: { id: req.user.id } });
      if (user) {
        await user.removeFollowing(parseInt(req.params.id, 10));
        res.send('success');
      } else {
        res.status(404).send('no user');
      }
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

module.exports = router;
