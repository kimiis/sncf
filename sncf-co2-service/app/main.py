import pandas as pd
import os

# Chemin vers le fichier xlsx dans le dossier repository/data (un niveau au-dessus)
data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
xlsx_files = [f for f in os.listdir(data_dir) if f.endswith('.xlsx')]

if not xlsx_files:
    print("Aucun fichier .xlsx trouvé dans le dossier data.")
else:
    xlsx_path = os.path.join(data_dir, xlsx_files[0])
    df = pd.read_excel(xlsx_path)
    print(df.head(10))