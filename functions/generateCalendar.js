const ical = require('node-ical');
const fs = require('fs');
const https = require('https');
const path = require('path');

const ICS_URL = 'https://westfieldstateowls.com/composite?print=ical';
const OUTPUT_PATH = path.join(__dirname, '../public/games.html');

function fetchICS(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', err => reject(err));
    });
  });
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'America/New_York',
  }).format(date);
}

function formatTime(date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  }).format(date);
}

// Return icon name and icon font type for a given sport/category string/array
function getSportIconData(categories) {
  if (!categories) return { icon: 'sports', type: 'material-icons' };

  let catStr = '';

  if (Array.isArray(categories)) {
    catStr = categories.join(' ').toLowerCase();
  } else if (typeof categories === 'string') {
    catStr = categories.toLowerCase();
  } else {
    return { icon: 'sports', type: 'material-icons' };
  }

  if (catStr.includes('soccer')) return { icon: 'sports_soccer', type: 'material-icons' };
  if (catStr.includes('basketball')) return { icon: 'sports_basketball', type: 'material-icons' };
  if (catStr.includes('baseball')) return { icon: 'sports_baseball', type: 'material-icons' };
  if (catStr.includes('track')) return { icon: 'directions_run', type: 'material-icons' };
  if (catStr.includes('cross country')) return { icon: 'sprint', type: 'material-icons' };
  if (catStr.includes('football')) return { icon: 'sports_football', type: 'material-icons' };
  if (catStr.includes('volleyball')) return { icon: 'sports_volleyball', type: 'material-icons' };
  if (catStr.includes('hockey')) return { icon: 'sports_hockey', type: 'material-icons' };
  if (catStr.includes('golf')) return { icon: 'golf_course', type: 'material-icons' };
  if (catStr.includes('lacrosse')) return { icon: 'pickleball', type: 'material-symbols-outlined' };
  if (catStr.includes('cheerleading')) return { icon: 'stadium', type: 'material-icons' };
  if (catStr.includes('swimming')) return { icon: 'pool', type: 'material-icons' };

  return { icon: 'sports', type: 'material-icons' };
}

(async () => {
  try {
    const rawICS = await fetchICS(ICS_URL);
    const data = ical.parseICS(rawICS);
    const now = new Date();

    const events = Object.values(data)
      .filter(e => e.type === 'VEVENT' && new Date(e.start) >= now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 5);

    const cards = events.map(e => {
      const date = formatDate(e.start);

      // Detect all-day event if start has no time part (UTC midnight)
      const isAllDay =
        e.datetype === 'date' ||
        (e.start instanceof Date &&
          e.start.getUTCHours() === 0 &&
          e.start.getUTCMinutes() === 0 &&
          e.start.toISOString().endsWith('T00:00:00.000Z'));

      const timeString = isAllDay ? 'All Day' : formatTime(e.start);

      const sport = e.categories || 'Unknown';
      const cleanSummary = e.summary.replace(/^\([^)]*\)\s*/, '').trim();

      const { icon, type } = getSportIconData(sport);

      return `
        <div class="col" style="flex: 0 0 18%; max-width: 18%;">
          <div class="card text-white bg-dark h-100 border border-light d-flex flex-column justify-content-between" style="padding: 1rem;">
            <div class="text-center mb-3">
              <span class="${type} icon-circle" aria-hidden="true">${icon}</span>
            </div>
            <h4 class="card-title text-center mb-4" style="font-size: 2rem;">${cleanSummary}</h4>
            <div class="text-center" style="font-size: 1.1rem; color: #ccc;">
              <div><strong>${date}</strong></div>
              <div>${timeString}</div>
              <div style="color: #00a8ff;">${sport}</div>
            </div>
          </div>
        </div>
      `;
    });

    const timestamp = `<!-- Updated: ${new Date().toISOString()} -->`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Games</title>
  <link href="https://fonts.googleapis.com/css2?family=Goldman:wght@700&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block"
  />
  <style>
    html, body {
      margin: 0; padding: 0;
      width: 1920px;
      height: 1080px;
      background: transparent;
      color: white;
      font-family: 'Goldman', cursive;
      font-weight: 700;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }

    body > .container {
      display: flex;
      width: 90vw;
      max-width: 1800px;
      justify-content: space-between;
      gap: 2%;
    }

    .card {
      border-radius: 1rem;
      box-shadow: 0 0 15px rgba(0, 168, 255, 0.6);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1rem 2rem;
      min-height: 320px;
    }

    .icon-circle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(0, 168, 255, 0.2);
      width: 4rem;
      height: 4rem;
      font-size: 3.5rem;
      color: #00a8ff;
      user-select: none;
    }

    .material-symbols-outlined.icon-circle {
      font-variation-settings: 'wght' 400, 'FILL' 0, 'GRAD' 0;
    }

    h4.card-title {
      margin-top: 0;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    ${cards.join('\n')}
  </div>

  ${timestamp}
</body>
</html>`;

    fs.writeFileSync(OUTPUT_PATH, html);
    console.log('✅ games.html generated!');
  } catch (err) {
    console.error('❌ Failed to generate HTML:', err);
  }
})();
