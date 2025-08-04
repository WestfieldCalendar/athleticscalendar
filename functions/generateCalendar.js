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

    // Map sport categories to Material Icon names
    const sportIcons = {
      Soccer: 'sports_soccer',
      Basketball: 'sports_basketball',
      Baseball: 'sports_baseball',
      'Track & Field': 'directions_run',
      Football: 'sports_football',
      Volleyball: 'sports_volleyball',
      Hockey: 'sports_hockey',
      Unknown: 'sports',
    };

    const cards = events.map(e => {
      const date = formatDate(e.start);

      // Detect all-day events
      const isAllDay =
        e.datetype === 'date' ||
        (e.start instanceof Date && e.start.getUTCHours() === 0 && e.start.getUTCMinutes() === 0 && !e.start.toISOString().includes('T00:00:00.000Z'));

      const timeString = isAllDay ? 'All Day' : formatTime(e.start);

      const sport = e.categories || 'Unknown';
      const cleanSummary = e.summary.replace(/^\([^)]*\)\s*/, '').trim();

      const iconName = sportIcons[sport] || sportIcons.Unknown;

      return `
        <div class="col" style="flex: 0 0 18%; max-width: 18%;">
          <div class="card text-white bg-dark h-100 border border-light">
            <div class="card-body d-flex flex-column justify-content-between text-center p-4" style="font-size: 1.4rem;">

              <!-- Icon inside a circle + Matchup on top -->
              <div class="mb-3 d-flex justify-content-center align-items-center" style="margin-bottom: 1.5rem;">
                <span class="material-icons icon-circle">${iconName}</span>
              </div>
              <h4 class="card-title mb-4" style="font-size: 2rem;">${cleanSummary}</h4>

              <!-- Date, time, sport at the bottom -->
              <div style="font-size: 1.1rem; color: #ccc;">
                <div><strong>${date}</strong></div>
                <div>${timeString}</div>
                <div style="color: #00a8ff;">${sport}</div>
              </div>
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
  <meta charset="UTF-8" />
  <title>Games</title>
  <link href="https://fonts.googleapis.com/css2?family=Goldman:wght@700&display=swap" rel="stylesheet" />
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
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
    .icon-circle {
      font-size: 3.5rem;
      color: #00a8ff;
      background-color: rgba(0, 168, 255, 0.15);
      border-radius: 50%;
      padding: 15px;
      width: 64px;
      height: 64px;
      display: flex;
      justify-content: center;
      align-items: center;
      user-select: none;
    }
  </style>
</head>
<body>
  <div class="container-fluid" style="width: 1920px; height: 1080px; display: flex; justify-content: center; align-items: center;">
    <div class="row w-100 justify-content-between px-5">
      ${cards.join('\n')}
    </div>
  </div>
  ${timestamp}
</body>
</html>
`;

    fs.writeFileSync(OUTPUT_PATH, html);
    console.log('✅ games.html generated with icons!');
  } catch (err) {
    console.error('❌ Failed to generate HTML:', err);
  }
})();
