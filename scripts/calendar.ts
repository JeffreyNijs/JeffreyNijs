// The last year of contributions from GitHub's GraphQL API, shared by the
// generated cards. Needs GITHUB_TOKEN (the workflow token is enough).
export type Level = 'NONE' | 'FIRST_QUARTILE' | 'SECOND_QUARTILE' | 'THIRD_QUARTILE' | 'FOURTH_QUARTILE';
export type Day = { date: string; contributionCount: number; contributionLevel: Level; weekday: number };
export type Calendar = { total: number; restricted: number; weeks: Day[][]; days: Day[] };

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const fmt = (n: number) => n.toLocaleString('en-US');
export const dayLabel = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};

export async function fetchCalendar(): Promise<Calendar> {
  const login = process.env.PROFILE_USER ?? process.env.GITHUB_REPOSITORY_OWNER ?? 'JeffreyNijs';
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required');

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query($login: String!) { user(login: $login) { contributionsCollection {
        restrictedContributionsCount
        contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel weekday } } }
      } } }`,
      variables: { login },
    }),
  });
  const json: any = await res.json();
  if (!res.ok || json.errors) throw new Error(`GitHub API: ${JSON.stringify(json.errors ?? json)}`);

  const collection = json.data.user.contributionsCollection;
  const weeks: Day[][] = collection.contributionCalendar.weeks.map((w: any) => w.contributionDays);
  return {
    total: collection.contributionCalendar.totalContributions,
    restricted: collection.restrictedContributionsCount,
    weeks,
    days: weeks.flat(),
  };
}
