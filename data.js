/**
 * SEA Fuel Watch — Data Layer
 * 
 * Mock data structured for easy API replacement.
 * Each country object follows a consistent schema.
 * 
 * Severity levels: "critical" | "severe" | "moderate" | "normal"
 * Trend: "rising" | "stable" | "falling"
 */

const FUEL_DATA = {
  lastUpdated: "2026-03-23T14:00:00Z",
  oilPrices: {
    brent: { price: 94.20, change: 32.7, trend: "rising" },
    wti: { price: 89.50, change: 28.1, trend: "rising" },
    opecBasket: { price: 91.80, change: 30.2, trend: "rising" }
  },
  countries: [
    {
      id: "MM",
      name: "Myanmar",
      severity: "critical",
      latlng: [19.7633, 96.0785],
      reserveDays: 40,
      prices: {
        gasoline: { local: "3,850 MMK/L", usd: 1.83, change: 62, trend: "rising" },
        diesel: { local: "4,200 MMK/L", usd: 2.00, change: 71, trend: "rising" }
      },
      summary: "Widespread fuel shortages. Long queues at stations in Yangon, Mandalay. Military government imposed rationing — 20L per vehicle. Black market prices 2-3x official rates.",
      factors: ["Sanctions limiting imports", "Foreign currency shortage", "Conflict disrupting logistics", "Iran war supply shock"],
      lastUpdated: "2026-03-23"
    },
    {
      id: "LA",
      name: "Laos",
      severity: "critical",
      latlng: [17.9757, 102.6331],
      reserveDays: 18,
      prices: {
        gasoline: { local: "18,500 LAK/L", usd: 1.70, change: 55, trend: "rising" },
        diesel: { local: "19,200 LAK/L", usd: 1.76, change: 58, trend: "rising" }
      },
      summary: "Acute shortage. No domestic refining capacity — 100% import dependent. Kip depreciation compounding fuel costs. Many rural stations closed. Government appealing for emergency imports from Vietnam and Thailand.",
      factors: ["No refining capacity", "Currency crisis", "Total import dependence", "Limited reserves"],
      lastUpdated: "2026-03-23"
    },
    {
      id: "KH",
      name: "Cambodia",
      severity: "critical",
      latlng: [12.5657, 104.9910],
      reserveDays: 20,
      prices: {
        gasoline: { local: "6,200 KHR/L", usd: 1.52, change: 45, trend: "rising" },
        diesel: { local: "6,500 KHR/L", usd: 1.59, change: 48, trend: "rising" }
      },
      summary: "Severe supply constraints. Only 20 days of reserves. Fuel rationing in provinces. Phnom Penh stations limiting purchases. Government in talks with Singapore for emergency supply.",
      factors: ["Minimal refining capacity", "Low strategic reserves", "Import supply chain disrupted", "Rising shipping costs"],
      lastUpdated: "2026-03-23"
    },
    {
      id: "TH",
      name: "Thailand",
      severity: "severe",
      latlng: [15.8700, 100.9925],
      reserveDays: 60,
      prices: {
        gasoline: { local: "52.50 THB/L", usd: 1.50, change: 35, trend: "rising" },
        diesel: { local: "38.94 THB/L", usd: 1.11, change: 28, trend: "rising" }
      },
      summary: "Government activated diesel price cap. Fishermen unable to afford diesel — boats docked in Samut Sakhon. Oil Fund reserves nearly depleted. 60-day reserves provide buffer but demand outpacing resupply.",
      factors: ["Oil Fund running low", "High domestic demand", "Middle East supply disruption", "Export obligations to neighbors"],
      lastUpdated: "2026-03-23"
    },
    {
      id: "VN",
      name: "Vietnam",
      severity: "severe",
      latlng: [14.0583, 108.2772],
      reserveDays: 22,
      prices: {
        gasoline: { local: "28,500 VND/L", usd: 1.14, change: 38, trend: "rising" },
        diesel: { local: "26,800 VND/L", usd: 1.07, change: 42, trend: "rising" }
      },
      summary: "Queues reported at stations in Hanoi and HCMC. Government ordered 4 refineries to maximize output. Nghi Son refinery operating at 110% capacity. Emergency crude oil imports from Russia redirected.",
      factors: ["Refinery capacity maxed", "Only 22 days reserves", "Import logistics disrupted", "Domestic demand surge"],
      lastUpdated: "2026-03-23"
    },
    {
      id: "PH",
      name: "Philippines",
      severity: "severe",
      latlng: [12.8797, 121.7740],
      reserveDays: 30,
      prices: {
        gasoline: { local: "82 PHP/L", usd: 1.46, change: 33, trend: "rising" },
        diesel: { local: "76 PHP/L", usd: 1.36, change: 38, trend: "rising" }
      },
      summary: "DOE ordered oil companies to maintain mandatory 30-day reserves. Jeepney and tricycle drivers staging protests over fuel costs. Government considering temporary fuel subsidy program.",
      factors: ["100% crude import dependent", "Archipelago logistics complex", "Peso weakening", "Transport sector pressure"],
      lastUpdated: "2026-03-23"
    },
    {
      id: "ID",
      name: "Indonesia",
      severity: "severe",
      latlng: [-0.7893, 113.9213],
      reserveDays: 21,
      prices: {
        gasoline: { local: "15,500 IDR/L", usd: 0.95, change: 22, trend: "rising" },
        diesel: { local: "7,150 IDR/L", usd: 0.44, change: 15, trend: "rising" }
      },
      summary: "Pertamina maintaining subsidized Pertalite at IDR 10,000 but rationing rumored. Subsidy bill ballooning. Remote eastern provinces reporting spot shortages. Government considering raising subsidized fuel prices.",
      factors: ["Massive subsidy burden", "Aging refineries", "Archipelago distribution", "Only 21 days reserves"],
      lastUpdated: "2026-03-23"
    },
    {
      id: "MY",
      name: "Malaysia",
      severity: "moderate",
      latlng: [4.2105, 101.9758],
      reserveDays: 45,
      prices: {
        gasoline: { local: "2.05 MYR/L", usd: 0.47, change: 0, trend: "stable" },
        diesel: { local: "3.35 MYR/L", usd: 0.77, change: 18, trend: "rising" }
      },
      summary: "RON95 price cap maintained at RM2.05 through subsidies. Petronas increasing domestic allocation. Subsidy bill surging — estimated RM40B for 2026. Diesel subsidy restructuring delayed amid crisis.",
      factors: ["Heavy subsidies masking prices", "Net oil exporter turning net importer", "Ringgit pressure", "Subsidy fiscal burden"],
      lastUpdated: "2026-03-23"
    },
    {
      id: "SG",
      name: "Singapore",
      severity: "moderate",
      latlng: [1.3521, 103.8198],
      reserveDays: 90,
      prices: {
        gasoline: { local: "3.20 SGD/L", usd: 2.40, change: 25, trend: "rising" },
        diesel: { local: "2.85 SGD/L", usd: 2.14, change: 30, trend: "rising" }
      },
      summary: "As Asia's refining hub, Singapore is managing. Refining margins at multi-year highs. No supply disruption but prices surging. Strategic reserves provide 90-day buffer. Re-export volumes reduced to prioritize domestic and regional supply.",
      factors: ["Major refining hub", "Strong reserves", "Re-export reductions", "High prices but no shortages"],
      lastUpdated: "2026-03-23"
    },
    {
      id: "BN",
      name: "Brunei",
      severity: "moderate",
      latlng: [4.5353, 114.7277],
      reserveDays: 75,
      prices: {
        gasoline: { local: "0.53 BND/L", usd: 0.40, change: 0, trend: "stable" },
        diesel: { local: "0.31 BND/L", usd: 0.23, change: 0, trend: "stable" }
      },
      summary: "Oil producer with heavily subsidized fuel. Among cheapest fuel globally. No shortage risk due to domestic production. Government maintaining price controls.",
      factors: ["Domestic oil production", "Heavy government subsidies", "Small population", "Ample reserves"],
      lastUpdated: "2026-03-23"
    },
    {
      id: "AU",
      name: "Australia",
      severity: "normal",
      latlng: [-25.2744, 133.7751],
      reserveDays: 68,
      prices: {
        gasoline: { local: "2.35 AUD/L", usd: 1.53, change: 20, trend: "rising" },
        diesel: { local: "2.45 AUD/L", usd: 1.59, change: 22, trend: "rising" }
      },
      summary: "Prices rising but supply stable. Government released strategic reserves. Increased imports from US Gulf Coast and non-Middle Eastern sources. Geelong and Lytton refineries at full capacity.",
      factors: ["Diversified supply sources", "Strategic reserve releases", "Domestic refining", "Strong purchasing power"],
      lastUpdated: "2026-03-23"
    },
    {
      id: "TL",
      name: "Timor-Leste",
      severity: "normal",
      latlng: [-8.8742, 125.7275],
      reserveDays: 55,
      prices: {
        gasoline: { local: "1.45 USD/L", usd: 1.45, change: 18, trend: "rising" },
        diesel: { local: "1.38 USD/L", usd: 1.38, change: 20, trend: "rising" }
      },
      summary: "Oil-producing nation with sovereign wealth fund. Fuel supplies adequate. Prices rising but government able to absorb costs. Greater Sunrise gas field development continues.",
      factors: ["Domestic production", "Petroleum fund buffer", "Small market", "Manageable demand"],
      lastUpdated: "2026-03-23"
    }
  ]
};

