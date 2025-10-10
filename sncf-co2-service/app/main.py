import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt

st.title("Comparaison des émissions de CO₂ : voiture vs train")

# Distances en km
distances = [10, 50, 100, 200, 400, 800, 1000, 1500, 2000]

# Facteurs émission kgCO2e/km
co2_train_factor = 0.0194
co2_voiture_factor = 0.122

# Calcul émissions totales
co2_train = [d * co2_train_factor for d in distances]
co2_voiture = [d * co2_voiture_factor for d in distances]

df = pd.DataFrame({
    'Distance (km)': distances,
    'CO₂ Train (kg)': co2_train,
    'CO₂ Voiture (kg)': co2_voiture
})

# Choisir un trajet type (par exemple 100 km)
typical_distance = 100
co2_train_typical = typical_distance * co2_train_factor
co2_car_typical = typical_distance * co2_voiture_factor
reduction_pct = (1 - co2_train_typical / co2_car_typical) * 100

# Analogie impact CO2
# Exemples d'équivalences (sources moyennes)
kgCO2_per_tree_year = 21.77  # kgCO2 stocké par un arbre adulte en un an approx
kWh_per_kgCO2 = 0.475  # kWh d'électricité produite par kg CO2 en France environ
km_electric_car_per_kgCO2 = 0.5  # km parcourus en voiture électrique pour 1 kg CO2 produits approx

trees_equiv_train = co2_train_typical / kgCO2_per_tree_year
trees_equiv_car = co2_car_typical / kgCO2_per_tree_year
elec_equiv_train = co2_train_typical * kWh_per_kgCO2
elec_equiv_car = co2_car_typical * kWh_per_kgCO2
km_ev_equiv_train = co2_train_typical * km_electric_car_per_kgCO2
km_ev_equiv_car = co2_car_typical * km_electric_car_per_kgCO2

st.markdown(f"### Trajet type : {typical_distance} km")
st.metric("CO₂ Train (kg)", f"{co2_train_typical:.2f}")
st.metric("CO₂ Voiture (kg)", f"{co2_car_typical:.2f}")
st.metric("Réduction CO₂ (%)", f"{reduction_pct:.1f}%")

st.markdown("### Impact environnemental équivalent pour ce trajet")
st.write(f"- Le train émet environ {co2_train_typical:.2f} kg CO₂, soit l'équivalent de **{trees_equiv_train:.1f} arbres adultes** stockant du carbone pendant 1 an.")
st.write(f"- La voiture émet environ {co2_car_typical:.2f} kg CO₂, soit environ **{trees_equiv_car:.1f} arbres adultes**.")
st.write(f"- En énergie électrique, le train correspond à {elec_equiv_train:.1f} kWh, la voiture à {elec_equiv_car:.1f} kWh.")
st.write(f"- Le CO₂ émis par la voiture correspond approximativement à {km_ev_equiv_car:.1f} km parcourus par une voiture électrique.")

# Graphique des émissions
fig, ax = plt.subplots(figsize=(8,5))
ax.plot(df['Distance (km)'], df['CO₂ Train (kg)'], marker='o', label='Train')
ax.plot(df['Distance (km)'], df['CO₂ Voiture (kg)'], marker='o', label='Voiture')
ax.set_xlabel("Distance (km)")
ax.set_ylabel("Émissions CO₂ (kg)")
ax.set_title("Émissions CO₂ selon distance et mode de transport")
ax.legend()
ax.grid(True)

st.pyplot(fig)

st.markdown("### Données d'émissions CO₂")
st.dataframe(df)
