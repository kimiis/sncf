const userService = require("../services/UserService");

class UserController {

    //Fonction asynchrone pour appeler la fonction dans le UserService pour récuperer tous les users
    //
    // req et res : objets fournis par Express,
    // L'objet req (request) représente la requête envoyée par le client (navigateur, application mobile, Postman, etc.).
    // Il contient des informations sur la requête
    //
    //L'objet res (response) représente la réponse envoyée au client. Il permet de :
    //
    // Envoyer du JSON (res.json(data))
    // Envoyer du texte (res.send("Message"))
    // Changer le code de statut HTTP (res.status(404))
    // Rediriger vers une autre page (res.redirect("/home"))
    async getAllUsersController(req, res) {
        try {
            const users = await userService.getAllUsersService();
            res.status(200).json(users);
        } catch (error) {
            console.error("Erreur lors de la récupération des utilisateurs:", error);
            res.status(500).json({ message: "Erreur interne du serveur" });
        }
    }

    //Fonction asynchrone pour appeler la fonction dans le UserService pour récuperer un user by id
    async getUserByIdController(req, res) {
        try {
            const user_id = req.params.id;
            // console.log("Requête reçue pour l'ID :", user_id);
            const user = await userService.getUserByIdService(user_id);

            if (!user) {
                console.log("Utilisateur non trouvé :", user_id);
                return res.status(404).json({ message: "Utilisateur non trouvé" });
            }

            // console.log("Utilisateur retourné :", user);

            return res.status(200).json(user);
        } catch (error) {
            console.error("Erreur lors de la récupération du client :", error);
            return res.status(500).json({ message: "Erreur interne du serveur" });
        }
    }

    //Fonction asynchrone pour appeler la fonction dans le UserService pour récuperer créer un user
    async createUser(req, res) {
        try {
            const userData = req.body;
            const photo = req.file?.filename || null;

            console.log(" Données reçues pour création :", userData);
            console.log(" Fichier reçu :", photo);

            // Ajoute la photo au userData
            const newUser = await userService.createUser({
                ...userData,
                photo_url: photo,
            });

            res.status(201).json({
                message: "Utilisateur créé avec succès.",
                user: newUser,
            });
        } catch (error) {
            console.error("Erreur dans createUserController :", error);
            res.status(500).json({
                message: error.message || "Erreur lors de la création de l'utilisateur.",
            });
        }
    }


    //Fonction asynchrone pour appeler la fonction dans le UserService pour mettre à jour un user
    async updateUserController(req, res) {
        try {
            const user_id = req.params.id;
            // console.log("Controller - Mise à jour utilisateur ID :", user_id);
            const user = await userService.updateUserService(user_id, req.body);
            return res.status(200).json(user);
        } catch (error) {
            console.error("Controller - Erreur mise à jour utilisateur :", error.message);
            return res.status(500).json({ message: error.message });
        }
    }

    //Fonction asynchrone pour appeler la fonction dans le UserService pour mettre à jour partiellement un user
    async patchUserController(req, res) {
        try {
            const user_id = req.params.id;
            //console.log("Controller - Mise à jour partielle utilisateur ID :", user_id);
            const user = await userService.patchUserService(user_id, req.body);
            return res.status(200).json(user);
        } catch (error) {
            console.error("Controller - Erreur mise à jour partielle :", error.message);
            return res.status(500).json({ message: error.message });
        }
    }

    //Fonction asynchrone pour appeler la fonction dans le UserService pour supprimer un user
    async deleteUserController(req, res) {
        try {
            const user_id = req.params.id;
            //console.log("Controller - Suppression utilisateur ID :", user_id);
            const result = await userService.deleteUserService(user_id);
            return res.status(200).json(result);
        } catch (error) {
            //console.error("Controller - Erreur suppression utilisateur :", error.message);
            return res.status(500).json({ message: error.message });
        }
    }

    // //Fonction pour récupérer tous les client suivant la recherche
    // async searchClient (req, res) {
    //     try {
    //         const search = req.query.search;
    //         const clients = await userService.searchClients(search);
    //         res.json(clients);
    //     } catch (error) {
    //         console.error("Erreur dans searchClient :", error);
    //         res.status(500).json({ error: "Erreur serveur" });
    //     }
    // };

}

module.exports = new UserController();
