# Planning & Méthodologie — RailGo

## Méthodologie

Le projet a suivi une approche **Agile itérative** organisée en phases de développement, avec :
- Des branches Git dédiées par fonctionnalité (feature branches)
- Des Pull Requests pour chaque merge vers `main`
- Des revues de code avant intégration

---

## Équipe

| Membre | Rôle principal |
|---|---|
| **Kim Isabelle** | Backend Node.js · FastAPI Python · Frontend React · Déploiement · ML |
| **Mathis** | Analyse données CO₂ · Service gares · Prototype Streamlit |

---

## Chronologie réelle du projet (d'après l'historique Git)

### Phase 1 — Fondations (8–10 octobre 2025)

| Date | Branche | Travail réalisé | Auteur |
|---|---|---|---|
| 08/10 | `connexion_bdd` | Création BDD PostgreSQL, liaison Sequelize, `.env` | Kim |
| 09/10 | `api_gateway` | Dossier API Gateway Express, routes de base, `npm run dev` fonctionnel | Kim |
| 09/10 | `models` | Création de tous les modèles Sequelize (User, Role, Favorites, History) | Kim |
| 09/10 | `crud_users` | CRUD complet (Create, Read, Update), Multer pour upload avatar | Kim |
| 09/10 | `Mathis` | Ajout données brutes CO₂ et gares dans les microservices | Mathis |
| 10/10 | `front_home` | Page d'accueil React avec logo RailGo | Kim |
| 10/10 | `gare_service` | Prototype Streamlit : sélection gare départ/arrivée, CO₂, tarif, durée | Mathis |

**PRs mergées :** #1 (connexion_bdd) · #2 · #3 · #4 · #5 · #6 (api_gateway) · #7 (models) · #8 (Mathis) · #12 (crud_users) · #13 · #14 (front_home) · #15 (gare_service)

---

### Phase 2 — Déploiement & infrastructure (27 mars 2026)

Après la phase de prototypage, refonte complète vers une architecture web déployée.

| Commit | Travail réalisé |
|---|---|
| `ajout du dossier api-gateway` | Restructuration en monorepo frontend / backend / api |
| `ajout railway.json` | Configuration déploiement Railway (Node.js + FastAPI) |
| `ajout requirements.txt dans api/` | Dépendances Python pour Railway |
| `vercel: react uniquement` | Frontend React déployé sur Vercel, suppression Python serverless |
| `strip prefixe /api dans FastAPI` | Compatibilité routage Vercel / Railway |
| `fix chemin fichiers Excel pour Vercel` | Chargement des données Excel en production |
| `fix casse import authMiddleware` | Compatibilité Linux/Railway |
| `fix railway.json buildCommand` | Pipeline CI/CD Railway opérationnel |

---

### Phase 3 — Stabilisation & POI (28–29 mars 2026)

| Date | Branche / PR | Travail réalisé |
|---|---|---|
| 28/03 | — | Fix CORS Helmet, trust proxy Railway, rate-limit |
| 28/03 | — | Fix `type_train` STRING → TEXT (troncature JSON évitée) |
| 28/03 | — | Seed rôles user/admin au démarrage |
| 28/03 | `fix-overpass-single-query` | POI : 4 requêtes Overpass → 1 requête combinée, cache 5 min |
| 28/03 | — | Fix icônes manquantes dans SearchResult (FaTrain, FaClock) |
| 29/03 | `fixResultPage` (#42) | Corrections page résultats, refonte palette couleurs `#FAEEDD` |
| 29/03 | `fix-overpass-single-query` (#40, #41) | Optimisation rate-limiting Overpass |
| 29/03 | `feature/poi-enrichment` (#43) | Enrichissement cartes POI : étoiles hôtels, cuisine restaurant |
| 29/03 | — | Update CSS inspiration, logo SVG navbar |

---

### Phase 4 — Enrichissement Navitia (30 mars 2026)

| Commit | Fonctionnalité |
|---|---|
| `feat: Navitia enrichment` | Autocomplétion Navitia, perturbations trafic, gares atteignables |
| `fix: replace Navitia polygon isochrones` | Gares atteignables depuis tarifs Excel + Haversine (plus fiable) |
| `fix: reachable uses Haversine x1.15` | Correction coefficient distance réelle vs vol d'oiseau |
| `feat: add real-time departure board` | Tableau des départs temps réel depuis gare de départ |
| `feat: wire date field to Navitia` | Champ date connecté aux APIs voyages et départs |
| `fix: autocomplete returns Excel canonical names` | Extraction code UIC Navitia → nom canonique Excel |
| `fix: add travelDate to useEffect` | Correction bug rechargement sur changement de date |

**Branche :** `feature/navitia-enrichment`

---

### Phase 5 — Pipeline ML (2 avril 2026)

| Fichier | Contenu |
|---|---|
| `ml/train.py` | K-Means (6 zones géo) + comparaison 4 modèles + XGBoost retenu |
| `ml/visualize.py` | 7 graphiques d'évaluation (ROC, confusion, coude, silhouette…) |
| `ml/RAPPORT_ML.md` | Documentation complète du pipeline |
| `api/app/main.py` | Endpoints `/ml/predict-price` et `/ml/report` |
| `frontend/SearchResult.jsx` | Widget prédiction IA (badge + confiance + probabilités) |

**Branche :** `ml` — **Commit :** `ed28233`

---

## Diagramme de Gantt

```
                   OCT 2025          MARS 2026                 AVR 2026
                   ├──────────┤      ├────────────────────────┤ ├──────┤
Phase 1 Fondations │██████████│
Phase 2 Déploiement│          │      │██│
Phase 3 POI/Fixes  │          │      │  │████│
Phase 4 Navitia    │          │      │      │███│
Phase 5 ML         │          │      │          │              │ │█│
Documentation      │          │      │          │              │ │█│
```

---

## Backlog — état final

### Livré ✅
- [x] Auth JWT (inscription / connexion / profil)
- [x] Recherche trajet avec autocomplétion Navitia
- [x] Carte interactive (Leaflet, tracé GPS réel)
- [x] Comparaison CO₂ train / voiture / avion (ADEME)
- [x] Prix indicatif (SNCF Open Data)
- [x] POI destination (hôtels, vélos, activités, parkings) via Overpass
- [x] Météo 7 jours à destination (Open-Meteo)
- [x] Tableau départs temps réel (Navitia)
- [x] Perturbations trafic (Navitia)
- [x] Historique de recherche (BDD + localStorage)
- [x] Favoris itinéraires et gares
- [x] Badges CO₂ et gamification
- [x] Leaderboard communautaire anonymisé
- [x] Alertes prix
- [x] Mode sombre
- [x] Page inspiration avec filtres
- [x] Gares atteignables depuis une gare source
- [x] Déploiement Vercel (frontend) + Railway (backend + FastAPI + PostgreSQL)
- [x] Pipeline ML : K-Means + XGBoost + 7 graphiques d'évaluation
- [x] Widget prédiction IA dans l'app
- [x] Documentation utilisateur, coûts, diagrammes, planning

### Non livré (hors scope v1) ❌
- [ ] Réservation de billet (accord commercial SNCF requis)
- [ ] Application mobile native
- [ ] Export PDF trajet
- [ ] Notifications push
- [ ] Interface admin

---

## Outils utilisés

| Catégorie | Outil |
|---|---|
| Versioning | Git + GitHub (43+ PRs mergées) |
| CI/CD | Railway (auto-deploy sur push) + Vercel |
| Communication | Discord |
| IDE | VS Code |
| Tests API | Postman |
| Monitoring | Railway dashboard + logs Railway |
