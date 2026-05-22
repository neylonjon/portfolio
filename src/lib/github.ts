export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionWeek {
  days: ContributionDay[];
}

export interface Commit {
  repo: string;
  message: string;
  sha: string;
  url: string;
  date: string;
  language: string | null;
  account: string;
  isPrivate: boolean;
}

export interface GitHubData {
  contributions: ContributionWeek[];
  totalContributions: number;
  commits: Commit[];
  accounts: string[];
  syncedAt: string;
  source: "live" | "fallback";
}

const GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

function userBlock(alias: string): string {
  return /* GraphQL */ `
    ${alias}: user(login: "${alias.replace(/[^a-zA-Z0-9_-]/g, "")}") {
      login
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays { date contributionCount }
          }
        }
      }
      repositories(first: 30, orderBy: { field: PUSHED_AT, direction: DESC }, ownerAffiliations: OWNER, isFork: false) {
        nodes {
          nameWithOwner
          isPrivate
          primaryLanguage { name }
          defaultBranchRef {
            target {
              ... on Commit {
                history(first: 3) {
                  nodes { messageHeadline committedDate oid url }
                }
              }
            }
          }
        }
      }
    }
  `;
}

interface RawUser {
  login: string;
  contributionsCollection: {
    contributionCalendar: {
      totalContributions: number;
      weeks: Array<{
        contributionDays: Array<{ date: string; contributionCount: number }>;
      }>;
    };
  };
  repositories: {
    nodes: Array<{
      nameWithOwner: string;
      isPrivate: boolean;
      primaryLanguage: { name: string } | null;
      defaultBranchRef: {
        target: {
          history: {
            nodes: Array<{ messageHeadline: string; committedDate: string; oid: string; url: string }>;
          };
        };
      } | null;
    }>;
  };
}

function levelFor(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count < 3) return 1;
  if (count < 6) return 2;
  if (count < 10) return 3;
  return 4;
}

async function gql<T>(token: string, query: string): Promise<T> {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${token}`,
      "User-Agent": "jonneylon-site",
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error(`GitHub GraphQL ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) {
    throw new Error(`GitHub GraphQL errors: ${json.errors.map((e) => e.message).join(", ")}`);
  }
  if (!json.data) throw new Error("GitHub GraphQL: no data");
  return json.data;
}

function mergeContributions(users: RawUser[]): { weeks: ContributionWeek[]; total: number } {
  const dayMap = new Map<string, number>();
  let total = 0;
  for (const u of users) {
    const cal = u.contributionsCollection.contributionCalendar;
    total += cal.totalContributions;
    for (const week of cal.weeks) {
      for (const d of week.contributionDays) {
        dayMap.set(d.date, (dayMap.get(d.date) ?? 0) + d.contributionCount);
      }
    }
  }
  const sortedDates = Array.from(dayMap.keys()).sort();
  const weeks: ContributionWeek[] = [];
  for (let i = 0; i < sortedDates.length; i += 7) {
    weeks.push({
      days: sortedDates.slice(i, i + 7).map((date) => {
        const count = dayMap.get(date) ?? 0;
        return { date, count, level: levelFor(count) };
      }),
    });
  }
  return { weeks, total };
}

function mergeCommits(users: RawUser[], limit = 8): Commit[] {
  const out: Commit[] = [];
  for (const u of users) {
    for (const repo of u.repositories.nodes) {
      const history = repo.defaultBranchRef?.target?.history?.nodes ?? [];
      for (const c of history) {
        out.push({
          repo: repo.nameWithOwner,
          account: u.login,
          message: c.messageHeadline,
          sha: c.oid.slice(0, 7),
          url: c.url,
          date: c.committedDate,
          isPrivate: repo.isPrivate,
          language: repo.primaryLanguage?.name ?? null,
        });
      }
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

export async function fetchGitHubData(logins: string[], token: string | undefined): Promise<GitHubData> {
  const accounts = logins.filter((l) => /^[a-zA-Z0-9_-]+$/.test(l));
  if (!token || accounts.length === 0) {
    return fallbackData(accounts);
  }

  try {
    const query = `query JonFeed {\n${accounts.map((a) => userBlock(a)).join("\n")}\n}`;
    const raw = await gql<Record<string, RawUser | null>>(token, query);
    const users = accounts.map((a) => raw[a]).filter((u): u is RawUser => u != null);
    if (users.length === 0) throw new Error("no users returned");

    const { weeks, total } = mergeContributions(users);
    const commits = mergeCommits(users);

    return {
      contributions: weeks,
      totalContributions: total,
      commits,
      accounts: users.map((u) => u.login),
      syncedAt: new Date().toISOString(),
      source: "live",
    };
  } catch (err) {
    console.error("[github] fetch failed:", err);
    return fallbackData(accounts);
  }
}

function fallbackData(accounts: string[]): GitHubData {
  // No fabricated commits. Flat grid + empty list until token is configured.
  const today = new Date();
  const weeks: ContributionWeek[] = Array.from({ length: 26 }, (_, w) => ({
    days: Array.from({ length: 7 }, (_, d) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (26 - w) * 7 + d);
      return { date: date.toISOString().slice(0, 10), count: 0, level: 0 as const };
    }),
  }));
  return {
    contributions: weeks,
    totalContributions: 0,
    commits: [],
    accounts,
    syncedAt: new Date().toISOString(),
    source: "fallback",
  };
}
