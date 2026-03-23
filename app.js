/**
 * SEA Fuel Watch — Application Logic
 */

(function () {
  'use strict';

  const SEVERITY_COLORS = {
    critical: '#e88b8b',
    severe: '#e8b86b',
    moderate: '#e8d87b',
    normal: '#8bc9a0'
  };

  const SEVERITY_LABELS = {
    critical: 'Critical',
    severe: 'Severe',
    moderate: 'Moderate',
    normal: 'Stable'
  };

  // ── Map ──────────────────────────────────────────────────────────
  function initMap() {
    const map = L.map('map', {
      center: [5, 115],
      zoom: 4,
      minZoom: 3,
      maxZoom: 8,
      zoomControl: true,
      attributionControl: true
    });

    // Dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Add country markers
    FUEL_DATA.countries.forEach(country => {
      const color = SEVERITY_COLORS[country.severity];
      const radius = country.severity === 'critical' ? 18 :
                     country.severity === 'severe' ? 15 :
                     country.severity === 'moderate' ? 12 : 10;

      const marker = L.circleMarker(country.latlng, {
        radius: radius,
        fillColor: color,
        color: color,
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.3,
        bubblingMouseEvents: false
      }).addTo(map);

      // Pulsing effect for critical — non-interactive so it doesn't block clicks
      if (country.severity === 'critical') {
        const pulseMarker = L.circleMarker(country.latlng, {
          radius: radius + 8,
          fillColor: color,
          color: color,
          weight: 1,
          opacity: 0,
          fillOpacity: 0,
          className: 'pulse-marker',
          interactive: false,
          bubblingMouseEvents: false
        }).addTo(map);
      }

      // Popup
      const popupContent = `
        <div class="popup-content">
          <h4>${country.name}</h4>
          <span class="popup-severity" style="color:${color}">${SEVERITY_LABELS[country.severity]}</span>
          <div class="popup-prices">
            <span>⛽ $${country.prices.gasoline.usd}/L</span>
            <span>🛢️ $${country.prices.diesel.usd}/L</span>
          </div>
          <p>${country.summary}</p>
          <p style="margin-top:6px;font-size:11px;color:#6e7681">Reserves: ~${country.reserveDays} days</p>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 280,
        className: 'dark-popup'
      });

      // Country label — offset below marker, pointer-events disabled
      const label = L.divIcon({
        className: 'country-label',
        html: `<span style="
          color: ${color};
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 500;
          text-shadow: 0 1px 4px rgba(0,0,0,0.9);
          white-space: nowrap;
          pointer-events: none;
        ">${country.id}</span>`,
        iconSize: [30, 16],
        iconAnchor: [15, -20]
      });
      L.marker(country.latlng, { icon: label, interactive: false, pane: 'overlayPane' }).addTo(map);

      // City markers (shown at higher zoom)
      if (country.cities && country.cities.length > 0) {
        country.cities.forEach(city => {
          if (!city.latlng || !city.gasoline || !city.gasoline.usd) return;
          const cityMarker = L.circleMarker(city.latlng, {
            radius: 5,
            fillColor: '#7eb8da',
            color: '#7eb8da',
            weight: 1,
            opacity: 0,
            fillOpacity: 0,
          }).addTo(map);

          cityMarker.bindPopup(`
            <div class="popup-content">
              <h4>${city.name}</h4>
              <div class="popup-prices">
                <span>⛽ $${city.gasoline.usd}/L</span>
                <span style="color:#6e7681;font-size:11px">${city.gasoline.local}</span>
              </div>
            </div>
          `, { maxWidth: 200, className: 'dark-popup' });

          const cityLabel = L.divIcon({
            className: 'country-label',
            html: `<span style="
              color: #7eb8da;
              font-family: 'Inter', sans-serif;
              font-size: 9px;
              font-weight: 400;
              text-shadow: 0 1px 3px rgba(0,0,0,0.9);
              white-space: nowrap;
              pointer-events: none;
              opacity: 0;
              transition: opacity 0.3s;
            " class="city-map-label">${city.name}</span>`,
            iconSize: [60, 14],
            iconAnchor: [30, -8]
          });
          const cityLabelMarker = city.latlng ? L.marker(city.latlng, { icon: cityLabel, interactive: false }).addTo(map) : null;

          // Store for zoom-based visibility
          cityMarker._isCityMarker = true;
          if (cityLabelMarker) cityLabelMarker._isCityLabel = true;
        });
      }
    });

    // Show/hide city markers based on zoom level
    function updateCityVisibility() {
      const zoom = map.getZoom();
      map.eachLayer(layer => {
        if (layer._isCityMarker) {
          const show = zoom >= 5;
          layer.setStyle({ opacity: show ? 0.8 : 0, fillOpacity: show ? 0.4 : 0 });
          if (show) layer.options.interactive = true;
          else { layer.options.interactive = false; layer.closePopup(); }
        }
        if (layer._isCityLabel) {
          const el = layer.getElement();
          if (el) {
            const span = el.querySelector('.city-map-label');
            if (span) span.style.opacity = zoom >= 6 ? '1' : '0';
          }
        }
      });
    }
    map.on('zoomend', updateCityVisibility);
    updateCityVisibility();
  }

  // ── Country Cards ────────────────────────────────────────────────
  function renderCards() {
    const container = document.getElementById('country-cards');
    // Sort: critical first, then severe, moderate, normal
    const order = { critical: 0, severe: 1, moderate: 2, normal: 3 };
    const sorted = [...FUEL_DATA.countries].sort((a, b) => order[a.severity] - order[b.severity]);

    sorted.forEach(country => {
      try {
      const reservePercent = Math.min((country.reserveDays / 90) * 100, 100);
      const reserveColor = country.reserveDays < 25 ? SEVERITY_COLORS.critical :
                           country.reserveDays < 45 ? SEVERITY_COLORS.severe :
                           country.reserveDays < 65 ? SEVERITY_COLORS.moderate :
                           SEVERITY_COLORS.normal;

      const gasChange = country.prices.gasoline.change;
      const dieselChange = country.prices.diesel.change;

      const card = document.createElement('div');
      card.className = `country-card ${country.severity}`;
      card.innerHTML = `
        <div class="card-header">
          <span class="card-country-name">${country.name}</span>
          <span class="card-severity-badge ${country.severity}">${SEVERITY_LABELS[country.severity]}</span>
        </div>
        <div class="card-prices">
          <div class="price-item">
            <div class="price-label">Gasoline</div>
            <div>
              <span class="price-value price-value-usd">$${country.prices.gasoline.usd}</span>
              <span class="price-value price-value-local" style="display:none">${country.prices.gasoline.local}</span>
              <span class="price-change ${gasChange > 0 ? 'up' : gasChange < 0 ? 'down' : 'flat'}">
                ${gasChange > 0 ? '▲' : gasChange < 0 ? '▼' : '—'} ${Math.abs(gasChange)}%
              </span>
            </div>
          </div>
          <div class="price-item">
            <div class="price-label">Diesel</div>
            <div>
              <span class="price-value price-value-usd">$${country.prices.diesel.usd}</span>
              <span class="price-value price-value-local" style="display:none">${country.prices.diesel.local}</span>
              <span class="price-change ${dieselChange > 0 ? 'up' : dieselChange < 0 ? 'down' : 'flat'}">
                ${dieselChange > 0 ? '▲' : dieselChange < 0 ? '▼' : '—'} ${Math.abs(dieselChange)}%
              </span>
            </div>
          </div>
        </div>
        <div class="card-reserve">
          <div class="reserve-bar">
            <div class="reserve-fill" style="width:${reservePercent}%;background:${reserveColor}"></div>
          </div>
          <span class="reserve-label">${country.reserveDays}d reserves</span>
        </div>
        <p class="card-summary">${country.summary}</p>
        <div class="card-sparkline" data-country="${country.id}"></div>
        <div class="card-chart-expand" data-country="${country.id}" hidden>
          <div class="chart-controls">
            <button class="chart-range-btn active" data-range="7">W</button>
            <button class="chart-range-btn" data-range="30">M</button>
          </div>
          <div class="chart-expanded" data-country="${country.id}"></div>
        </div>
        <div class="card-factors">
          ${country.factors.map(f => `<span class="factor-tag">${f}</span>`).join('')}
        </div>
        ${country.fuelTypes && Object.keys(country.fuelTypes || {}).length > 0 ? `
        <div class="city-accordion">
          <button class="city-toggle" aria-expanded="false">
            <span class="city-toggle-icon">›</span>
            <span>${Object.keys(country.fuelTypes).length} fuel types · national pricing</span>
          </button>
          <div class="city-list" hidden>
            ${Object.entries(country.fuelTypes).map(([name, data]) => `
              <div class="city-row">
                <span class="city-name">${name}</span>
                <span class="city-price">$${data.usd}</span>
                <span class="city-local">${data.local}/L</span>
              </div>
            `).join('')}
            ${country.cities && country.cities.length > 0 ? `
            <div class="detail-subheader">Cities (uniform national price)</div>
            ${country.cities.map(city => `
              <div class="city-row">
                <span class="city-name">${city.name}</span>
                <span class="city-price">${city.gasoline.usd ? `$${city.gasoline.usd}` : '—'}</span>
                <span class="city-local">${city.gasoline.local !== 'N/A' ? city.gasoline.local : ''}</span>
              </div>
            `).join('')}` : ''}
          </div>
        </div>
        ` : ''}
        ${country.provinces && country.provinces.length > 0 ? `
        <div class="city-accordion">
          <button class="city-toggle" aria-expanded="false">
            <span class="city-toggle-icon">›</span>
            <span>${country.provinces.length} provinces tracked</span>
          </button>
          <div class="city-list" hidden>
            <div class="province-header-row">
              <span></span>
              <span class="province-col-label">G95</span>
              <span class="province-col-label">Regular</span>
              <span class="province-col-label">Diesel</span>
            </div>
            ${country.provinces.map(prov => `
              <div class="province-row">
                <span class="city-name">${prov.name}</span>
                <span class="city-price">${prov.gasoline95 ? `$${prov.gasoline95.usd}` : '—'}</span>
                <span class="city-price">${prov.regular ? `$${prov.regular.usd}` : '—'}</span>
                <span class="city-price">${prov.diesel ? `$${prov.diesel.usd}` : '—'}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
        ${(!country.fuelTypes || Object.keys(country.fuelTypes || {}).length === 0) ? (country.cities && country.cities.length > 0 && (!country.provinces || country.provinces.length === 0) ? `
        <div class="city-accordion">
          <button class="city-toggle" aria-expanded="false">
            <span class="city-toggle-icon">›</span>
            <span>${country.cities.length} ${country.cities.length === 1 ? 'city' : 'cities'} tracked</span>
          </button>
          <div class="city-list" hidden>
            ${country.cities.map(city => `
              <div class="city-row">
                <span class="city-name">${city.name}</span>
                <span class="city-price">${city.gasoline.usd ? `$${city.gasoline.usd}` : '—'}</span>
                <span class="city-local">${city.gasoline.local !== 'N/A' ? city.gasoline.local : ''}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : '') : ''}
      `;

      // Wire up city accordion toggle
      const toggle = card.querySelector('.city-toggle');
      if (toggle) {
        toggle.addEventListener('click', () => {
          const list = card.querySelector('.city-list');
          const expanded = toggle.getAttribute('aria-expanded') === 'true';
          toggle.setAttribute('aria-expanded', !expanded);
          toggle.querySelector('.city-toggle-icon').textContent = expanded ? '›' : '‹';
          list.hidden = expanded;
        });
      }

      container.appendChild(card);
      } catch(err) { console.error('Card render error for', country.id, err); }
    });
  }

  // ── News Feed ────────────────────────────────────────────────────
  // Country keywords for auto-tagging news
  const COUNTRY_KEYWORDS = {
    'Myanmar': ['myanmar', 'yangon', 'mandalay', 'naypyidaw', 'burmese'],
    'Thailand': ['thailand', 'thai', 'bangkok', 'phuket', 'chiang mai'],
    'Laos': ['laos', 'lao', 'vientiane', 'luang prabang'],
    'Cambodia': ['cambodia', 'phnom penh', 'siem reap', 'khmer'],
    'Vietnam': ['vietnam', 'vietnamese', 'hanoi', 'ho chi minh', 'saigon'],
    'Philippines': ['philippines', 'filipino', 'manila', 'cebu', 'davao', 'jeepney'],
    'Indonesia': ['indonesia', 'indonesian', 'jakarta', 'pertamina', 'bali'],
    'Malaysia': ['malaysia', 'malaysian', 'kuala lumpur', 'petronas'],
    'Singapore': ['singapore', 'singaporean'],
    'Brunei': ['brunei'],
    'Australia': ['australia', 'australian', 'sydney', 'melbourne'],
    'Timor-Leste': ['timor', 'timorese']
  };

  function detectCountries(text) {
    const lower = text.toLowerCase();
    const matches = [];
    for (const [country, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
      if (keywords.some(kw => lower.includes(kw))) matches.push(country);
    }
    return matches.length ? matches : ['Regional'];
  }

  let activeNewsFilter = 'all';

  function initNewsFilters() {
    const select = document.getElementById('news-country-select');

    // Get unique countries from news
    const countriesInNews = new Set();
    NEWS_DATA.forEach(item => {
      const countries = item.countries || detectCountries(item.title);
      countries.forEach(c => countriesInNews.add(c));
    });

    [...countriesInNews].sort().forEach(country => {
      const opt = document.createElement('option');
      opt.value = country;
      opt.textContent = country;
      select.appendChild(opt);
    });

    select.addEventListener('change', () => {
      activeNewsFilter = select.value;
      filterNews();
    });
  }

  function filterNews() {
    document.querySelectorAll('.news-item').forEach(el => {
      if (activeNewsFilter === 'all') {
        el.style.display = '';
      } else {
        const tags = el.dataset.countries || '';
        el.style.display = tags.includes(activeNewsFilter) ? '' : 'none';
      }
    });
  }

  function renderNews() {
    const container = document.getElementById('news-feed');
    NEWS_DATA.forEach((item, i) => {
      try {
      const countries = item.countries || detectCountries(item.title);
      const el = document.createElement('a');
      el.href = item.url;
      el.target = '_blank';
      el.rel = 'noopener';
      el.className = 'news-item';
      el.dataset.countries = countries.join(',');
      el.style.setProperty('--i', i + 1);
      el.innerHTML = `
        <span class="news-category ${item.category}">${item.category}</span>
        <div class="news-content">
          <div class="news-title">${item.title}</div>
          <div class="news-meta">
            <span class="news-source">${item.source}</span>
            ${countries.filter(c => c !== 'Regional').map(c => `<span class="news-country-tag">${c}</span>`).join('')}
            <span class="news-date">${item.date}</span>
          </div>
        </div>
      `;
      container.appendChild(el);
      } catch(err) { console.error('News render error', err); }
    });
  }

  // ── Summary Counts ──────────────────────────────────────────────
  function updateSummary() {
    const counts = { critical: 0, severe: 0, moderate: 0, normal: 0 };
    FUEL_DATA.countries.forEach(c => counts[c.severity]++);
    document.getElementById('critical-count').textContent = counts.critical;
    document.getElementById('severe-count').textContent = counts.severe;
    document.getElementById('moderate-count').textContent = counts.moderate;
    document.getElementById('normal-count').textContent = counts.normal;
  }

  // ── Data Loading ──────────────────────────────────────────────────
  const DATA_API = 'https://srv1376791.tailfd8618.ts.net/fuel/data.json';

  async function loadLiveData() {
    try {
      const res = await fetch(DATA_API, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // Update globals
      Object.assign(FUEL_DATA, json.fuelData);
      NEWS_DATA.length = 0;
      json.newsData.forEach(n => NEWS_DATA.push(n));
      // Load live exchange rates if available
      if (json.fuelData.exchangeRates) {
        USD_RATES = json.fuelData.exchangeRates;
        console.log('Loaded live exchange rates');
      }
      if (json.priceHistory && typeof PRICE_HISTORY !== 'undefined') {
        Object.assign(PRICE_HISTORY, json.priceHistory);
      } else if (json.priceHistory) {
        window.PRICE_HISTORY = json.priceHistory;
      }
      console.log('Loaded live data from API');
    } catch (e) {
      console.warn('Using bundled data (API unavailable):', e.message);
    }
  }

  // ── Filters ───────────────────────────────────────────────────────
  let activeFilter = 'all';
  let activeCurrency = 'auto';

  // Currency codes per country
  const COUNTRY_CURRENCIES = {
    'Myanmar': 'MMK', 'Laos': 'LAK', 'Cambodia': 'KHR', 'Thailand': 'THB',
    'Vietnam': 'VND', 'Philippines': 'PHP', 'Indonesia': 'IDR', 'Malaysia': 'MYR',
    'Singapore': 'SGD', 'Brunei': 'BND', 'Australia': 'AUD', 'Timor-Leste': 'USD'
  };

  // Exchange rates — loaded from live data, fallback to approximates
  let USD_RATES = {
    'USD': 1, 'THB': 35.0, 'VND': 25000, 'PHP': 56.0, 'IDR': 16300,
    'MYR': 4.35, 'SGD': 1.33, 'MMK': 2100, 'LAK': 10900, 'KHR': 4080,
    'BND': 1.33, 'AUD': 1.54
  };

  const CURRENCY_SYMBOLS = {
    'USD': '$', 'THB': '฿', 'VND': '₫', 'PHP': '₱', 'IDR': 'Rp',
    'MYR': 'RM', 'SGD': 'S$', 'MMK': 'K', 'LAK': '₭', 'KHR': '៛',
    'BND': 'B$', 'AUD': 'A$'
  };

  function convertPrice(usdPrice, toCurrency) {
    const rate = USD_RATES[toCurrency] || 1;
    const converted = usdPrice * rate;
    // Format based on magnitude
    if (converted >= 1000) return Math.round(converted).toLocaleString();
    if (converted >= 100) return converted.toFixed(0);
    if (converted >= 10) return converted.toFixed(1);
    return converted.toFixed(2);
  }

  function initFilters() {
    const container = document.getElementById('filters');
    const filters = [
      { key: 'all', label: 'All' },
      { key: 'critical', label: 'Critical' },
      { key: 'severe', label: 'Severe' },
      { key: 'moderate', label: 'Moderate' },
      { key: 'normal', label: 'Stable' }
    ];

    filters.forEach(f => {
      const btn = document.createElement('button');
      btn.className = `filter-btn${f.key === 'all' ? ' active' : ''}`;
      btn.dataset.filter = f.key;
      btn.textContent = f.label;
      btn.addEventListener('click', () => {
        activeFilter = f.key;
        container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterCards();
      });
      container.appendChild(btn);
    });

    // Currency dropdown
    const currSelect = document.getElementById('currency-select');
    currSelect.addEventListener('change', () => {
      activeCurrency = currSelect.value;
      updateCurrencyDisplay();
    });
  }

  function updateCurrencyDisplay() {
    const cards = document.querySelectorAll('.country-card');
    cards.forEach(card => {
      const countryName = card.querySelector('.card-country-name').textContent;
      const countryCurrency = COUNTRY_CURRENCIES[countryName] || 'USD';

      card.querySelectorAll('.price-item').forEach(item => {
        const usdEl = item.querySelector('.price-value-usd');
        const localEl = item.querySelector('.price-value-local');
        const convertedEl = item.querySelector('.price-value-converted');
        const usdPrice = parseFloat(usdEl.textContent.replace('$', ''));

        // Remove old converted element if exists
        if (convertedEl) convertedEl.remove();

        if (activeCurrency === 'auto') {
          usdEl.style.display = 'none';
          localEl.style.display = '';
        } else if (activeCurrency === 'usd') {
          usdEl.style.display = '';
          localEl.style.display = 'none';
        } else if (activeCurrency === countryCurrency) {
          usdEl.style.display = 'none';
          localEl.style.display = '';
        } else {
          // Convert USD to selected currency
          usdEl.style.display = 'none';
          localEl.style.display = 'none';
          const symbol = CURRENCY_SYMBOLS[activeCurrency] || activeCurrency;
          const converted = convertPrice(usdPrice, activeCurrency);
          const newEl = document.createElement('span');
          newEl.className = 'price-value price-value-converted';
          newEl.textContent = `${symbol}${converted}`;
          usdEl.parentNode.insertBefore(newEl, usdEl);
        }
      });
    });
  }

  function filterCards() {
    const cards = document.querySelectorAll('.country-card');
    let delay = 0;
    cards.forEach(card => {
      const match = activeFilter === 'all' || card.classList.contains(activeFilter);
      card.style.display = match ? '' : 'none';
      if (match) {
        card.style.animation = 'none';
        card.offsetHeight;
        card.style.animation = `emerge 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) forwards`;
        card.style.animationDelay = `${delay * 0.04}s`;
        delay++;
      }
    });
  }

  // ── Sparklines & Charts ──────────────────────────────────────────
  const SEVERITY_CSS = {
    critical: 'var(--critical)', severe: 'var(--severe)',
    moderate: 'var(--moderate)', normal: 'var(--normal)'
  };

  function svgPath(points, w, h, padding = 2) {
    if (points.length < 2) return '';
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const xStep = (w - padding * 2) / (points.length - 1);
    return points.map((v, i) => {
      const x = padding + i * xStep;
      const y = padding + (1 - (v - min) / range) * (h - padding * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  function svgAreaPath(points, w, h, padding = 2) {
    const path = svgPath(points, w, h, padding);
    if (!path) return '';
    const xStep = (w - padding * 2) / (points.length - 1);
    const lastX = padding + (points.length - 1) * xStep;
    return `${path} L${lastX.toFixed(1)},${(h - padding).toFixed(1)} L${padding},${(h - padding).toFixed(1)} Z`;
  }

  function renderSparklines() {
    if (typeof PRICE_HISTORY === 'undefined') return;
    document.querySelectorAll('.card-sparkline').forEach(el => {
      const cid = el.dataset.country;
      const history = PRICE_HISTORY[cid];
      if (!history || history.length < 2) return;
      const last14 = history.slice(-14);
      const gasPoints = last14.map(d => d.gasoline);
      const country = FUEL_DATA.countries.find(c => c.id === cid);
      const color = country ? SEVERITY_CSS[country.severity] : 'var(--accent)';
      const w = 200, h = 32;
      el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="sparkline-svg">
        <path d="${svgAreaPath(gasPoints, w, h)}" fill="${color}" opacity="0.06"/>
        <path d="${svgPath(gasPoints, w, h)}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.5"/>
      </svg>`;
    });
  }

  function renderExpandedChart(container, cid, range) {
    const history = (typeof PRICE_HISTORY !== 'undefined') ? PRICE_HISTORY[cid] : null;
    if (!history || history.length < 2) { container.innerHTML = ''; return; }
    const data = history.slice(-range);
    if (data.length < 2) { container.innerHTML = ''; return; }

    const country = FUEL_DATA.countries.find(c => c.id === cid);
    const dieselColor = country ? SEVERITY_CSS[country.severity] : 'var(--severe)';
    const gasColor = 'var(--accent)';
    const w = 400, h = 120, pad = 28;

    const gasPoints = data.map(d => d.gasoline);
    const dieselPoints = data.map(d => d.diesel);
    const allPoints = [...gasPoints, ...dieselPoints];
    const min = Math.min(...allPoints);
    const max = Math.max(...allPoints);
    const range_ = max - min || 0.1;

    const xStep = (w - pad * 2) / (data.length - 1);
    const toY = v => pad + (1 - (v - min) / range_) * (h - pad * 2);
    const toX = i => pad + i * xStep;

    const gasPath = gasPoints.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
    const dieselPath = dieselPoints.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');

    const gasArea = `${gasPath} L${toX(data.length-1).toFixed(1)},${(h-pad).toFixed(1)} L${pad},${(h-pad).toFixed(1)} Z`;
    const dieselArea = `${dieselPath} L${toX(data.length-1).toFixed(1)},${(h-pad).toFixed(1)} L${pad},${(h-pad).toFixed(1)} Z`;

    // Y-axis: 3 ticks
    const yTicks = [min, (min + max) / 2, max];
    const gridLines = yTicks.map(v => `<line x1="${pad}" x2="${w-pad}" y1="${toY(v).toFixed(1)}" y2="${toY(v).toFixed(1)}" stroke="var(--border)" stroke-width="0.5"/>`).join('');
    const yLabels = yTicks.map(v => `<text x="${pad-4}" y="${toY(v).toFixed(1)}" text-anchor="end" dominant-baseline="middle" fill="var(--text-muted)" font-size="9" font-family="var(--font-mono)">$${v.toFixed(2)}</text>`).join('');

    // X-axis: start and end dates
    const startDate = data[0].date.slice(5); // MM-DD
    const endDate = data[data.length-1].date.slice(5);
    const xLabels = `<text x="${pad}" y="${h-6}" text-anchor="start" fill="var(--text-muted)" font-size="9" font-family="var(--font-mono)">${startDate}</text>
      <text x="${w-pad}" y="${h-6}" text-anchor="end" fill="var(--text-muted)" font-size="9" font-family="var(--font-mono)">${endDate}</text>`;

    // Legend
    const legend = `<text x="${w-pad}" y="14" text-anchor="end" fill="var(--text-muted)" font-size="9">
        <tspan fill="${gasColor}">● </tspan>Gas
        <tspan fill="${dieselColor}"> ● </tspan>Diesel
      </text>`;

    // Tooltip overlay (invisible rects per data point)
    const tooltipRects = data.map((d, i) => {
      const rw = (w - pad * 2) / data.length;
      return `<rect x="${(toX(i) - rw/2).toFixed(1)}" y="${pad}" width="${rw.toFixed(1)}" height="${h - pad*2}" fill="transparent" class="chart-hover-rect" data-idx="${i}" data-date="${d.date}" data-gas="${d.gasoline}" data-diesel="${d.diesel}"/>`;
    }).join('');

    container.innerHTML = `<svg viewBox="0 0 ${w} ${h}" class="expanded-chart-svg">
      ${gridLines}${yLabels}${xLabels}${legend}
      <path d="${gasArea}" fill="${gasColor}" opacity="0.05"/>
      <path d="${dieselArea}" fill="${dieselColor}" opacity="0.05"/>
      <path d="${gasPath}" fill="none" stroke="${gasColor}" stroke-width="2" opacity="0.7"/>
      <path d="${dieselPath}" fill="none" stroke="${dieselColor}" stroke-width="2" opacity="0.7"/>
      ${tooltipRects}
      <line class="chart-crosshair" x1="0" y1="${pad}" x2="0" y2="${h-pad}" stroke="var(--text-muted)" stroke-width="0.5" opacity="0" stroke-dasharray="2,2"/>
      <g class="chart-tooltip-group" opacity="0">
        <rect class="chart-tooltip-bg" rx="4" ry="4" fill="var(--bg-card)" stroke="var(--border)" stroke-width="0.5"/>
        <text class="chart-tooltip-text" font-size="9" font-family="var(--font-mono)" fill="var(--text-primary)"></text>
      </g>
    </svg>`;

    // Wire tooltip hover
    const svg = container.querySelector('.expanded-chart-svg');
    const crosshair = svg.querySelector('.chart-crosshair');
    const ttGroup = svg.querySelector('.chart-tooltip-group');
    const ttBg = svg.querySelector('.chart-tooltip-bg');
    const ttText = svg.querySelector('.chart-tooltip-text');

    svg.querySelectorAll('.chart-hover-rect').forEach(rect => {
      rect.addEventListener('mouseenter', e => {
        const idx = +rect.dataset.idx;
        const x = toX(idx);
        crosshair.setAttribute('x1', x); crosshair.setAttribute('x2', x);
        crosshair.setAttribute('opacity', '0.5');

        const label = `${rect.dataset.date.slice(5)}  ⛽$${parseFloat(rect.dataset.gas).toFixed(2)}  🛢️$${parseFloat(rect.dataset.diesel).toFixed(2)}`;
        ttText.textContent = label;
        const textW = label.length * 5.4;
        const ttX = Math.min(Math.max(x - textW/2, 2), w - textW - 4);
        ttBg.setAttribute('x', ttX - 3); ttBg.setAttribute('y', pad - 18);
        ttBg.setAttribute('width', textW + 6); ttBg.setAttribute('height', 15);
        ttText.setAttribute('x', ttX); ttText.setAttribute('y', pad - 8);
        ttGroup.setAttribute('opacity', '1');
      });
      rect.addEventListener('mouseleave', () => {
        crosshair.setAttribute('opacity', '0');
        ttGroup.setAttribute('opacity', '0');
      });
    });
  }

  function initChartExpanders() {
    document.querySelectorAll('.card-sparkline').forEach(el => {
      el.addEventListener('click', () => {
        const cid = el.dataset.country;
        const expandEl = el.nextElementSibling;
        const isHidden = expandEl.hidden;
        // Close all others
        document.querySelectorAll('.card-chart-expand').forEach(e => e.hidden = true);
        if (isHidden) {
          expandEl.hidden = false;
          const chartContainer = expandEl.querySelector('.chart-expanded');
          const activeBtn = expandEl.querySelector('.chart-range-btn.active');
          renderExpandedChart(chartContainer, cid, parseInt(activeBtn.dataset.range));
        }
      });
    });

    document.querySelectorAll('.chart-range-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const parent = btn.closest('.card-chart-expand');
        parent.querySelectorAll('.chart-range-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cid = parent.dataset.country;
        const chartContainer = parent.querySelector('.chart-expanded');
        renderExpandedChart(chartContainer, cid, parseInt(btn.dataset.range));
      });
    });
  }

  // ── Init ─────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', async () => {
    await loadLiveData();
    initMap();
    renderCards();
    initFilters();
    updateCurrencyDisplay();
    renderNews();
    initNewsFilters();
    updateSummary();
    renderSparklines();
    initChartExpanders();
  });
})();
