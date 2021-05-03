const Sequelize = require('sequelize');
const Products = require('./products');
const Product = require('./product');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.Products = Products;
db.Product = Product;

Products.init(sequelize);
Product.init(sequelize);

Products.associate(db);
Product.associate(db);

module.exports = db;