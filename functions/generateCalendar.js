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

// Prioritize longer sport names first
function extractSport(summary) {
  const knownSports = [
    'Field Hockey',
    'Football',
    'Soccer',
    'Basketball',
    'Volleyball',
    'Hockey',
    'Lacrosse',
    'Baseball',
    'Softball',
    'Track',
    'Cross Country',
    'Golf',
    'Tennis'
  ];

  const lowerSummary = summary.toLowerCase();

  for (const sport of knownSports) {
    if (lowerSummary.includes(sport.toLowerCase())) {
      return sport;
    }
  }

  // fallback:
  return summary.split(' ')[0];
}

function simplifyOpponent(summary) {
  const vsIndex = summary.toLowerCase().indexOf('vs.');
  let opponent = vsIndex !== -1 ? summary.slice(vsIndex + 3).trim() : summary;

  // Remove parentheses and content inside them, e.g. "(Women's Soccer)"
  opponent = opponent.replace(/\s*\([^)]*\)/g, '').trim();

  return opponent;
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
}

function formatTime(date) {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
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

    const rows = events.map(e => {
      const sport = extractSport(e.summary);
      const date = formatDate(new Date(e.start));
      const time = formatTime(new Date(e.start));
      const opponent = simplifyOpponent(e.summary);
      return `<tr><td>${sport}</td><td>${date}</td><td>${time}</td><td>${opponent}</td></tr>`;
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Goldman:wght@700&display=swap" rel="stylesheet">
  <meta charset="UTF-8" />
  <title>Games</title>
<style>
  body {
    font-family: 'Goldman', cursive;
    font-weight: 700; /* Bold */
    background: transparent;
    margin: 0;
    color: white;
    display: flex;
    justify-content: center;
    padding-top: 630px;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    max-width: 1920px;
    font-size: 2.5em;
    text-align: center;
  }

  td {
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    vertical-align: middle;
    color: white;
    background: transparent;
  }

  tr:nth-child(odd) {
    background-color: rgba(0, 0, 0, 0.8);
  }

tr:nth-child(even) {
  background-color: rgba(0, 0, 0, 0.4); /* 40% black */
}

tr:nth-child(even) td {
  color: #00a8ff !important; /* Bright blue text for even rows */
}
</style>
</head>
<body>
  <table>
    ${rows.join('\n')}
  </table>
</body>
</html>
`;

    fs.writeFileSync(OUTPUT_PATH, html);
    console.log('✅ games.html generated!');
  } catch (err) {
    console.error('❌ Failed to generate HTML:', err);
  }
})();
