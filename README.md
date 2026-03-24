# RailGo

Application web pour encourager le voyage en train en France. Elle permet de rechercher des trajets, comparer l'impact environnemental avec la voiture et l'avion, et decouvrir des points d'interet autour des gares de depart et d'arrivee.

---

## Architecture

L'application est composee de trois services qui tournent en parallele.

```
Frontend React (port 3000)
        |
        v
Backend Express.js (port 8000)
        |
        +-----> FastAPI Python (port 9000)
        |
        +-----> PostgreSQL (port 5432)
```

Le frontend ne communique qu'avec le backend Express. Le backend Express joue le role de proxy vers la FastAPI pour tout ce qui concerne les donnees SNCF et les points d'interet, et se connecte directement a PostgreSQL pour la gestion des utilisateurs, favoris et historique.

---

## Structure du projet

```
sncf/
├── api/                    FastAPI Python
│   ├── app/
│   │   └── main.py         Tous les endpoints de donnees SNCF et POI
│   └── .env                Cle API SNCF
├── backend/                Express.js
│   ├── src/
│   │   ├── config/
│   │   │   └── Database.js Connexion Sequelize PostgreSQL
│   │   ├── controllers/    Logique metier HTTP
│   │   ├── middlewares/    Auth JWT, upload fichiers
│   │   ├── models/         Modeles Sequelize (User, FavoriteItinary, SearchHistory...)
│   │   ├── repositories/   Acces BDD
│   │   ├── routes/         AuthRoute, UserRoute, SncfRoute, TrajetRoute, StatsRoute
│   │   └── services/       Services metier
│   └── .env                Config BDD, port, JWT secret
├── frontend/               React
│   └── src/
│       ├── api/            Instance Axios avec intercepteur JWT
│       ├── components/     NavBar, CO2Equivalences, WeatherWidget, ShareButton
│       ├── context/        ThemeContext (dark mode global)
│       ├── hooks/          useAuth (decodage JWT)
│       ├── pages/          Home, Index, SearchResult, Profil, Inspiration
│       └── styles/         CSS par page et composant
└── Data/
    └── DataLake/processed/
        ├── gares.xlsx              Liste des gares avec coordonnees GPS
        ├── tarifs-tgv.xlsx         Tarifs de reference par trajet
        └── emission-co2-perimetre-usage.xlsx  Empreintes CO2 par trajet
```

---

## Prerequis

- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- pip

---

## Installation

### 1. Base de donnees PostgreSQL

Creer une base de donnees nommee `sncf`. Configurer `backend/.env` :

```
DB_NAME=sncf
DB_USER=postgres
DB_PASS=votre_mot_de_passe
DB_HOST=localhost
DB_PORT=5432
DB_SSL=false
PORT=8000
FASTAPI_URL=http://localhost:9000
JWT_SECRET=votre_secret_jwt
```

Les tables sont creees automatiquement au premier demarrage via `sequelize.sync()`.

### 2. FastAPI Python

```bash
cd api
pip install fastapi uvicorn pandas openpyxl requests python-dotenv
```

Configurer `api/.env` :

```
SNCF_API_KEY=votre_cle_api_sncf
```

La cle est disponible sur api.sncf.com apres creation d'un compte developeur.

### 3. Backend Express

```bash
cd backend
npm install
```

### 4. Frontend React

```bash
cd frontend
npm install
```

Creer `frontend/.env` ou `frontend/.env.local` :

```
REACT_APP_API_URL=http://localhost:8000/api
```

---

## Lancement

Trois terminaux en parallele.

**Terminal 1 - FastAPI :**
```bash
cd api
uvicorn app.main:app --reload --port 9000
```

**Terminal 2 - Backend Express :**
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend React :**
```bash
cd frontend
npm start
```

Application accessible sur `http://localhost:3000`.

---

## Variables d'environnement

### backend/.env

| Variable | Description | Defaut |
|---|---|---|
| DB_NAME | Nom de la base PostgreSQL | sncf |
| DB_USER | Utilisateur PostgreSQL | postgres |
| DB_PASS | Mot de passe PostgreSQL | |
| DB_HOST | Hote PostgreSQL | localhost |
| DB_PORT | Port PostgreSQL | 5432 |
| PORT | Port du serveur Express | 8000 |
| JWT_SECRET | Cle secrete pour les tokens JWT | secret_key |
| FASTAPI_URL | URL de la FastAPI | http://localhost:9000 |

