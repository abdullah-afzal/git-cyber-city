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
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: query
    });

    const data = await response.json();
    const weeks = data.data.user.contributionsCollection.contributionCalendar.weeks;

    // --- TIME OF DAY LOGIC ---
    const hour = new Date().getUTCHours() + 5; // Adjust '+5' to your target offset
    const isNight = hour < 6 || hour > 18;
    const theme = {
      primary: isNight ? "#ff00ff" : "#33E6F0",   // Synth-Purple vs Cyber-Blue
      secondary: isNight ? "#7000ff" : "#00d2ff",
      floor: isNight ? "#1a0033" : "#161b22"
    };

    let svg = `<svg width="900" height="450" xmlns="http://www.w3.org/2000/svg" style="background:#0d1117">
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>`;

    // 🕊️ ANIMATION: Data Packets (Traffic)
    for(let i=0; i<12; i++) {
        const x = Math.random() * 900;
        svg += `<rect width="1.5" height="1.5" fill="${theme.primary}" filter="url(#glow)">
            <animateMotion path="M${x} 0 L${x + 200} 450" dur="${2+Math.random()*4}s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" />
        </rect>`;
    }

    weeks.forEach((week, x) => {
      week.contributionDays.forEach((day, y) => {
        const isoX = (x - y) * 8 + 400;
        const isoY = (x + y) * 4 + 100;
        const count = day.contributionCount;
        const delay = Math.random() * 3;

        if (count > 0) {
            const h = count * 8;
            const color = count > 15 ? "#ffffff" : theme.primary;
            svg += `
                <polygon points="${isoX-8},${isoY+4} ${isoX},${isoY+8} ${isoX},${isoY+8-h} ${isoX-8},${isoY+4-h}" fill="${theme.secondary}" opacity="0.8" />
                <polygon points="${isoX+8},${isoY+4} ${isoX},${isoY+8} ${isoX},${isoY+8-h} ${isoX+8},${isoY+4-h}" fill="${theme.secondary}" />
                <polygon points="${isoX},${isoY-h} ${isoX+8},${isoY+4-h} ${isoX},${isoY+8-h} ${isoX-8},${isoY+4-h}" fill="${color}" filter="url(#glow)">
                    <animate attributeName="fill" values="${color};${theme.primary};${color}" dur="3s" begin="${delay}s" repeatCount="indefinite" />
                </polygon>`;
        } else {
            svg += `<polygon points="${isoX},${isoY} ${isoX+8},${isoY+4} ${isoX},${isoY+8} ${isoX-8},${isoY+4}" fill="${theme.floor}" opacity="0.4"/>`;
        }
      });
    });

    svg += `</svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(200).send(svg);
  } catch (e) { return res.status(500).send('API Error'); }
}