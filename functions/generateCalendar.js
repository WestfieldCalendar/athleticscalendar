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

function getSportIconData(categories) {
  if (!categories) return { icon: 'sports', type: 'material-icons' };

  let catStr = Array.isArray(categories)
    ? categories.join(' ').toLowerCase()
    : typeof categories === 'string'
    ? categories.toLowerCase()
    : '';

  if (catStr.includes('soccer')) return { icon: 'sports_soccer', type: 'material-icons' };
  if (catStr.includes('basketball')) return { icon: 'sports_basketball', type: 'material-icons' };
  if (catStr.includes('baseball')) return { icon: 'sports_baseball', type: 'material-icons' };
  if (catStr.includes('track')) return { icon: 'directions_run', type: 'material-icons' };
  if (catStr.includes('cross country')) return { icon: 'directions_run', type: 'material-icons' };
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
        <div class="col">
          <div class="card h-100">
            <div class="mb-3">
              <span class="${type} icon-circle" aria-hidden="true">${icon}</span>
            </div>
            <h4 class="card-title mb-4">${cleanSummary}</h4>
            <div class="card-details">
              <div><strong>${date}</strong></div>
              <div>${timeString}</div>
              <div class="sport-name">${sport}</div>
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
  <link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block"
  />
<style>
  html, body {
    margin: 0;
    padding: 0;
    width: 1920px;
    height: 1080px;
    background: transparent;
    color: white;
    font-family: 'Work Sans', sans-serif;
    font-weight: 700;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  .container {
    display: flex;
    width: 95vw;
    max-width: 1920px;
    justify-content: space-evenly;
    gap: 20px;
  }

  .col {
    flex: 1;
    max-width: 320px;
  }

  .card {
    background-color: rgba(0, 0, 0, 0.5); /* black with 50% opacity */
    border: 1px solid white;             /* 1px white stroke */
    border-radius: 12px;
    padding: 30px;
    text-align: center;
    height: 100%;
  }

  .card-title {
    font-size: 1.8rem;
    margin-bottom: 20px;
    color: #00a2ff; /* your custom light blue */
  }

  .card-details {
    font-size: 1.1rem;
    line-height: 1.8;
    color: #00a2ff; /* your custom light blue */
  }

  .icon-circle {
    font-size: 3rem;
    border-radius: 50%;
    padding: 15px;
    display: inline-block;
    color: #00a2ff; /* your custom light blue */
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
    console.log(`Games HTML written to: ${OUTPUT_PATH}`);
  } catch (err) {
    console.error('Error fetching or generating games HTML:', err);
  }
})();
