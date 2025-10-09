import NodeCache from "node-cache";

const cache = new NodeCache();

export const cacheMiddleware = (ttlSeconds = 60) => (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached) {
        return res.json(cached);
    }

    res.originalJson = res.json;
    res.json = (data) => {
        cache.set(key, data, ttlSeconds);
        res.originalJson(data);
    };

    next();
};
