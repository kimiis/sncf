# Diagrammes — RailGo

> Les diagrammes utilisent la syntaxe **Mermaid** qui s'affiche directement sur GitHub.

---

## 1. Architecture globale (C4 — Contexte)

```mermaid
graph TB
    U([👤 Utilisateur])

    subgraph RailGo
        FE[Frontend React<br/>Vercel]
        BE[Backend Express<br/>Railway :8000]
        API[FastAPI Python<br/>Railway :9000]
        DB[(PostgreSQL<br/>Railway)]
    end

    subgraph APIs externes
        SNCF[SNCF API<br/>Navitia]
        OSM[Overpass API<br/>OpenStreetMap]
        WIKI[Wikipedia<br/>Wikimedia]
        METEO[Open-Meteo<br/>Météo]
        OTM[OpenTripMap]
    end

    subgraph Données statiques
        EXCEL[Excel SNCF<br/>gares · tarifs · CO₂]
        ML[Modèles ML<br/>K-Means · XGBoost]
    end

    U -->|HTTPS| FE
    FE -->|REST JSON| BE
    BE -->|JWT + SQL| DB
    BE -->|HTTP proxy| API
    API -->|REST| SNCF
    API -->|REST| OSM
    API -->|REST| WIKI
    API -->|REST| OTM
    FE -->|REST direct| METEO
    API -->|lecture| EXCEL
    API -->|inférence| ML
```

---

## 2. Schéma de la base de données (ERD)

```mermaid
erDiagram
    USERS {
        uuid id PK
        string firstname
        string lastname
        string email UK
        string password
        string address
        date date_of_birth
        string phone
        string avatar
        timestamp created_at
    }

    ROLES {
        int id PK
        string name
    }

    USER_ROLES {
        uuid user_id FK
        int role_id FK
    }

    FAVORITES_ITINARY {
        int id PK
        uuid user_id FK
        string gare_depart
        string gare_arrivee
        timestamp created_at
    }

    FAVORITES_GARES {
        int id PK
        uuid user_id FK
        string gare_name
        timestamp created_at
    }

    SEARCH_HISTORY {
        int id PK
        uuid user_id FK
        string gare_depart
        string gare_arrivee
        timestamp date_recherche
        json type_train
        string duree
        string co2_economise
        string prix
    }

    USERS ||--o{ USER_ROLES : "a"
    ROLES ||--o{ USER_ROLES : "attribué à"
    USERS ||--o{ FAVORITES_ITINARY : "sauvegarde"
    USERS ||--o{ FAVORITES_GARES : "sauvegarde"
    USERS ||--o{ SEARCH_HISTORY : "génère"
```

---

## 3. Flux de données — Recherche d'un trajet

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant FE as React Frontend
    participant BE as Express Backend
    participant API as FastAPI
    participant SNCF as SNCF API
    participant DB as PostgreSQL

    U->>FE: Saisit "Paris → Lyon, 15/04"
    FE->>BE: GET /sncf/autocomplete?q=Paris
    BE->>API: GET /autocomplete?q=Paris
    API->>SNCF: GET /places?q=Paris
    SNCF-->>API: Liste des gares
    API-->>BE: Suggestions
    BE-->>FE: Suggestions
    FE-->>U: Dropdown gares

    U->>FE: Clique "Rechercher"
    FE->>BE: GET /sncf/trajet?from=Paris&to=Lyon&date=...
    BE->>API: GET /trajet?from=Paris&to=Lyon&date=...
    API->>SNCF: GET /journeys
    SNCF-->>API: Horaires + coordonnées GPS
    API->>API: Calcule CO₂, prix indicatif, distance
    API-->>BE: Trajet complet (JSON)
    BE-->>FE: Trajet + métriques

    par En parallèle
        FE->>BE: GET /sncf/ml/predict-price?from=Paris&to=Lyon
        BE->>API: GET /ml/predict-price
        API->>API: XGBoost.predict()
        API-->>BE: {prediction: "HIGH", confidence: 0.72}
        BE-->>FE: Prédiction prix IA
    and
        FE->>BE: GET /sncf/departures?from=Paris
        BE->>API: GET /departures
        API->>SNCF: GET /departures
        SNCF-->>API: Prochains départs
        API-->>BE: Tableau départs
        BE-->>FE: Départs temps réel
    end

    opt Si authentifié
        FE->>BE: POST /trajet/history
        BE->>DB: INSERT search_history
    end

    FE-->>U: Affiche carte + CO₂ + prix + météo + prédiction IA
