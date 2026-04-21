# Documentation des Tests — RailGo

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture de test](#2-architecture-de-test)
3. [Prérequis et installation](#3-prérequis-et-installation)
4. [Lancer les tests](#4-lancer-les-tests)
5. [Tests unitaires — Backend](#5-tests-unitaires--backend)
   - [AuthService](#51-authservice)
   - [authMiddleware](#52-authmiddleware)
   - [UserService](#53-userservice)
6. [Tests d'intégration — Backend](#6-tests-dintégration--backend)
   - [Routes Auth](#61-routes-auth)
   - [Routes Trajet](#62-routes-trajet)
   - [Routes Utilisateurs](#63-routes-utilisateurs)
7. [Tests de composants — Frontend](#7-tests-de-composants--frontend)
   - [Hook useAuth](#71-hook-useauth)
   - [Composant AuthModal](#72-composant-authmodal)
   - [Composant PrivateRoute](#73-composant-privateroute)
   - [Composant CO2Equivalences](#74-composant-co2equivalences)
   - [Smoke test App](#75-smoke-test-app)
8. [Tests End-to-End — Playwright](#8-tests-end-to-end--playwright)
   - [auth.spec.js](#81-authspecjs)
   - [search.spec.js](#82-searchspecjs)
   - [favorites.spec.js](#83-favoritesspecjs)
9. [Stratégie de mock](#9-stratégie-de-mock)
10. [Configuration technique](#10-configuration-technique)
11. [Résultats et couverture](#11-résultats-et-couverture)
12. [Problèmes connus et solutions](#12-problèmes-connus-et-solutions)

---

## 1. Vue d'ensemble

Le projet RailGo dispose d'une suite de tests en **trois niveaux** couvrant l'ensemble de la stack :

| Niveau | Framework | Localisation | Tests |
|--------|-----------|--------------|-------|
| Unitaires | Jest | `backend/src/__tests__/unit/` | 25 tests |
| Intégration | Jest + Supertest | `backend/src/__tests__/integration/` | 32 tests |
| Composants | React Testing Library | `frontend/src/__tests__/` | 31 tests |
| E2E | Playwright | `e2e/` | 14 scénarios |

**Total : 88 tests automatisés.**

---

## 2. Architecture de test

```
                        ┌─────────────────────┐
                        │   Tests E2E          │  Playwright
                        │   (app complète)     │  e2e/*.spec.js
                        └─────────────────────┘
                   ┌─────────────────────────────────┐
                   │   Tests d'intégration            │  Jest + Supertest
                   │   (routes HTTP + middlewares)    │  integration/*.test.js
                   └─────────────────────────────────┘
          ┌──────────────────────────────────────────────────┐
          │   Tests unitaires / composants                    │  Jest / RTL
          │   (fonctions isolées, composants React)           │  unit/*.test.js
          └──────────────────────────────────────────────────┘
```

### Philosophie

- **Tests unitaires** : testent une fonction ou une classe en isolation totale. Toutes les dépendances sont mockées. Aucun accès réseau ni base de données.
- **Tests d'intégration** : testent une route HTTP de bout en bout (middleware → contrôleur → service). La base de données est mockée, mais le routing Express est réel.
- **Tests de composants** : testent le rendu, les interactions et la logique de chaque composant React de manière isolée. Les appels API sont mockés.
- **Tests E2E** : testent des scénarios utilisateurs complets dans un vrai navigateur Chromium. L'application frontend doit tourner ; les appels API peuvent être interceptés via `page.route()`.

---

## 3. Prérequis et installation

### Dépendances backend (Jest + Supertest)

```bash
cd backend
npm install
# Déjà inclus dans devDependencies :
# jest ^30.3.0
# supertest ^7.2.2
# @jest/globals ^30.3.0
```

### Dépendances frontend (React Testing Library)

```bash
cd frontend
npm install
# Déjà inclus dans dependencies :
# @testing-library/react ^16.3.0
# @testing-library/jest-dom ^6.9.1
# @testing-library/user-event ^13.5.0
# @testing-library/dom ^10.4.1
```

### Dépendances E2E (Playwright)

```bash
# À la racine du projet
npm install
# Installe @playwright/test ^1.59.1

# Télécharger les navigateurs Playwright (à faire une fois)
npx playwright install chromium
```

### Variables d'environnement pour les tests E2E

Créer un fichier `.env.e2e` à la racine (ou exporter dans le shell) :

```env
# Compte utilisateur de test existant dans la base
RAILGO_TEST_EMAIL=test@railgo.fr
RAILGO_TEST_PASSWORD=Test1234!

# Token JWT pré-signé pour les tests nécessitant une session
# Générer avec : node -e "console.log(require('jsonwebtoken').sign({id:'test-id',role:'user'},'secret_key',{expiresIn:'1y'}))"
RAILGO_TEST_TOKEN=eyJhbGci...
```

---

## 4. Lancer les tests

### Toutes les commandes disponibles

```bash
# Depuis la RACINE du projet
npm run test:backend           # Tests backend (unitaires + intégration)
npm run test:backend:unit      # Tests unitaires backend uniquement
npm run test:backend:integration # Tests d'intégration backend uniquement
npm run test:frontend          # Tests frontend (composants + hooks)
npm run test:all               # Backend + frontend en séquence
npm run test:e2e               # Tests E2E Playwright (frontend doit tourner)

# Depuis le dossier backend/
npm test                       # Tous les tests backend
npm run test:unit              # Unitaires seulement
npm run test:integration       # Intégration seulement
npm run test:coverage          # Avec rapport de couverture HTML

# Depuis le dossier frontend/
npm test                       # Mode watch interactif
npm test -- --watchAll=false   # Une seule passe (CI)
```

### Lancer un seul fichier de test

```bash
# Backend
cd backend
npx jest src/__tests__/unit/AuthService.test.js

# Frontend
cd frontend
npm test -- --testPathPattern=AuthModal --watchAll=false

# E2E
npx playwright test e2e/auth.spec.js --config=e2e/playwright.config.js
```

### Lancer un seul test par nom

```bash
# Backend (--testNamePattern supporte les regex)
cd backend
npx jest --testNamePattern="retourne un token" --runInBand

# Frontend
cd frontend
npm test -- --testNamePattern="connexion réussie" --watchAll=false
```

---

## 5. Tests unitaires — Backend

> Localisation : `backend/src/__tests__/unit/`  
> Framework : Jest  
> Base de données : **non utilisée** (tout est mocké)

---

### 5.1 AuthService

**Fichier :** `backend/src/__tests__/unit/AuthService.test.js`  
**Module testé :** `backend/src/services/AuthService.js`

#### Ce que ce service fait

`AuthService.login(email, password)` :
1. Cherche l'utilisateur dans la base via `UserRepository.findByEmail`
2. Compare le mot de passe haché via `bcrypt.compare`
3. Récupère le rôle associé via `RoleRepository.getRoleById`
4. Génère et retourne un token JWT signé

#### Mocks utilisés

| Module mocké | Raison |
|---|---|
| `UserRepository` | Éviter tout accès PostgreSQL |
| `RoleRepository` | Idem |
| `bcryptjs` | Contrôler le résultat de `compare()` |
| `jsonwebtoken` | Contrôler le token généré par `sign()` |

#### Cas de test

| # | Description | Entrée | Résultat attendu |
|---|---|---|---|
| 1 | **Login valide** | email + mdp corrects | `{ token, message, user }` |
| 2 | **Utilisateur inexistant** | email inconnu | Erreur `status: 404` |
| 3 | **Mauvais mot de passe** | mdp incorrect | Erreur `status: 401` |
| 4 | **Appel du bon repository** | n'importe quel email | `findByEmail` appelé avec cet email |
| 5 | **Structure du JWT** | login valide | `jwt.sign` appelé avec `{ id, email, role }` + expiry 24h |
| 6 | **Rôle null** | utilisateur sans rôle | `user.role` est `undefined` (pas d'erreur) |

#### Exemple de test commenté

```js
test("génère un JWT avec id, email et role", async () => {
    // Arrange — configurer les mocks
    UserRepository.findByEmail.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);          // mdp valide
    RoleRepository.getRoleById.mockResolvedValue({ name: "user" });
    jwt.sign.mockReturnValue("token");

    // Act — appeler le service
    await AuthService.login("alice@example.com", "password123");

    // Assert — vérifier que jwt.sign a reçu les bons paramètres
    expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
            id: "uuid-123",
            email: "alice@example.com",
            role: "user",
        }),
        "test_secret",
        { expiresIn: "24h" }
    );
});
```

---

### 5.2 authMiddleware

**Fichier :** `backend/src/__tests__/unit/authMiddleware.test.js`  
**Module testé :** `backend/src/middlewares/authMiddleware.js`

#### Ce que ce middleware fait

- **`verifyToken(req, res, next)`** : extrait le token Bearer du header `Authorization`, le vérifie avec `jwt.verify`, et place le payload décodé dans `req.user` avant d'appeler `next()`.
- **`isAdmin(req, res, next)`** : vérifie que `req.user.role === 'admin'`, sinon renvoie 403.

#### Helpers de test

Les tests utilisent deux fonctions factory locales pour créer des faux objets `req` et `res` Express :

```js
function buildReq(headers = {}) {
    return { headers };
}

function buildRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);  // chaînable
    res.json   = jest.fn().mockReturnValue(res);
    return res;
}
```

#### Cas de test — verifyToken

| # | Scénario | Header envoyé | Résultat |
|---|---|---|---|
| 1 | Token valide | `Bearer xxx` | `next()` appelé, `req.user` rempli |
| 2 | Header absent | *(aucun)* | 401 `"Token manquant ou incorrect"` |
| 3 | Format incorrect | `Basic xxx` | 401 `"Token manquant ou incorrect"` |
| 4 | Token expiré/invalide | `Bearer expired` | 401 `"Token invalide ou expiré"` |

#### Cas de test — isAdmin

| # | Scénario | `req.user` | Résultat |
|---|---|---|---|
| 5 | Rôle admin | `{ role: "admin" }` | `next()` appelé |
| 6 | Rôle user | `{ role: "user" }` | 403 `"Accès refusé"` |
| 7 | `req.user` absent | `{}` | 403 `"Accès refusé"` |

---

### 5.3 UserService

**Fichier :** `backend/src/__tests__/unit/UserService.test.js`  
**Module testé :** `backend/src/services/UserService.js`

#### Particularité technique — mocks avec factory

Les modèles Sequelize définissent des associations (`User.belongsTo(Role, ...)`) au niveau du module. Si Jest charge le module pour générer un auto-mock, ces associations échouent car Sequelize n'est pas initialisé. La solution est d'utiliser des **factory mocks** qui ne chargent jamais le vrai module :

```js
jest.mock("../../repositories/UserRepository", () => ({
    getAllUsersRepository: jest.fn(),
    getUserByIdRepository: jest.fn(),
    findByEmail: jest.fn(),
    createUser: jest.fn(),
    patchUserRepository: jest.fn(),
    deleteUserRepository: jest.fn(),
}));
```

#### Méthodes testées

| Méthode | Cas testés |
|---|---|
| `getAllUsersService()` | Retour de liste, propagation d'erreur DB |
| `getUserByIdService(id)` | Utilisateur trouvé, null, tri des notes par date |
| `createUser(data)` | Création standard, rôle par défaut, rôle fourni, rôle introuvable, mdp auto-généré |
| `patchUserService(id, fields)` | Mise à jour partielle, erreur générique |
| `deleteUserService(id)` | Suppression, erreur générique |

#### Cas de test notables

**Tri des notes par date décroissante** — le service trie `notes_received` automatiquement. On vérifie l'ordre :

```js
test("retourne l'utilisateur avec les notes triées par date décroissante", async () => {
    const mockUser = {
        user_id: "uuid-1",
        notes_received: [
            { created_at: "2024-01-01" },  // ancienne
            { created_at: "2024-03-01" },  // la plus récente
            { created_at: "2024-02-01" },  // intermédiaire
        ],
    };
    userRepository.getUserByIdRepository.mockResolvedValue(mockUser);
    const result = await userService.getUserByIdService("uuid-1");

    expect(result.notes_received[0].created_at).toBe("2024-03-01");
    expect(result.notes_received[2].created_at).toBe("2024-01-01");
});
```

**Mot de passe auto-généré** — si aucun mot de passe n'est fourni, le service en génère un avec `crypto.randomBytes`. On vérifie que `bcrypt.hash` est bien appelé avec un string (sans vérifier sa valeur exacte, inconnue) :

```js
expect(bcrypt.hash).toHaveBeenCalledWith(expect.any(String), 10);
```

---

## 6. Tests d'intégration — Backend

> Localisation : `backend/src/__tests__/integration/`  
> Framework : Jest + Supertest  
> La **couche service et base de données** est mockée.  
> La **couche routing Express et middlewares** est réelle.

### Comment fonctionnent ces tests

Supertest monte l'application Express directement en mémoire sans démarrer un serveur HTTP :

```js
const request = require("supertest");
const app = require("../../app");

const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "a@b.com", password: "pass" });
```

Mocks systématiques dans tous les fichiers d'intégration :

```js
// Désactive le rate-limiter (limiterait les tests à N req/15min)
jest.mock("express-rate-limit", () => () => (req, res, next) => next());

// Supprime les logs HTTP pendant les tests
jest.mock("morgan", () => () => (req, res, next) => next());
```

---

### 6.1 Routes Auth

**Fichier :** `backend/src/__tests__/integration/auth.routes.test.js`  
**Route testée :** `POST /api/auth/login`

`AuthService` est entièrement mocké. On teste uniquement que le contrôleur et la route transmettent correctement les données et les codes HTTP.

| # | Scénario | Mock AuthService | Code HTTP | Corps attendu |
|---|---|---|---|---|
| 1 | Identifiants valides | résout avec `{ token, message, user }` | 200 | `token: "fake.jwt.token"` |
| 2 | Utilisateur introuvable | rejette avec `{ status: 404 }` | 404 | `message: "Utilisateur introuvable."` |
| 3 | Mauvais mot de passe | rejette avec `{ status: 401 }` | 401 | `message: "Mot de passe incorrect."` |
| 4 | Erreur serveur | rejette (sans `status`) | 500 | *(erreur générique)* |
| 5 | Format de réponse | résout | 200 | `Content-Type: application/json` |

---

### 6.2 Routes Trajet

**Fichier :** `backend/src/__tests__/integration/trajet.routes.test.js`  
**Routes testées :** `/api/trajet/favorites` et `/api/trajet/history`

Toutes ces routes sont **protégées par `verifyToken`**. Le test génère de vrais tokens JWT signés avec la clé de test :

```js
function makeToken(payload = { id: "user-uuid", role: "user" }) {
    return jwt.sign(payload, process.env.JWT_SECRET || "secret_key", { expiresIn: "1h" });
}
```

Les modèles Sequelize `FavoriteItinary` et `SearchHistory` sont auto-mockés par Jest.

#### Favoris — cas testés

| Route | # | Scénario | Code |
|---|---|---|---|
| `GET /favorites` | 1 | Token valide → liste des favoris | 200 |
| `GET /favorites` | 2 | Sans token | 401 |
| `GET /favorites` | 3 | Erreur base de données | 500 |
| `POST /favorites` | 4 | Corps complet → favori créé | 201 |
| `POST /favorites` | 5 | `gare_arrivee` manquant | 400 |
| `POST /favorites` | 6 | Favori déjà existant (doublon) | 409 |
| `POST /favorites` | 7 | Sans token | 401 |
| `DELETE /favorites/:id` | 8 | Suppression réussie | 200 |
| `DELETE /favorites/:id` | 9 | ID inexistant | 404 |
| `DELETE /favorites/:id` | 10 | Sans token | 401 |

#### Historique — cas testés

| Route | # | Scénario | Code |
|---|---|---|---|
| `GET /history` | 11 | Token valide → historique | 200 |
| `GET /history` | 12 | Sans token | 401 |
| `POST /history` | 13 | Corps complet → entrée sauvegardée | 201 |
| `POST /history` | 14 | `gare_depart` manquant | 400 |
| `POST /history` | 15 | Vérification du format JSON stocké | 201 + assertion sur `type_train` |

#### Test de sérialisation JSON (cas 15)

Ce test vérifie un comportement interne critique : les métadonnées du trajet (`duree`, `co2_economise`, `prix`) sont sérialisées en JSON et stockées dans le champ `type_train` de la base. Un bug ici provoquerait des `JSON.parse()` silencieusement cassés côté frontend.

```js
test("stocke les métadonnées au format JSON", async () => {
    let captured;
    SearchHistory.create.mockImplementation((data) => {
        captured = data;           // on capture les données envoyées au modèle
        return Promise.resolve({ ...data, history_id: 1 });
    });

    await request(app).post("/api/trajet/history")
        .set("Authorization", `Bearer ${makeToken()}`)
        .send({ gare_depart: "Paris", gare_arrivee: "Lyon", duree: "2h00", prix: 55 });

    expect(typeof captured.type_train).toBe("string");   // stocké en string
    const parsed = JSON.parse(captured.type_train);
    expect(parsed.duree).toBe("2h00");
    expect(parsed.prix).toBe(55);
});
```

---

### 6.3 Routes Utilisateurs

**Fichier :** `backend/src/__tests__/integration/users.routes.test.js`  
**Routes testées :** `/api/users`

> **Note importante :** Dans l'implémentation actuelle, les routes `/api/users` n'appliquent pas `verifyToken`. Les routes de modification utilisent le préfixe `/api/users/user/:id`.

`UserService` est mocké avec une factory explicite. Le middleware multer (upload de photo) est remplacé par un passthrough.

| Route | # | Scénario | Code |
|---|---|---|---|
| `GET /users` | 1 | Liste de tous les utilisateurs (public) | 200 |
| `GET /users` | 2 | Erreur DB | 500 |
| `GET /users/:id` | 3 | Utilisateur trouvé | 200 |
| `GET /users/:id` | 4 | ID inexistant | 404 |
| `GET /users/:id` | 5 | Erreur DB | 500 |
| `POST /users` | 6 | Création réussie | 201 |
| `POST /users` | 7 | Email déjà utilisé | 500 |
| `PATCH /users/user/:id` | 8 | Mise à jour partielle | 200 |
| `PATCH /users/user/:id` | 9 | ID inexistant | 500 |
| `DELETE /users/user/:id` | 10 | Suppression réussie | 200 |
| `DELETE /users/user/:id` | 11 | ID inexistant | 500 |

---

## 7. Tests de composants — Frontend

> Localisation : `frontend/src/__tests__/`  
> Framework : React Testing Library + Jest  
> Environnement : jsdom (navigateur simulé)  
> Appels API : **tous mockés**

### Configuration Jest (frontend/package.json)

Des ajustements ont été nécessaires pour React Router DOM v7 (pas de `main.js` CJS) et axios v1 (ESM only) :

```json
"jest": {
    "moduleNameMapper": {
        "^react-router-dom$": "<rootDir>/node_modules/react-router-dom/dist/index.js",
        "^react-router/dom$": "<rootDir>/node_modules/react-router/dist/development/dom-export.js",
        "^react-router$":     "<rootDir>/node_modules/react-router/dist/development/index.js"
    },
    "transformIgnorePatterns": [
        "/node_modules/(?!(axios)/)"
    ]
}
```

---

### 7.1 Hook useAuth

**Fichier :** `frontend/src/__tests__/hooks/useAuth.test.js`  
**Module testé :** `frontend/src/hooks/useAuth.jsx`

#### Ce que ce hook fait

`useAuth()` lit le token JWT du `localStorage`, le décode avec `jwt-decode`, vérifie son expiration et retourne `{ isAuthenticated, id, role }`.

#### Mock de jwt-decode

```js
jest.mock("jwt-decode");
import { jwtDecode } from "jwt-decode";
```

Chaque test contrôle ce que `jwtDecode` retourne, sans avoir besoin d'un vrai token signé.

#### Cas de test

| # | Scénario | localStorage | jwtDecode | Résultat |
|---|---|---|---|---|
| 1 | Pas de token | vide | *(non appelé)* | `{ isAuthenticated: false, id: null, role: null }` |
| 2 | Token valide | `"valid.token"` | `{ id, role, exp: futur }` | `{ isAuthenticated: true, id, role }` |
| 3 | Token expiré | `"expired.token"` | `{ exp: passé }` | `isAuthenticated: false`, token supprimé du localStorage |
| 4 | Token malformé | `"bad.token"` | lève une Error | `{ isAuthenticated: false, id: null, role: null }` |
| 5 | Token sans rôle | `"token"` | `{ id, exp: futur }` (pas de `role`) | `{ isAuthenticated: true, role: null }` |
| 6 | Token sans exp | `"token"` | `{ id, role }` (pas d'`exp`) | `{ isAuthenticated: true }` — pas d'expiration vérifiée |

#### Test de suppression du token expiré

```js
test("retourne isAuthenticated=false et supprime le token expiré", () => {
    const pastExp = Math.floor(Date.now() / 1000) - 1;  // 1 seconde dans le passé
    jwtDecode.mockReturnValue({ id: "uuid-1", role: "user", exp: pastExp });
    localStorage.setItem("token", "expired.token");

    const result = useAuth();

    expect(result.isAuthenticated).toBe(false);
    expect(localStorage.getItem("token")).toBeNull();  // token supprimé !
});
```

---

### 7.2 Composant AuthModal

**Fichier :** `frontend/src/__tests__/components/AuthModal.test.jsx`  
**Composant testé :** `frontend/src/components/AuthModal.jsx`

#### Ce que ce composant fait

Modal qui gère deux formulaires : connexion (email + mdp) et inscription (nom, prénom, date de naissance, email, mdp, téléphone). Utilise `api.post` pour appeler le backend et stocke le token JWT dans le localStorage.

#### Mocks

```js
// Factory mock explicite pour éviter le chargement du module ESM axios
jest.mock("../../api/axios", () => {
    const mock = {
        post: jest.fn(),
        get: jest.fn(),
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    };
    return { __esModule: true, default: mock };
});

// L'image décoratives remplacée par une string (jsdom ne charge pas les assets)
jest.mock("../../assets/montagnes-ss-bg.png", () => "montagnes.png");

// alert() natif n'existe pas dans jsdom — on le remplace par un mock
global.alert = jest.fn();
```

#### Cas de test

| Catégorie | # | Description |
|---|---|---|
| **Rendu conditionnel** | 1 | `isOpen=false` → le DOM est vide |
| **Rendu conditionnel** | 2 | `isOpen=true` → le titre "Se connecter" est visible |
| **Mode login** | 3 | Formulaire login affiche Email et Mot de passe, mais pas les champs inscription |
| **Mode login** | 4 | Connexion réussie → token stocké dans localStorage, `onClose()` appelé |
| **Mode login** | 5 | Connexion échouée → `alert()` avec le message d'erreur, modal reste ouverte |
| **Bascule** | 6 | Clic "S'inscrire" → titre "Inscription", champs Nom/Prénom visibles |
| **Mode inscription** | 7 | Inscription réussie → retour au mode login |
| **Fermeture** | 8 | Clic sur l'overlay → `onClose()` appelé |
| **Fermeture** | 9 | Clic à l'intérieur de la modal → `onClose()` NON appelé |

#### Interaction utilisateur avec userEvent

Les tests utilisent `userEvent` (simulation haute-fidélité) pour les saisies, et `fireEvent.submit` pour la soumission du formulaire :

```js
test("connexion réussie — stocke le token et ferme la modal", async () => {
    api.post.mockResolvedValue({ data: { token: "fake.jwt.token" } });

    render(<AuthModal isOpen={true} onClose={onClose} />);

    // Simulation réaliste de la frappe (événements keydown + keyup + input)
    await userEvent.type(screen.getByPlaceholderText("Email"), "alice@example.com");
    await userEvent.type(screen.getByPlaceholderText("Mot de passe"), "password123");
    fireEvent.submit(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => {
        expect(localStorage.getItem("token")).toBe("fake.jwt.token");
        expect(onClose).toHaveBeenCalled();
    });
});
```

---

### 7.3 Composant PrivateRoute

**Fichier :** `frontend/src/__tests__/components/PrivateRoute.test.jsx`  
**Composant testé :** `frontend/src/components/PrivateRoute.jsx`

#### Ce que ce composant fait

Garde de route qui :
1. Appelle `useAuth()` pour vérifier l'état de connexion
2. Si non authentifié → `<Navigate to="/login" />`
3. Si authentifié mais rôle non autorisé → `<Navigate to="/unauthorized" />`
4. Sinon → `<Outlet />` (contenu de la route protégée)

#### Stratégie de mock — react-router-dom v7

React Router DOM v7 utilise des APIs navigateur modernes (`TextEncoder`, etc.) non disponibles dans jsdom. On mocke entièrement la librairie avec des composants React simples :

```js
jest.mock("react-router-dom", () => ({
    // Navigate ajoute un data-to pour qu'on puisse vérifier la destination
    Navigate: ({ to }) => <div data-testid="navigate" data-to={to} />,
    // Outlet rend un div identifiable
    Outlet: () => <div data-testid="outlet">Contenu protégé</div>,
    useLocation: () => ({ pathname: "/" }),
}));
```

Ce mock permet d'utiliser `screen.getByTestId("navigate")` et de vérifier l'attribut `data-to` pour savoir vers quelle URL la redirection pointe.

#### Cas de test

| # | isAuthenticated | role | roles requis | Résultat |
|---|---|---|---|---|
| 1 | `true` | `"user"` | `[]` | `<Outlet />` affiché |
| 2 | `false` | `null` | `[]` | Redirect vers `/login` |
| 3 | `true` | `"admin"` | `["admin"]` | `<Outlet />` affiché |
| 4 | `true` | `"user"` | `["admin"]` | Redirect vers `/unauthorized` |
| 5 | `true` | `"user"` | `[]` *(aucun requis)* | `<Outlet />` affiché |
| 6 | `true` | `"moderator"` | `["admin", "moderator"]` | `<Outlet />` affiché |

---

### 7.4 Composant CO2Equivalences

**Fichier :** `frontend/src/__tests__/components/CO2Equivalences.test.jsx`  
**Composant testé :** `frontend/src/components/CO2Equivalences.jsx`

#### Ce que ce composant fait

Affiche 4 cartes d'équivalences CO₂ (arbres, km voiture, chauffage, charges smartphone) calculées à partir du paramètre `co2SavedKg`. Une animation CSS est déclenchée 200ms après le montage.

#### Formules de calcul testées

| Équivalence | Formule | Exemple (10 kg) |
|---|---|---|
| Arbres plantés | `co2 / 21` | `10 / 21 = 0.5` → `"0.5"` |
| Km de voiture | `co2 / 0.122` | `10 / 0.122 = 81.97` → `"82 km"` |
| Jours de chauffage | `co2 / 8` | `10 / 8 = 1.25` → `"1.2"` |
| Charges smartphone | `co2 / 0.008` | `10 / 0.008 = 1250` → `"1250"` |

**Règle d'affichage :** valeur `< 10` → `toFixed(1)`, valeur `>= 10` → `Math.round`.

#### Mock des icônes react-icons

Les icônes sont remplacées par de simples `<span>` pour ne pas dépendre du rendu SVG de jsdom :

```js
jest.mock("react-icons/fa", () => ({
    FaTree: () => <span>tree</span>,
    FaCar: () => <span>car</span>,
    // ...
}));
```

#### Cas de test

| # | Description | Entrée | Résultat |
|---|---|---|---|
| 1 | Pas de rendu si CO₂ = 0 | `co2SavedKg={0}` | `container.firstChild` est null |
| 2 | Pas de rendu si CO₂ négatif | `co2SavedKg={-5}` | `container.firstChild` est null |
| 3 | Pas de rendu si CO₂ undefined | *(prop absente)* | `container.firstChild` est null |
| 4 | Affichage du titre avec la bonne valeur | `42.567` | `"42.6 kg de CO₂"` |
| 5 | Toutes les 4 cartes présentes | `10` | Labels texte visibles |
| 6 | Calcul km voiture | `12.2` | `"100 km"` |
| 7 | Affichage `toFixed(1)` si < 10 | `21` (arbres = 1.0) | `"1.0"` |
| 8 | Arrondi entier si >= 10 | `100` (voiture = 820) | `"820 km"` |
| 9 | Animation après 200ms | `10` | Classe `.co2-visible` ajoutée après `advanceTimersByTime(200)` |

#### Test de timer avec Jest fake timers

```js
test("la section devient visible après le timer de 200ms", () => {
    const { container } = render(<CO2Equivalences co2SavedKg={10} />);
    const section = container.querySelector(".co2-equiv-section");

    // Avant l'écoulement du timer : pas de classe visible
    expect(section).not.toHaveClass("co2-visible");

    // Avancer le temps de 200ms (sans attendre en vrai)
    act(() => jest.advanceTimersByTime(200));

    // Après : la classe est ajoutée
    expect(section).toHaveClass("co2-visible");
});
```

---

### 7.5 Smoke test App

**Fichier :** `frontend/src/App.test.js`  
**Composant testé :** `frontend/src/App.js`

Test minimal qui vérifie que le composant racine se monte sans lever d'exception. Toutes les pages, le router et les contextes sont mockés.

```js
test("l'application se monte sans crash", () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
});
```

---

## 8. Tests End-to-End — Playwright

> Localisation : `e2e/`  
> Framework : Playwright Test  
> Navigateur : Chromium (headless)  
> Configuration : `e2e/playwright.config.js`

### Configuration Playwright

```js
module.exports = defineConfig({
    testDir: "./e2e",
    timeout: 30_000,
    retries: 1,          // 1 retry en cas d'échec flaky
    workers: 1,          // séquentiel pour éviter les conflits de state
    use: {
        baseURL: "http://localhost:3000",
        headless: true,
        screenshot: "only-on-failure",
        video: "retain-on-failure",
    },
    // Lance automatiquement le frontend React avant les tests
    webServer: {
        command: "npm start",
        cwd: "./frontend",
        url: "http://localhost:3000",
        reuseExistingServer: true,
    },
});
```

### Interception d'API (page.route)

Plutôt que d'appeler le vrai backend (qui nécessiterait PostgreSQL et FastAPI), les tests E2E peuvent intercepter les appels réseau avec `page.route()` :

```js
await page.route("**/api/sncf/trajet**", (route) =>
    route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ journeys: [], from: "Paris", to: "Lyon" }),
    })
);
```

---

### 8.1 auth.spec.js

**Fichier :** `e2e/auth.spec.js`

Prérequis : un compte de test doit exister dans la base (`RAILGO_TEST_EMAIL` / `RAILGO_TEST_PASSWORD`).

| # | Scénario | Prérequis réseau |
|---|---|---|
| 1 | Ouvre la modal en cliquant sur "Connexion" | Aucun |
| 2 | Connexion réussie → token JWT dans localStorage | Backend réel sur :8000 |
| 3 | Mauvais identifiants → alerte JavaScript | Backend réel sur :8000 |
| 4 | Bascule vers le formulaire d'inscription | Aucun |
| 5 | Fermeture de la modal via l'overlay | Aucun |
| 6 | Accès à `/profil` sans connexion → redirection `/login` | Aucun |

#### Interception des alertes

```js
const alertMessages = [];
page.on("dialog", async (dialog) => {
    alertMessages.push(dialog.message());
    await dialog.accept();  // ferme la boîte de dialogue automatiquement
});
```

#### Vérification du format JWT dans localStorage

```js
const token = await page.evaluate(() => localStorage.getItem("token"));
expect(token).not.toBeNull();
expect(token.split(".").length).toBe(3);  // header.payload.signature
```

---

### 8.2 search.spec.js

**Fichier :** `e2e/search.spec.js`

| # | Describe | Scénario | API mockée |
|---|---|---|---|
| 1 | Recherche de trajet | Page principale se charge | Non |
| 2 | Recherche de trajet | Autocomplétion visible après frappe | Non (appel Navitia réel) |
| 3 | Recherche de trajet | Sélection depuis l'autocomplétion remplit le champ | Non |
| 4 | Recherche de trajet | Formulaire vide → pas de navigation | Non |
| 5 | Recherche de trajet | Recherche complète → navigation vers `/search` | Oui (autocomplete + trajet) |
| 6 | Page de résultats | Aucun trajet → message d'information | Oui (trajet → journeys vide) |
| 7 | Page de résultats | Filtres POI cliquables et toggleables | Oui (trajet + sncf/*) |

---

### 8.3 favorites.spec.js

**Fichier :** `e2e/favorites.spec.js`

Ces tests nécessitent une session utilisateur. On l'injecte directement dans le localStorage plutôt que de passer par le formulaire de login :

```js
async function loginAsTestUser(page) {
    await page.goto("/index");
    await page.evaluate((token) => localStorage.setItem("token", token), FAKE_TOKEN);
}
```

Toutes les routes `/api/trajet/favorites` sont mockées avec un handler qui gère GET / POST / DELETE selon la méthode HTTP.

| # | Describe | Scénario | API mockée |
|---|---|---|---|
| 1 | Favoris | Favoris affichés dans la sidebar | Oui (GET favorites) |
| 2 | Favoris | Clic favori pré-remplit les champs de recherche | Oui (GET favorites) |
| 3 | Favoris | Ajout depuis les résultats de recherche | Oui (trajet + POST favorites) |
| 4 | Historique | Historique visible dans la page profil | Oui (GET history + GET user) |

---

## 9. Stratégie de mock

### Règles générales

| Type de dépendance | Stratégie | Raison |
|---|---|---|
| Base de données (Sequelize) | Mock complet (factory) | Tests rapides, déterministes, pas de DB nécessaire |
| Services internes | `jest.mock("./service")` | Isolation des couches |
| JWT | Mock de `jsonwebtoken` | Contrôle total sur les tokens générés/vérifiés |
| Axios (frontend) | Factory mock ESM-compatible | Axios v1 est ESM ; auto-mock casse le chargement |
| react-router-dom v7 | Module mapper + mock React | v7 exige `TextEncoder` absent de jsdom |
| react-icons | Mock par composant `<span>` | Évite SVG complexe dans les snapshots |
| Assets (images) | `jest.mock("image.png", () => "image.png")` | jsdom ne charge pas les fichiers binaires |
| Rate limiter | Passthrough `(req, res, next) => next()` | Évite d'être bloqué après N requêtes de test |
| Morgan (logs) | Passthrough | Pas de logs parasites dans la sortie de test |

### Ordre des mocks dans les fichiers

Les `jest.mock()` sont **hoistés** automatiquement avant les `require/import` par Jest. L'ordre dans le code n'a pas d'importance, mais par convention on les place en tête de fichier pour la lisibilité.

---

## 10. Configuration technique

### jest.config.js (backend)

```js
module.exports = {
    testEnvironment: "node",
    testMatch: ["**/__tests__/**/*.test.js"],
    collectCoverageFrom: [
        "src/**/*.js",
        "!src/server.js",     // point d'entrée, pas de logique
        "!src/config/**",     // configuration DB, pas de logique
    ],
    coverageReporters: ["text", "lcov"],
};
```

### jest (frontend — extrait de package.json)

```json
"jest": {
    "moduleNameMapper": {
        "^react-router-dom$": "<rootDir>/node_modules/react-router-dom/dist/index.js",
        "^react-router/dom$": "<rootDir>/node_modules/react-router/dist/development/dom-export.js",
        "^react-router$":     "<rootDir>/node_modules/react-router/dist/development/index.js"
    },
    "transformIgnorePatterns": [
        "/node_modules/(?!(axios)/)"
    ]
}
```

### playwright.config.js

```js
module.exports = defineConfig({
    testDir: "./e2e",
    timeout: 30_000,
    retries: 1,
    workers: 1,
    use: {
        baseURL: "http://localhost:3000",
        headless: true,
        screenshot: "only-on-failure",
        video: "retain-on-failure",
    },
    projects: [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    ],
    webServer: {
        command: "npm start",
        cwd: "./frontend",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 60_000,
    },
});
```

---

## 11. Résultats et couverture

### Backend (dernière exécution)

```
Test Suites: 6 passed, 6 total
Tests:       57 passed, 57 total
Snapshots:   0 total
Time:        ~12s
```

| Suite | Tests | Statut |
|---|---|---|
| unit/AuthService.test.js | 6 | ✅ |
| unit/authMiddleware.test.js | 7 | ✅ |
| unit/UserService.test.js | 12 | ✅ |
| integration/auth.routes.test.js | 5 | ✅ |
| integration/trajet.routes.test.js | 14 | ✅ |
| integration/users.routes.test.js | 13 | ✅ |

### Frontend (dernière exécution)

```
Test Suites: 5 passed, 5 total
Tests:       31 passed, 31 total
Snapshots:   0 total
Time:        ~3s
```

| Suite | Tests | Statut |
|---|---|---|
| hooks/useAuth.test.js | 6 | ✅ |
| components/AuthModal.test.jsx | 8 | ✅ |
| components/PrivateRoute.test.jsx | 6 | ✅ |
| components/CO2Equivalences.test.jsx | 8 | ✅ |
| App.test.js | 1 | ✅ |

### E2E (statut selon environnement)

Les tests E2E nécessitent l'application complète. Le résultat varie selon que le backend réel est disponible.

| Suite | Scénarios | Dépend du backend |
|---|---|---|
| auth.spec.js | 6 | Tests 2 et 3 seulement |
| search.spec.js | 7 | Tests 2 et 3 (autocomplete live) |
| favorites.spec.js | 4 | Non (tout mocké) |

---

## 12. Problèmes connus et solutions

### Problème 1 — Modèles Sequelize dans les tests unitaires

**Symptôme :** `User.belongsTo called with something that's not a subclass of Sequelize.Model`

**Cause :** Les fichiers de modèles définissent des associations Sequelize au niveau du module (ligne de code exécutée à l'import). Même avec `jest.mock("../models/UserModel")`, Jest charge le module pour générer l'auto-mock, ce qui déclenche les associations avant que Sequelize soit initialisé.

**Solution :** Utiliser des **factory mocks** qui remplacent le module sans le charger :

```js
// ❌ Auto-mock (charge le module quand même)
jest.mock("../../repositories/UserRepository");

// ✅ Factory mock (le module original n'est jamais chargé)
jest.mock("../../repositories/UserRepository", () => ({
    findByEmail: jest.fn(),
    createUser: jest.fn(),
    // ...
}));
```

---

### Problème 2 — axios ESM dans les tests frontend

**Symptôme :** `SyntaxError: Cannot use import statement outside a module` dans `axios/index.js`

**Cause :** axios v1.x est un module ESM (`"type": "module"`). CRA's Jest (basé sur Babel/CommonJS) ne peut pas le transformer par défaut.

**Solution :** Ajouter axios à la liste des modules à transformer dans `jest.transformIgnorePatterns` :

```json
"transformIgnorePatterns": ["/node_modules/(?!(axios)/)"]
```

Et utiliser une factory mock pour `src/api/axios.jsx` afin d'éviter même que Jest charge axios :

```js
jest.mock("../../api/axios", () => ({
    __esModule: true,
    default: { post: jest.fn(), get: jest.fn() }
}));
```

---

### Problème 3 — react-router-dom v7 et `main.js` manquant

**Symptôme :** `Cannot find module 'react-router-dom'`

**Cause :** Le `package.json` de react-router-dom v7 pointe vers `./dist/main.js`, qui n'existe pas. Le vrai fichier CJS est `./dist/index.js`.

**Solution :** Ajouter un `moduleNameMapper` dans la configuration Jest du frontend pour pointer vers le bon fichier :

```json
"moduleNameMapper": {
    "^react-router-dom$": "<rootDir>/node_modules/react-router-dom/dist/index.js"
}
```

---

### Problème 4 — `TextEncoder` manquant pour react-router v7 dans jsdom

**Symptôme :** `ReferenceError: TextEncoder is not defined`

**Cause :** react-router v7 utilise l'API `TextEncoder` (disponible dans Node.js ≥ 11 mais pas toujours exposée dans l'environnement jsdom de CRA).

**Solution :** Mocker complètement `react-router-dom` dans les tests qui l'utilisent, avec de simples composants React qui ne déclenchent pas le code natif du routeur :

```js
jest.mock("react-router-dom", () => ({
    Navigate: ({ to }) => <div data-testid="navigate" data-to={to} />,
    Outlet: () => <div data-testid="outlet" />,
    useLocation: () => ({ pathname: "/" }),
}));
```

---

### Problème 5 — Rate limiter bloque les tests d'intégration

**Symptôme :** Les requêtes Supertest retournent 429 après quelques tests.

**Cause :** L'application active un rate limiter (1000 req/15min) via `express-rate-limit`. En test, toutes les requêtes viennent du même process.

**Solution :** Mocker le rate limiter pour qu'il soit transparent :

```js
jest.mock("express-rate-limit", () => () => (req, res, next) => next());
```

---

*Documentation générée le 2026-04-04 — RailGo v1.0*
