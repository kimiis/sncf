#!/usr/bin/env python3
"""
Visualisation ML — RailGo SNCF
═══════════════════════════════════════════════════════════════
Génère 7 graphiques pour justifier les choix algorithmiques :

  Fig 1 — Comparaison des 4 modèles (accuracy, precision, recall, F1)
  Fig 2 — Courbe du coude K-Means (inertie vs k)
  Fig 3 — Silhouette Score vs k (justification k=6)
  Fig 4 — Carte des zones K-Means (gares colorées par cluster)
  Fig 5 — Importance des features XGBoost
  Fig 6 — Matrice de confusion XGBoost
  Fig 7 — Courbes ROC (XGBoost, une courbe par classe)

Pré-requis : exécuter d'abord ml/train.py
═══════════════════════════════════════════════════════════════
Usage :
    python ml/visualize.py
"""
import os
import json
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
from sklearn.metrics import (
    confusion_matrix,
    roc_curve,
    auc as sklearn_auc,
)
from sklearn.preprocessing import label_binarize

# ── Chemins ────────────────────────────────────────────────────────────────
ROOT       = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
FIGS_DIR   = os.path.join(os.path.dirname(os.path.abspath(__file__)), "figures")
os.makedirs(FIGS_DIR, exist_ok=True)

# ── Palette RailGo ─────────────────────────────────────────────────────────
SPRUCE  = "#2D5443"
ALMOND  = "#EDD9BE"
OLIVE   = "#8B9E6A"
MAUVE   = "#A6706A"
GOLD    = "#C9A84C"
DARK    = "#1F3D30"
BG      = "#FAEEDD"

PRICE_COLORS = {
    "LOW":     OLIVE,
    "MEDIUM":  GOLD,
    "HIGH":    MAUVE,
    "PREMIUM": "#8B3A3A",
}

MODEL_COLORS = [OLIVE, GOLD, MAUVE, SPRUCE]
MODEL_LABELS = ["Logistic\nRegression", "Random\nForest", "SVM\n(RBF)", "XGBoost\n★"]

# ── Chargement ─────────────────────────────────────────────────────────────
print("Chargement des données…")

report_path = os.path.join(MODELS_DIR, "rapport_evaluation.json")
if not os.path.exists(report_path):
    raise FileNotFoundError("rapport_evaluation.json introuvable. Exécutez d'abord : python ml/train.py")

with open(report_path, encoding="utf-8") as f:
    report = json.load(f)

X_test     = np.load(os.path.join(MODELS_DIR, "X_test.npy"))
y_test     = np.load(os.path.join(MODELS_DIR, "y_test.npy"))
proba_xgb  = np.load(os.path.join(MODELS_DIR, "y_proba_xgb.npy"))
proba_lr   = np.load(os.path.join(MODELS_DIR, "y_proba_lr.npy"))
proba_rf   = np.load(os.path.join(MODELS_DIR, "y_proba_rf.npy"))
proba_svm  = np.load(os.path.join(MODELS_DIR, "y_proba_svm.npy"))
gares_data = np.load(os.path.join(MODELS_DIR, "gares_coords.npy"))

classes     = list(report["model_comparison"]["models"]["xgboost"]["metrics"].keys())
price_labels = ["LOW", "MEDIUM", "HIGH", "PREMIUM"]  # ordre LabelEncoder (alphabétique)
mc          = report["model_comparison"]
kmeans_data = report["kmeans"]

# Métriques des 4 modèles dans l'ordre LR / RF / SVM / XGB
def get_metrics(key):
    m = mc["models"][key]["metrics"]
    return [m["accuracy"], m["precision_macro"], m["recall_macro"], m["f1_macro"]]

metrics_lr  = get_metrics("logistic_regression")
metrics_rf  = get_metrics("random_forest")
metrics_svm = get_metrics("svm_rbf")
metrics_xgb = get_metrics("xgboost")

metric_names = ["Accuracy", "Precision\n(macro)", "Recall\n(macro)", "F1\n(macro)"]

plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "axes.facecolor": BG,
    "figure.facecolor": BG,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.grid": True,
    "grid.alpha": 0.3,
    "grid.color": "#CCBBAA",
})


def save(fig, name):
    path = os.path.join(FIGS_DIR, name)
    fig.savefig(path, dpi=150, bbox_inches="tight", facecolor=BG)
    plt.close(fig)
    print(f"  ✓  {name}")


