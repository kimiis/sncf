const jwt = require("jsonwebtoken");

jest.mock("jsonwebtoken");

const { verifyToken, isAdmin } = require("../../middlewares/authMiddleware");

function buildReq(headers = {}) {
    return { headers };
}

function buildRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe("verifyToken", () => {
    const next = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = "test_secret";
    });

    test("appelle next() avec un token valide", () => {
        const decoded = { id: "uuid-1", email: "a@b.com", role: "user" };
        jwt.verify.mockImplementation((token, secret, cb) => cb(null, decoded));

        const req = buildReq({ authorization: "Bearer valid.token.here" });
        const res = buildRes();

        verifyToken(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toEqual(decoded);
    });

    test("retourne 401 si pas de header Authorization", () => {
        const req = buildReq({});
        const res = buildRes();

        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Token manquant ou incorrect" });
        expect(next).not.toHaveBeenCalled();
    });

    test("retourne 401 si le header ne commence pas par 'Bearer '", () => {
        const req = buildReq({ authorization: "Basic some.token" });
        const res = buildRes();

        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test("retourne 401 si le token est expiré ou invalide", () => {
        jwt.verify.mockImplementation((token, secret, cb) =>
            cb(new Error("jwt expired"), null)
        );

        const req = buildReq({ authorization: "Bearer expired.token" });
        const res = buildRes();

        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Token invalide ou expiré" });
    });
});

describe("isAdmin", () => {
    const next = jest.fn();

    beforeEach(() => jest.clearAllMocks());

    test("appelle next() si l'utilisateur est admin", () => {
        const req = { user: { role: "admin" } };
        const res = buildRes();

        isAdmin(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    test("retourne 403 si le rôle est 'user'", () => {
        const req = { user: { role: "user" } };
        const res = buildRes();

        isAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: "Accès refusé" });
        expect(next).not.toHaveBeenCalled();
    });

    test("retourne 403 si req.user est absent", () => {
        const req = {};
        const res = buildRes();

        isAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
    });
});
