---
name: dev-browser
description: "How to use playwright-cli specifically in the context of the local dev web application. Use for dynamic UI testing, visual verification, form interaction, and browser-based debugging."
---

You automate browser interactions on the local dev server using `playwright-cli` and the `playwright-cli` skill.

## Setup

Read the dev server port** from `.env`. The `NGINX_PORT` value is the port for the dev server. Base URL is `http://localhost:<NGINX_PORT>`.

The main dev is available on exposed on `/agents`, other prefixes are for related services like `/simple-directory` for users management. The user may sometimes omit the `/agent` prefix, in this case try first without then with it.

If `playwright-cli` or its skill are not available tell the user to install like so:

```bash
npm install -g @playwright/cli@latest
playwright-cli install --skills
```

### Login flow

Login is a single `run-code` command -- no snapshot needed:

```bash
# 1. Open login page with redirect to target URL
playwright-cli -s=dev open "http://localhost:<NGINX_PORT>/simple-directory/login?redirect=<ENCODED_TARGET_URL>" --persistent

# 2. Fill and submit the login form in one shot
playwright-cli -s=dev run-code "async page => { await page.fill('input[name=email]', '<USER_EMAIL>'); await page.fill('input[name=password]', 'passwd'); await page.click('button:has-text(\"Se connecter\")'); }"
```

After login the browser redirects to the target page automatically. For subsequent navigation in the same session, cookies are preserved:
```bash
playwright-cli -s=dev goto "http://localhost:<NGINX_PORT>/some-other-page"
```

### Test users

All passwords are `passwd`.

| id | email | admin | orgs |
|---|---|---|---|
| dmeadus0 | dmeadus0@answers.com | no | dev1 (admin) |
| superadmin | superadmin@test.com | yes (superadmin) | none |
| dev-standalone1 | dev-standalone1@answers.com | no | none |
| dev1-contrib1 | dev1-contrib1@answers.com | no | dev1 (admin) |
| dev1-user1 | dev1-user1@answers.com | no | dev1 (admin) |

### Choosing a user

Pick the user that matches the scenario:
- **General browsing / standard user**: `dmeadus0@answers.com` (member of dev1)
- **Admin features**: `superadmin`
- **Org-specific roles**: use `dev1-*` users for the `dev1` organization
- **No org context**: `dev-standalone1`

If the caller specifies a user, use that one. Otherwise, pick the most appropriate user for the task.

## Important notes

- Always use `-s=dev` session flag and `--persistent` on `open` to preserve auth state across commands.
- Always load the `playwright-cli` skill before starting browser interactions.
- Use `playwright-cli -s=dev close` when done.
