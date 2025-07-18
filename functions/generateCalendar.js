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
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
  <meta charset="UTF-8" />
  <title>Games</title>
<style>
  body {
    font-family: sans-serif;
    background: transparent; /* Make body background transparent */
    margin: 20px;
    color: white; /* White text everywhere */
  }
  table {
    border-collapse: collapse;
    width: 100%;
    font-size: 1.3em;
    background: transparent; /* Make table background transparent */
  }
  td {
    padding: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2); /* subtle white border */
    vertical-align: middle;
    color: white; /* ensure white text */
    background: transparent; /* transparent cell backgrounds */
  }
  tr:nth-child(odd),
  tr:nth-child(even) {
    background-color: transparent !important; /* remove zebra backgrounds */
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