# ══════════════════════════════════════════════════════════════════════════
# Figure 1 — Comparaison des 4 modèles
# ══════════════════════════════════════════════════════════════════════════
print("\n[1/7] Comparaison des modèles…")

fig, ax = plt.subplots(figsize=(10, 5))
fig.suptitle("Comparaison des modèles de classification de prix",
             fontsize=14, fontweight="bold", color=DARK, y=1.01)

x      = np.arange(len(metric_names))
width  = 0.2
all_m  = [metrics_lr, metrics_rf, metrics_svm, metrics_xgb]
offsets = [-1.5, -0.5, 0.5, 1.5]

for i, (vals, color, label, offset) in enumerate(zip(all_m, MODEL_COLORS, MODEL_LABELS, offsets)):
    bars = ax.bar(x + offset * width, vals, width, color=color,
                  label=label, alpha=0.88, edgecolor="white", linewidth=0.5)
    # Valeur au-dessus de chaque barre
    for bar, v in zip(bars, vals):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.005,
                f"{v:.2f}", ha="center", va="bottom", fontsize=7.5, color=DARK)

# Mise en valeur XGBoost
xgb_x = x + 1.5 * width
for xi, v in zip(xgb_x, metrics_xgb):
    ax.annotate("", xy=(xi, v + 0.045), xytext=(xi, v + 0.015),
                arrowprops=dict(arrowstyle="->", color=SPRUCE, lw=1.5))

ax.set_xticks(x)
ax.set_xticklabels(metric_names, fontsize=10)
ax.set_ylim(0, 1.12)
ax.set_ylabel("Score", fontsize=10)
ax.set_xlabel("Métrique", fontsize=10)
ax.legend(loc="upper left", fontsize=8.5, framealpha=0.8)
ax.axhline(0.8, color=SPRUCE, linestyle="--", linewidth=0.8, alpha=0.4, label="_")

note = ("★ XGBoost retenu — meilleur F1-macro\n"
        "  Logistic Regression = baseline linéaire\n"
        "  Données tabulaires → gradient boosting > modèles linéaires")
fig.text(0.02, -0.06, note, fontsize=8, color="#555", style="italic")

save(fig, "01_comparaison_modeles.png")

# ══════════════════════════════════════════════════════════════════════════
# Figure 2 — Courbe du coude K-Means (inertie)
# ══════════════════════════════════════════════════════════════════════════
print("[2/7] Courbe du coude K-Means…")

k_vals   = kmeans_data["elbow_curve"]["k_values"]
inertias = kmeans_data["elbow_curve"]["inertias"]

fig, ax = plt.subplots(figsize=(7, 4))
fig.suptitle("Courbe du coude — K-Means (choix de k)",
             fontsize=13, fontweight="bold", color=DARK)

ax.plot(k_vals, inertias, marker="o", color=SPRUCE, linewidth=2, markersize=7,
        markerfacecolor=ALMOND, markeredgecolor=SPRUCE, markeredgewidth=1.5)

# Annotation k=6
k_chosen = 6
ax.axvline(k_chosen, color=OLIVE, linestyle="--", linewidth=1.5, alpha=0.8)
ax.annotate(f"k = {k_chosen} retenu\n(coude visible)",
            xy=(k_chosen, inertias[k_chosen - 1]),
            xytext=(k_chosen + 0.5, inertias[k_chosen - 1] + (max(inertias) - min(inertias)) * 0.1),
            fontsize=9, color=DARK,
            arrowprops=dict(arrowstyle="->", color=SPRUCE, lw=1.2))

ax.set_xlabel("Nombre de clusters k", fontsize=10)
ax.set_ylabel("Inertie (somme des distances²)", fontsize=10)
ax.set_xticks(k_vals)

note = ("L'inertie mesure la compacité des clusters.\n"
        "Le 'coude' indique le k optimal : au-delà, le gain diminue.")
fig.text(0.5, -0.06, note, ha="center", fontsize=8, color="#555", style="italic")

save(fig, "02_coude_kmeans.png")

# ══════════════════════════════════════════════════════════════════════════
# Figure 3 — Silhouette Score vs k
# ══════════════════════════════════════════════════════════════════════════
print("[3/7] Silhouette Score vs k…")

sil_scores = kmeans_data["elbow_curve"]["silhouette_scores"]
k_sil  = [k for k, s in zip(k_vals, sil_scores) if s is not None]
s_vals = [s for s in sil_scores if s is not None]

