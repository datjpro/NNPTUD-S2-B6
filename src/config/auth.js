const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN
};
