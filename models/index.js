const Sequelize = require('sequelize');
const TemporaryProductCount = require('./temporaryProductCount');
const ProductTodayCount = require('./productTodayCount');
const Product = require('./product');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.TemporaryProductCount = TemporaryProductCount;
db.ProductTodayCount = ProductTodayCount;
db.Product = Product;

TemporaryProductCount.init(sequelize);
ProductTodayCount.init(sequelize);
Product.init(sequelize);

// Product.associate(db);

module.exports = db;