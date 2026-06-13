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

However, there are several deployment and CI risks that should be addressed before production deployment:

1. **Node.js version risk** — modern dependencies require Node.js `20.19+` or `22.12+`.
2. **Lint failure** — `npm run lint` fails with multiple TypeScript/React lint errors.
3. **Root directory risk** — the folder contains a nested project, so Vercel root directory must be set correctly.
4. **Local install issue** — `npm ci` failed locally due to a Windows file-lock/permission issue.
5. **OpenAI client-side key usage** — not a build failure, but a runtime/security risk.
6. **No explicit Vercel configuration** — Vercel should auto-detect Vite, but explicit settings are safer.

---

## Validation Results

### Build

Command run:

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

---

### Lint

Command run:

```bash
npm run lint
```

Result: **Failed**

Summary:

```text
28 errors
1 warning
```

Conclusion: The app can still deploy if Vercel only runs `npm run build`, but deployment will fail if lint is added to the build command or CI pipeline.

---

### Dependency lock validation

Command run:

```bash
npm install --package-lock-only --ignore-scripts --dry-run
```

Result: **Passed**

Conclusion: The `package-lock.json` appears valid.

---

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

Likely cause: local Windows file lock, antivirus, editor process, or stale `node_modules`.

Conclusion: This is likely not a Vercel-specific issue because Vercel runs on Linux and performs a clean install. However, it should be verified locally before relying on deployment.

---

## Deployment Risks

## 1. Node.js Version Risk

**Severity:** High

The project uses recent versions of Vite, React tooling, and ESLint.

Relevant installed packages:

```text
vite@8.0.16
@vitejs/plugin-react@6.0.2
eslint@10.5.0
```

These packages require newer Node.js versions, including:

```text
node ^20.19.0 || >=22.12.0
```

The project does **not** currently define an `engines` field in `package.json`.

### Risk

Vercel may select a Node.js version that is too old, causing install or build failure.

### Resolution

Add this to `package.json`:

```json
"engines": {
  "node": ">=20.19.0"
}
```

Recommended Vercel setting:

```text
Node.js Version: 22.x
```

Minimum acceptable:

```text
Node.js Version: 20.19.x or newer
```

---

## 2. Lint Script Failure

**Severity:** High if lint is used in deployment/CI

Current lint command:

```json
"lint": "eslint ."
```

`npm run lint` fails.

### Main failing files

#### `src/App.tsx`

Issues:

- `undo` is accessed before declaration.
- `redo` is accessed before declaration.
- Ref values are accessed during render:
  - `undoStackRef.current`
  - `redoStackRef.current`
- React Compiler lint errors related to manual memoization.

#### `src/hooks/useStorage.ts`

Issues:

- `loadAll` is accessed before declaration.
- `persistResume` is accessed before declaration.
- Missing dependency warning for `persistResume`.

#### `src/components/VersionHistory.tsx`

Issues:

- Several variables should be declared with `const`.

#### Section components

Affected files:

```text
AchievementsSection.tsx
ContactSection.tsx
EducationSection.tsx
ExperienceSection.tsx
ProjectsSection.tsx
SkillsSection.tsx
SummarySection.tsx
```

Issue:

- Multiple uses of `any`.

### Resolution

Either fix the lint errors or do not include lint in the Vercel build command.

If adding lint to deployment, change the build command to:

```json
"build": "npm run lint && tsc -b && vite build"
```

But this should only be done after fixing the lint errors.

---

## 3. Vercel Root Directory Risk

**Severity:** Medium

The inspected folder contains a nested project:

```text
resume-editor/astronautical-axis/
```

That nested project appears to be an Astro app.

### Risk

If the parent repository is connected to Vercel and the root directory is not configured correctly, Vercel may attempt to deploy the wrong project.

### Resolution

In Vercel, set the root directory to:

```text
resume-editor
```

Do not deploy from the parent directory unless intentionally configuring a monorepo.

---

## 4. Build Command and Output Directory

**Severity:** Medium

Current build script:

```json
"build": "tsc -b && vite build"
```

This is valid.

Vite outputs to:

```text
dist
```

### Risk

If Vercel does not auto-detect the framework correctly, deployment may fail or serve the wrong directory.

### Resolution

