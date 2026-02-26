# EV BMS Blog Hosting (GitHub Pages)

This repo is configured to deploy a Markdown blog to GitHub Pages from `codex_blog/`.

## What was added

- `mkdocs.yml`: site configuration and sidebar navigation.
- `codex_blog/index.md`: homepage topic index.
- `.github/workflows/deploy.yml`: auto-deploy on pushes to `main`.

## One-time GitHub setup

1. Push this repo to GitHub.
2. Open repository `Settings` -> `Pages`.
3. Under `Build and deployment`, set `Source` to `GitHub Actions`.
4. Commit/push to `main`.
5. Wait for the `Deploy GitHub Pages` workflow to complete.

Your site URL will be:

- `https://<username>.github.io/<repo>/`

## Content workflow

- Write or edit posts inside `codex_blog/`.
- Push to `main`.
- GitHub Actions rebuilds and republishes automatically.

## Media

- Put diagrams/images/HTML animations in `codex_blog/assets/`.
- Use relative links inside Markdown, for example:
  - `![Diagram](assets/example.svg)`
  - `[Animation](assets/cooling-flow.html)`

## Notes

- Update `site_url`, `repo_url`, and `repo_name` in `mkdocs.yml` after creating the GitHub repository.
- If your default branch is `master`, update `.github/workflows/deploy.yml` accordingly.
