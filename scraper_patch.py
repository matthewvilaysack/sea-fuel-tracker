
# ── Thailand Fuel Type Prices (motorist.co.th) ─────────────────────
def scrape_thailand_fuel_types():
    """Scrape detailed fuel type prices from motorist.co.th. Returns dict of fuel_type -> price_thb."""
    url = "https://www.motorist.co.th/en/petrol-prices"
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(r.text, "html.parser")
        text = soup.get_text()

        fuel_types = {}

        # Try table-based parsing first
        tables = soup.find_all("table")
        for table in tables:
            rows = table.find_all("tr")
            for row in rows:
                cells = [c.get_text(strip=True) for c in row.find_all(["td", "th"])]
                if len(cells) >= 2:
                    name = cells[0]
                    for fuel_name in ["Gasohol 95 Premium", "Gasohol 95", "Gasohol 91", "Gasohol E20", "Gasohol E85", "Diesel B7 Premium", "Diesel B7", "Benzin 95"]:
                        if fuel_name in name:
                            for cell in cells[1:]:
                                price_match = re.search(r"[฿]?([\d.]+)", cell.replace(",", ""))
                                if price_match:
                                    try:
                                        price = float(price_match.group(1))
                                        if 10 < price < 100:
                                            fuel_types[fuel_name] = price
                                            break
                                    except ValueError:
                                        pass
                            break

        # Fallback: line-by-line text parsing
        if not fuel_types:
            lines = [l.strip() for l in text.split("\n") if l.strip()]
            for i, line in enumerate(lines):
                for fuel_name in ["Gasohol 95", "Gasohol 91", "Gasohol E20", "Gasohol E85", "Diesel B7", "Diesel B7 Premium", "Benzin 95"]:
                    if fuel_name == line and i + 1 < len(lines):
                        next_line = lines[i + 1]
                        price_match = re.search(r"[฿]?([\d.]+)", next_line.replace(",", ""))
                        if price_match:
                            try:
                                price = float(price_match.group(1))
                                if 10 < price < 100:
                                    fuel_types[fuel_name] = price
                            except ValueError:
                                pass

        print(f"    Thailand fuel types: {len(fuel_types)} found")
        for ft, p in sorted(fuel_types.items()):
            print(f"      {ft}: THB {p}")
        return fuel_types
    except Exception as e:
        print(f"    Error scraping Thailand fuel types: {e}")
        return {}


# ── Laos Province Prices (laostatefuel.com) ────────────────────────
LAOS_PROVINCE_COORDS = {
    "Vientiane Capital": [17.9757, 102.6331],
    "Vientiane": [17.9757, 102.6331],
    "Vientiane Province": [18.3, 102.5],
    "Luang Prabang": [19.8856, 102.1347],
    "Savannakhet": [16.5417, 104.7403],
    "Champasak": [14.8860, 105.8654],
    "Xiangkhouang": [19.4500, 103.2000],
    "Khammouan": [17.3950, 104.8000],
    "Khammouane": [17.3950, 104.8000],
    "Houaphan": [20.3200, 104.1000],
    "Oudomxay": [20.6829, 101.9879],
    "Phongsali": [21.6840, 102.1040],
    "Luang Namtha": [21.0000, 101.4000],
    "Bokeo": [20.2900, 100.7400],
    "Sayaboury": [19.2600, 101.7100],
    "Xayaboury": [19.2600, 101.7100],
    "Bolikhamxai": [18.3700, 104.0000],
    "Attapeu": [14.8070, 106.8400],
    "Sekong": [15.3500, 106.7300],
    "Salavan": [15.7200, 106.4200],
    "Saravan": [15.7200, 106.4200],
    "Xaisomboun": [18.8600, 103.2000],
}


def scrape_laos_provinces():
    """Scrape province-level fuel prices from laostatefuel.com. Returns list of province dicts."""
    url = "https://laostatefuel.com/en/gas-price.html"

    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(r.text, "html.parser")

        provinces = []

        # Try parsing tables
        tables = soup.find_all("table")
        for table in tables:
            rows = table.find_all("tr")
            for row in rows[1:]:
                cells = [c.get_text(strip=True) for c in row.find_all(["td", "th"])]
                if len(cells) >= 3:
                    name = cells[0].strip()
                    if not name or name.lower() in ["province", "no", "no.", "#", ""]:
                        continue

                    prices = []
                    for cell in cells[1:]:
                        clean = cell.replace(",", "").replace(" ", "")
                        price_match = re.search(r"([\d.]+)", clean)
                        if price_match:
                            try:
                                p = float(price_match.group(1))
                                if p > 100:
                                    prices.append(p)
                            except ValueError:
                                pass

                    if prices and len(prices) >= 2:
                        coords = [17.9, 102.6]
                        for pname, pcoords in LAOS_PROVINCE_COORDS.items():
                            if pname.lower() in name.lower() or name.lower() in pname.lower():
                                coords = pcoords
                                break

                        prov = {
                            "name": name,
                            "latlng": coords,
                            "gasoline95": prices[0] if len(prices) > 0 else None,
                            "regular": prices[1] if len(prices) > 1 else None,
                            "diesel": prices[2] if len(prices) > 2 else None,
                        }
                        provinces.append(prov)

        # Fallback: div-based
        if not provinces:
            for div in soup.find_all(["div", "section"]):
                text = div.get_text()
                for pname, pcoords in LAOS_PROVINCE_COORDS.items():
                    if pname in text:
                        lak_prices = re.findall(r"([\d,]+)\s*(?:LAK|kip|₭)", text, re.I)
                        if lak_prices:
                            plist = [float(p.replace(",", "")) for p in lak_prices[:3]]
                            if plist and any(p > 1000 for p in plist):
                                if not any(pr["name"] == pname for pr in provinces):
                                    provinces.append({
                                        "name": pname,
                                        "latlng": pcoords,
                                        "gasoline95": plist[0] if len(plist) > 0 else None,
                                        "regular": plist[1] if len(plist) > 1 else None,
                                        "diesel": plist[2] if len(plist) > 2 else None,
                                    })

        print(f"    Laos provinces: {len(provinces)} found")
        for prov in provinces:
            print(f"      {prov['name']}: G95={prov.get('gasoline95')}, Reg={prov.get('regular')}, D={prov.get('diesel')}")
        return provinces
    except Exception as e:
        print(f"    Error scraping Laos provinces: {e}")
        return []
