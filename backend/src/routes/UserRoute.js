const express = require("express");
const router = express.Router();
const userController = require("../controllers/UserController");
const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/multer");

// /api/users
router.get("/", userController.getAllUsersController);
// router.get("/clients", userController.searchClient);
// router.get("/employees/search", userController.searchEmployee);

// Info du user connecté
// router.get("/me", verifyToken, userController.getUserWithRoleController);

// Création
router.post("/", upload.single("photo"), userController.createUser);

// MàJ / delete
router.put("/user/:id", userController.updateUserController);
router.patch("/user/:id", verifyToken, userController.patchUserController);
router.delete("/user/:id", verifyToken, (req, res, next) => {
    if (String(req.user.id) !== String(req.params.id)) {
        return res.status(403).json({ message: "Action non autorisée" });
    }
    next();
}, userController.deleteUserController);

router.get("/:id", userController.getUserByIdController);



module.exports = router;
