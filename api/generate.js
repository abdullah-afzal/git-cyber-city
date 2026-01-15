export default async function handler(req, res) {
  const { username } = req.query;
  const GITHUB_TOKEN = process.env.GH_TOKEN;

  if (!username) return res.status(400).send('Username required');

  try {
    const query = JSON.stringify({
      query: `query($u:String!){user(login:$u){contributionsCollection{contributionCalendar{weeks{contributionDays{contributionCount}}}}}}`,
      variables: { u: username }
    });

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: query
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'GitHub API Error');
    }

    const weeks = data.data.user.contributionsCollection.contributionCalendar.weeks;
    
    // --- SVG GENERATION LOGIC ---
    let svg = `<svg width="900" height="450" xmlns="http://www.w3.org/2000/svg" style="background:#0d1117">`;
    
    // Birds/Spinners
    for(let i=0; i<6; i++) {
        const y = Math.random() * 250;
        svg += `<circle r="1.5" fill="#33E6F0">
            <animateMotion path="M-20 ${y} L1000 ${y - 30}" dur="${6 + Math.random()*10}s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
        </circle>`;
    }

    weeks.forEach((week, x) => {
      week.contributionDays.forEach((day, y) => {
        const isoX = (x - y) * 8 + 400;
        const isoY = (x + y) * 4 + 100;
        const count = day.contributionCount;
        if (count > 0) {
            const h = count * 8;
            const color = count > 15 ? "#ff00ff" : "#33E6F0";
            svg += `<polygon points="${isoX-8},${isoY+4} ${isoX},${isoY+8} ${isoX},${isoY+8-h} ${isoX-8},${isoY+4-h}" fill="#0a4d5c" />
                    <polygon points="${isoX+8},${isoY+4} ${isoX},${isoY+8} ${isoX},${isoY+8-h} ${isoX+8},${isoY+4-h}" fill="#0e7a8a" />
                    <polygon points="${isoX},${isoY-h} ${isoX+8},${isoY+4-h} ${isoX},${isoY+8-h} ${isoX-8},${isoY+4-h}" fill="${color}">
                        <animate attributeName="fill" values="${color};#fff;${color}" dur="2s" repeatCount="indefinite" />
                    </polygon>`;
        } else {
            svg += `<polygon points="${isoX},${isoY} ${isoX+8},${isoY+4} ${isoX},${isoY+8} ${isoX-8},${isoY+4}" fill="#161b22" opacity="0.3"/>`;
        }
      });
    });

    svg += `</svg>`;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).send(svg);

  } catch (error) {
    return res.status(500).send(`System Error: ${error.message}`);
  }
}