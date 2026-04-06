const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

if (!process.env.PORT) {
  throw new Error('El puerto no está definido');
}

module.exports = {
  port: Number(process.env.PORT),
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
};
