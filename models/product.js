const Sequelize = require('sequelize');

module.exports = class Product extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      user_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      buyma_product_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      buyma_product_name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      buyma_product_status: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      buyma_product_realease_date: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      create_id: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      date_created: {
        type: Sequelize.DATE,
        allowNull: false
      },
      update_id: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      last_updated: {
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
};