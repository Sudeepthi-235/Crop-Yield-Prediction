const mongoose = require("mongoose");
const config = require("./env");

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("Successfully Connected to MongoDB");
  } catch (error) {
    console.log("Error Connecting to Database : ", error);
  }
};

module.exports = connectDB;
