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
  if (catStr.includes('golf')) return { icon: 'golf_course', type: 'm_
