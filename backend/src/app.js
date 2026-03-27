const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mainRoutes = require("./routes");

const app = express();

// Middlewares globaux
app.use(express.json());
app.use(cors({ origin: "*", credentials: false }));
app.use(morgan("dev"));
app.use(helmet({ crossOriginResourcePolicy: false }));

// Limite les requêtes : max 1000 par 15 minutes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
});
app.use(limiter);

// Routes principales
app.use("/api", mainRoutes);

module.exports = app;
