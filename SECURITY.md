# Security Policy

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, use GitHub's private vulnerability reporting for this repository:
[Security → Report a vulnerability](https://github.com/MorGamer1/QRCODE-GEN/security/advisories/new).
This opens a private discussion visible only to you and the maintainers until a fix is ready.

Please include:

- The affected version/commit
- Steps to reproduce, or a proof of concept
- The potential impact as you understand it

There's no fixed SLA, but reports are triaged as soon as they're seen, and you'll get an
acknowledgment before a fix is scoped.

## Supported versions

This project doesn't yet maintain multiple release branches - security fixes land on `main` and
the most recently tagged release. Self-hosters should track `main` or the latest tag rather than
pinning to an old one indefinitely.

## Scope

In scope: the application code in this repository (`apps/`, `packages/`) and the deployment
artifacts it ships (`Dockerfile`s, `docker-compose.yml`, the bundled nginx config). Out of scope:
vulnerabilities in third-party dependencies with no exploitable path through this application's
own code (report those upstream instead) and issues arising purely from a self-hoster's own
deployment choices that deviate from the documented defaults (e.g., disabling TLS, exposing a
service the default setup keeps internal).

## Notes for self-hosters

A few defaults worth knowing about rather than discovering the hard way:

- The three `*_SECRET` values in `.env` (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
  `COOKIE_SECRET`) must each be unique, 32+ character, unpredictable values - the app refuses to
  start otherwise, but nothing stops you from setting all three to the same string, which you
  shouldn't do.
- Uploaded QR assets (logos, "Image" content-type files) are served as **publicly readable**
  URLs by design (see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#security-relevant-design-decisions))
  - don't rely on their URL being unguessable as an access control mechanism, and don't upload
    anything through this feature that isn't meant to be publicly visible.
  - Only `GET` is public; uploading/deleting still requires the real object-storage credentials.
- Redirect-gate passwords on individual QR codes protect the redirect/landing page, not the QR
  code's _existence_ - a short code is enumerable-ish by brute force in principle, same as any
  short-URL service (see `RATE_LIMIT` in `packages/shared/src/constants.ts` for the redirect
  endpoint's rate limit, which is the actual mitigation).