### api/.env

| Variable | Description |
|---|---|
| SNCF_API_KEY | Cle API SNCF (api.sncf.com) |

### frontend/.env

| Variable | Description |
|---|---|
| REACT_APP_API_URL | URL complete du backend Express |

---

## Routes API

### Express - prefixe /api

**Authentification**
- `POST /api/auth/login` - Connexion, retourne un token JWT
- `POST /api/auth/register` - Creation de compte

**Utilisateurs**
- `GET /api/users/:id` - Profil utilisateur
- `PATCH /api/users/user/:id` - Modifier le profil (authentifie)
- `DELETE /api/users/user/:id` - Supprimer le compte (authentifie)

**SNCF - proxy vers FastAPI**
- `GET /api/sncf/autocomplete?q=` - Suggestions de gares
- `GET /api/sncf/gares` - Liste complete des gares
- `GET /api/sncf/gare-proche?lat=&lon=` - Gare la plus proche par coordonnees GPS
- `GET /api/sncf/trajet?from_city=&to_city=` - Infos du trajet sans POI (rapide)
- `GET /api/sncf/trajet/poi?lat_arr=&lon_arr=&lat_dep=&lon_dep=` - Points d'interet (lent, appels Overpass)
- `GET /api/sncf/destinations` - Destinations coup de coeur

**Trajets - authentifie**
- `GET /api/trajet/favorites` - Mes trajets favoris
- `POST /api/trajet/favorites` - Ajouter un favori
- `DELETE /api/trajet/favorites/:id` - Supprimer un favori
- `GET /api/trajet/history` - Mon historique de recherches
- `POST /api/trajet/history` - Sauvegarder une recherche

**Statistiques**
- `GET /api/stats/global` - CO2 total economise et nombre de trajets (tous utilisateurs)
- `GET /api/stats/leaderboard` - Top 10 utilisateurs par CO2 economise (anonymise)
- `POST /api/stats/price-alert` - Creer une alerte prix indicatif (authentifie)
- `GET /api/stats/price-alerts` - Mes alertes prix (authentifie)
- `DELETE /api/stats/price-alerts/:id` - Supprimer une alerte (authentifie)

---

## Modeles de base de donnees

**users** - Comptes utilisateurs. Champs : user_id (UUID), first_name, last_name, email, password (hache bcrypt), phone, address, postal_code, city, date_of_birth, photo_url, role_id.

**roles** - Roles disponibles : user, admin.

**favorites_itinary** - Trajets favoris. Champs : favorites_itinary_id, user_id (FK), gare_depart, gare_arrivee, created_at.

**favorites_gares** - Gares favorites. Champs : favorites_gare_id, user_id (FK), gare_code, gare_nom, region, created_at.

**search_history** - Historique des recherches. Champs : search_history_id, user_id (FK), gare_depart, gare_arrivee, date_recherche, type_train (JSON : duree, co2_economise, prix indicatif), created_at.

---

## Sources de donnees et ce qui est reel

### Donnees reelles en temps reel

**Duree du trajet et prochains departs**
Source : API SNCF v1 (api.sncf.com, endpoint `/coverage/sncf/journeys`). Appel reel avec la cle API configuree dans `api/.env`. Retourne jusqu'a 5 options de trajet avec heure de depart, heure d'arrivee, nombre de correspondances et trace GPS GeoJSON.

**Points d'interet : hotels, velos, parkings, activites**
Source : OpenStreetMap via Overpass API (overpass-api.de). Donnees contributives, mises a jour en continu par la communaute OSM. La FastAPI maintient un cache en memoire de 5 minutes pour eviter le rate limiting (erreur 429).

**Meteo a destination**
Source : Open-Meteo API (api.open-meteo.com). API gratuite, sans cle, donnees meteorologiques prevues sur 7 jours. Appel direct depuis le navigateur avec les coordonnees GPS de la gare d'arrivee.

**Utilisateurs, favoris, historique, stats, leaderboard**
Source : base de donnees PostgreSQL locale. Toutes les ecritures et lectures sont reelles. Le leaderboard est agrege depuis la table search_history au moment de la requete.

**Gare la plus proche**
Calcul Haversine applique aux coordonnees GPS de toutes les gares du fichier gares.xlsx. Le resultat est reel mais base sur les coordonnees statiques du fichier.

