const express = require("express");
const router = express.Router();
const predictionController = require("../controller/prediction.controller");
const auth = require("../middleware/auth.middleware");

router.post("/", auth, predictionController.createPrediction);

router.get("/", auth, predictionController.getPredictions);

router.get("/:id", auth, predictionController.getPrediction);

router.delete("/:id", auth, predictionController.deletePrediction);
module.exports = router;
