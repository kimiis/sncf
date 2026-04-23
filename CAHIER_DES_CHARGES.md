# Cahier des charges — RailGo

---

## SOMMAIRE

| Section | Titre | Page |
|---|---|---|
| 1 | Contexte et objectifs du projet | P.3 |
| 2 | Périmètre du projet | P.4 |
| 3 | Utilisateurs finaux et parties prenantes | P.5 |
| 4 | Spécifications fonctionnelles | P.6 |
| 5 | Spécifications techniques | P.8 |
| 6 | Sécurité et conformité | P.11 |
| 7 | Déploiement et infrastructure | P.12 |
| 8 | Planning prévisionnel | P.13 |

---

## 1. CONTEXTE ET OBJECTIFS DU PROJET

### 1.1 Contexte du projet

Le transport ferroviaire représente l'un des modes de déplacement les moins émetteurs de CO2 en France, avec une empreinte carbone jusqu'à 50 fois inférieure à celle de la voiture sur certains trajets. Pourtant, une majorité de Français continue de privilégier la voiture pour des déplacements interurbains, faute d'une expérience numérique suffisamment fluide et complète autour du train.

L'offre existante est fragmentée : SNCF Connect pour les billets, Google Maps pour s'orienter, TripAdvisor pour les restaurants, une application tierce pour les vélos en libre-service. L'utilisateur doit jongler entre plusieurs outils avant, pendant et après son trajet.

Par ailleurs, les données ouvertes mises à disposition par la SNCF (tarifs TGV, empreintes CO2, liste des gares) restent sous-exploitées par les acteurs tiers.

**RailGo** naît de ce constat : il est possible de créer, en s'appuyant uniquement sur des données publiques et des APIs ouvertes, une application qui rend l'expérience ferroviaire simple, concrète et engageante pour l'utilisateur final.

### 1.2 Objectif du projet

L'objectif principal de RailGo est de proposer une interface web mobile-first qui centralise toutes les informations nécessaires à un voyage en train :

- Recherche d'un trajet avec autocomplétion des gares
- Visualisation du prix indicatif, de la durée et du tracé réel sur carte
- Comparaison de l'impact carbone train / voiture / avion
- Affichage des prochains départs en temps réel
- Prédiction de la catégorie de prix par machine learning
- Points d'intérêt autour des gares (hôtels, restaurants, vélos, parkings)
- Transports en commun locaux à destination
- Gestion d'un compte personnel (favoris, historique, profil)

L'objectif secondaire est de démontrer la valeur produit des données SNCF Open Data dans le cadre d'une présentation à la SNCF, et d'explorer les scénarios d'intégration ou de partenariat possibles.

---

## 2. PÉRIMÈTRE DU PROJET

### 2.1 Fonctionnalités principales

| Fonctionnalité | Description |
|---|---|
| Recherche de trajet | Saisie ville de départ / arrivée avec autocomplétion, sélection de date optionnelle |
| Résultats trajet | Prix indicatif, durée, distance, prochains départs, tracé GPS sur carte Leaflet |
| Comparatif CO2 | Comparaison train / voiture / avion avec barres visuelles et équivalences concrètes |
| Prédiction ML | Catégorie de prix prédite par XGBoost (BUDGET / STANDARD / CONFORT / PRESTIGE) |
| Points d'intérêt | Hôtels, restaurants, bars, musées, parcs, sports, vélos, parkings autour des gares |
| Transports locaux | Prochains passages bus/tram/métro à destination (Paris, Nantes, Caen, Rouen, La Rochelle, Bordeaux et région NAM) |
| Carte interactive | Leaflet avec tracé réel ou pointillé, marqueurs colorés par catégorie POI |
| Météo destination | Prévision sur 7 jours via Open-Meteo, affichée pour la date de voyage |
| Page Inspiration | 20 destinations coup de cœur avec filtres thématiques (mer, montagne, culture, gastronomie, nature) |

### 2.2 Fonctionnalités secondaires

