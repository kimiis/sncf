const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const routes = require("./routes");
// const sncfRoutes = require("./routes/sncf.routes");

const app = express();


app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use((req, res, next) => {
    console.log("🌍 Incoming request:", req.method, req.url);
    next();
});
// --- Mount routes ---
app.use("/api", routes);
// app.use("/api/sncf", sncfRoutes);

// --- Debug complet ---
console.log("\n===== 🔍 ROUTES SETUP SUMMARY =====");
console.log("📦 Imported routes file:", "./routes");
console.log("📦 Imported SNCF routes file:", "./routes/sncf.routes");
console.log("🛣  /api → routes/index.js");


console.log("\n===== 📜 Express Router Structure =====");
console.log("🔹 routes.stack:", routes.stack?.map(l => l.route?.path || "(sub-router)") || []);
// console.log("🔹 sncfRoutes.stack:", sncfRoutes.stack?.map(l => l.route?.path || "(sub-router)") || []);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`\n🚄 API Gateway running on port ${PORT}`);
    console.log("===== 📋 Registered Routes =====");

    const listRoutes = (router, prefix = "") => {
        if (!router?.stack) return;
        router.stack.forEach(layer => {
            if (layer.route) {
                const methods = Object.keys(layer.route.methods).join(", ").toUpperCase();
                console.log(`➡️ [${methods}] ${prefix}${layer.route.path}`);
            } else if (layer.name === "router" && layer.handle.stack) {
                listRoutes(layer.handle, prefix + (layer.regexp?.source.replace(/\\\//g, "/").replace("^\\", "").replace("\\/?(?=\\/|$)", "").replace(/\$$/, "") || ""));
            }
        });
    };

    listRoutes(app._router, "");
    console.log("==================================\n");
});
