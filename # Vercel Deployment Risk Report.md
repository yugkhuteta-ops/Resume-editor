# Vercel Deployment Risk Report

**Project:** `resume-editor`  
**Path:** `C:\Users\Lenovo\Documents\resume-editor`  
**Report time:** 2026-06-13 13:05 IST  
**Framework detected:** Vite + React + TypeScript  
**Deployment type:** Static frontend SPA  
**Vercel output directory:** `dist`

---

## Executive Summary

The project is generally deployable to Vercel as a static Vite application. The production build command works:

```bash
npm run build
```

Main deployment/CI risks to address:

1. **Node.js version risk** — modern dependencies require Node.js `20.19+` or `22.12+`.
2. **Lint failure** — `npm run lint` fails with multiple TypeScript/React lint errors.
3. **Root directory risk** — the repo contains a nested project; Vercel root directory must be correct.
4. **Local install issue** — `npm ci` failed locally (Windows file-lock/permission issue).
5. **OpenAI client-side key usage** — runtime/security risk (not a build failure).
6. **No explicit Vercel configuration** — optional but explicit settings are safer.

---

## Validation Results

### Build

Command:

```bash
npm run build
```

Result: **Passed**

Build command used:

```json
"build": "tsc -b && vite build"
```

Output produced:

```text
dist/index.html
dist/assets/index-DgW30v_c.css
dist/assets/index-DFQQjZvm.js
```

Conclusion: The Vite production build works locally.

### Lint

Command:

```bash
npm run lint
```

Result: **Failed**

Summary:

```text
28 errors
1 warning
```

Conclusion: Deploy should still succeed if Vercel runs only `npm run build`, but deployment will fail if lint is added to CI/build.

### Dependency lock validation

Command:

```bash
npm install --package-lock-only --ignore-scripts --dry-run
```

Result: **Passed**

Conclusion: `package-lock.json` appears valid.

### Clean install check

Command attempted:

```bash
npm ci
```

Result: **Failed locally**

Error:

```text
EPERM: operation not permitted, unlink
node_modules/lightningcss-win32-x64-msvc/lightningcss.win32-x64-msvc.node
```

Likely cause: local Windows file lock / antivirus / editor process / stale `node_modules`.

Conclusion: Probably not Vercel-specific (Linux clean install), but verify locally.

---

## Deployment Risks

### 1. Node.js Version Risk

**Severity:** High

Relevant installed packages:

```text
vite@8.0.16
@vitejs/plugin-react@6.0.2
eslint@10.5.0
```

They require newer Node.js versions, including:

```text
node ^20.19.0 || >=22.12.0
```

Risk: Vercel may select an older Node version.

Resolution: add to `package.json`:

```json
"engines": {
  "node": ">=20.19.0"
}
```

Recommended Vercel setting: **Node.js 22.x**.

---

### 2. Lint Script Failure

**Severity:** High (if lint is used in deployment/CI)

Current lint command:

```json
"lint": "eslint ."
```

Risk: CI/build may fail if lint is added to build command.

Resolution:
- Option A: keep Vercel build as `npm run build` (do not run lint).
- Option B (only after fixing lint):

```json
"build": "npm run lint && tsc -b && vite build"
```

---

### 3. Vercel Root Directory Risk

**Severity:** Medium

Repo contains a nested project:

```text
resume-editor/astronautical-axis/
```

Risk: Vercel could deploy the wrong project if root directory is misconfigured.

Resolution: set **Root Directory** to:

```text
resume-editor
```

---

### 4. Build Command and Output Directory

**Severity:** Medium

Current build script:

```json
"build": "tsc -b && vite build"
```

Vite outputs to: `dist`

Resolution: configure Vercel:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm ci
```

---

### 5. Local Clean Install Failure

**Severity:** Medium (local)

Risk: Windows file locks can break `npm ci` locally; might not reproduce on Vercel.

Resolution: before deployment, validate clean install:

```powershell
Remove-Item -Recurse -Force node_modules
npm ci
npm run build
```

---

### 6. Environment Variables / Client Secrets

**Severity:** Low for deployment, medium for runtime/security

No `process.env` / `import.meta.env` / `VITE_` usage detected.

AI feature uses an OpenAI API key entered in the browser and stored in `localStorage`.

Risk: API key exposure to the browser.

Resolution (if you need secure keys): move OpenAI calls to a serverless function and store `OPENAI_API_KEY` in Vercel env vars.

---

### 7. Serverless Function Constraints

**Severity:** Low

No serverless functions currently.

---

### 8. Browser-Only APIs

**Severity:** Low

Uses browser-only APIs (`localStorage`, `indexedDB`, `window`, etc.). Not a deployment risk for a static Vite app.

---

### 9. Tailwind v4 Configuration

**Severity:** Low

Build succeeds; keep custom theme values in `src/index.css`.

---

## 10. Google Drive Integration (New Feature)

**Severity:** Medium

Overview:

- Sign in with Google (OAuth / GIS popup)
- Autosave to Drive (debounced)
- Manual sync
- Scope: `drive.file`

Risks:

1. Missing credentials: requires `VITE_GOOGLE_CLIENT_ID`.
2. Client-side token storage in `sessionStorage` (XSS risk).
3. Token expiry handling.
4. Browser privacy restrictions on GIS popup.
5. Google Drive API quotas.

Resolution:

- Verify GIS script load.
- Ensure `VITE_GOOGLE_CLIENT_ID` is configured in Vercel if Drive is used in production.

---

## Recommended Vercel Configuration

```text
Framework Preset: Vite
Root Directory: resume-editor
Install Command: npm ci
Build Command: npm run build
Output Directory: dist
Node.js Version: 22.x
```

Add to `package.json`:

```json
"engines": {
  "node": ">=20.19.0"
}
```

Optional `vercel.json`:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