Use these Vercel settings:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm ci
```

Optional explicit `vercel.json`:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

---

## 5. Local Clean Install Failure

**Severity:** Medium/local

`npm ci` failed locally with:

```text
EPERM: operation not permitted, unlink
node_modules/lightningcss-win32-x64-msvc/lightningcss.win32-x64-msvc.node
```

### Risk

This could indicate local `node_modules` corruption or a locked file. It may not reproduce on Vercel because Vercel uses a clean Linux environment.

### Resolution

Before deployment, verify clean install locally.

On Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules
npm ci
npm run build
```

If the same error appears:

1. Close editors/terminals using the project.
2. Restart the machine if necessary.
3. Retry `npm ci`.
4. Check antivirus/security software locking `.node` files.

---

## 6. Environment Variables

**Severity:** Low for deployment, medium for runtime/security

No environment variables are currently used in the frontend code.

Search found no usage of:

```ts
process.env
import.meta.env
VITE_
```

The AI feature uses an OpenAI API key entered by the user in the browser and stored in `localStorage`.

### Risk

This is not required for Vercel deployment, but it has runtime and security implications:

- API keys are exposed to the browser.
- Keys are stored in `localStorage`.
- Browser calls to OpenAI may be affected by CORS.
- This is not ideal for production usage with paid API keys.

### Resolution

If the app is intentionally local-first, document that users provide their own OpenAI key.

If OpenAI should be hosted securely, move the API call to a Vercel serverless function and store the key as:

```text
OPENAI_API_KEY
```

Then call your own API route from the frontend.

---

## 7. Serverless Function Constraints

**Severity:** Low

The project currently has no serverless functions.

No directories found:

```text
api/
functions/
middleware
```

### Risk

None for current deployment.

### Resolution

No action required.

If serverless functions are added later:

- Keep functions small.
- Avoid long-running operations.
- Avoid local filesystem persistence.
- Store secrets in Vercel Environment Variables.
- Keep dependencies minimal.

---

## 8. Browser-Only APIs

**Severity:** Low

The app uses browser-only APIs:

```ts
localStorage
sessionStorage
indexedDB
window
document
crypto.randomUUID
```

These are used inside browser-side code and effects.

### Risk

No deployment risk for a Vite static app.

Potential risk only if SSR/server rendering is added later.

### Resolution

No action required.

If SSR is added later, guard browser-only APIs:

```ts
if (typeof window !== 'undefined') {
  // browser-only code
}
```

---

## 9. Tailwind v4 Configuration

**Severity:** Low

The project uses Tailwind v4 with:

```css
@import "tailwindcss";
```

It also has a legacy-style:

```text
tailwind.config.js
```

### Risk

The current build succeeds, so this is not blocking deployment.

Future theme changes should prefer Tailwind v4 CSS-first configuration in `src/index.css` using `@theme`.

### Resolution

Keep custom theme values in:

```text
src/index.css
```

Example already present:

```css
@theme {
  --color-primary-500: #4361ee;
  --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

---

## Recommended Vercel Configuration

Use the following settings:

```text
Framework Preset: Vite# Vercel Deployment Risk Report

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

However, there are several deployment and CI risks that should be addressed before production deployment:

1. **Node.js version risk** — modern dependencies require Node.js `20.19+` or `22.12+`.
2. **Lint failure** — `npm run lint` fails with multiple TypeScript/React lint errors.
3. **Root directory risk** — the folder contains a nested project, so Vercel root directory must be set correctly.
4. **Local install issue** — `npm ci` failed locally due to a Windows file-lock/permission issue.
5. **OpenAI client-side key usage** — not a build failure, but a runtime/security risk.
6. **No explicit Vercel configuration** — Vercel should auto-detect Vite, but explicit settings are safer.

---

## Validation Results

### Build

Command run:

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

---

### Lint

Command run:

```bash
npm run lint
```

Result: **Failed**

Summary:

```text
28 errors
1 warning
```

Conclusion: The app can still deploy if Vercel only runs `npm run build`, but deployment will fail if lint is added to the build command or CI pipeline.

---

### Dependency lock validation

Command run:

```bash
npm install --package-lock-only --ignore-scripts --dry-run
```

Result: **Passed**

Conclusion: The `package-lock.json` appears valid.

---

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

Likely cause: local Windows file lock, antivirus, editor process, or stale `node_modules`.

