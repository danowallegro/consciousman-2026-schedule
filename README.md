# Conscious Man 2026 Schedule

Static offline-first schedule page for GitHub Pages.

## Deploy To GitHub Pages

```bash
gh auth login -h github.com
cd /Users/daniel.nowak/Documents/Codex/2026-06-30/on/outputs/consciousman-schedule
git init
git add .
git commit -m "Publish Conscious Man 2026 schedule"
git branch -M main
gh repo create consciousman-2026-schedule --public --source=. --remote=origin --push
gh api "repos/{owner}/{repo}/pages" -X POST -F "source[branch]=main" -F "source[path]=/"
```

The page saves its offline package automatically after the first load from GitHub Pages. Open the live page once before the event so the browser can cache the schedule, map, logo, and app shell.
