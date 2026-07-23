const dotenv = require("dotenv");
dotenv.config();

if (!process.env.MONGO_URI) {
  throw new Error("Mongo uri environment variable is not avaliable");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT Secret environment variable is not avaliable");
}

const config = {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
};

module.exports = config;
