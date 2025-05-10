import osmnx as ox
import networkx as nx
from flask import Flask, request, jsonify
from datasets import load_dataset
import json
from flask_cors import CORS
from openai import OpenAI
import ssl
from geopy.geocoders import Nominatim
import certifi

# Use custom context for geopy only
context = ssl.create_default_context(cafile=certifi.where())

app = Flask(__name__)
CORS(app)



# Initialize geolocator (you can use OpenCage or others if needed)
geolocator = Nominatim(user_agent="antwerp_night_route", ssl_context=context)

# Load dataset
print("Loading tagged dataset...")
ds = load_dataset("ns2agi/antwerp-osm-navigator")

def is_tagged_way(example):
    return example['type'] == 'way' and example['tags'] != '{}'

tagged_ways = ds['train'].filter(is_tagged_way)
# Ensure we properly populate tag_lookup with names of streets
tag_lookup = {}
for row in tagged_ways:
    tags = json.loads(row['tags'])
    name = tags.get("name")
    if name:
        tag_lookup[row['id']] = name  # Using the way ID as the key for name lookup

# Load road graph
print("Downloading base road graph from OSM...")
G = ox.graph_from_place("Antwerp, Belgium", network_type='walk')

# Default fallback policy
DEFAULT_POLICY = {
    "prefer_lit": True,
    "avoid_types": [],
    "prefer_types": ["primary", "secondary"]
}

def get_location_from_text(text):
    try:
        location = geolocator.geocode(text)
        if location:
            return location.latitude, location.longitude
        else:
            return None
    except Exception as e:
        print("[Geocoding error]", e)
        return None

# AI prompt to extract policy
def extract_routing_policy(note):
    prompt = f"""
You are an assistant that converts user route preferences into JSON policy rules.

Example:
User: "Avoid side streets and stick to main lit roads"
Output: {{
  "prefer_lit": true,
  "avoid_types": ["residential", "footway"],
  "prefer_types": ["primary", "secondary"]
}}

Now convert this:
User: "{note}"
Output:
"""
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You convert user preferences into JSON route policy."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        result = response.choices[0].message.content.strip()
        return json.loads(result)
    except Exception as e:
        print("[OpenAI error]", e)
        return DEFAULT_POLICY


# Generate edge weighting function
def compute_weight_factory(policy):
    def compute_weight(u, v, data):
        length = data.get("length", 1)
        name = str(data.get("name", "")).lower()
        highway = data.get("highway", "residential")
        lit = "no"

        if name in tag_lookup:
            tags = tag_lookup[name]
            highway = tags.get("highway", highway)
            lit = tags.get("lit", tags.get("lighting", lit))

        if isinstance(highway, list):
            highway = highway[0]

        lit_penalty = 1.0
        if policy.get("prefer_lit"):
            lit_penalty = 0.5 if lit == "yes" else 2.0

        road_penalty = 1.0
        if highway in policy.get("avoid_types", []):
            road_penalty *= 2.0
        elif highway in policy.get("prefer_types", []):
            road_penalty *= 0.5

        return length * lit_penalty * road_penalty

    return compute_weight


def generate_directions(path, G):
    directions = []

    for i in range(1, len(path)):
        u = path[i - 1]
        v = path[i]
        edge_data = G.get_edge_data(u, v)

        street_name = None
        for _, data in edge_data.items():
            street_name = data.get("name")
            if street_name:
                break

        if not street_name:
            street_name = "Unknown road"
        elif isinstance(street_name, list):
            street_name = street_name[0]
        elif not isinstance(street_name, str):
            street_name = str(street_name)

        if i == 1:
            direction = f"Start at {street_name}"
        elif street_name in directions[-1]:
            direction = f"Remain on {street_name}"
        else:
            direction = f"Turn onto {street_name}"

        directions.append(direction)

    return directions


@app.route("/route", methods=["GET"])
def route():
    print("Request received:")
    start = request.args.get("start")
    end = request.args.get("end")
    note = request.args.get("note", "prefer lit main roads")
    print(f"start: {start}, end: {end}, note: {note}")

    try:
        # Use the start coordinates directly if they are numeric
        try:
            orig_lat, orig_lon = map(float, start.split(","))
        except ValueError:
            return jsonify({"error": "Invalid start location format"}), 400

        # Extract routing preferences and possibly a destination
        policy = extract_routing_policy(note)
        print("Routing policy:", policy)

        # Use extracted destination from policy if available
        if 'destination' in policy:
            end_coords = get_location_from_text(policy['destination'])
        elif end.strip():
            end_coords = get_location_from_text(end)
        else:
            end_coords = get_location_from_text(note)

        if not end_coords:
            return jsonify({"error": "Could not find end location from the note or 'end' field"}), 400

        dest_lat, dest_lon = end_coords

        weight_fn = compute_weight_factory(policy)

        for u, v, k, data in G.edges(keys=True, data=True):
            G[u][v][k]['weight'] = weight_fn(u, v, data)

        orig_node = ox.distance.nearest_nodes(G, orig_lon, orig_lat)
        dest_node = ox.distance.nearest_nodes(G, dest_lon, dest_lat)

        path = nx.shortest_path(G, orig_node, dest_node, weight='weight')
        coords = [(G.nodes[n]['y'], G.nodes[n]['x']) for n in path]

        # Generate the turn-by-turn directions
        directions = generate_directions(path, G)

        return jsonify({"route": coords, "directions": directions})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=False)
