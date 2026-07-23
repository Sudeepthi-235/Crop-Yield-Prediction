const express = require("express");
const router = express.Router();
const mlModelController = require("../controller/mlmodel.controller");

router.post("/", mlModelController.predictCrop);

module.exports = router;
