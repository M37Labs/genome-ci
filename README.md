# M37 Delivery Protocol

An interactive, scroll-driven walkthrough of how a change travels from a laptop to production at M37 Labs: branching rules, blocking gates, AI review agents, one sealed build, and three rollout modes.

**Live:** https://m37labs.github.io/genome-ci/

## What it covers

- **Genome**: the GitFlow branching model (`main`, `develop`, `feature/*`, `release/*`, `hotfix/*`, `side/*`), where each branch may merge and how long it may live.
- **The pipeline stages (M37-01 to M37-09)**: your machine, pull request, agent review, review and merge, build, seal, artifact store, staging and release.
- **Principles**: build once and promote the same artifact, gates decide while agents advise, no stored keys, and every outcome explained.

## Structure

```
index.html               page markup and content
styles.css               styles
app.js                   scroll and animation logic
vendor/anime.umd.min.js  Anime.js (vendored)
.nojekyll                serve files as-is on GitHub Pages
```

It's a static site with no build step.

## Run locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

GitHub Pages serves the `main` branch root. Pushing to `main` publishes the site.