| Fonctionnalité | Description |
|---|---|
| Compte utilisateur | Inscription, connexion, modification du profil, suppression du compte |
| Favoris | Sauvegarde et suppression de trajets favoris |
| Historique | Conservation des 10 dernières recherches (localStorage + BDD si connecté) |
| Badges et progression | 6 niveaux de badge basés sur le CO2 économisé et le nombre de trajets |
| Défi hebdomadaire | Barre de progression vers un objectif CO2 hebdomadaire |
| Leaderboard | Classement communautaire anonymisé des économies CO2 |
| Dashboard CO2 | Total CO2 économisé, équivalent en arbres, km voiture évités |
| Dark mode | Bascule persistante via localStorage, contexte React global |
| Partage de trajet | Web Share API ou copie dans le presse-papier |
| Géolocalisation | Détection automatique de la gare la plus proche |
| Destination aléatoire | Bouton "Surprends-moi" sur la page d'accueil |
| Perturbations trafic | Affichage des perturbations en cours sur la ligne de départ |

### 2.3 Fonctionnalités hors périmètre

Les fonctionnalités suivantes sont explicitement **exclues** de la version actuelle :

- Achat de billets en ligne (nécessite un accord commercial avec SNCF Connect)
- Prix de billets en temps réel (l'API de distribution SNCF n'est pas publique)
- Notifications push (Service Worker non implémenté en V1)
- Application mobile native (iOS / Android)
- Comparateur de prix sur plusieurs dates
- Intégration de vélos et trottinettes en temps réel (Lime, Bird)
- Avis et notes utilisateurs sur les POI
- Paiement ou réservation d'hébergement
- Support multilingue

### 2.4 Cas d'utilisation principaux

**CU-01 — Recherche d'un trajet**
Un utilisateur saisit une ville de départ et une ville d'arrivée. L'autocomplétion propose des gares correspondantes. Il sélectionne une date optionnelle et lance la recherche. La page de résultats s'affiche avec la carte, les stats et les POI.

