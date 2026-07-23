const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    crop: {
      type: String,
      required: true,
    },

    location: {
      lat: Number,
      lon: Number,
    },

    yield_prediction: {
      value: Number,
      total_yield: Number,
      unit: String,
      land_area_ha: Number,
      confidence: String,
    },

    current_stage: {
      name: String,
      progress_percent: Number,
      days_remaining: Number,
    },

    risks: [String],

    stage_insights: [
      {
        stage: String,
        status: String,
      },
    ],

    suggestions: [String],

    meta: {
      crop: String,
      days_since_sowing: Number,
      location: {
        lat: Number,
        lon: Number,
      },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Prediction", predictionSchema);
