#!/usr/bin/env python3
"""City centres for the cities the publishers name. One lookup per city, cached.

The point is the city's centre, never the mosque's own: the record states the city,
the gazetteer states where that city is. Class DERIVED-CITY.
"""
import json, os, time, urllib.parse, urllib.request

OUT = os.path.expanduser("~/athan-gitree/census/o1l-city/coords-americas/data/gazetteer.json")
UA = "athan-census-coords/1.0 (prayer-times census; one lookup per city)"

CITIES = [
    ("US", "Marysville, Washington, USA"), ("US", "Lynnwood, Washington, USA"),
    ("US", "Cordova, Tennessee, USA"), ("US", "Getzville, New York, USA"),
    ("US", "Johns Creek, Georgia, USA"), ("US", "Buford, Georgia, USA"),
    ("US", "SeaTac, Washington, USA"), ("US", "Katy, Texas, USA"),
    ("US", "Waterbury, Connecticut, USA"), ("US", "Houston, Texas, USA"),
    ("US", "Loganville, Georgia, USA"), ("US", "Kent, Washington, USA"),
    ("US", "Seattle, Washington, USA"), ("US", "Redmond, Washington, USA"),
    ("US", "Portland, Oregon, USA"), ("US", "Richmond, Texas, USA"),
    ("US", "Honolulu, Hawaii, USA"), ("US", "Buffalo, New York, USA"),
    ("US", "Suwanee, Georgia, USA"), ("US", "Antioch, Tennessee, USA"),
    ("US", "Charlotte, North Carolina, USA"), ("US", "Tukwila, Washington, USA"),
    ("US", "Puyallup, Washington, USA"), ("US", "Glendale, Arizona, USA"),
    ("US", "Franklin, Tennessee, USA"), ("US", "Lomita, California, USA"),
    ("US", "Jamaica, Queens, New York, USA"), ("US", "Livonia, Michigan, USA"),
    ("US", "Albuquerque, New Mexico, USA"), ("US", "Perrysburg, Ohio, USA"),
    ("US", "San Antonio, Texas, USA"), ("US", "Richardson, Texas, USA"),
    ("US", "Chicago, Illinois, USA"), ("US", "Los Angeles, California, USA"),
    ("US", "Culver City, California, USA"), ("US", "Bridgeview, Illinois, USA"),
    ("US", "Villa Park, Illinois, USA"), ("US", "Falls Church, Virginia, USA"),
    ("US", "North Smithfield, Rhode Island, USA"),
    ("CA", "Winnipeg, Manitoba, Canada"), ("CA", "Kitchener, Ontario, Canada"),
    ("CA", "Halifax, Nova Scotia, Canada"), ("CA", "Edmonton, Alberta, Canada"),
    ("CA", "Brandon, Manitoba, Canada"), ("CA", "London, Ontario, Canada"),
    ("CA", "Toronto, Ontario, Canada"), ("CA", "Saskatoon, Saskatchewan, Canada"),
    ("CA", "Quebec City, Quebec, Canada"),
    ("TT", "Chaguanas, Trinidad and Tobago"), ("TT", "San Fernando, Trinidad and Tobago"),
    ("TT", "Guaico, Trinidad and Tobago"), ("TT", "Crown Point, Tobago, Trinidad and Tobago"),
    ("CO", "Cartagena de Indias, Colombia"), ("SR", "Paramaribo, Suriname"),
]

cache = json.load(open(OUT)) if os.path.exists(OUT) else {}
for cc, q in CITIES:
    if q in cache:
        continue
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"q": q, "format": "jsonv2", "limit": 1})
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        data = json.load(urllib.request.urlopen(req, timeout=30))
    except Exception as e:
        print("FAIL", q, e)
        continue
    if not data:
        print("EMPTY", q)
        continue
    d = data[0]
    cache[q] = {"country": cc, "lat": round(float(d["lat"]), 4),
                "lon": round(float(d["lon"]), 4),
                "display": d.get("display_name"),
                "osm": f"{d.get('osm_type')}/{d.get('osm_id')}"}
    print(f"{q:45s} {cache[q]['lat']:8.4f} {cache[q]['lon']:9.4f}  {cache[q]['display'][:60]}")
    json.dump(cache, open(OUT, "w"), indent=1, sort_keys=True)
    time.sleep(1.1)

print(len(cache), "cities cached")
