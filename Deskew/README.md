# Deskew — perspective crop PWA

Upload a photo, drag the four corners onto a document/sign/whiteboard, and download the
flattened (de-skewed) image at full resolution. Runs 100% in the browser — no server, no upload.

## Deploy to GitHub Pages

1. Create a repo (e.g. `deskew`) and copy **all files in this folder** into it (keep the flat structure).
2. Push to the `main` branch.
3. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
4. Open the published URL. On mobile, use the browser's **Add to Home Screen** to install it.

> The `.nojekyll` file is included so GitHub Pages serves every file as-is.
> The app must be served over **https** (GitHub Pages is) for the service worker and install to work.

## Features

- Upload from camera roll or files: **JPEG, PNG, WebP, GIF, and HEIC/HEIF** (iPhone default).
  HEIC is decoded in-browser via `heic2any` (bundled, works offline).
- **Four grab handles** for perspective crop, with a **magnified loupe** that pops up offset
  from your finger/cursor so the point under the handle is never hidden.
- **Live side-by-side result** on desktop; on phones a **Preview** button opens the result
  full-screen with **Keep adjusting** to go back and forth until you're happy.
- **De-skew / flatten**: the selected quad is warped to a clean rectangle (bilinear sampling).
- **Download at full resolution**, in the original format where the browser can re-encode it
  (HEIC is saved as JPEG, since browsers can't write HEIC).
- **New photo** button to start over. Installable PWA (manifest + service worker).

## Files

| File | Purpose |
|------|---------|
| `index.html` | The entire app (UI + logic) |
| `heic2any.min.js` | HEIC/HEIF decoder (bundled) |
| `manifest.webmanifest` | PWA metadata |
| `sw.js` | Service worker (offline + install) |
| `icon-*.png` | App icons |
| `.nojekyll` | Tell Pages to serve files verbatim |

## Notes / limits

- Very large images are flattened on the main thread; a 12 MP photo processes in ~1–2 s on a
  modern phone. Output is capped at 6000 px on the long edge to stay within mobile memory limits.
- EXIF orientation is honored on load (`createImageBitmap`'s `imageOrientation:"from-image"`).
