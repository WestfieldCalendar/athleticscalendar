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
      const time = formatTime(e.start);
      const sport = e.categories || 'Unknown';
      const cleanSummary = e.summary.replace(/^\([^)]*\)\s*/, '').trim();

      return `
        <div class="col" style="flex: 0 0 18%; max-width: 18%;">
          <div class="card text-white bg-dark h-100">
            <div class="card-body d-flex flex-column justify-content-center text-center" style="font-size: 1.5rem;">
              <h5 class="card-title">${sport}</h5>
              <h6 class="card-subtitle mb-2 text-muted">${date} @ ${time}</h6>
              <p class="card-text">${cleanSummary}</p>
            </div>
          </div>
        </div>
      `;
    });

    const timestamp = `<!-- Updated: ${new Date().toISOString()} -->`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Games</title>
  <link href="https://fonts.googleapis.com/css2?family=Goldman:wght@700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 1920px;
      height: 1080px;
      background: transparent;
      color: white;
      font-family: 'Goldman', cursive;
      font-weight: 700;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div class="container-fluid" style="width: 1920px; height: 1080px; display: flex; justify-content: center; align-items: center; background: transparent;">
    <div class="row w-100 justify-content-between px-5">
      ${cards.join('\n')}
    </div>
  </div>
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