const NEWS_DATA = [
  {
    title: "Southeast Asia scrambles for energy as Iran war disrupts oil flows",
    source: "The Diplomat",
    date: "2026-03-23",
    url: "https://thediplomat.com/2026/03/in-southeast-asia-the-scramble-for-energy-is-on/",
    category: "analysis"
  },
  {
    title: "Thailand fishermen dock boats as diesel prices soar 28%",
    source: "New York Times",
    date: "2026-03-20",
    url: "https://nytimes.com",
    category: "impact"
  },
  {
    title: "Southeast Asia shuts offices, limits travel as oil crisis deepens",
    source: "Al Jazeera",
    date: "2026-03-12",
    url: "https://www.aljazeera.com/news/2026/3/12/southeast-asia-shuts-offices-limits-travel-as-oil-crisis-deepens",
    category: "crisis"
  },
  {
    title: "IEA coordinates 60 million barrel strategic reserve release",
    source: "IEA",
    date: "2026-03-15",
    url: "#",
    category: "response"
  },
  {
    title: "Cambodia, Indonesia, Vietnam reserves at critical 20-23 day levels",
    source: "TravelMole / UN",
    date: "2026-03-22",
    url: "#",
    category: "data"
  },
  {
    title: "OPEC+ emergency meeting set for March 25 to discuss production increase",
    source: "Reuters",
    date: "2026-03-22",
    url: "#",
    category: "response"
  },
  {
    title: "UN warns Southeast Asia inflation could hit 4.6% as fuel crisis spreads",
    source: "UN News",
    date: "2026-03-20",
    url: "https://news.un.org/en/story/2026/03/1167167",
    category: "analysis"
  },
  {
    title: "Philippines jeepney drivers protest as fuel costs threaten livelihoods",
    source: "Rappler",
    date: "2026-03-21",
    url: "#",
    category: "impact"
  }
];

