# Gestion des coûts — RailGo

## Situation actuelle (développement / prototype)

Toute l'infrastructure actuelle tourne en **tier gratuit** — coût mensuel : **0 €**.

| Service | Usage actuel | Limite gratuite | Coût actuel |
|---|---|---|---|
| **Vercel** (frontend React) | Déploiement continu | 100 GB bandwidth / mois | 0 € |
| **Railway** (backend Node.js) | Instance permanente | 500h / mois + $5 crédit | 0 € |
| **Railway** (FastAPI Python) | Instance permanente | Partagé avec ci-dessus | 0 € |
| **Railway** (PostgreSQL) | Base de données | 500 MB stockage | 0 € |
| **SNCF API — Navitia** | Trajets, gares, départs | 10 000 req/jour | 0 € |
| **Overpass API (OSM)** | Hôtels, vélos, POI | Communautaire, illimitée | 0 € |
| **Open-Meteo** (météo) | Prévisions 7 jours | Illimitée, sans clé | 0 € |
| **Wikipedia / Wikimedia** | Images et descriptions | Illimitée | 0 € |
| **OpenTripMap** | Points d'intérêt | 1 000 req/jour | 0 € |

---

## Estimation mise en production réelle

Pour une application avec **500 utilisateurs actifs / mois** et **200 requêtes / jour** :

### Infrastructure

| Service | Plan | Coût mensuel |
|---|---|---|
| **Vercel Pro** (frontend) | Hobby → Pro | 20 $ / mois |
| **Railway Pro** (backend Node.js) | ~0.5 vCPU, 512 MB RAM | 10 $ / mois |
| **Railway Pro** (FastAPI) | ~0.5 vCPU, 512 MB RAM | 10 $ / mois |
| **Railway PostgreSQL** | 1 GB stockage | 5 $ / mois |
| **Domaine personnalisé** (ex: railgo.fr) | OVH / Namecheap | 1 € / mois |
| **TOTAL INFRASTRUCTURE** | | **~47 $ / mois** |

### APIs externes (si dépassement des tiers gratuits)

| API | Seuil gratuit | Coût si dépassé |
|---|---|---|
| **Navitia SNCF** | 10 000 req/jour | Contacter SNCF pour plan commercial |
| **OpenTripMap** | 1 000 req/jour | 20 € / mois (plan Basic) |
| **Vercel** (bandwidth) | 100 GB / mois | 0.15 $ / GB supplémentaire |

> Pour 500 utilisateurs avec ~5 pages vues chacun (5 appels API), on reste sous les seuils gratuits.

### Coût total estimé (petite production)

```
Infrastructure fixe    :  ~47 $ / mois
APIs (si dépassement)  :  ~20 € / mois
Maintenance / DevOps   :  0 € (CI/CD automatique via Railway + Vercel)
──────────────────────────────────────
TOTAL                  :  ~70 € / mois
Coût par utilisateur   :  ~0.14 € / utilisateur / mois
```

---

## Scénario de montée en charge

| Scénario | Utilisateurs | Requêtes/jour | Coût estimé |
|---|---|---|---|
| **MVP / Prototype** | < 50 | < 500 | 0 € (tier gratuit) |
| **Lancement** | 500 | 2 000 | ~70 € / mois |
| **Croissance** | 5 000 | 20 000 | ~250 € / mois |
| **Scale** | 50 000 | 200 000 | ~1 500 € / mois + CDN |

À partir de 5 000 utilisateurs, il faudrait envisager :
- Un CDN (Cloudflare — gratuit jusqu'à un certain seuil)
- Redis pour le cache (Railway Redis : ~10 $ / mois) — remplacerait le cache mémoire actuel
- Un load balancer (géré par Railway automatiquement sur les plans supérieurs)

---

## Optimisations de coût déjà en place

| Optimisation | Impact |
|---|---|
| Cache mémoire Overpass (5 min TTL) | Réduit les appels OSM de ~80 % |
| Cache destinations (1h TTL) | Réduit les appels Wikipedia/OTM de ~90 % |
| Rate limiting Express (1 000 req / 15 min) | Protège contre les abus et les coûts imprévus |
| Données Excel en mémoire au démarrage | Évite une base de données externe pour les tarifs statiques |
| Frontend React en SPA | Pas de SSR → Vercel Hobby suffisant |

---

## Risques financiers

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Dépassement quota Navitia | Faible | Élevé (service coupé) | Cache + monitoring des appels |
| Railway hors quota | Moyen | Moyen (app en veille) | Upgrade Railway Starter ($5) |
| Attaque DDoS | Faible | Élevé (coûts bandwidth) | Rate limiting déjà en place |
| OpenTripMap dépassé | Moyen | Faible (fallback statique) | Fallback `_static_destinations()` déjà codé |
