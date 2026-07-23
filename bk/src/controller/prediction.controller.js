const Prediction = require("../models/prediction.model");

// CREATE PREDICTION
async function createPrediction(req, res) {
  try {
    const prediction = await Prediction.create({
      user: req.user.id,
      ...req.body,
    });

    res.status(201).json({
      msg: "Prediction saved",
      prediction,
    });
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
}

// GET ALL USER PREDICTIONS
async function getPredictions(req, res) {
  try {
    const predictions = await Prediction.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json(predictions);
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
}

// GET SINGLE PREDICTION
async function getPrediction(req, res) {
  try {
    const prediction = await Prediction.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!prediction) {
      return res.status(404).json({
        msg: "Prediction not found",
      });
    }

    res.status(200).json(prediction);
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
}

// DELETE PREDICTION
async function deletePrediction(req, res) {
  try {
    const prediction = await Prediction.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!prediction) {
      return res.status(404).json({
        msg: "Prediction not found",
      });
    }

    res.status(200).json({
      msg: "Prediction deleted",
    });
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
}

module.exports = {
  createPrediction,
  getPredictions,
  getPrediction,
  deletePrediction,
};