Conclusion: This is likely not a Vercel-specific issue because Vercel runs on Linux and performs a clean install. However, it should be verified locally before relying on deployment.

---

## Deployment Risks

## 1. Node.js Version Risk

**Severity:** High

The project uses recent versions of Vite, React tooling, and ESLint.

Relevant installed packages:

```text
vite@8.0.16
@vitejs/plugin-react@6.0.2
eslint@10.5.0
```

These packages require newer Node.js versions, including:

```text
node ^20.19.0 || >=22.12.0
```

The project does **not** currently define an `engines` field in `package.json`.

### Risk

Vercel may select a Node.js version that is too old, causing install or build failure.

### Resolution

Add this to `package.json`:

```json
"engines": {
  "node": ">=20.19.0"
}
```

Recommended Vercel setting:

```text
Node.js Version: 22.x
```

Minimum acceptable:

```text
Node.js Version: 20.19.x or newer
```

---

## 2. Lint Script Failure

**Severity:** High if lint is used in deployment/CI

Current lint command:

```json
"lint": "eslint ."
```

`npm run lint` fails.

### Main failing files

#### `src/App.tsx`

Issues:

- `undo` is accessed before declaration.
- `redo` is accessed before declaration.
- Ref values are accessed during render:
  - `undoStackRef.current`
  - `redoStackRef.current`
- React Compiler lint errors related to manual memoization.

#### `src/hooks/useStorage.ts`

Issues:

- `loadAll` is accessed before declaration.
- `persistResume` is accessed before declaration.
- Missing dependency warning for `persistResume`.

#### `src/components/VersionHistory.tsx`

Issues:

- Several variables should be declared with `const`.

#### Section components

Affected files:

```text
AchievementsSection.tsx
ContactSection.tsx
EducationSection.tsx
ExperienceSection.tsx
ProjectsSection.tsx
SkillsSection.tsx
SummarySection.tsx
```

Issue:

- Multiple uses of `any`.

### Resolution

Either fix the lint errors or do not include lint in the Vercel build command.

If adding lint to deployment, change the build command to:

```json
"build": "npm run lint && tsc -b && vite build"
```

But this should only be done after fixing the lint errors.

---

## 3. Vercel Root Directory Risk

**Severity:** Medium

The inspected folder contains a nested project:

```text
resume-editor/astronautical-axis/
```

That nested project appears to be an Astro app.

### Risk

If the parent repository is connected to Vercel and the root directory is not configured correctly, Vercel may attempt to deploy the wrong project.

### Resolution

In Vercel, set the root directory to:

```text
resume-editor
```

Do not deploy from the parent directory unless intentionally configuring a monorepo.

---

## 4. Build Command and Output Directory

**Severity:** Medium

Current build script:

```json
"build": "tsc -b && vite build"
```

This is valid.

Vite outputs to:

```text
dist
```

### Risk

If Vercel does not auto-detect the framework correctly, deployment may fail or serve the wrong directory.

### Resolution

Use these Vercel settings:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm ci
```

Optional explicit `vercel.json`:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

---

## 5. Local Clean Install Failure

**Severity:** Medium/local

`npm ci` failed locally with:

```text
EPERM: operation not permitted, unlink
node_modules/lightningcss-win32-x64-msvc/lightningcss.win32-x64-msvc.node
```

### Risk

This could indicate local `node_modules` corruption or a locked file. It may not reproduce on Vercel because Vercel uses a clean Linux environment.

### Resolution

Before deployment, verify clean install locally.

On Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules
npm ci
npm run build
```

If the same error appears:

1. Close editors/terminals using the project.
2. Restart the machine if necessary.
3. Retry `npm ci`.
4. Check antivirus/security software locking `.node` files.

---

## 6. Environment Variables

**Severity:** Low for deployment, medium for runtime/security

No environment variables are currently used in the frontend code.

Search found no usage of:

```ts
process.env
import.meta.env
VITE_
```

The AI feature uses an OpenAI API key entered by the user in the browser and stored in `localStorage`.

### Risk

This is not required for Vercel deployment, but it has runtime and security implications:

- API keys are exposed to the browser.
- Keys are stored in `localStorage`.
- Browser calls to OpenAI may be affected by CORS.
- This is not ideal for production usage with paid API keys.

### Resolution

