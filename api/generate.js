const axios = require('axios');

export default async function handler(req, res) {
  const { username } = req.query;
  if (!username) return res.status(400).send('Username required');

  try {
    const GITHUB_TOKEN = process.env.GH_TOKEN;
    const query = `query($u:String!){user(login:$u){contributionsCollection{contributionCalendar{weeks{contributionDays{contributionCount}}}}}}`;
    
    const response = await axios.post('https://api.github.com/graphql', 
      { query, variables: { u: username } },
      { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } }
    );

    const weeks = response.data.data.user.contributionsCollection.contributionCalendar.weeks;
    const tileW = 16, tileH = 8;
    
    let svg = `<svg width="900" height="450" xmlns="http://www.w3.org/2000/svg" style="background:#0d1117">`;
    
    // 🌌 Advanced Background: Flying Spinners
    for(let i=0; i<6; i++) {
        const y = Math.random() * 250;
        svg += `<circle r="1.5" fill="#33E6F0">
            <animateMotion path="M-20 ${y} L1000 ${y - 30}" dur="${6 + Math.random()*10}s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
        </circle>`;
    }

    weeks.forEach((week, x) => {
      week.contributionDays.forEach((day, y) => {
        const isoX = (x - y) * (tileW / 2) + 400;
        const isoY = (x + y) * (tileH / 2) + 100;
        const count = day.contributionCount;
        
        if (count > 0) {
            const h = count * 8;
            const isCitadel = count > 15;
            const color = isCitadel ? "#ff00ff" : "#33E6F0";
            
            svg += `
            <polygon points="${isoX-tileW/2},${isoY+tileH/2} ${isoX},${isoY+tileH} ${isoX},${isoY+tileH-h} ${isoX-tileW/2},${isoY+tileH/2-h}" fill="#0a4d5c" />
            <polygon points="${isoX+tileW/2},${isoY+tileH/2} ${isoX},${isoY+tileH} ${isoX},${isoY+tileH-h} ${isoX+tileW/2},${isoY+tileH/2-h}" fill="#0e7a8a" />
            <polygon points="${isoX},${isoY-h} ${isoX+tileW/2},${isoY+tileH/2-h} ${isoX},${isoY+tileH-h} ${isoX-tileW/2},${isoY+tileH/2-h}" fill="${color}">
                <animate attributeName="fill" values="${color};#fff;${color}" dur="${isCitadel ? '1s' : '3s'}" repeatCount="indefinite" />
            </polygon>
            ${isCitadel ? `<circle cx="${isoX}" cy="${isoY-h}" r="10" fill="${color}" opacity="0.2"><animate attributeName="r" values="8;15;8" dur="2s" repeatCount="indefinite"/></circle>` : ''}`;
        } else {
            svg += `<polygon points="${isoX},${isoY} ${isoX+tileW/2},${isoY+tileH/2} ${isoX},${isoY+tileH} ${isoX-tileW/2},${isoY+tileH/2}" fill="#161b22" opacity="0.3"/>`;
        }
      });
    });

    svg += `</svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(200).send(svg);
  } catch (e) {
    return res.status(500).send('API Error');
  }
}