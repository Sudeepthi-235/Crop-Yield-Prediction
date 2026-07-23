const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");
const predictionRoutes = require("./routes/prediction.routes");
const mlModelRoutes = require("./routes/mlmodel.routes");

const app = express();

const allowedOrigins = (
  process.env.FRONTEND_URL || "http://localhost:5173"
)
  .split(",")
  .map((o) => o.trim());

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/prediction", predictionRoutes);
app.use("/api/mlmodel", mlModelRoutes);

module.exports = app;
