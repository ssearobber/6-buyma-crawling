const Sequelize = require('sequelize');

module.exports = class Product extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
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
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    }, {
      sequelize,
      timestamps: false,
      underscored: false,
      modelName: 'Product',
      tableName: 'product',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    db.Product.belongsTo(db.Products, { foreignKey: 'productId', targetKey: 'productId' });
  }
};