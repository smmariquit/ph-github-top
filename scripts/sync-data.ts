/**
 * Fetches gayanvoice/top-github-users Philippines markdown and writes JSON snapshots.
 * Source: https://github.com/gayanvoice/top-github-users (CC-friendly community data)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE =
  "https://raw.githubusercontent.com/gayanvoice/top-github-users/main/markdown";

type MetricKey = "followers" | "public_contributions" | "total_contributions";

type GitHubUserRow = {
  rank: number;
  username: string;
  name: string;
  avatar: string;
  company: string | null;
  twitter: string | null;
  location: string;
  value: number;
  publicContributions?: number;
};

type Dataset = {
  metric: MetricKey;
  title: string;
  updatedAt: string | null;
  sourceUrl: string;
  users: GitHubUserRow[];
};

const METRICS: { key: MetricKey; file: string; title: string; valueLabel: string }[] =
  [
    {
      key: "followers",
      file: "followers/philippines.md",
      title: "Top by Followers",
      valueLabel: "Followers",
    },
    {
      key: "public_contributions",
      file: "public_contributions/philippines.md",
      title: "Top by Public Contributions",
      valueLabel: "Public Contributions",
    },
    {
      key: "total_contributions",
      file: "total_contributions/philippines.md",
      title: "Top by Total Contributions",
      valueLabel: "Total Contributions",
    },
  ];

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(html: string): string {
  return decodeHtml(html.replace(/<[^>]+>/g, " "));
}

function parseUpdatedAt(markdown: string): string | null {
  const match = markdown.match(/on `([^`]+)`/);
  return match?.[1] ?? null;
}

function parseTableRows(markdown: string, metric: MetricKey): GitHubUserRow[] {
  const tableMatch = markdown.match(
    /<table>\s*<tr>\s*<th>#<\/th>[\s\S]*?<\/table>/,
  );
  if (!tableMatch) return [];

  const rows = [...tableMatch[0].matchAll(/<tr>\s*([\s\S]*?)<\/tr>/g)].slice(1);
  const users: GitHubUserRow[] = [];

  for (const row of rows) {
    const cells = [...row[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map((c) => c[1]);
    if (cells.length < 6) continue;

    const rank = Number(stripTags(cells[0]!));
    if (!Number.isFinite(rank)) continue;

    const nameCell = cells[1]!;
    const profileMatch = nameCell.match(/href="https:\/\/github\.com\/([^"]+)"/);
    const avatarMatch = nameCell.match(/src="([^"]+)"/);
    const username = profileMatch?.[1] ?? "";
    if (!username) continue;

    const avatar = avatarMatch?.[1]?.replace(/&amp;/g, "&") ?? "";
    const nameParts = nameCell.split(/<br\s*\/?>/i);
    const displayName = stripTags(nameParts[1] ?? nameParts[0] ?? username);

    const companyRaw = stripTags(cells[2]!);
    const company =
      companyRaw && !/^no company$/i.test(companyRaw) ? companyRaw : null;

    const twitterCell = cells[3]!;
    const twitterMatch = twitterCell.match(/twitter\.com\/([^"<]+)/);
    const twitterRaw = stripTags(twitterCell);
    const twitter =
      twitterMatch?.[1] ??
      (twitterRaw && !/^no twitter username$/i.test(twitterRaw)
        ? twitterRaw.replace(/^@/, "")
        : null);

    const location = stripTags(cells[4]!);

    if (metric === "total_contributions" && cells.length >= 7) {
      const publicContributions = Number(stripTags(cells[5]!));
      const total = Number(stripTags(cells[6]!));
      users.push({
        rank,
        username,
        name: displayName,
        avatar,
        company,
        twitter,
        location,
        value: total,
        publicContributions: Number.isFinite(publicContributions)
          ? publicContributions
          : undefined,
      });
      continue;
    }

    const value = Number(stripTags(cells[5]!));
    users.push({
      rank,
      username,
      name: displayName,
      avatar,
      company,
      twitter,
      location,
      value: Number.isFinite(value) ? value : 0,
    });
  }

  return users;
}

async function fetchMetric(metric: (typeof METRICS)[number]): Promise<Dataset> {
  const url = `${BASE}/${metric.file}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const markdown = await res.text();

  return {
    metric: metric.key,
    title: metric.title,
    updatedAt: parseUpdatedAt(markdown),
    sourceUrl: `https://github.com/gayanvoice/top-github-users/blob/main/markdown/${metric.file}`,
    users: parseTableRows(markdown, metric.key),
  };
}

const outDir = resolve(import.meta.dir, "../public/data");
mkdirSync(outDir, { recursive: true });

for (const metric of METRICS) {
  const dataset = await fetchMetric(metric);
  const path = resolve(outDir, `${metric.key}.json`);
  writeFileSync(path, `${JSON.stringify(dataset, null, 2)}\n`);
  console.log(`Wrote ${path} (${dataset.users.length} users)`);
}

writeFileSync(
  resolve(outDir, "meta.json"),
  `${JSON.stringify(
    {
      syncedAt: new Date().toISOString(),
      attribution:
        "Rankings from gayanvoice/top-github-users (Philippines location filter).",
    },
    null,
    2,
  )}\n`,
);

console.log("Done.");