// GeoJSON-like country boundaries (simplified centroids and rough polygons for markers)
// For a production version, use Natural Earth Data shapefiles
const COUNTRY_BOUNDARIES = {
  MM: [[28.5, 92.2], [28.5, 101.2], [9.8, 101.2], [9.8, 92.2]],
  LA: [[22.5, 100.1], [22.5, 107.7], [13.9, 107.7], [13.9, 100.1]],
  KH: [[14.7, 102.3], [14.7, 107.6], [10.4, 107.6], [10.4, 102.3]],
  TH: [[20.5, 97.3], [20.5, 105.6], [5.6, 105.6], [5.6, 97.3]],
  VN: [[23.4, 102.1], [23.4, 109.5], [8.4, 109.5], [8.4, 102.1]],
  PH: [[21.1, 116.9], [21.1, 126.6], [4.6, 126.6], [4.6, 116.9]],
  ID: [[5.9, 95.0], [5.9, 141.0], [-11.0, 141.0], [-11.0, 95.0]],
  MY: [[7.4, 99.6], [7.4, 119.3], [0.9, 119.3], [0.9, 99.6]],
  SG: [[1.47, 103.6], [1.47, 104.0], [1.22, 104.0], [1.22, 103.6]],
  BN: [[5.0, 114.0], [5.0, 115.4], [4.0, 115.4], [4.0, 114.0]],
  AU: [[-10.7, 113.2], [-10.7, 153.6], [-43.6, 153.6], [-43.6, 113.2]],
  TL: [[-8.1, 124.0], [-8.1, 127.3], [-9.5, 127.3], [-9.5, 124.0]]
};
