const Sequelize = require('sequelize');

module.exports = class Product extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      productId: {
        type: Sequelize.STRING(20),
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      productName: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      productStatus: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      releaseDate: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      today: {
        type: Sequelize.DATE,
        allowNull: false
      },
      cart: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      wish: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      access: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    }, {
      sequelize,
      timestamps: false,
      underscored: false,
      modelName: 'Product',
      tableName: 'products',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }
};