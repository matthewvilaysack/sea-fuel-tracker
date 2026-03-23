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
          if (!city.gasoline.usd) return;
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
          const cityLabelMarker = L.marker(city.latlng, { icon: cityLabel, interactive: false }).addTo(map);

          // Store for zoom-based visibility
          cityMarker._isCityMarker = true;
          cityLabelMarker._isCityLabel = true;
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
        <div class="card-factors">
          ${country.factors.map(f => `<span class="factor-tag">${f}</span>`).join('')}
        </div>
        ${country.cities && country.cities.length > 0 ? `
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
        ` : ''}
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
    });
  }

  // ── News Feed ────────────────────────────────────────────────────
  function renderNews() {
    const container = document.getElementById('news-feed');
    NEWS_DATA.forEach((item, i) => {
      const el = document.createElement('a');
      el.href = item.url;
      el.target = '_blank';
      el.rel = 'noopener';
      el.className = 'news-item';
      el.style.setProperty('--i', i + 1);
      el.innerHTML = `
        <span class="news-category ${item.category}">${item.category}</span>
        <div class="news-content">
          <div class="news-title">${item.title}</div>
          <div class="news-meta">
            <span class="news-source">${item.source}</span>
            <span class="news-date">${item.date}</span>
          </div>
        </div>
      `;
      container.appendChild(el);
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

  // ── Init ─────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', async () => {
    await loadLiveData();
    initMap();
    renderCards();
    initFilters();
    updateCurrencyDisplay();
    renderNews();
    updateSummary();
  });
})();
