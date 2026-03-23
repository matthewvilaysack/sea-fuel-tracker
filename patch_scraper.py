#!/usr/bin/env python3
"""Patch scraper.py to add Thailand fuel types and Laos province scraping."""
import re

with open("/home/matt/fuel-tracker/scraper_patch.py") as f:
    patch = f.read()

with open("/home/matt/fuel-tracker/scraper.py") as f:
    scraper = f.read()

# 1. Insert patch functions before main()
insert_point = scraper.find("\n# ── Main")
if insert_point == -1:
    insert_point = scraper.find("def main():")
scraper = scraper[:insert_point] + "\n" + patch + "\n" + scraper[insert_point:]

# 2. Add Khon Kaen to Thailand cities
old_pattaya = '{"name": "Pattaya", "slug": "Pattaya", "latlng": [12.9236, 100.8825]},'
new_pattaya = old_pattaya + '\n        {"name": "Khon Kaen", "slug": "Khon-Kaen", "latlng": [16.4322, 102.8236]},'
scraper = scraper.replace(old_pattaya, new_pattaya, 1)

# 3. After city cache save, add fuel type + province scraping
old_cache = '            new_city_cache[c["id"]] = cities_data'
new_block = '''            new_city_cache[c["id"]] = cities_data

        # Thailand fuel type breakdown
        fuel_types_data = {}
        if c["id"] == "TH":
            print("    Scraping Thailand fuel types...")
            th_fuels = scrape_thailand_fuel_types()
            fx_thb = fx_rates.get("THB", 35.0)
            for ft_name, ft_price in th_fuels.items():
                fuel_types_data[ft_name] = {
                    "local": f"\\u0e3f{ft_price}",
                    "thb": ft_price,
                    "usd": round(ft_price / fx_thb, 2) if fx_thb else 0,
                }

        # Laos province breakdown
        provinces_data = []
        if c["id"] == "LA":
            print("    Scraping Laos provinces...")
            la_provs = scrape_laos_provinces()
            fx_lak = fx_rates.get("LAK", 10900)
            for prov in la_provs:
                prov_obj = {
                    "name": prov["name"],
                    "latlng": prov["latlng"],
                }
                if prov.get("gasoline95"):
                    prov_obj["gasoline95"] = {
                        "local": f"{int(prov['gasoline95']):,} LAK",
                        "usd": round(prov["gasoline95"] / fx_lak, 2) if fx_lak else 0,
                    }
                if prov.get("regular"):
                    prov_obj["regular"] = {
                        "local": f"{int(prov['regular']):,} LAK",
                        "usd": round(prov["regular"] / fx_lak, 2) if fx_lak else 0,
                    }
                if prov.get("diesel"):
                    prov_obj["diesel"] = {
                        "local": f"{int(prov['diesel']):,} LAK",
                        "usd": round(prov["diesel"] / fx_lak, 2) if fx_lak else 0,
                    }
                provinces_data.append(prov_obj)'''
scraper = scraper.replace(old_cache, new_block, 1)

# 4. Add fuelTypes and provinces to country_obj
old_cities = '"cities": cities_data,'
new_cities = '"cities": cities_data,\n            "fuelTypes": fuel_types_data,\n            "provinces": provinces_data,'
scraper = scraper.replace(old_cities, new_cities, 1)

with open("/home/matt/fuel-tracker/scraper.py", "w") as f:
    f.write(scraper)

print("Scraper patched successfully!")
