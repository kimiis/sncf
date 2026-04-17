# Rendu individuel — RailGo
**Kim Isabelle** · Projet SNCF · 2025–2026

---

## I. Perspectives d'évolution de la solution

### 1.1 Évolutions techniques à court terme (3–6 mois)

**Amélioration du modèle ML**

Le modèle XGBoost actuel prédit le niveau de prix uniquement à partir de la distance et de la zone géographique. Les pistes d'amélioration les plus directes sont :
- Intégrer la **dimension temporelle** : jour de semaine, mois, délai de réservation (données SNCF Connect si accord commercial)
- Résoudre le **déséquilibre de classes** PREMIUM via sur-échantillonnage (SMOTE) ou ajustement du `class_weight`
- Ajouter la **classe de billet** (Seconde / Première) comme feature
- Tester un **réseau de neurones léger** (MLP) pour voir si les non-linéarités supplémentaires apportent un gain

**Infrastructure**

- Remplacer le cache mémoire Python par **Redis** (Railway Redis, ~10$/mois) pour partager le cache entre instances et survivre aux redémarrages
- Ajouter une **file de tâches** (Celery ou BullMQ) pour les appels Overpass lents, plutôt que les faire de manière synchrone
- Mettre en place un **monitoring applicatif** (Sentry pour les erreurs, Prometheus/Grafana pour les métriques)

**Fonctionnalités produit**

- **Réservation intégrée** : nécessite un partenariat avec SNCF Connect (API de distribution)
- **Application mobile** : React Native permettrait de réutiliser 70 % du code React existant
- **Notifications push** : alertes prix en temps réel via Service Workers (PWA)
- **Mode hors-ligne** : mise en cache des dernières recherches via IndexedDB

### 1.2 Évolutions à moyen terme (6–18 mois)

- **Multimodalité** : intégrer les bus (Flixbus API), le covoiturage (BlaBlaCar API) pour une vraie comparaison intermodale
- **Empreinte carbone personnalisée** : calcul basé sur le profil utilisateur (type de voiture, mode de vie) plutôt que des coefficients ADEME génériques
- **Recommandation collaborative** : "Les voyageurs comme toi ont aussi aimé…" basé sur l'historique des favoris
- **Open Data enrichi** : intégrer les données de fréquentation des trains (SNCF Open Data) pour suggérer les créneaux moins bondés

### 1.3 Vision long terme

RailGo pourrait évoluer vers une **plateforme de mobilité durable** qui ne se limite pas au train :
- Calcul d'un score CO₂ pour tout voyage (combinaison train + bus + vélo + marche)
- Programme de compensation carbone intégré (partenariat avec une ONG)
- API ouverte pour que d'autres services intègrent le moteur de comparaison CO₂

---

## II. Analyse critique des limites techniques rencontrées

### 2.1 Données : des sources statiques qui limitent le ML

**Problème central :** Les fichiers Excel SNCF Open Data (tarifs-tgv.xlsx, 3,4 MB) contiennent des prix de référence, pas des prix en temps réel. Un billet Paris → Marseille peut varier de 25 € à 220 € selon le délai de réservation — notre modèle ne peut pas capturer ça.

**Conséquence :** Le F1-macro de XGBoost plafonne à 0,41 non pas parce que l'algorithme est mauvais, mais parce que les features disponibles ne contiennent pas assez d'information pour discriminer les 4 catégories de prix. C'est une limite structurelle des données, pas du modèle.

**Ce qu'on aurait pu faire :** Scraper les prix SNCF Connect sur 3 mois pour avoir un historique réel. Non réalisé par manque de temps et risque juridique (CGU SNCF).

### 2.2 API SNCF : quotas et fiabilité

L'API Navitia est généreuse (10 000 req/jour gratuit) mais pose deux problèmes :
- **Latence** : certains appels `journeys` prennent 3–8 secondes, ce qui ralentit l'affichage de la page résultats
- **Données manquantes** : les coordonnées GPS du tracé de trajet ne sont pas toujours disponibles — fallback sur une ligne droite entre les deux gares, visuellement moins précis