**CU-02 — Comparaison de l'impact environnemental**
Sur la page de résultats, l'utilisateur visualise le CO2 de son trajet en train comparé à la voiture et à l'avion, puis des équivalences concrètes (nombre d'arbres, de km en voiture, de jours de chauffage).

**CU-03 — Découverte des points d'intérêt**
L'utilisateur active les filtres hôtels, restaurants ou vélos. Les marqueurs apparaissent sur la carte. Il peut cliquer pour voir les détails (étoiles, distance, type de cuisine, capacité).

**CU-04 — Consultation des transports locaux**
L'utilisateur bascule sur l'onglet "Transports à [ville]". Les prochains passages de bus, tram et métro sont affichés avec ligne, direction et heure en temps réel.

**CU-05 — Gestion du compte**
Un utilisateur crée un compte, se connecte, sauvegarde un trajet en favori, consulte son historique et suit sa progression CO2 sur son profil.

**CU-06 — Découverte de destinations**
Sur la page Inspiration, l'utilisateur filtre les destinations par thème, sélectionne une ville de départ et clique sur une destination pour lancer la recherche directement.

### 2.5 Livrables attendus

| Livrable | Description |
|---|---|
| Application web déployée | Frontend React sur Vercel, accessible via URL publique |
| API FastAPI déployée | Service Python sur Railway, endpoints SNCF/OSM/ML |
| Backend Express déployé | Service Node.js sur Railway, auth + proxy + BDD |
| Base de données PostgreSQL | Instance Railway avec modèles synchronisés via Sequelize |
| Modèles ML entraînés | Fichiers `kmeans_gares.pkl`, `xgb_price.json` dans `ml/models/` |
| Documentation technique | `PRESENTATION_SNCF.md`, `README.md`, `CAHIER_DES_CHARGES.md` |
| Code source versionné | Dépôt GitHub avec historique de commits |

---

## 3. UTILISATEURS FINAUX ET PARTIES PRENANTES

### 3.1 Utilisateurs finaux

**Profil principal — Le voyageur occasionnel**
Personne de 25 à 45 ans, habituée à utiliser son smartphone pour planifier ses déplacements. Elle prend le train 3 à 10 fois par an pour des weekends ou des déplacements professionnels. Elle est sensible à l'argument écologique mais manque de temps pour chercher les informations sur plusieurs sites.

Besoins : rapidité, tout en un seul endroit, visualisation claire du prix et de la durée.

**Profil secondaire — Le voyageur éco-responsable**
Personne qui a fait le choix de ne plus prendre l'avion ou de réduire ses trajets en voiture. Elle cherche à mesurer et valoriser ses économies de CO2. Elle utilise régulièrement les transports en commun et connaît les applis de mobilité.

Besoins : données CO2 précises, équivalences parlantes, suivi de sa progression.

**Profil tertiaire — L'utilisateur non connecté**
Visiteur qui découvre l'application sans créer de compte. Il peut rechercher des trajets, consulter les POI et la météo, mais est limité à 10 résultats par catégorie et ne peut pas sauvegarder de favoris.

Besoins : accès immédiat sans friction, pas d'obligation de création de compte.

### 3.2 Parties prenantes du projet

| Partie prenante | Rôle | Intérêt |
|---|---|---|
| Équipe de développement | Conception, développement, déploiement | Livraison d'un produit fonctionnel |
| SNCF (cible de présentation) | Partenaire potentiel | Valorisation des données Open Data, scénarios d'intégration |
| Utilisateurs finaux | Consommateurs du service | Expérience de recherche de trajet simplifiée |

### 3.3 Rôles et responsabilités

| Rôle | Responsabilités |
|---|---|
| Développeur fullstack | Architecture, développement frontend React, backend Express, API FastAPI |
| Administrateur (role_id admin) | Accès à toutes les données utilisateurs, modération |
| Utilisateur connecté (role_id user) | Gestion de son propre compte, favoris, historique |
| Visiteur (non connecté) | Recherche de trajets et POI, limité à 10 résultats par catégorie |

---

## 4. SPÉCIFICATIONS FONCTIONNELLES

### 4.1 User Stories

**Module Recherche**

| ID | En tant que | Je veux | Afin de |
|---|---|---|---|
| US-01 | Visiteur | Saisir une ville de départ et d'arrivée avec autocomplétion | Trouver rapidement ma gare sans connaître le nom exact |
| US-02 | Visiteur | Sélectionner une date de voyage | Voir les horaires du bon jour |
| US-03 | Visiteur | Cliquer sur "Surprends-moi" | Découvrir une destination aléatoire |
| US-04 | Visiteur | Utiliser ma géolocalisation | Trouver automatiquement la gare la plus proche de moi |

**Module Résultats**

| ID | En tant que | Je veux | Afin de |
|---|---|---|---|
| US-05 | Visiteur | Voir le prix indicatif, la durée et la distance | Évaluer si le trajet me convient |
| US-06 | Visiteur | Voir les prochains départs en dépliant | Choisir mon horaire sans quitter la page |
| US-07 | Visiteur | Voir le tracé réel du trajet sur une carte | Me repérer géographiquement |
| US-08 | Visiteur | Comparer le CO2 train/voiture/avion | Mesurer l'impact écologique de mon choix |
| US-09 | Visiteur | Voir des équivalences CO2 concrètes | Rendre l'économie de CO2 tangible |
| US-10 | Visiteur | Voir la météo à destination | Préparer mon voyage |
| US-11 | Visiteur | Voir une prédiction de catégorie de prix | Savoir si le trajet est plutôt budget ou premium |
| US-12 | Visiteur | Activer/désactiver les POI sur la carte | Choisir les informations qui m'intéressent |
| US-13 | Visiteur | Voir les transports locaux à destination | Organiser mon dernier kilomètre |
| US-14 | Visiteur | Partager mon trajet | Envoyer les infos à un proche |

**Module Compte**

| ID | En tant que | Je veux | Afin de |
|---|---|---|---|
| US-15 | Visiteur | Créer un compte | Accéder aux fonctionnalités personnalisées |
| US-16 | Utilisateur connecté | Sauvegarder un trajet en favori | Le retrouver facilement plus tard |
| US-17 | Utilisateur connecté | Consulter mon historique | Me souvenir de mes dernières recherches |
| US-18 | Utilisateur connecté | Voir mes badges et ma progression CO2 | Être valorisé pour mes choix écologiques |
| US-19 | Utilisateur connecté | Modifier mon profil | Mettre à jour mes informations personnelles |
| US-20 | Utilisateur connecté | Voir le classement communautaire | Me situer par rapport aux autres utilisateurs |

**Module Inspiration**

| ID | En tant que | Je veux | Afin de |
|---|---|---|---|
| US-21 | Visiteur | Filtrer les destinations par thème | Trouver une idée de voyage qui correspond à mes envies |
| US-22 | Visiteur | Cliquer sur une destination | Lancer directement la recherche de trajet |

### 4.2 Parcours utilisateurs

**Parcours 1 — Recherche rapide sans compte**

```
Page d'accueil
  → Saisie ville départ (autocomplétion)
  → Saisie ville arrivée (autocomplétion)
  → Clic "Rechercher"
  → Page résultats :
      Carte avec tracé
      Stats (durée, distance, prix)
      CO2 comparatif
      Prédiction prix ML
      Météo
      Départs (dépliant)
      Filtres POI → activation hôtels
      Carte mise à jour avec marqueurs hôtels
```

**Parcours 2 — Utilisateur connecté qui sauvegarde**

```
Page d'accueil → Connexion via modal
  → Recherche d'un trajet
  → Page résultats
  → Clic "Ajouter aux favoris" (si bouton présent)
  → Page profil :
      Favoris → liste du trajet sauvegardé
      Historique → trajet apparu
      Badges → mise à jour CO2
```

**Parcours 3 — Découverte via Inspiration**

```
Page Inspiration
  → Filtre "Mer"
  → 5-6 destinations s'affichent (Nice, Marseille, Biarritz…)
  → Clic sur une destination
  → Redirect vers /result?from=...&to=...
  → Page résultats pré-remplie
```

**Parcours 4 — Consultation des transports locaux**

```
Page résultats après recherche vers Nantes
  → Onglet "Transports à Nantes"
  → Prochains passages tram ligne 1, 2, 3
  → Bus lignes C1, C2…
  → Horaires en temps réel (réseau TAN)
```

---

## 5. SPÉCIFICATIONS TECHNIQUES

### 5.1 Plateformes et technologies

**Frontend**

| Technologie | Version | Rôle |
|---|---|---|
| React | 19 | Framework UI, SPA |
| React Router DOM | 7 | Routing côté client |
| Axios | 1.x | Requêtes HTTP avec intercepteur JWT |
| Leaflet + React-Leaflet | 4.x / 5.x | Carte interactive |
| React Icons | 5.x | Icônes FontAwesome, Material |
| jwt-decode | 4.x | Décodage du token JWT côté client |
| CSS custom | — | Pas de framework CSS, design system maison |

**Backend Node.js**

| Technologie | Version | Rôle |
|---|---|---|
| Node.js | 18+ | Runtime serveur |
| Express | 5 | Framework HTTP |
| Sequelize | 6 | ORM PostgreSQL |
| bcryptjs | — | Hachage des mots de passe |
| jsonwebtoken | — | Génération et vérification JWT |
| Helmet | — | Headers de sécurité HTTP |
| express-rate-limit | — | Limitation des requêtes par IP |
| Axios | — | Proxy vers FastAPI |
| Multer | — | Upload de fichiers (photo profil) |

**API FastAPI (Python)**

| Technologie | Version | Rôle |
|---|---|---|
| Python | 3.11 | Runtime |
| FastAPI | 0.100+ | Framework API REST |
| Uvicorn | — | Serveur ASGI |
| Pandas + openpyxl | — | Lecture des fichiers Excel SNCF Open Data |
| Requests | — | Appels HTTP vers APIs externes |
| Joblib | — | Chargement des modèles ML |
| XGBoost | — | Modèle de prédiction de prix |
| scikit-learn | — | K-Means, preprocessing ML |
| gtfs-realtime-bindings | — | Parsing GTFS-RT protobuf (réseau Twisto Caen) |

**Base de données**

| Technologie | Version | Rôle |
|---|---|---|
| PostgreSQL | 14+ | Stockage utilisateurs, favoris, historique |
| Sequelize sync | — | Création automatique des tables au démarrage |

**Hébergement**

| Service | Usage |
|---|---|
| Vercel | Frontend React (CDN mondial, CI/CD GitHub) |
| Railway | Backend Node.js + FastAPI + PostgreSQL (3 services, 1 projet) |

### 5.2 Gestion des rôles et vues différenciées

| Fonctionnalité | Visiteur | Utilisateur connecté | Admin |
|---|---|---|---|
| Recherche de trajet | ✅ | ✅ | ✅ |
| Visualisation POI | ✅ (10 max/catégorie) | ✅ (illimité) | ✅ |
| Météo, CO2, prédiction ML | ✅ | ✅ | ✅ |
| Transports locaux | ✅ | ✅ | ✅ |
| Favoris | ❌ | ✅ | ✅ |
| Historique BDD | ❌ | ✅ | ✅ |
| Historique localStorage | ✅ | ✅ | ✅ |
| Badges et progression | ❌ | ✅ | ✅ |
| Leaderboard | ✅ (anonymisé) | ✅ (anonymisé) | ✅ |
| Modification profil | ❌ | ✅ (son propre) | ✅ (tous) |

### 5.3 API externes et services complémentaires

| API | URL | Auth | Usage | Fallback |
|---|---|---|---|---|
| API SNCF (Navitia) | `api.sncf.com/v1` | Basic Auth (clé API) | Horaires, tracé GeoJSON, perturbations | Prix Excel si absent |
| Overpass / OSM | `overpass-api.de` | Aucune | Hôtels, vélos, restaurants, parkings | Cache 5 min, puis erreur silencieuse |
| Open-Meteo | `api.open-meteo.com` | Aucune | Météo 7 jours à destination | Composant masqué si erreur |
| Wikipedia REST | `fr.wikipedia.org` | Aucune | Images et descriptions des destinations | Pas d'image si absent |
| OpenTripMap | `api.opentripmap.com` | Clé API optionnelle | Lieux emblématiques destinations | Ignoré si clé absente |
| IDFM PRIM | `prim.iledefrance-mobilites.fr` | Clé API (IDFM_API_KEY) | Transports Paris/IDF temps réel | Liste vide |
| Réseau TAN (Nantes) | `open.tan.fr` | Aucune | Transports Nantes temps réel | Liste vide |
| Okina (Caen, Rouen, La Rochelle, NAM) | `api.okina.fr/gateway/` | Aucune | Transports locaux temps réel (GTFS-RT / JSON) | Liste vide |

### 5.4 Contraintes techniques

**Performance**
- Temps de réponse de l'endpoint `/trajet` : < 3 secondes (dépend de l'API SNCF)
- Chargement des POI déclenché séparément du trajet pour ne pas bloquer l'affichage initial
- Cache mémoire Overpass de 5 minutes pour éviter le rate-limiting
- Cache destinations Wikipedia de 1 heure
- Pré-chargement des destinations au démarrage FastAPI en arrière-plan (thread daemon)

