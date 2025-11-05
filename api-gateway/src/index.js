const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const routes = require("./routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use((req, res, next) => {
    console.log("Incoming request:", req.method, req.url);
    next();
});
// --- Mount routes ---
app.use("/api", routes);


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`\n API Gateway running on port ${PORT}`);

    const listRoutes = (router, prefix = "") => {
        if (!router?.stack) return;
        router.stack.forEach(layer => {
            if (layer.route) {
                const methods = Object.keys(layer.route.methods).join(", ").toUpperCase();
                console.log(`[${methods}] ${prefix}${layer.route.path}`);
            } else if (layer.name === "router" && layer.handle.stack) {
                listRoutes(layer.handle, prefix + (layer.regexp?.source.replace(/\\\//g, "/").replace("^\\", "").replace("\\/?(?=\\/|$)", "").replace(/\$$/, "") || ""));
            }
        });
    };

    listRoutes(app._router, "");
});
