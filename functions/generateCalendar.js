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
  }).format(date);
}

function formatTime(date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
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
      const eventDate = new Date(e.start.toLocaleString("en-US", { timeZone: "America/New_York" }));
      const date = formatDate(eventDate);
      const time = formatTime(eventDate);

      // Remove leading sport in parentheses
      const cleanSummary = e.summary.replace(/^\([^)]*\)\s*/, '');

      return `<tr><td>${date}</td><td>${time}</td><td>${cleanSummary}</td></tr>`;
    });

    const timestamp = `<!-- Updated: ${new Date().toISOString()} -->`;

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
      font-weight: 700;
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
      background: transparent;
    }
    tr:nth-child(odd) {
      background-color: rgba(0, 0, 0, 0.8);
    }
    tr:nth-child(even) {
      background-color: rgba(0, 0, 0, 0.4);
    }
    tr:nth-child(even) td {
      color: #00a8ff !important;
    }
  </style>
</head>
<body>
  <table>
    ${rows.join('\n')}
  </table>
  ${timestamp}
</body>
</html>
`;

    fs.writeFileSync(OUTPUT_PATH, html);
    console.log('✅ games.html generated!');
  } catch (err) {
    console.error('❌ Failed to generate HTML:', err);
  }
})();
