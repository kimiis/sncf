# Guide utilisateur — RailGo

> Ce guide explique comment utiliser l'application. Pour l'installation technique, voir le README.

---

## Qu'est-ce que RailGo ?

RailGo est une application web qui t'aide à **planifier un voyage en train** en France, en te montrant instantanément :
- Le trajet et ses horaires
- L'impact environnemental (CO₂) comparé à la voiture et à l'avion
- La météo à destination
- Les hôtels, vélos, activités et parkings près de ta gare d'arrivée
- Une prédiction IA du niveau de prix du billet

---

## Sans compte (accès libre)

Tu peux utiliser les fonctionnalités suivantes **sans créer de compte** :

### Rechercher un trajet

1. Sur la page d'accueil, clique dans le champ **"Départ"** et tape le nom de ta gare
2. L'autocomplétion te propose les gares correspondantes — sélectionne-en une
3. Fais de même pour **"Arrivée"**
4. (Optionnel) Sélectionne une **date de voyage**
5. Clique sur **"Rechercher"**

> **Astuce :** Clique sur "Surprise !" pour qu'on choisisse une destination à ta place.

### Lire les résultats

Sur la page de résultats, tu trouveras de haut en bas :

| Section | Ce que ça t'apporte |
|---|---|
| **Carte interactive** | Tracé du trajet avec marqueurs départ/arrivée et POI (hôtels, vélos…) |
| **Stats du trajet** | Durée · Distance · Prix indicatif |
| **Prédiction IA** | Catégorie de prix prédite par XGBoost (LOW / MEDIUM / HIGH / PREMIUM) avec niveau de confiance |
| **Météo** | Prévisions 7 jours à destination |
| **Impact carbone** | Comparaison CO₂ train vs voiture vs avion avec équivalences visuelles |
| **Départs temps réel** | Tableau des prochains départs depuis ta gare de départ |
| **POI** | Hôtels, stations vélo, activités et parkings autour de la gare d'arrivée |
| **Perturbations** | Alertes trafic en cours si disponibles |

### Filtrer les points d'intérêt

Sur la carte, tu peux afficher / masquer :
- 🏨 **Hôtels** — hébergements proches de la gare d'arrivée
- 🚲 **Vélos** — stations de vélo en libre-service et parkings vélo
- 🎭 **Activités** — restaurants, bars, musées, parcs, sports
- 🅿️ **Parkings** — parking auto près de la gare

Clique sur chaque marqueur pour voir le nom et l'adresse.

### Explorer les destinations

Va sur l'onglet **"Inspiration"** pour découvrir 20 destinations françaises.
- Filtre par thème : **Mer · Montagne · Culture · Gastronomie · Nature**
- Clique sur une carte pour lancer directement la recherche de trajet

---

## Avec un compte (fonctionnalités supplémentaires)

### Créer un compte

1. Clique sur **"Connexion"** en haut à droite
2. Sélectionne **"Créer un compte"**
3. Remplis : prénom, nom, email, mot de passe
4. Valide — tu es connecté immédiatement

### Sauvegarder un trajet en favori

Sur la page de résultats, clique sur **"Ajouter aux favoris"**.
Tu retrouves tes trajets favoris dans ton profil → section "Favoris".

### Créer une alerte prix

Sur la page de résultats, clique sur 🔔 **"Alerte prix"** :
1. Saisis le prix maximum que tu acceptes de payer
2. Valide — l'alerte est enregistrée
3. Tu seras notifié si le prix indicatif passe sous ce seuil

### Voir ton profil

Clique sur ton avatar en haut à droite → **"Mon profil"**

**Onglet Informations** : modifie ton prénom, nom, adresse, date de naissance, téléphone.

**Onglet CO₂** : tableau de bord de ton impact personnel
- Total de CO₂ économisé depuis ton inscription
- Équivalent en arbres plantés
- Km évités en voiture

**Onglet Badges** : 6 niveaux de récompense selon le nombre de trajets et le CO₂ économisé

| Badge | Condition |
|---|---|
| 🌱 Éco-Voyageur | 1er trajet en train |
| 🚂 Aventurier des Rails | 5 trajets |
| 🌍 Gardien de la Planète | 50 kg CO₂ économisés |
| ⭐ Ambassadeur Vert | 10 trajets |
| 🏆 Champion du Train | 200 kg CO₂ économisés |
| 💚 Légende Écologique | 500 kg CO₂ économisés |

**Onglet Classement** : leaderboard des 10 utilisateurs ayant économisé le plus de CO₂ (noms anonymisés).

---

## Comprendre la prédiction IA

Le widget **"Prédiction IA du prix"** apparaît automatiquement dans les résultats de trajet.

```
┌──────────────────────────────────────────────────┐
│  🤖 Prédiction IA du prix                        │
│                                                  │
│  [ HIGH ]  80–150 €          Confiance : 72 %   │
│                                                  │
│  LOW    ████░░░░░░  18 %                         │
│  MEDIUM ██░░░░░░░░   9 %                         │
│  HIGH   ████████░░  72 %   ← prédiction          │
│  PREMIUM ░░░░░░░░░   1 %                         │
│                                                  │
│  Modèle XGBoost · données SNCF · 680 km          │
└──────────────────────────────────────────────────┘
```

| Catégorie | Fourchette indicative |
|---|---|
| 🟢 LOW | 0 – 40 € |
| 🟡 MEDIUM | 40 – 80 € |
| 🟠 HIGH | 80 – 150 € |
| 🔴 PREMIUM | > 150 € |

> ⚠️ **Il s'agit d'une estimation** basée sur les tarifs de référence SNCF Open Data et la distance du trajet. Le prix réel dépend du délai de réservation, de la classe et de la disponibilité.

---

## Questions fréquentes

**Le prix affiché est-il le prix réel ?**
Non, c'est un prix indicatif basé sur les données SNCF Open Data (tarifs de référence). Pour réserver, utilise SNCF Connect ou Trainline.

**Puis-je utiliser l'app sans connexion internet ?**
Non, l'application nécessite une connexion pour contacter l'API SNCF en temps réel.

**Mes données sont-elles conservées ?**
L'historique de recherche est sauvegardé en base de données si tu es connecté. Tu peux le supprimer depuis ton profil.

**L'app fonctionne-t-elle sur mobile ?**
Oui, l'interface est responsive et fonctionne sur smartphone et tablette.

**Pourquoi certaines gares n'apparaissent-elles pas ?**
L'autocomplétion interroge la base Navitia qui couvre les gares du réseau SNCF national. Les petites haltes TER peuvent ne pas apparaître.
