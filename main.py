from datasets import load_dataset

import pandas as pd
from matplotlib import pyplot as plt

# Login using e.g. `huggingface-cli login` to access this dataset
ds = load_dataset("ns2agi/antwerp-osm-navigator")

if __name__ == "__main__":
    print(ds)
    print(ds['train'][0])  # prints first row
    print(ds['train'].features)  # prints types and structure

    sample = ds['train'].shuffle(seed=42).select(range(1000))
    df = pd.DataFrame(sample)
    print(df.head())
    print(df.columns)

    plt.scatter(df['lon'], df['lat'], s=1, alpha=0.5)
    plt.title("Map of OSM Points in Antwerp")
    plt.xlabel("Longitude")
    plt.ylabel("Latitude")
    plt.show()