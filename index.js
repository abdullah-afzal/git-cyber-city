const axios = require('axios');
const fs = require('fs');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = process.env.USERNAME || 'abdullah-afzal';

async function getContributions(username) {
  const query = `
    query($userName:String!) {
      user(login: $userName) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  const response = await axios.post(
    'https://api.github.com/graphql',
    { query, variables: { userName: username } },
    { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } }
  );

  return response.data.data.user.contributionsCollection.contributionCalendar.weeks;
}

const drawBuilding = (x, y, level, w, h) => {
  if (level === 0) return `<polygon points="${x},${y} ${x+w/2},${y+h/2} ${x},${y+h} ${x-w/2},${y+h/2}" fill="#161b22" />`;
  
  const height = level * 8; // Scale height to commits
  const color = level > 5 ? "#33E6F0" : "#00d2ff";

  return `
    <polygon points="${x-w/2},${y+h/2} ${x},${y+h} ${x},${y+h-height} ${x-w/2},${y+h/2-height}" fill="#0a4d5c" />
    <polygon points="${x+w/2},${y+h/2} ${x},${y+h} ${x},${y+h-height} ${x+w/2},${y+h/2-height}" fill="#0e7a8a" />
    <polygon points="${x},${y-height} ${x+w/2},${y+h/2-height} ${x},${y+h-height} ${x-w/2},${y+h/2-height}" fill="${color}">
      <animate attributeName="fill" values="${color};#ffffff;${color}" dur="3s" repeatCount="indefinite" />
    </polygon>`;
};

async function main() {
  try {
    const weeks = await getContributions(USERNAME);
    const tileW = 16, tileH = 8;
    const svgWidth = 900, svgHeight = 450;

    let svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0d1117" />`;

    weeks.forEach((week, x) => {
      week.contributionDays.forEach((day, y) => {
        const isoX = (x - y) * (tileW / 2) + 400;
        const isoY = (x + y) * (tileH / 2) + 100;
        svg += drawBuilding(isoX, isoY, day.contributionCount, tileW, tileH);
      });
    });

    svg += `</svg>`;
    fs.writeFileSync('city.svg', svg);
    console.log("City generated successfully!");
  } catch (error) {
    console.error("Error generating city:", error);
  }
}

main();