```

---

## 4. Pipeline ML — Flux de données

```mermaid
flowchart LR
    subgraph DATA["📁 Data Source"]
        G[gares.xlsx<br/>848 KB]
        T[tarifs-tgv.xlsx<br/>3.4 MB]
        C[co2.xlsx<br/>14 KB]
    end

    subgraph TRAIN["🏋️ ml/train.py"]
        P[Parsing GPS<br/>Pandas]
        KM[K-Means<br/>k=6 zones]
        FE2[Feature Engineering<br/>distance · log · clusters]
        XGB[XGBoost<br/>Classifier]
        EVAL[Évaluation<br/>F1 · AUC · Confusion]
    end

    subgraph MODELS["💾 ml/models/"]
        M1[kmeans_gares.pkl]
        M2[xgb_price.json]
        M3[rapport_evaluation.json]
    end

    subgraph VIZ["📊 ml/visualize.py"]
        F1[Fig 1 — Comparaison modèles]
        F2[Fig 2-3 — Coude K-Means]
        F4[Fig 4 — Carte zones]
        F5[Fig 5 — Feature importance]
        F6[Fig 6 — Matrice confusion]
        F7[Fig 7 — Courbes ROC]
    end

    subgraph API["⚡ FastAPI"]
        EP1[GET /ml/predict-price]
        EP2[GET /ml/report]
    end

    subgraph UI["🖥️ React"]
        W[Widget prédiction<br/>Badge · Confiance · Probabilités]
    end

    G --> P
    T --> P
    C --> P
    P --> KM
    KM --> FE2
    FE2 --> XGB
    XGB --> EVAL
    KM --> M1
    XGB --> M2
    EVAL --> M3
    M1 --> VIZ
    M2 --> VIZ
    M3 --> VIZ
    M1 --> API
    M2 --> API
    M3 --> API
    EP1 --> W
    EP2 --> W
```

---

## 5. Diagramme de cas d'utilisation (Use Case)

```mermaid
graph LR
    GU([👤 Utilisateur\nnon connecté])
    GC([👤 Utilisateur\nconnecté])

    subgraph RailGo
        UC1[Rechercher un trajet]
        UC2[Voir la carte interactive]
        UC3[Comparer CO₂]
        UC4[Voir la météo destination]
        UC5[Voir les POI]
        UC6[Voir la prédiction IA]
        UC7[S'inscrire / Se connecter]
        UC8[Sauvegarder un favori]
        UC9[Voir son historique]
        UC10[Gagner des badges CO₂]
        UC11[Voir le leaderboard]
        UC12[Créer une alerte prix]
        UC13[Voir la page inspiration]
    end

    GU --> UC1
    GU --> UC2
    GU --> UC3
    GU --> UC4
    GU --> UC5
    GU --> UC6
    GU --> UC7
    GU --> UC13

    GC --> UC1
    GC --> UC2
    GC --> UC3
    GC --> UC4
    GC --> UC5
    GC --> UC6
    GC --> UC8
    GC --> UC9
    GC --> UC10
    GC --> UC11
    GC --> UC12
    GC --> UC13
```

---

## 6. Modèle de déploiement

```mermaid
graph TB
    subgraph Internet
        USER([Navigateur utilisateur])
    end

    subgraph Vercel
        CDN[CDN Global]
        REACT[React SPA<br/>Build statique]
    end

    subgraph Railway
        NODE[Express.js<br/>Node 20 · Port 8000]
        PYTHON[FastAPI + Uvicorn<br/>Python 3.11 · Port 9000]
        PG[(PostgreSQL 15<br/>500 MB)]
    end

    subgraph GitHub
        REPO[Repo Git]
        CI[Auto-deploy<br/>sur push main]
    end

    USER -->|HTTPS| CDN
    CDN --> REACT
    REACT -->|REST /api| NODE
    NODE -->|SQL| PG
    NODE -->|HTTP| PYTHON
    REPO --> CI
    CI -->|Deploy| Vercel
    CI -->|Deploy| Railway
```
