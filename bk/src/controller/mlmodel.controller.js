const axios = require("axios");

const ML_API_URL = process.env.ML_API_URL || "http://localhost:8000/predict";

async function predictCrop(req, res) {
  try {
    // Get data from frontend
    const data = req.body;

    // Send to FastAPI
    const response = await axios.post(ML_API_URL, data);

    // Return ML response
    res.status(200).json(response.data);
  } catch (err) {
    console.log(err.response?.data || err.message);

    res.status(500).json({
      msg: "ML model request failed",
      error: err.response?.data || err.message,
      console: err.response?.data || err.message,
    });
  }
}

module.exports = {
  predictCrop,
};