If the app is intentionally local-first, document that users provide their own OpenAI key.

If OpenAI should be hosted securely, move the API call to a Vercel serverless function and store the key as:

```text
OPENAI_API_KEY
```

Then call your own API route from the frontend.

---

## 7. Serverless Function Constraints

**Severity:** Low

The project currently has no serverless functions.

No directories found:

```text
api/
functions/
middleware
```

### Risk

None for current deployment.

### Resolution

No action required.

If serverless functions are added later:

- Keep functions small.
- Avoid long-running operations.
- Avoid local filesystem persistence.
- Store secrets in Vercel Environment Variables.
- Keep dependencies minimal.

---

## 8. Browser-Only APIs

**Severity:** Low

The app uses browser-only APIs:

```ts
localStorage
sessionStorage
indexedDB
window
document
crypto.randomUUID
```

These are used inside browser-side code and effects.

### Risk

No deployment risk for a Vite static app.

Potential risk only if SSR/server rendering is added later.

### Resolution

No action required.

If SSR is added later, guard browser-only APIs:

```ts
if (typeof window !== 'undefined') {
  // browser-only code
}
```

---

## 9. Tailwind v4 Configuration

**Severity:** Low

The project uses Tailwind v4 with:

```css
@import "tailwindcss";
```

It also has a legacy-style:

```text
tailwind.config.js
```

### Risk

The current build succeeds, so this is not blocking deployment.

Future theme changes should prefer Tailwind v4 CSS-first configuration in `src/index.css` using `@theme`.

### Resolution

Keep custom theme values in:

```text
src/index.css
```

Example already present:

```css
@theme {
  --color-primary-500: #4361ee;
  --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

---

## Recommended Vercel Configuration

Use the following settings:

```text
Framework Preset: Vite
Root Directory: resume-editor
Install Command: npm ci
Build Command: npm run build
Output Directory: dist
Node.js Version: 22.x
```

Recommended `package.json` addition:

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

---

## 10. Google Drive Integration (New Feature)

**Severity:** Medium

### Overview

The app now supports optional Google Drive backup:

- **Sign in with Google** — OAuth 2.0 popup via Google Identity Services (GIS)
- **Auto-save to Drive** — every change is synced to a JSON file in the user's Google Drive
- **Manual sync** — explicit sync button shows last-sync timestamp
- **Scope** — `drive.file` (per-file access only)

### Affected files

```
src/lib/googleDrive.ts              — Drive API client (find, create, update, read)
src/hooks/useGoogleDrive.ts         — React hook for auth state & auto-sync
src/components/GoogleDriveButton.tsx — Sign-in / status button
src/App.tsx                         — Integrates button and autosave effect
src/global.d.ts                     — Google Identity Services type declarations
index.html                          — Loads GSI script from CDN
.env.example                        — Template for VITE_GOOGLE_CLIENT_ID
```

### Risks

1. **Missing credentials** — The feature is inert without `VITE_GOOGLE_CLIENT_ID`. Users must create a Google Cloud project, enable Drive API, and add an OAuth 2.0 client ID. See `.env.example`.

2. **Client-side token storage** — The access token is stored in `sessionStorage`. It is not exposed to any server, but XSS could leak it. Mitigation: the scope is restricted to `drive.file` (the app can only see files it creates).

3. **Token expiry** — The implicit token expires after ~1 hour. The current implementation detects 401 responses and clears the session. A future improvement could add silent token refresh.

4. **Third-party cookie restrictions** — The GIS popup may be blocked by some browsers in strict privacy modes. The user can still manually copy credentials and use the backup/import buttons.

5. **Rate limits** — Google Drive API has usage quotas. Autosave debounces at 2 s to avoid excessive writes.

### Resolution

- Before deploying, verify that GIS library loads from `https://accounts.google.com/gsi/client` (already in `index.html`).
- Ensure `VITE_GOOGLE_CLIENT_ID` is set in the Vercel environment (if using Drive feature in prod).
- The app remains fully functional without Google Drive; the button simply shows a "Drive" option in the navbar.
Root Directory: resume-editor
Install Command: npm ci
Build Command: npm run build
Output Directory: dist
Node.js Version: 22.x
```

Recommended `package.json` addition:

```json
"engines": {
  "node": ">=20.19.0"
}
```

Optional `vercel.json`:

```json