### Donnees reelles mais statiques (fichiers Excel SNCF Open Data)

**Empreinte CO2 train et voiture**
Source : `emission-co2-perimetre-usage.xlsx`, jeu de donnees SNCF Open Data. Contient l'empreinte carbone mesuree par trajet en kg CO2e. Si le trajet n'est pas dans le fichier, la valeur est estimee avec les coefficients ADEME : 0.0194 kg/km pour le train, 0.122 kg/km pour la voiture.

**Liste des gares et coordonnees GPS**
Source : `gares.xlsx`, jeu de donnees SNCF Open Data. Charge en memoire au demarrage de la FastAPI. Utilise pour l'autocompletion, la recherche par code UIC et la geolocalisation de la gare la plus proche.

**CO2 avion**
Coefficient ADEME fixe de 0.255 kg/km par passager. Affiche uniquement pour les distances superieures a 300 km. Valeur reconnue par l'ADEME, non calculee en temps reel.

### Donnees statiques limitees - ce qui n'est pas temps reel

**Prix indicatif**
Source : `tarifs-tgv.xlsx`, jeu de donnees SNCF Open Data. Ce fichier contient des fourchettes de prix min/max par trajet issu de statistiques historiques. Ce sont des tarifs de reference, pas des prix de billets disponibles a la vente. L'interface precise explicitement "prix indicatif - tarif de reference SNCF Open Data". Pour obtenir les vrais prix de billets en temps reel, il faudrait un accord commercial avec SNCF Connect (OUI.sncf), dont l'API de distribution n'est pas publique.

**Destinations coup de coeur**
Liste de 10 destinations codee en dur dans `api/app/main.py` avec des descriptions et des images Unsplash. Elle est melangee aleatoirement a chaque appel. Ce n'est pas dynamique : pour ajouter ou modifier une destination, il faut editer le code Python.

---

## Securite

- Mots de passe haches avec bcrypt (salt 10)
- Authentification stateless par token JWT, expiration 24h
- Middleware `verifyToken` sur toutes les routes qui necessitent un compte
- Rate limiting Express : 100 requetes par tranche de 15 minutes
- Headers de securite via Helmet.js
- Cle API SNCF dans variable d'environnement, jamais dans le code versionne

---

## Fonctionnalites

### Recherche de trajet
Saisie avec autocompletion sur les noms de gares, selection de date, geolocalisation automatique de la gare la plus proche. Bouton "Surprends-moi" pour une destination aleatoire.

### Page de resultats
Carte Leaflet interactive avec trace GPS reel du trajet (ou ligne droite en pointilles si indisponible). Comparatif CO2 train / voiture / avion avec barres visuelles. Equivalences CO2 en termes concrets (arbres, km voiture, jours de chauffage). Prochains departs avec horaires reels. Meteo a destination. Alerte prix. Bouton de partage natif (Web Share API).

### Points d'interet
Charges separement du trajet pour ne pas ralentir l'affichage initial. Hotels, stations velo en libre-service, activites (restaurants, bars, culture, parcs, sports), parkings. Filtres et sous-filtres. Marqueurs colores sur la carte.

### Page Inspiration
Grille de destinations avec filtres par type (mer, montagne, culture, gastronomie, nature). Ville de depart configurable. Clic direct vers la recherche du trajet.

### Profil utilisateur
Informations personnelles avec modification. Historique des 5 derniers trajets (depuis la BDD). Favoris avec suppression. Badges de progression bases sur le nombre de trajets et le CO2 economise (6 niveaux). Defi hebdomadaire avec barre de progression. Dashboard CO2 personnel (total, arbres equivalents, km evites). Classement communaute anonymise.

### Dark mode
Toggle dans le profil, persistance en localStorage, classe appliquee sur `document.body` via un contexte React global.

---

## Dependances principales

### FastAPI (Python)
- fastapi, uvicorn
- pandas, openpyxl
- requests
- python-dotenv

### Backend Express (Node.js)
- express 5
- sequelize, pg, pg-hstore
- bcryptjs
- jsonwebtoken
- axios
- multer
- helmet, express-rate-limit, morgan

### Frontend (React)
- react-leaflet, leaflet
- react-router-dom
- axios
- react-icons
- jwt-decode