fig, ax = plt.subplots(figsize=(7, 4))
fig.suptitle("Silhouette Score — qualité du clustering K-Means",
             fontsize=13, fontweight="bold", color=DARK)

ax.bar(k_sil, s_vals, color=[OLIVE if k == k_chosen else GOLD for k in k_sil],
       edgecolor="white", linewidth=0.5, alpha=0.88)

for k, s in zip(k_sil, s_vals):
    ax.text(k, s + 0.003, f"{s:.3f}", ha="center", va="bottom", fontsize=8, color=DARK)

ax.axvline(k_chosen, color=SPRUCE, linestyle="--", linewidth=1.5, alpha=0.7)
ax.set_xlabel("Nombre de clusters k", fontsize=10)
ax.set_ylabel("Silhouette Score (0–1, plus haut = mieux)", fontsize=10)
ax.set_xticks(k_sil)
ax.set_ylim(0, max(s_vals) * 1.15)

note = ("Silhouette Score proche de 1 = clusters denses et bien séparés.\n"
        f"k={k_chosen} offre un bon équilibre compacité / nombre de zones.")
fig.text(0.5, -0.06, note, ha="center", fontsize=8, color="#555", style="italic")

save(fig, "03_silhouette_kmeans.png")

# ══════════════════════════════════════════════════════════════════════════
# Figure 4 — Carte des zones K-Means
# ══════════════════════════════════════════════════════════════════════════
print("[4/7] Carte des zones K-Means…")

lats     = gares_data[:, 0]
lons     = gares_data[:, 1]
clusters = gares_data[:, 2].astype(int)

CLUSTER_PALETTE = [SPRUCE, OLIVE, GOLD, MAUVE, "#5B7FA6", "#8B3A3A"]

fig, ax = plt.subplots(figsize=(7, 7))
fig.suptitle(f"Zones géographiques K-Means (k={k_chosen})\nGares françaises",
             fontsize=13, fontweight="bold", color=DARK)

for c in range(k_chosen):
    mask = clusters == c
    ax.scatter(lons[mask], lats[mask], s=8, alpha=0.5,
               color=CLUSTER_PALETTE[c], label=f"Zone {c + 1}")

ax.set_xlabel("Longitude", fontsize=9)
ax.set_ylabel("Latitude", fontsize=9)
ax.legend(fontsize=8, loc="lower right", framealpha=0.85)

note = ("Chaque couleur = 1 zone géographique.\n"
        "Ces zones servent de features pour XGBoost (origin_cluster, dest_cluster).")
fig.text(0.5, -0.03, note, ha="center", fontsize=8, color="#555", style="italic")

save(fig, "04_carte_zones_kmeans.png")

# ══════════════════════════════════════════════════════════════════════════
# Figure 5 — Importance des features XGBoost
# ══════════════════════════════════════════════════════════════════════════
print("[5/7] Importance des features XGBoost…")

feat_imp = report["model_comparison"]["feature_importance_xgboost"]
feat_names  = list(feat_imp.keys())
feat_values = list(feat_imp.values())

# Tri décroissant
sorted_pairs = sorted(zip(feat_values, feat_names), reverse=True)
feat_values, feat_names = zip(*sorted_pairs)

FEAT_LABELS = {
    "distance_km":    "Distance (km)",
    "dist_log":       "log(Distance)",
    "dist_sq":        "Distance²",
    "origin_cluster": "Zone départ (K-Means)",
    "dest_cluster":   "Zone arrivée (K-Means)",
}

fig, ax = plt.subplots(figsize=(7, 4))
fig.suptitle("Importance des variables — XGBoost",
             fontsize=13, fontweight="bold", color=DARK)

colors = [SPRUCE if v == max(feat_values) else OLIVE for v in feat_values]
bars = ax.barh([FEAT_LABELS.get(n, n) for n in feat_names], feat_values,
               color=colors, edgecolor="white", linewidth=0.5, alpha=0.88)

for bar, v in zip(bars, feat_values):
    ax.text(bar.get_width() + 0.002, bar.get_y() + bar.get_height() / 2,
            f"{v:.3f}", va="center", fontsize=9, color=DARK)

ax.set_xlabel("Importance (gain normalisé)", fontsize=10)
ax.set_xlim(0, max(feat_values) * 1.2)

note = ("La distance est le prédicteur principal du prix.\n"
        "Les zones K-Means ajoutent le contexte géographique (ex : Paris → Sud vs Est).")
