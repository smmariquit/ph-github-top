type MetricKey = "followers" | "public_contributions" | "total_contributions";
type FrameKey = "square" | "landscape" | "story";
type ThemeKey = "light" | "dark";

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

type Meta = {
  syncedAt: string;
  attribution: string;
};

const METRIC_LABELS: Record<MetricKey, string> = {
  followers: "Followers",
  public_contributions: "Public contributions",
  total_contributions: "Total contributions",
};

const state = {
  metric: "followers" as MetricKey,
  count: 10,
  frame: "square" as FrameKey,
  theme: "light" as ThemeKey,
};

const datasets = new Map<MetricKey, Dataset>();
let meta: Meta | null = null;

const leaderboardEl = document.getElementById("leaderboard")!;
const cardTitleEl = document.getElementById("card-title")!;
const cardSubtitleEl = document.getElementById("card-subtitle")!;
const cardUpdatedEl = document.getElementById("card-updated")!;
const metaNoteEl = document.getElementById("meta-note")!;
const frameShellEl = document.getElementById("frame-shell")!;
const screenshotBtn = document.getElementById("btn-screenshot-mode")!;

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-PH").format(value);
}

function readUrlState(): void {
  const params = new URLSearchParams(window.location.search);
  const metric = params.get("metric");
  const count = params.get("count");
  const frame = params.get("frame");
  const theme = params.get("theme");

  if (metric && metric in METRIC_LABELS) state.metric = metric as MetricKey;
  if (count) {
    const n = Number(count);
    if ([5, 10, 15].includes(n)) state.count = n;
  }
  if (frame === "square" || frame === "landscape" || frame === "story") {
    state.frame = frame;
  }
  if (theme === "light" || theme === "dark") state.theme = theme;
  if (params.get("shot") === "1") document.body.classList.add("screenshot-mode");
}

function writeUrlState(): void {
  const params = new URLSearchParams();
  params.set("metric", state.metric);
  params.set("count", String(state.count));
  params.set("frame", state.frame);
  params.set("theme", state.theme);
  if (document.body.classList.contains("screenshot-mode")) {
    params.set("shot", "1");
  }
  const next = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, "", next);
}

function syncControlButtons(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-metric]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.metric === state.metric);
  });
  document.querySelectorAll<HTMLButtonElement>("[data-count]").forEach((btn) => {
    btn.classList.toggle("is-active", Number(btn.dataset.count) === state.count);
  });
  document.querySelectorAll<HTMLButtonElement>("[data-frame]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.frame === state.frame);
  });
  document.querySelectorAll<HTMLButtonElement>("[data-theme]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.theme === state.theme);
  });
}

function render(): void {
  const dataset = datasets.get(state.metric);
  if (!dataset) return;

  document.documentElement.dataset.theme = state.theme;
  frameShellEl.dataset.frame = state.frame;

  cardTitleEl.textContent = dataset.title;
  cardSubtitleEl.textContent = `Top ${state.count} developers in the Philippines`;
  cardUpdatedEl.textContent = dataset.updatedAt
    ? `Data updated ${dataset.updatedAt}`
    : "Data from gayanvoice/top-github-users";

  const rows = dataset.users.slice(0, state.count);
  leaderboardEl.innerHTML = rows
    .map((user) => {
      const topClass =
        user.rank === 1
          ? "leaderboard__item--top1"
          : user.rank === 2
            ? "leaderboard__item--top2"
            : user.rank === 3
              ? "leaderboard__item--top3"
              : "";

      const valueLabel =
        state.metric === "total_contributions" && user.publicContributions != null
          ? `${formatNumber(user.value)} total · ${formatNumber(user.publicContributions)} public`
          : formatNumber(user.value);

      return `
        <li class="leaderboard__item ${topClass}">
          <span class="leaderboard__rank">${user.rank}</span>
          <img
            class="leaderboard__avatar"
            src="${user.avatar}"
            alt=""
            width="44"
            height="44"
            loading="lazy"
          />
          <div class="leaderboard__meta">
            <p class="leaderboard__name">${escapeHtml(user.name)}</p>
            <p class="leaderboard__handle">@${escapeHtml(user.username)}</p>
          </div>
          <span class="leaderboard__value" title="${METRIC_LABELS[state.metric]}">${valueLabel}</span>
        </li>
      `;
    })
    .join("");

  if (meta) {
    metaNoteEl.textContent = `${meta.attribution} Synced ${new Date(meta.syncedAt).toLocaleString()}.`;
  }

  syncControlButtons();
  frameShellEl.dataset.count = String(state.count);
  writeUrlState();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadData(): Promise<void> {
  const keys: MetricKey[] = [
    "followers",
    "public_contributions",
    "total_contributions",
  ];

  const [metaRes, ...metricRes] = await Promise.all([
    fetch("/data/meta.json"),
    ...keys.map((key) => fetch(`/data/${key}.json`)),
  ]);

  meta = (await metaRes.json()) as Meta;
  for (const [index, key] of keys.entries()) {
    datasets.set(key, (await metricRes[index]!.json()) as Dataset);
  }

  render();
}

function bindControls(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-metric]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.metric = btn.dataset.metric as MetricKey;
      render();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-count]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.count = Number(btn.dataset.count);
      render();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-frame]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.frame = btn.dataset.frame as FrameKey;
      render();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-theme]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.theme = btn.dataset.theme as ThemeKey;
      render();
    });
  });

  screenshotBtn.addEventListener("click", () => {
    document.body.classList.toggle("screenshot-mode");
    writeUrlState();
  });
}

readUrlState();
bindControls();
loadData().catch((error) => {
  metaNoteEl.textContent = `Failed to load data: ${error instanceof Error ? error.message : String(error)}`;
});
