const Sequelize = require('sequelize');
const TemporaryProduct = require('./temporaryProduct');
const TodayCount = require('./todayCount');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.TemporaryProduct = TemporaryProduct;
db.TodayCount = TodayCount;

TemporaryProduct.init(sequelize);
TodayCount.init(sequelize);

// Product.associate(db);

module.exports = db;