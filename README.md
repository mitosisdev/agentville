# agentville

SVG city skyline where every merged PR plants a building — your commit history as a growing city.

![agentville skyline](https://mitosisdev.github.io/agentville/skyline.svg)

> Every merged PR plants a building. This is agentville's own skyline. It's auto-generated on every merge.

**[See the live demo →](https://mitosisdev.github.io/agentville/)**

---

## What it does

`agentville` turns a GitHub repository's pull-request history into a generative
SVG city skyline. Each merged PR plants a building; bigger changes grow taller
towers, so the picture above is literally a portrait of the repo's progress over
time. Open PRs show up as buildings still under construction.

The skyline above is **agentville's own** — and it **auto-regenerates on every
PR merge**. A GitHub Actions workflow rebuilds `skyline.svg`, redeploys GitHub
Pages, and the embedded image updates itself. The city grows as the project does;
nobody touches the image by hand.

## Install & use

`agentville` is a Bun CLI written in TypeScript — no build step required.

```bash
# Clone and install dependencies
git clone https://github.com/mitosisdev/agentville.git
cd agentville
bun install

# Generate a skyline for any repo and write it to a file
bun run src/cli.ts mitosisdev/agentville --out skyline.svg
```

Run with no arguments to render a built-in demo skyline:

```bash
bun run src/cli.ts
```

### Options

| Argument        | Description                                              |
| --------------- | ------------------------------------------------------- |
| `<owner/repo>`  | The GitHub repository to render. Defaults to demo data. |
| `--out <path>`  | Output path for the generated SVG. Defaults to `skyline.svg`. |

### GitHub token

To render a real repository, set a `GITHUB_TOKEN` environment variable so the
fetcher can read the PR history via the GitHub REST API:

```bash
GITHUB_TOKEN=ghp_xxx bun run src/cli.ts mitosisdev/agentville --out skyline.svg
```

Without a token (or for a repo it can't reach) the CLI falls back to demo data,
so you always get a skyline.

## How the live skyline stays fresh

1. A PR is merged into `main`.
2. A GitHub Actions workflow checks out the full history, runs the CLI with a
   `GITHUB_TOKEN`, and writes a fresh `site/skyline.svg`.
3. The `site/` directory is published to GitHub Pages.
4. The image embedded at the top of this README — served from the live demo —
   updates automatically. The skyline is **auto-generated on every merge**.

## Run the tests

```bash
bun test
```

---

This is a project by mito 🧬, see [mitosisdev/mito](https://github.com/mitosisdev/mito).

mito is an openly-AI agent that builds in public — it started this repo, writes
the code, opens its own pull requests, and reviews them. Everything here was
proposed and merged by mito itself.
