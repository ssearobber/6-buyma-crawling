const Sequelize = require('sequelize');

module.exports = class Products extends Sequelize.Model {
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
      modelName: 'Products',
      tableName: 'products',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    db.Products.hasMany(db.Product, { foreignKey: 'productId', sourceKey: 'productId' });
  }
};