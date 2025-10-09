import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import gatewayRoutes from "./routes/gateway.routes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/", gatewayRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
