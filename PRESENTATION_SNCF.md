# RailGo — Documentation technique & Pitch SNCF

> Document confidentiel — non versionné

---

## Table des matières

1. [Vision du projet](#1-vision-du-projet)
2. [Architecture globale](#2-architecture-globale)
3. [Frontend — React](#3-frontend--react)
4. [Backend — Node.js / Express](#4-backend--nodejs--express)
5. [API Python — FastAPI](#5-api-python--fastapi)
6. [Sources de données & APIs externes](#6-sources-de-données--apis-externes)
7. [Choix d'hébergement — Vercel & Railway](#7-choix-dhébergement--vercel--railway)
8. [Sécurité & authentification](#8-sécurité--authentification)
9. [Pistes V2](#9-pistes-v2)
10. [Pitch 15 minutes SNCF](#10-pitch-15-minutes-sncf)

---

## 1. Vision du projet

**RailGo** est une application web mobile-first qui transforme la recherche de trajet en train en une expérience complète : prix, empreinte carbone, horaires réels, carte interactive et points d'intérêt autour de la destination.

L'objectif est double :
- **Convaincre l'utilisateur de prendre le train** en rendant visibles les avantages écologiques et pratiques face à la voiture ou l'avion.
- **L'aider à préparer son voyage** en lui proposant hôtels, restaurants, activités, vélos et parkings autour des gares, directement dans la même interface.

---

## 2. Architecture globale

```
┌─────────────────────────────────────────┐
│           Vercel (Frontend)             │
│         React 19 — SPA                  │
│  REACT_APP_API_URL → Railway Node.js    │
└────────────────┬────────────────────────┘
                 │ HTTP / REST
┌────────────────▼────────────────────────┐
│      Railway — Node.js (Express)        │
│  • Auth JWT + PostgreSQL                │
│  • Proxy vers FastAPI                   │
│  • Favoris, Historique, Profil          │
└────────┬───────────────┬────────────────┘
         │               │
┌────────▼──────┐ ┌──────▼──────────────────┐
│ Railway —     │ │ Railway — PostgreSQL     │
│ FastAPI       │ │ Users, Roles,            │
│ (Python 3.11) │ │ FavoriteItinary,         │
│               │ │ SearchHistory            │
│ • Données     │ └──────────────────────────┘
│   SNCF Excel  │
│ • API SNCF    │
│ • Overpass    │
│ • Wikipedia   │
└───────────────┘
```

**Règle de séparation des responsabilités :**
- Le Node.js ne traite jamais de données SNCF directement — il est un proxy et un gestionnaire d'utilisateurs.
- Le FastAPI est le seul à parler à l'API SNCF, à Overpass OSM et à lire les fichiers Excel.
- Le frontend ne parle qu'au Node.js — jamais directement au FastAPI.

---

## 3. Frontend — React

### Stack

| Technologie | Version | Rôle |
|---|---|---|
| React | 19 | UI |
| React Router DOM | 7 | Routing SPA |
| Axios | 1.x | Appels HTTP |
| Leaflet + React-Leaflet | 1.9 / 5.0 | Carte interactive |
| React Icons | 4.x | Icônes (Lucide, FontAwesome) |
| jwt-decode | 4.x | Lecture du token JWT côté client |

### Pages

| Page | Route | Description |
|---|---|---|
| `Home` | `/` | Redirect vers `/index` |
| `Index` | `/index` | Page d'accueil : recherche, destinations, stats |
| `SearchResult` | `/result` | Résultat d'un trajet avec carte, CO2, POI |
| `Inspiration` | `/inspiration` | Destinations coup de cœur avec filtres |
| `Profil` | `/profil` | Compte utilisateur, favoris, historique |
| `UnauthorizedPage` | `/unauthorized` | Page 403 |

### Composants clés

- **NavBar** — logo SVG RailGo, navigation, modal d'auth
- **AuthModal** — formulaire connexion / inscription (modal)
- **CO2Equivalences** — visualisation de l'économie de CO2 (comparaison train / voiture / avion)
- **SearchResult** — carte Leaflet + 4 sections POI (hôtels, vélos, activités, parkings)

### Gestion de l'état

Pas de store global (Redux, Zustand…). L'état est local à chaque composant via `useState`. Le token JWT est stocké dans `localStorage` et lu au chargement de chaque page protégée.

### Design system

Palette de couleurs cohérente sur toute l'app :

| Nom | Hex | Usage |
|---|---|---|
| Almond | `#FAEEDD` | Fond principal |
| Spruce | `#2D5443` | Texte, accents verts |
| Olive | `#8B9E6A` | Icônes secondaires |
| Mauve Wood | `#A6706A` | Boutons CTA, tags prix |
| Cream | `#EDD9BE` | Cartes, badges |

Police principale : **Poppins** (corps), **Oswald** (titres).

---

## 4. Backend — Node.js / Express

### Rôle

Le backend Node.js est la **seule porte d'entrée** du frontend. Il a deux missions :

1. **Gestion des utilisateurs** — inscription, connexion, profil, favoris, historique (PostgreSQL via Sequelize)
2. **Proxy vers FastAPI** — toutes les routes SNCF/OSM sont retransmises au service Python

### Endpoints exposés

#### Auth
| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Connexion → retourne JWT |
| POST | `/api/users/register` | Inscription |

#### Trajets / POI (proxy FastAPI)
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/sncf/trajet` | Infos trajet (prix, CO2, durée, coordonnées) |
| GET | `/api/sncf/trajet/poi` | POI autour des gares (hôtels, vélos, activités, parkings) |
| GET | `/api/sncf/autocomplete` | Autocomplétion des noms de gares |
| GET | `/api/sncf/gares` | Liste complète des gares |
| GET | `/api/sncf/gare-proche` | Gare la plus proche d'une position GPS |
| GET | `/api/sncf/destinations` | Destinations coup de cœur |

#### Données utilisateur (authentifié)
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/trajet/favorites` | Liste des favoris |
| POST | `/api/trajet/favorites` | Ajouter un favori |
| DELETE | `/api/trajet/favorites/:id` | Supprimer un favori |
| GET | `/api/trajet/history` | Historique des 10 dernières recherches |
| POST | `/api/trajet/history` | Sauvegarder une recherche |
| GET | `/api/users/me` | Profil utilisateur |

### Base de données — PostgreSQL via Sequelize

**Modèles :**

```
User          — id, username, email, password (bcrypt), role_id
Role          — id, name (user / admin)
FavoriteItinary — id, user_id, gare_depart, gare_arrivee, created_at
SearchHistory — id, user_id, gare_depart, gare_arrivee, date_recherche, type_train (TEXT/JSON), created_at
```

Le modèle `SearchHistory.type_train` est de type `TEXT` (et non `VARCHAR(50)`) car il stocke un objet JSON sérialisé contenant `{ duree, co2_economise, prix }`.

### Middlewares notables

- `express-rate-limit` avec `app.set("trust proxy", 1)` (Railway tourne derrière un reverse proxy)
- `helmet` avec `crossOriginResourcePolicy: false` (pour les assets cross-origin)
- `cors({ origin: "*", credentials: false })` (frontend Vercel ≠ domaine backend)
- Seeding automatique des rôles (`user`, `admin`) au démarrage du serveur

---

## 5. API Python — FastAPI

C'est le cœur technique de RailGo. Il traite trois types de données :

### 5.1 Données SNCF Open Data (fichiers Excel)

Trois fichiers Excel chargés au démarrage en mémoire avec **pandas** :

| Fichier | Contenu |
|---|---|
| `tarifs-tgv.xlsx` | Prix min/max entre chaque paire de gares |
| `emission-co2-perimetre-usage.xlsx` | Empreinte CO2 train vs voiture par trajet |
| `gares.xlsx` | Liste des gares avec code UIC et coordonnées GPS |

Le chargement se fait une seule fois au boot (`pd.read_excel()`). Les données restent en RAM pour des réponses instantanées.

**Résolution de chemin robuste :**

```python
ROOT_DIR = next(
    (p for p in [_root_candidate, _api_dir, "/var/task"]
     if os.path.isdir(os.path.join(p, "Data"))),
    _root_candidate
)
```

Ceci permet de faire fonctionner l'API indifféremment en local, sous Docker (Railway) et sur Vercel (ancien déploiement), quel que soit le working directory.

### 5.2 API SNCF officielle

- **Endpoint utilisé :** `https://api.sncf.com/v1/coverage/sncf/journeys`
- **Auth :** Basic Auth avec la clé API SNCF encodée en base64
- **Ce qu'on en tire :**
  - Horaires réels des prochains départs (jusqu'à 3 options)
  - Durée exacte du trajet
  - Tracé GeoJSON du parcours → affiché comme `Polyline` sur la carte Leaflet

**Fallback prix :** si l'API SNCF ne retourne pas de prix (ce qu'elle ne fait pas toujours), on calcule la moyenne entre `prix_min` et `prix_max` du fichier Excel.

**Fallback CO2 :** si la paire origine/destination n'est pas dans le fichier Excel, on estime :
- Train : `0.0194 kg CO2/km`
- Voiture : `0.122 kg CO2/km`
- Avion (si > 300 km) : `0.255 kg CO2/km` (source ADEME)

### 5.3 Overpass API (OpenStreetMap)

**URL :** `https://overpass-api.de/api/interpreter`

Overpass est l'API de requête sur la base de données OpenStreetMap. Elle permet de demander "tous les hôtels dans un rayon de X mètres autour de ce point GPS".

**Stratégie anti-rate-limiting :**

Problème initial : 4 requêtes séparées (hôtels, vélos, activités, parkings) → Overpass retournait `429 Too Many Requests` de manière aléatoire.

Solution : **une seule requête Overpass** qui récupère tous les types de POI en un seul appel, en combinant toutes les conditions avec l'opérateur union `()` :

```
[out:json][timeout:40];
(
  node["tourism"~"^(hotel|hostel|motel|...)$"](around:1200,...);
  node["amenity"~"^(restaurant|cafe|...)$"](around:1200,...);
  node["amenity"~"^(bicycle_rental|...)$"](around:800,...);
  node["amenity"="parking"](around:800,...);
  ...
);
out center 200;
```

**Système de cache mémoire :**

```python
overpass_cache = {}
CACHE_DURATION = 300  # 5 minutes
```

Si la même paire (lat_arr, lon_arr, lat_dep, lon_dep) est demandée dans les 5 minutes, la réponse Overpass est servie depuis le cache sans appel réseau. En cas d'erreur Overpass, le cache expiré est utilisé en fallback plutôt que de renvoyer une erreur.

**Tags OSM extraits :**

Pour les hôtels :
- `stars` → classification officielle (★★★★☆)

Pour les restaurants / bars / cafés :
- `cuisine` → type de cuisine (français, italien, japonais…)
- `price_range` → niveau de prix OSM si renseigné
- Heuristique si absent : `fast_food/cafe → €`, `bar/pub → €€`, `restaurant → €€`

### 5.4 Destinations — Wikipedia + OpenTripMap

Pour la page Inspiration, 20 villes françaises sont pré-définies statiquement (coordonnées, région, tags thématiques).

Pour chaque ville :
1. **Image** : API REST Wikimedia (`/page/summary/{ville}`) → `originalimage` ou `thumbnail`
2. **Description** : API Wikipedia (`extracts`, 1 phrase)
3. **Lieux emblématiques** (optionnel) : OpenTripMap `places/radius` si une clé API est configurée

Les données sont mises en cache 1h (`DESTINATIONS_CACHE_TTL = 3600`) pour éviter de surcharger Wikipedia.

### 5.5 Géolocalisation inverse

`GET /gare-proche?lat=&lon=` — parcourt tous les points GPS du fichier `gares.xlsx` et retourne la gare la plus proche via la formule de Haversine.

---

## 6. Sources de données & APIs externes

### Comparatif des APIs évaluées

#### Pour les trajets SNCF

| API | Avantages | Inconvénients | Choix |
|---|---|---|---|
| **API SNCF officielle** (navitia.io) | Données officielles, horaires temps réel, GeoJSON du tracé | Quota limité, parfois lente | ✅ Retenu |
| SNCF Connect (scraping) | Données riches | Illégal, fragile | ❌ |
| Trainline API | Rapide, couvre l'Europe | Payante, non officielle | ❌ |

**Pourquoi l'API SNCF officielle ?** C'est la seule source légale et officielle avec des horaires temps réel et un tracé géographique réel. Dans le contexte d'une présentation à la SNCF, c'est aussi un signal fort d'utilisation des ressources ouvertes qu'ils mettent à disposition.

#### Pour les données CO2 et prix

| Source | Avantages | Inconvénients | Choix |
|---|---|---|---|
| **SNCF Open Data (Excel)** | Officiel, précis, gratuit | Statique (pas temps réel) | ✅ Retenu |
| Estimation pure (formule) | Toujours disponible | Approximatif | ✅ Fallback |
| API ADEME | Officiel écologie | Complexe à intégrer | ❌ |

#### Pour les POI (points d'intérêt)

| API | Avantages | Inconvénients | Choix |
|---|---|---|---|
| **Overpass / OSM** | Gratuit, mondial, très riche, open source | Rate-limiting, données parfois incomplètes | ✅ Retenu |
| Google Places | Données riches, notes utilisateurs | Payant au-delà de 5000 req/mois | ❌ |
| Foursquare | Notes et catégories riches | Payant, quota faible | ❌ |
| TripAdvisor API | Avis, notes | Non accessible sans partenariat | ❌ |
| HERE Places | Bonne qualité | Payant | ❌ |

**Pourquoi Overpass ?** Gratuit, sans quota strict si on cache bien, données mondiales, et open source — cohérent avec une démarche d'application publique et éco-responsable. Le seul vrai inconvénient (rate-limiting) a été résolu en combinant toutes les requêtes en une seule.

#### Pour les images et descriptions de villes

| Source | Avantages | Inconvénients | Choix |
|---|---|---|---|
| **Wikipedia API REST** | Gratuit, images haute qualité, multilingue | Parfois pas d'image disponible | ✅ Retenu |
| Unsplash | Photos magnifiques | Quota 50 req/h, licence à vérifier | ❌ |
| OpenTripMap | Lieux emblématiques en plus | Quota limité en gratuit | ✅ Optionnel |
| Flickr | Riche | Complexité des licences | ❌ |

---

## 7. Choix d'hébergement — Vercel & Railway

### Pourquoi Vercel pour le frontend ?

| Critère | Vercel | Netlify | GitHub Pages | AWS S3 + CloudFront |
|---|---|---|---|---|
| SPA routing (React Router) | ✅ natif via `rewrites` | ✅ via `_redirects` | ❌ difficile | ✅ mais complexe |
| CI/CD depuis GitHub | ✅ automatique | ✅ automatique | ✅ | Manuel |
| CDN mondial | ✅ | ✅ | Limité | ✅ |
| Build React intégrée | ✅ | ✅ | ❌ | ❌ |
| Gratuit | ✅ Hobby plan | ✅ | ✅ | Payant dès le début |
| Preview par PR | ✅ | ✅ | ❌ | ❌ |

**Verdict :** Vercel est le standard de l'industrie pour les apps React/Next.js. Setup en 2 minutes, zéro configuration de serveur, CDN inclus.

### Pourquoi Railway pour le backend ?

| Critère | Railway | Heroku | Render | AWS EC2 | Fly.io |
|---|---|---|---|---|---|
| Docker natif | ✅ | ✅ | ✅ | ✅ | ✅ |
| PostgreSQL intégré | ✅ même projet | Add-on payant | ✅ | Séparé | Séparé |
| Variables d'env entre services | ✅ référencement direct | ❌ | ❌ | ❌ | ❌ |
| Gratuit | ✅ 5$/mois crédits offerts | ❌ Plus gratuit depuis 2022 | ✅ limité | Payant | ✅ limité |
| Multi-services dans 1 projet | ✅ | ❌ | ❌ | ❌ | ❌ |
| Déploiement depuis GitHub | ✅ | ✅ | ✅ | Manuel | ✅ |

**Verdict :** Railway permet d'avoir les 3 services backend (Node.js + FastAPI + PostgreSQL) dans un seul projet, avec les variables d'environnement partagées facilement. C'est ce qui a fait la différence — notamment le fait que `PGHOST`, `PGUSER`, `PGPASSWORD` du service PostgreSQL sont directement référençables dans les variables du service Node.js.

---

## 8. Sécurité & authentification

### JWT (JSON Web Tokens)

- À la connexion, le backend génère un JWT signé avec `JWT_SECRET` (variable d'environnement Railway)
- Le token est stocké dans `localStorage` côté client
- Chaque requête protégée envoie le token dans le header `Authorization: Bearer <token>`
- Le middleware `verifyToken` valide le token avant d'accéder aux routes protégées

### Mots de passe

- Hachés avec **bcrypt** avant stockage — jamais en clair en base
- Aucun secret ne transite en réponse API

### Autres mesures

- **Helmet.js** — headers de sécurité HTTP (XSS protection, HSTS…)
- **express-rate-limit** — limite le nombre de requêtes par IP pour contrer le brute-force
- **Trust proxy** activé — Railway utilise un reverse proxy, sans ce flag le rate-limiter se serait basé sur l'IP du proxy plutôt que celle du client
- **CORS** configuré pour n'accepter que les requêtes du domaine Vercel

---

## 9. Pistes V2

### Fonctionnalités produit

| Feature | Valeur ajoutée | Complexité |
|---|---|---|
| **Notifications push** — rappel départ J-1 | UX, fidélisation | Moyenne (Service Worker + backend notification) |
| **Comparateur multi-dates** — "quand partir moins cher ?" | Décision utilisateur | Moyenne (graphe prix sur 30 jours) |
| **Mode hors-ligne** (PWA) — consulter son trajet sans réseau | Voyageurs en zone blanche | Faible (Service Worker cache) |
| **Réservation intégrée** — deep link SNCF Connect | Conversion directe | Faible (URL scheme SNCF) |
| **Covoiturage combiné** — BlaBlaCar pour le "dernier km" | Intermodalité | Élevée (API BlaBlaCar) |
| **Notes et avis utilisateurs** sur les POI | Engagement communautaire | Élevée (modération) |
| **Itinéraire complet** — hébergement + activités bookable | Super-app voyage | Très élevée |

### Technique

| Amélioration | Bénéfice |
|---|---|
| **Cache Redis** à la place du cache mémoire Python | Persistance entre redémarrages, partage entre instances |
| **Websocket** pour les horaires temps réel | Plus besoin de recharger la page |
| **Clustering** Node.js (PM2) | Haute disponibilité |
| **CDN pour les images Wikipedia** | Réduction latence |
| **Base de données gares enrichie** | Évite la dépendance au fichier Excel statique |
| **Tests automatisés** (Jest, Pytest) | Qualité, CI/CD fiable |
| **Analytics** (Plausible, open source) | Comprendre les usages réels |

### Partenariats possibles

- **SNCF** — accès à l'API tarifs temps réel (aujourd'hui on utilise les moyennes Excel)
- **Booking.com / Hotels.com** — affiliation sur les hôtels affichés (monétisation)
- **Lime / Bird / Pony** — vélos et trottinettes en temps réel (remplace Overpass statique)
- **ADEME** — validation officielle des calculs CO2

---

## 10. Pitch 15 minutes SNCF

> **Format suggéré :** slides de présentation + démo live

---

### Slide 1 — L'accroche (1 min)

**"Chaque année, 80 millions de Français prennent leur voiture pour des trajets que le train pourrait faire."**

Pourquoi ? Pas parce que le train est mauvais. Parce que **l'expérience de recherche** est fragmentée : SNCF Connect pour les billets, Google Maps pour les hôtels, TripAdvisor pour les restos, Maps encore pour les parkings.

RailGo réunit tout ça en un seul endroit.

---

### Slide 2 — Le problème (2 min)

Trois freins majeurs à la prise du train :
1. **Le prix perçu** — "le train c'est cher" (mais est-ce vrai si on compte l'essence + parking ?)
2. **La complexité** — combien d'apps pour planifier un weekend à Lyon ?
3. **Le dernier kilomètre** — "une fois arrivé, je fais comment ?"

RailGo adresse ces trois points dans une interface unique.

---

### Slide 3 — La solution (2 min)

**Démo live — page d'accueil → recherche Paris → Rennes**

Montrer :
- Autocomplétion instantanée
- Carte avec tracé réel du train
- Prix indicatif + durée + prochains départs
- CO2 économisé vs voiture (ex: 94% de moins)
- Les équivalences CO2 (arbres, km en voiture…)

---

### Slide 4 — L'écologie comme différenciateur (2 min)

**Démo — section CO2Equivalences**

La SNCF communique sur son bilan carbone mais peu d'outils le rendent concret pour l'utilisateur. RailGo traduit les kg de CO2 en chiffres parlants :

> "En prenant le train Paris-Nice, vous économisez l'équivalent de 47 km en voiture, ou la charge de 12 smartphones."

C'est un levier de **marketing éco-responsable** que la SNCF peut s'approprier.

---

### Slide 5 — Le voyage complet (2 min)

**Démo — section POI (hôtels, restaurants, vélos, parkings)**

Une fois arrivé en gare, l'utilisateur voit directement sur la carte :
- 🏨 Les hôtels à moins de 1,2 km, avec leurs étoiles OSM
- 🍽 Les restaurants avec la cuisine et la gamme de prix (€ à €€€)
- 🚲 Les stations vélo pour le dernier kilomètre
- 🅿 Les parkings à la gare de départ (pour ceux qui viennent en voiture)

Données 100% open source, 100% gratuites — via OpenStreetMap.

---

### Slide 6 — L'architecture technique (1 min)

Pour les décideurs techniques :

```
React (Vercel) → Node.js (Railway) → FastAPI (Railway) + PostgreSQL
                                    ↓
                          API SNCF officielle
                          SNCF Open Data (CO2, Prix)
                          Overpass API (OSM)
                          Wikipedia API
```

- **Données SNCF officielles** utilisées (API + Open Data)
- **Zéro coût de données** — OSM, Wikipedia sont open source
- **Scalable** — architecture microservices, chaque composant est indépendant

---

### Slide 7 — Chiffres du projet (1 min)

| Indicateur | Valeur |
|---|---|
| Pages / routes frontend | 6 |
| Endpoints API | 14 |
| Gares couvertes | ~3 000 (source SNCF Open Data) |
| Villes destinations proposées | 20 villes françaises |
| Sources de données intégrées | 5 (SNCF API, SNCF Open Data, OSM, Wikipedia, ADEME) |
| Temps de réponse moyen `/trajet` | < 2 secondes |
| Coût d'hébergement mensuel | ~5 €/mois (Railway) + 0 € (Vercel) |

---

### Slide 8 — Ce que la SNCF pourrait en faire (2 min)

**3 scénarios de valorisation :**

**Scénario A — Intégration dans SNCF Connect**
Intégrer la section POI directement dans l'app SNCF après l'achat d'un billet. L'utilisateur a déjà son billet, on lui propose le reste de son voyage.

**Scénario B — Outil interne de communication CO2**
Utiliser le moteur de calcul CO2 pour des campagnes de communication : "Saviez-vous que le TGV Paris-Marseille émet 94% moins de CO2 que la voiture ?"

**Scénario C — White-label pour les collectivités**
Proposer l'outil aux régions (PACA, Occitanie, Bretagne…) pour valoriser le train régional sur leur territoire.

---

### Slide 9 — V2 & roadmap (1 min)

Priorités V2 :
1. **Notifications push** — rappel de départ la veille
2. **Comparateur de prix sur 30 jours** — quand partir moins cher
3. **Réservation directe** — deep link vers SNCF Connect
4. **PWA / mode hors-ligne** — consulter son trajet en zone blanche dans le train

Avec un accès à l'**API tarifs temps réel** de la SNCF (actuellement on utilise les moyennes Open Data), la précision des prix passerait de "indicatif" à "exact".

---

### Slide 10 — Conclusion & call to action (1 min)

**RailGo démontre que :**
- L'expérience train peut être simple et moderne
- Les données ouvertes de la SNCF ont une vraie valeur produit
- L'argument écologique peut être rendu concret et engageant

**Ce qu'on demande :**
- Accès à l'API tarifs SNCF temps réel
- Retour sur les cas d'usage les plus pertinents pour la SNCF
- Éventuellement, un accompagnement pour explorer les scénarios d'intégration

---

*RailGo — Voyagez mieux, polluez moins.*

---

> Document rédigé le 2026-03-29 — confidentiel, non destiné à être versionné.
