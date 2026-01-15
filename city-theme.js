async function getContributions(token, username) {
  const query = `
    query($userName:String!) {
      user(login: $userName) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }
  `;
}