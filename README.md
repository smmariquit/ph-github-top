# ph-github-top

Screenshot-friendly leaderboard of top GitHub developers in the **Philippines**.

Data is synced from [gayanvoice/top-github-users](https://github.com/gayanvoice/top-github-users) (Philippines location filter). This project renders clean cards you can capture for posts, slides, or stories: no scrolling through giant markdown tables.

## Live

After deploy: GitHub Pages at `https://smmariquit.github.io/ph-github-top/`

## Quick start

```sh
bun install
bun run sync   # fetch latest PH rankings
bun run dev    # http://localhost:5174
bun run build
bun run preview
```

## Screenshot workflow

1. Pick **metric** (followers, public contributions, total).
2. Choose **rows** (5 / 10 / 15) and **frame** (1:1, 16:9, 9:16).
3. Click **Screenshot mode** to hide controls.
4. Capture the card (browser screenshot, OS snip, or share URL).

Shareable URL example:

```
?metric=followers&count=10&frame=square&theme=dark&shot=1
```

## Data refresh

```sh
bun run sync
```

A weekly GitHub Action also refreshes `data/*.json` on the default branch.

## Attribution

Rankings © community data via [gayanvoice/top-github-users](https://github.com/gayanvoice/top-github-users). Not affiliated with GitHub, Inc.

## License

MIT
