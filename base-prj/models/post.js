/**
 * models/post.js
 */

const Sequelize = require('sequelize');

module.exports = class Post extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      content: {
        type: Sequelize.STRING(140),
        allowNull: false,
      },
      img: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      flag: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      }
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Post',
      tableName: 'posts',
      paranoid: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.Post.belongsTo(db.User);
    db.Post.hasMany(db.Comment)
    db.Post.belongsToMany(db.Hashtag, { through: 'PostHashtag' });
    db.Post.belongsToMany(db.User, { through:'likes', as:'Liker'})
  }
};
