import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import sncfRoutes from "./routes/sncf.routes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// === Routes ===
app.use("/api", sncfRoutes); // /api/co2/trajet

// === Démarrage serveur ===
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚪 API Gateway running on port ${PORT}`));
