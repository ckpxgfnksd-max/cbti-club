# Deploying cbti.club

The live site at **cbti.club** is a Cloudflare Pages **Direct Upload** project
(account `5f89e8e2576e2ebef44f1ee8b1fb2511`, project `cbti-club`). Cloudflare
does not let a Direct-Upload project be converted to a Git-integrated project
after the fact, so auto-deploy is wired from the GitHub side instead.

## How auto-deploy works

On every push to `main`, `.github/workflows/deploy.yml` runs
`wrangler pages deploy .` using the `cloudflare/wrangler-action`. Cloudflare
accepts the upload as a new `production` deployment and promotes it to
cbti.club immediately.

## One-time setup

Two GitHub Actions secrets need to exist on the `cbti-club` repo (Settings →
Secrets and variables → Actions → New repository secret):

1. **`CLOUDFLARE_ACCOUNT_ID`** = `5f89e8e2576e2ebef44f1ee8b1fb2511`
2. **`CLOUDFLARE_API_TOKEN`** = a token created at
   https://dash.cloudflare.com/profile/api-tokens with these permissions:
   - Account → Cloudflare Pages → **Edit**
   - Account resource: `Chase.wang2022@gmail.com's Account`

That's it. Once both secrets are set, pushing to `main` auto-deploys.

## Manual deploys (still possible anytime)

```bash
cd "path/to/crypto-personality-test"
npx wrangler pages deploy . \
  --project-name=cbti-club \
  --branch=main \
  --commit-dirty=true
```

Uses your cached `wrangler login` OAuth.

## The other GitHub repo

There are two mirror repos with near-identical content:

- `github.com/ckpxgfnksd-max/cbti-club`  — primary (this one; Actions live here)
- `github.com/ckpxgfnksd-max/cbti.club`  — legacy mirror (safe to archive)

Once auto-deploy is confirmed working, the `cbti.club` repo can be archived.