**Solution partielle mise en place :** Appels en parallèle (disruptions + départs + ML simultanés) pour masquer la latence. Le trajet principal reste bloquant.

### 2.3 Overpass API : le problème du rate limiting

Overpass API (données POI OpenStreetMap) limite les requêtes des clients trop fréquents avec des erreurs 429. En développement, les rechargements de page répétés déclenchaient cette limite.

**Solutions implémentées :**
1. Cache mémoire Python avec TTL 5 minutes (`overpass_cache` dict)
2. Fusion de 4 requêtes séparées en 1 requête combinée (PR #40)

**Limite persistante :** Le cache est en mémoire process — il se vide à chaque redémarrage Railway. En production avec traffic réel, Redis serait indispensable.

### 2.4 Déploiement : la complexité de l'architecture multi-service

Le projet est déployé sur 3 services séparés (Vercel + Railway Node + Railway Python). Cela a causé plusieurs problèmes non triviaux à résoudre :

| Problème | Cause | Solution |
|---|---|---|
| Chemins fichiers Excel cassés | Vercel serverless vs Docker | Détection dynamique `ROOT_DIR` avec plusieurs candidats |
| CORS bloqué en prod | Helmet `crossOriginResourcePolicy` | Désactivation de cette option spécifique |
| Import Python échoue sur Linux | Casse du nom de fichier (Mac insensible) | Renommage du fichier + `__init__.py` |
| `$PORT` non résolu dans Dockerfile | Expansion de variable shell | Réécriture du CMD Dockerfile |

**Ce que j'aurais fait différemment :** Tester le déploiement dès le sprint 2, pas au sprint de finalisation. L'intégration continue (Railway auto-deploy) aurait dû être mise en place bien plus tôt.

### 2.5 Base de données : le localStorage comme béquille

L'historique de recherche est sauvegardé à la fois en base de données (si connecté) et en localStorage (toujours). Le localStorage est devenu le vrai source of truth car la BDD a plusieurs fois été indisponible en développement.

**Limite :** Le localStorage est limité à 5 MB, non synchronisé entre appareils, et vide si l'utilisateur efface ses données navigateur. Ce n'est pas acceptable pour une production réelle.

---

## III. Annexes

### A. Documentation utilisateur

→ Voir [`docs/GUIDE_UTILISATEUR.md`](./GUIDE_UTILISATEUR.md)

Ce document couvre :
- Les fonctionnalités accessibles sans compte
- Les fonctionnalités avec compte (favoris, badges, historique, alertes prix)
- L'explication du widget de prédiction IA
- Les questions fréquentes

---

### B. Analyse personnelle

#### B.1 Réflexion sur les défis rencontrés

**Le défi technique le plus difficile : le déploiement multi-service**

Je n'avais jamais déployé une architecture avec un frontend React (Vercel), un backend Node.js (Railway) et une API Python (Railway) en même temps, chacun avec ses propres variables d'environnement, ses propres règles de routage et ses propres conventions de fichiers.

La journée du 27 mars 2026 illustre bien ce que ça représente : 15 commits en une journée, tous liés au déploiement. Chaque fix révélait un nouveau problème. La résolution de ces problèmes m'a appris à lire les logs Railway, à comprendre comment Vercel route les requêtes, et à déboguer des erreurs qui n'apparaissent qu'en production (environnement Linux vs Mac local).

**Le défi organisationnel : travailler en binôme sur une base de code commune**

Le projet a impliqué deux personnes avec des rôles différents. La coordination a parfois manqué, notamment lors de la phase initiale en octobre 2025 où les microservices Streamlit de Mathis et mon approche monorepo React ont coexisté sans vraie décision d'architecture commune. On a résolu ça en convergeant vers l'approche web pour la v1.

**Le défi intellectuel : intégrer un pipeline ML dans une app web**

La difficulté n'était pas d'entraîner un modèle — sklearn et XGBoost sont bien documentés. La difficulté était de **concevoir le pipeline de bout en bout** : comment les données Excel deviennent des features, comment les features alimentent le modèle, comment le modèle est chargé au démarrage de FastAPI, comment le résultat est affiché dans React de façon utile. Comprendre que la limite du modèle vient des données et pas de l'algorithme était une conclusion importante à documenter honnêtement.

#### B.2 Forces et faiblesses personnelles identifiées

**Forces**

| Force | Manifestation dans le projet |
|---|---|
| **Autonomie technique** | Capable de travailler sur le frontend, le backend, l'API Python et le ML |
| **Résolution de problèmes** | Chaque bug de déploiement a été diagnostiqué et résolu sans aide externe |
| **Rigueur sur la documentation** | README, rapport ML, diagrammes, guide utilisateur rédigés avec soin |
| **Itération rapide** | Capacité à livrer des fonctionnalités complètes en quelques heures |

**Faiblesses**

| Faiblesse | Impact sur le projet |
|---|---|
| **Tests insuffisants** | Pas de tests unitaires ni d'intégration — les bugs sont découverts en production |
| **Gestion du temps** | Longue pause entre octobre 2025 et mars 2026 — pression forte sur la fin |
| **Tendance au sur-engineering** | Temps passé sur des détails (cache Overpass, optimisation requêtes) au détriment de fonctionnalités core |
| **Communication d'équipe** | Pas de daily, pas de board partagé — coordination parfois floue |

#### B.3 Compétences développées

**Compétences techniques acquises ou renforcées**

- **FastAPI** : création d'une API Python robuste avec gestion des erreurs, middleware CORS, chargement de données au démarrage
- **Déploiement cloud** : Vercel (React), Railway (Node.js + Python + PostgreSQL), Docker, variables d'environnement en production
- **Intégration d'APIs tierces** : SNCF Navitia, Overpass, Open-Meteo, Wikipedia — gestion des quotas, des timeouts, des fallbacks
- **Pipeline ML** : de la donnée brute (Excel) jusqu'au widget React, en passant par l'entraînement, l'évaluation et le serving (FastAPI)
- **Leaflet / cartographie web** : affichage de cartes interactives, marqueurs personnalisés, tracé de routes GeoJSON
- **Gestion de données géospatiales** : formule Haversine, clustering géographique K-Means, coordonnées GPS

**Compétences transversales développées**

- Lire et comprendre des logs d'erreur en production (Railway, Vercel, navigateur)
- Rédiger une documentation technique claire destinée à différents publics (dev, utilisateur, jury)
- Prendre des décisions d'architecture avec des contraintes réelles (quotas API, budget $0, deadline)
- Expliquer des concepts ML à un public non technique (graphiques, langage accessible)

#### B.4 Axes d'amélioration pour de futurs projets

**1. Mettre en place les tests dès le début**

Dans ce projet, l'absence de tests a rendu chaque modification risquée. À l'avenir, je veux appliquer le principe TDD (Test-Driven Development) au moins pour les fonctions critiques (calcul CO₂, parsing données, endpoints API). Un simple fichier de tests Pytest aurait détecté plusieurs bugs avant la production.

**2. Déployer tôt, déployer souvent**

Le déploiement a été fait en toute fin de projet, ce qui a créé un goulot d'étranglement. Je veux m'imposer de déployer dès le sprint 1, même avec une app vide, pour détecter les problèmes d'infrastructure au plus tôt.

**3. Définir une architecture avant de coder**

On a commencé avec des microservices Python (Streamlit) avant de pivoter vers une SPA React + API REST. Ce pivot a été coûteux en temps. Un atelier d'architecture de 2h au démarrage aurait évité ça.

**4. Mieux utiliser GitHub comme outil de coordination**

Les branches et les PRs existent, mais il n'y a pas eu de GitHub Issues ni de GitHub Projects utilisés systématiquement. À l'avenir, chaque fonctionnalité devrait avoir une Issue, une branche liée, et une PR avec description. Ça améliore la traçabilité et facilite les revues de code.

**5. Documenter au fil de l'eau**

La documentation a été rédigée en fin de projet, sous pression. Il vaut mieux écrire un paragraphe de doc au moment où on développe une fonctionnalité — on en comprend mieux les détails à ce moment-là.
