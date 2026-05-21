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
}

export interface GitHubData {
  contributions: ContributionWeek[];
  totalContributions: number;
  commits: Commit[];
  syncedAt: string;
  source: "live" | "fallback";
}

const GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

const QUERY = /* GraphQL */ `
  query JonFeed($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              color
            }
          }
        }
      }
      repositories(first: 30, orderBy: { field: PUSHED_AT, direction: DESC }, ownerAffiliations: OWNER, isFork: false) {
        nodes {
          nameWithOwner
          primaryLanguage { name }
          defaultBranchRef {
            target {
              ... on Commit {
                history(first: 3, author: { id: $userId }) {
                  nodes {
                    messageHeadline
                    committedDate
                    oid
                    url
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const USER_ID_QUERY = /* GraphQL */ `
  query($login: String!) {
    user(login: $login) { id }
  }
`;

function levelFor(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count < 3) return 1;
  if (count < 6) return 2;
  if (count < 10) return 3;
  return 4;
}

async function gql<T>(token: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${token}`,
      "User-Agent": "jonneylon-site",
    },
    body: JSON.stringify({ query, variables }),
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

export async function fetchGitHubData(login: string, token: string | undefined): Promise<GitHubData> {
  if (!token) {
    return fallbackData("no-token");
  }

  try {
    const userIdData = await gql<{ user: { id: string } }>(token, USER_ID_QUERY, { login });
    const userId = userIdData.user.id;

    const data = await gql<{
      user: {
        contributionsCollection: {
          contributionCalendar: {
            totalContributions: number;
            weeks: Array<{
              contributionDays: Array<{ date: string; contributionCount: number; color: string }>;
            }>;
          };
        };
        repositories: {
          nodes: Array<{
            nameWithOwner: string;
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
      };
    }>(token, QUERY, { login, userId });

    const calendar = data.user.contributionsCollection.contributionCalendar;
    const contributions: ContributionWeek[] = calendar.weeks.map((week) => ({
      days: week.contributionDays.map((d) => ({
        date: d.date,
        count: d.contributionCount,
        level: levelFor(d.contributionCount),
      })),
    }));

    const commits: Commit[] = data.user.repositories.nodes
      .flatMap((repo) => {
        const history = repo.defaultBranchRef?.target?.history?.nodes ?? [];
        return history.map((c) => ({
          repo: repo.nameWithOwner,
          message: c.messageHeadline,
          sha: c.oid.slice(0, 7),
          url: c.url,
          date: c.committedDate,
          language: repo.primaryLanguage?.name ?? null,
        }));
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);

    return {
      contributions,
      totalContributions: calendar.totalContributions,
      commits,
      syncedAt: new Date().toISOString(),
      source: "live",
    };
  } catch (err) {
    console.error("[github] fetch failed:", err);
    return fallbackData("error");
  }
}

function fallbackData(_reason: string): GitHubData {
  const today = new Date();
  const weeks: ContributionWeek[] = Array.from({ length: 26 }, (_, w) => ({
    days: Array.from({ length: 7 }, (_, d) => {
      const date = new Date(today);
      date.setDate(date.getDate() - ((26 - w) * 7) + d);
      const count = Math.max(0, Math.round((Math.sin(w * 0.6 + d * 0.3) + 1) * 3));
      return { date: date.toISOString().slice(0, 10), count, level: levelFor(count) };
    }),
  }));
  const commits: Commit[] = [
    { repo: "jonneylon/nextwork", message: "carousel: settle motion timing, drop premature scroll trigger", sha: "a1b2c3d", url: "#", date: new Date(today.getTime() - 1000 * 60 * 90).toISOString(), language: "TypeScript" },
    { repo: "jonneylon/sona-speech", message: "telehealth: wire booking buffer override for ACC clients", sha: "e4f5g6h", url: "#", date: new Date(today.getTime() - 1000 * 60 * 60 * 5).toISOString(), language: "Astro" },
    { repo: "jonneylon/tracks", message: "rules engine: ratchet stop on confirmed breakout", sha: "i7j8k9l", url: "#", date: new Date(today.getTime() - 1000 * 60 * 60 * 18).toISOString(), language: "TypeScript" },
    { repo: "jonneylon/portfolio", message: "feat: live github feed + warm minimalist tokens", sha: "m0n1o2p", url: "#", date: new Date(today.getTime() - 1000 * 60 * 60 * 26).toISOString(), language: "Astro" },
    { repo: "jonneylon/nextwork", message: "generator: research-first thesis lands in v3", sha: "q3r4s5t", url: "#", date: new Date(today.getTime() - 1000 * 60 * 60 * 38).toISOString(), language: "TypeScript" },
  ];
  return {
    contributions: weeks,
    totalContributions: weeks.reduce((sum, w) => sum + w.days.reduce((s, d) => s + d.count, 0), 0),
    commits,
    syncedAt: new Date().toISOString(),
    source: "fallback",
  };
}