**Compatibilité**
- Application mobile-first : conçue pour les résolutions < 480px en priorité
- Compatible navigateurs modernes (Chrome, Firefox, Safari, Edge)
- Pas de support IE

**Limites connues**
- Les prix affichés sont des tarifs indicatifs issus de données historiques SNCF Open Data, non des prix de vente en temps réel
- La couverture des transports locaux est limitée aux villes configurées dans `CITY_TRANSPORT_CONFIG`
- L'API SNCF peut retourner des résultats partiels ou vides selon la disponibilité du service

### 5.5 Ergonomie et design

**Palette de couleurs**

| Nom | Hex | Usage |
|---|---|---|
| Almond | `#FAEEDD` | Fond principal |
| Spruce | `#2D5443` | Texte, hero, accents verts |
| Olive | `#8B9E6A` | Icônes secondaires, barres |
| Mauve Wood | `#A6706A` | Boutons CTA, tags prix |
| Cream | `#EDD9BE` | Cartes, badges |

**Typographie**
- Corps : **Poppins** (Google Fonts)
- Titres : **Oswald** (Google Fonts)

**Principes UX**
- Zéro friction : recherche accessible immédiatement depuis la page d'accueil, sans compte obligatoire
- Progressive disclosure : POI et transports locaux chargés en arrière-plan, onglets pour ne pas surcharger la page
- Feedback visuel : états de chargement explicites pour chaque section
- Icônes uniquement issues de bibliothèques externes (react-icons) — aucun emoji utilisé comme icône UI

