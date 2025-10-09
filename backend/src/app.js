const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mainRoutes = require("./routes");

const app = express();

// Middlewares globaux
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(helmet());

// Limite les requêtes : max 100 par 15 minutes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
app.use(limiter);

// Routes principales
app.use("/", mainRoutes);

module.exports = app;
