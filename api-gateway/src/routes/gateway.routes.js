import express from "express";
import sncfRoutes from "./sncf.routes.js";

const router = express.Router();

router.use("/sncf", sncfRoutes);

export default router;