**Dark mode**
Contexte React global (`ThemeContext`) appliquant la classe `dark` sur `document.body`. Persistance en `localStorage`. Bascule disponible depuis la page profil.

### 5.6 Maintenance et support

- Les modèles ML doivent être ré-entraînés manuellement (`python ml/train.py`) si les fichiers Excel SNCF Open Data sont mis à jour
- L'ajout d'une nouvelle ville pour les transports locaux nécessite l'ajout d'une entrée dans `CITY_TRANSPORT_CONFIG` dans `api/app/main.py`
- L'ajout d'une destination Inspiration nécessite l'édition de `FRENCH_CITIES` dans `api/app/main.py`
- Les clés API (SNCF, IDFM, OpenTripMap) sont gérées via des variables d'environnement Railway et ne doivent jamais être versionnées

---

## 6. SÉCURITÉ ET CONFORMITÉ

### 6.1 Niveau de sécurité requis

L'application gère des données personnelles (nom, prénom, email, date de naissance, téléphone). Elle est soumise au RGPD. Les données sensibles doivent être protégées à toutes les étapes : stockage, transit, accès.

Le niveau de sécurité ciblé est celui d'une application grand public standard, sans traitement de données bancaires ni de données de santé.

### 6.2 Authentification et autorisation

**Authentification**
- Basée sur des tokens **JWT** (JSON Web Token) signés avec `JWT_SECRET` (variable d'environnement)
- Expiration du token : 24 heures
- Le token est stocké côté client dans `localStorage`
- Chaque requête protégée envoie le token dans le header `Authorization: Bearer <token>`

**Mots de passe**
- Hachés avec **bcrypt** (salt factor 10) avant tout stockage
- Aucun mot de passe en clair n'est stocké ni retourné par l'API
- Aucun secret ne transite dans les réponses API

**Autorisation**
- Middleware `verifyToken` appliqué sur toutes les routes nécessitant un compte
- Vérification du rôle (`user` / `admin`) pour les routes d'administration
- Un utilisateur ne peut accéder et modifier que ses propres données

**Protection contre les attaques**
- **Brute-force** : `express-rate-limit` — 100 requêtes par IP par tranche de 15 minutes
- **Injection XSS** : headers de sécurité via `Helmet.js` (Content-Security-Policy, X-Frame-Options, HSTS)
- **CORS** : configuré pour n'autoriser que le domaine frontend Vercel
- **Trust proxy** activé pour que le rate-limiter utilise l'IP réelle du client derrière le reverse proxy Railway

### 6.3 Intégrité, sauvegarde et confidentialité

**Intégrité des données**
- Validation des entrées côté backend (types Sequelize, contraintes NOT NULL, clés étrangères)
- Les clés API externes ne sont jamais exposées au frontend ni versionnées dans le code

**Sauvegarde**
- La base de données PostgreSQL est hébergée sur Railway qui assure la persistance
- Aucun système de backup automatique n'est configuré en V1 (à prévoir en V2 via pg_dump planifié)

**Conformité RGPD**
- L'utilisateur peut supprimer son compte (`DELETE /api/users/user/:id`), ce qui supprime ses données personnelles
- Aucune donnée personnelle n'est partagée avec des tiers
- Les logs serveur ne contiennent pas de données personnelles identifiantes

---

## 7. DÉPLOIEMENT ET INFRASTRUCTURE

### 7.1 Environnements techniques

| Environnement | Frontend | Backend | FastAPI | BDD |
|---|---|---|---|---|
| Local | `localhost:3000` | `localhost:8000` | `localhost:9000` | PostgreSQL local |
| Production | Vercel (CDN) | Railway service Node | Railway service Python | Railway PostgreSQL |

**Variables d'environnement par service**

*backend/.env (Railway)*

| Variable | Description |
|---|---|
| DB_NAME | Nom de la base PostgreSQL |
| DB_USER | Utilisateur PostgreSQL |
| DB_PASS | Mot de passe PostgreSQL |
| DB_HOST | Hôte PostgreSQL (référence Railway interne) |
| DB_PORT | Port PostgreSQL |
| DB_SSL | Activation SSL (true en production) |
| PORT | Port Express (8000) |
| JWT_SECRET | Clé de signature des tokens JWT |
| FASTAPI_URL | URL interne du service FastAPI sur Railway |

*api/.env (Railway)*

| Variable | Description |
|---|---|
| SNCF_API_KEY | Clé API SNCF (navitia.io) |
| IDFM_API_KEY | Clé API IDFM PRIM (transports Paris/IDF) |
| OPENTRIPMAP_API_KEY | Clé OpenTripMap (optionnel) |

*frontend/.env (Vercel)*

| Variable | Description |
|---|---|
| REACT_APP_API_URL | URL complète du backend Express Railway |

### 7.2 Outils & Méthode de livraison

**Versionnement**
- Git avec GitHub comme dépôt distant
- Branches : `main` (production), branches `feature/` pour les développements

**CI/CD**
- **Vercel** : déploiement automatique à chaque push sur `main` pour le frontend
- **Railway** : déploiement automatique à chaque push sur `main` pour Node.js et FastAPI

**Démarrage local**

```bash
# Terminal 1 — FastAPI
cd api && uvicorn app.main:app --reload --port 9000

# Terminal 2 — Backend Express
cd backend && npm run dev

# Terminal 3 — Frontend React
cd frontend && npm start
```

**Entraînement des modèles ML**

```bash
cd api
pip install -r ml/requirements.txt
python ml/train.py
```

### 7.3 Maintenance post-livraison

| Tâche | Fréquence | Responsable |
|---|---|---|
| Mise à jour des fichiers Excel SNCF Open Data | Annuelle ou à parution | Développeur |
| Ré-entraînement des modèles ML | Après mise à jour des données | Développeur |
| Rotation des clés API | Annuelle ou en cas de compromission | Développeur |
| Revue des logs Railway | Mensuelle | Développeur |
| Mise à jour des dépendances npm / pip | Trimestrielle | Développeur |
| Extension couverture transports locaux | Selon besoin | Développeur |

---

## 8. PLANNING PRÉVISIONNEL

### 8.1 Tableau des phases

| Phase | Contenu | Durée estimée | Statut |
|---|---|---|---|
| Phase 1 — Socle technique | Setup React / Express / FastAPI / PostgreSQL, auth JWT, proxy SNCF | 2 semaines | Terminé |
| Phase 2 — Données SNCF | Intégration Excel Open Data, endpoint trajet, carte Leaflet, CO2 | 2 semaines | Terminé |
| Phase 3 — POI & carte | Overpass API, hôtels, vélos, restaurants, parkings, filtres | 2 semaines | Terminé |
| Phase 4 — Expérience utilisateur | Profil, favoris, historique, badges, leaderboard, dark mode | 1 semaine | Terminé |
| Phase 5 — Enrichissement données | Météo, Wikipedia, destinations, perturbations, horaires temps réel | 2 semaines | Terminé |
| Phase 6 — Machine Learning | Pipeline K-Means + XGBoost, prédiction prix, rapport évaluation | 1 semaine | Terminé |
| Phase 7 — Transports locaux | Adapters IDFM, TAN, Okina (Caen, Rouen, La Rochelle, NAM) | 1 semaine | Terminé |
| Phase 8 — Nettoyage & qualité | Suppression code mort, refactoring, documentation | En cours | En cours |
| Phase 9 — Déploiement production | Configuration Railway + Vercel, variables env, tests end-to-end | 3 jours | Planifié |
| Phase 10 — Présentation SNCF | Préparation slides, démo, pitch 15 minutes | 1 semaine | Planifié |

### 8.2 Jalons clés

| Jalon | Description | Date cible |
|---|---|---|
| J-1 | Première version déployée (trajet + CO2 + carte) | Atteint |
| J-2 | Compte utilisateur fonctionnel (auth, favoris, historique) | Atteint |
| J-3 | POI complets (4 catégories + filtres) | Atteint |
| J-4 | Machine Learning intégré et visible en production | En cours |
| J-5 | Transports locaux couvrant 8+ villes | En cours |
| J-6 | Application nettoyée, documentée, prête pour présentation | Planifié |
| J-7 | Pitch SNCF | À définir |

---

*RailGo — Cahier des charges V1 — Document de référence projet.*
