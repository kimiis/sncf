# Analyse de la problématique — RailGo

## Contexte

La France s'est engagée à réduire ses émissions de CO₂ de 40 % d'ici 2030 (Loi Énergie-Climat 2019). Le secteur des transports représente **31 % des émissions nationales**, dont une large part provient de la voiture individuelle et de l'avion intérieur.

Pourtant, **le train émet 28× moins de CO₂ que l'avion et 7× moins que la voiture** sur les mêmes trajets (source : ADEME 2023). Le réseau TGV français dessert 230 villes. Le potentiel de report modal existe — mais il est sous-exploité.

### Pourquoi les voyageurs ne prennent-ils pas le train ?

D'après les études de mobilité (Enquête Nationale Mobilité 2019, Baromètre SNCF 2023) :

| Frein | % de voyageurs concernés |
|---|---|
| Complexité de la recherche d'itinéraire | 43 % |
| Manque de visibilité sur le prix réel | 38 % |
| Méconnaissance des destinations accessibles | 31 % |
| Absence de comparaison avec la voiture | 27 % |

---

## Problème ciblé

> **Comment rendre le voyage en train aussi simple et désirable que la voiture ou l'avion, tout en mettant en avant son impact environnemental positif ?**

RailGo répond à ce problème en agissant sur trois leviers :

1. **Simplification** — Recherche de trajet en 2 clics, autocomplétion, carte interactive
2. **Transparence** — Prix indicatif, CO₂ comparatif (train / voiture / avion), temps réel
3. **Désirabilité** — Destinations inspirantes, météo, POI, gamification (badges, CO₂ économisé)

---

## Utilisateurs cibles

| Profil | Besoin principal | Valeur apportée |
|---|---|---|
| **Jeune actif (18-35 ans)** | Voyager responsable sans complexité | App intuitive, badge CO₂, partage social |
| **Famille** | Préparer un voyage complet (hôtel, activités) | POI intégrés, parking, météo destination |
| **Voyageur régulier** | Gagner du temps sur les recherches répétées | Favoris, historique, alertes prix |
| **Entreprise / DSI** | Suivi des déplacements professionnels | Historique, export CO₂, leaderboard |

---

## Valeur apportée

### Pour le voyageur
- Décision éclairée en moins de 30 secondes (prix + CO₂ + météo + logement)
- Sentiment de contribuer à une cause environnementale (badges, arbres économisés)

### Pour SNCF (client hypothétique)
- Augmentation du taux de conversion sur les trajets longue distance
- Données anonymisées sur les destinations populaires et les freins au voyage
- Levier de communication RSE mesurable (kg CO₂ économisés agrégés)

---

## KPIs visés

| KPI | Valeur cible (6 mois post-lancement) |
|---|---|
| Nombre d'utilisateurs inscrits | 500 |
| Trajets recherchés / jour | 200 |
| CO₂ économisé total (vs voiture) | 10 000 kg |
| Taux de retour (utilisateur revient > 2×) | 40 % |
| Note satisfaction (NPS) | > 7/10 |
| Temps moyen de recherche d'un trajet | < 45 secondes |

---

## Positionnement vs solutions existantes

| Fonctionnalité | SNCF Connect | Trainline | **RailGo** |
|---|---|---|---|
| Recherche de trajet | ✅ | ✅ | ✅ |
| Comparaison CO₂ | ❌ | Partiel | ✅ Détaillé |
| Carte interactive | ❌ | ❌ | ✅ |
| POI destination | ❌ | ❌ | ✅ |
| Météo intégrée | ❌ | ❌ | ✅ |
| Gamification CO₂ | ❌ | ❌ | ✅ Badges |
| Prédiction prix IA | ❌ | ❌ | ✅ XGBoost |
| Open source | ❌ | ❌ | ✅ |
