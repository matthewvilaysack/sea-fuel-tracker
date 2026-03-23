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
        fillOpacity: 0.25
      }).addTo(map);

      // Pulsing effect for critical
      if (country.severity === 'critical') {
        const pulseMarker = L.circleMarker(country.latlng, {
          radius: radius + 8,
          fillColor: color,
          color: color,
          weight: 1,
          opacity: 0,
          fillOpacity: 0,
          className: 'pulse-marker'
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

      // Country label
      const label = L.divIcon({
        className: 'country-label',
        html: `<span style="
          color: ${color};
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 600;
          text-shadow: 0 1px 4px rgba(0,0,0,0.8);
          white-space: nowrap;
        ">${country.id}</span>`,
        iconSize: [30, 16],
        iconAnchor: [15, -10]
      });
      L.marker(country.latlng, { icon: label, interactive: false }).addTo(map);
    });
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
              <span class="price-value">$${country.prices.gasoline.usd}</span>
              <span class="price-change ${gasChange > 0 ? 'up' : gasChange < 0 ? 'down' : 'flat'}">
                ${gasChange > 0 ? '▲' : gasChange < 0 ? '▼' : '—'} ${Math.abs(gasChange)}%
              </span>
            </div>
            <div class="price-label" style="margin-top:2px;font-size:9px">${country.prices.gasoline.local}</div>
          </div>
          <div class="price-item">
            <div class="price-label">Diesel</div>
            <div>
              <span class="price-value">$${country.prices.diesel.usd}</span>
              <span class="price-change ${dieselChange > 0 ? 'up' : dieselChange < 0 ? 'down' : 'flat'}">
                ${dieselChange > 0 ? '▲' : dieselChange < 0 ? '▼' : '—'} ${Math.abs(dieselChange)}%
              </span>
            </div>
            <div class="price-label" style="margin-top:2px;font-size:9px">${country.prices.diesel.local}</div>
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
      `;
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

  // ── Init ─────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initMap();
    renderCards();
    renderNews();
    updateSummary();
  });
})();