fig.text(0.5, -0.06, note, ha="center", fontsize=8, color="#555", style="italic")

save(fig, "05_feature_importance_xgboost.png")

# ══════════════════════════════════════════════════════════════════════════
# Figure 6 — Matrice de confusion XGBoost
# ══════════════════════════════════════════════════════════════════════════
print("[6/7] Matrice de confusion XGBoost…")

y_pred_xgb = np.argmax(proba_xgb, axis=1)
cm = confusion_matrix(y_test, y_pred_xgb)
cm_norm = cm.astype(float) / cm.sum(axis=1, keepdims=True)  # normalisée par ligne

fig, axes = plt.subplots(1, 2, figsize=(12, 5))
fig.suptitle("Matrice de confusion — XGBoost", fontsize=13, fontweight="bold", color=DARK)

for ax, data, fmt, title in zip(
    axes,
    [cm, cm_norm],
    ["d", ".2f"],
    ["Valeurs absolues", "Normalisée (rappel par classe)"],
):
    sns.heatmap(data, annot=True, fmt=fmt, cmap="YlOrBr",
                xticklabels=price_labels, yticklabels=price_labels,
                linewidths=0.5, linecolor="white", ax=ax,
                cbar_kws={"shrink": 0.8})
    ax.set_xlabel("Classe prédite", fontsize=9)
    ax.set_ylabel("Classe réelle", fontsize=9)
    ax.set_title(title, fontsize=10, color=DARK)

note = ("Diagonale = prédictions correctes.\n"
        "La matrice normalisée montre le rappel par classe (valeur 1.0 = parfait).")
fig.text(0.5, -0.04, note, ha="center", fontsize=8, color="#555", style="italic")

save(fig, "06_matrice_confusion_xgboost.png")

# ══════════════════════════════════════════════════════════════════════════
# Figure 7 — Courbes ROC (XGBoost, OVR)
# ══════════════════════════════════════════════════════════════════════════
print("[7/7] Courbes ROC XGBoost…")

n_classes   = len(price_labels)
y_bin       = label_binarize(y_test, classes=list(range(n_classes)))
ROC_COLORS  = [OLIVE, GOLD, MAUVE, SPRUCE]

fig, ax = plt.subplots(figsize=(7, 6))
fig.suptitle("Courbes ROC — XGBoost (One-vs-Rest par classe de prix)",
             fontsize=12, fontweight="bold", color=DARK)

for i, (label, color) in enumerate(zip(price_labels, ROC_COLORS)):
    fpr, tpr, _ = roc_curve(y_bin[:, i], proba_xgb[:, i])
    roc_auc = sklearn_auc(fpr, tpr)
    ax.plot(fpr, tpr, color=color, linewidth=2,
            label=f"{label}  (AUC = {roc_auc:.3f})")

ax.plot([0, 1], [0, 1], color="#AAAAAA", linestyle="--", linewidth=1, label="Aléatoire (AUC=0.5)")
ax.set_xlabel("Taux de faux positifs (FPR)", fontsize=10)
ax.set_ylabel("Taux de vrais positifs (TPR / Recall)", fontsize=10)
ax.legend(fontsize=9, loc="lower right", framealpha=0.85)
ax.set_xlim(0, 1)
ax.set_ylim(0, 1.05)

note = ("AUC proche de 1.0 = le modèle distingue parfaitement la classe.\n"
        "Chaque courbe = 'cette classe vs toutes les autres' (One-vs-Rest).")
fig.text(0.5, -0.04, note, ha="center", fontsize=8, color="#555", style="italic")

save(fig, "07_roc_curves_xgboost.png")

# ── Résumé ─────────────────────────────────────────────────────────────────
print(f"\n  7 graphiques sauvegardés dans : {FIGS_DIR}/")
print("  ┌──────────────────────────────────────────────────────────────────┐")
print("  │  01 Comparaison 4 modèles      — justifie le choix de XGBoost  │")
print("  │  02 Coude K-Means (inertie)    — justifie k=6                  │")
print("  │  03 Silhouette Score vs k      — confirme k=6                  │")
print("  │  04 Carte des zones            — visualise le clustering        │")
print("  │  05 Feature importance         — explique le modèle             │")
print("  │  06 Matrice de confusion       — évalue par classe              │")
print("  │  07 Courbes ROC                — AUC par catégorie de prix      │")
print("  └──────────────────────────────────────────────────────────────────┘\n")
