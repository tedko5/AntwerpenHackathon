from datasets import load_dataset

from collections import Counter
import json
import pandas as pd
from matplotlib import pyplot as plt

# Login using e.g. `huggingface-cli login` to access this dataset
ds = load_dataset("ns2agi/antwerp-osm-navigator")

def has_tags(example):
    return example['tags'] != '{}'

if __name__ == "__main__":
    print(ds)
    print(ds['train'][0])  # prints first row
    print(ds['train'].features)  # prints types and structure

    sample = ds['train'].shuffle(seed=42).select(range(10000))
    df = pd.DataFrame(sample)

    plt.figure(figsize=(10, 10))
    plt.scatter(df['lon'], df['lat'], s=1, alpha=0.5)
    plt.title("Antwerp OSM Nodes")
    plt.xlabel("Longitude")
    plt.ylabel("Latitude")
    plt.grid(True)
    plt.show()

    tagged = ds['train'].filter(has_tags).shuffle(seed=42).select(range(1000))
    for i in range(5):
        print(json.loads(tagged[i]['tags']))

    key_counter = Counter()

    for row in tagged:
        tag_dict = json.loads(row['tags'])
        key_counter.update(tag_dict.keys())

    print(key_counter.most_common(10))