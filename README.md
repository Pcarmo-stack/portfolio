# 3D Portfolio — beginner-friendly static site

A cinematic, dark-mode portfolio for a 3D artist / digital designer.

**No installation. No terminal. No build step. No frameworks.**
Just HTML, CSS, and a tiny bit of JavaScript.

To view the site: **double-click `index.html`**. That's it.

---

## What's in the folder

```
3D Portfolio/
├── index.html      ← the entire website (open this in your browser)
├── style.css       ← all the styling (colors, fonts, layout)
├── script.js       ← small animations and the project modal
│
├── images/         ← drop your photos here (thumbnails, gallery, portrait)
├── videos/         ← drop your .mp4 / .webm files here
├── models/         ← drop your .glb / .gltf 3D files here
└── projects/       ← optional: keep your source files here (not used by the site)
```

Each folder has a `README.txt` inside explaining what to put there.

---

## How to edit your content

Open `index.html` in any text editor (TextEdit, Notepad, VS Code…).
Look for the **big comment blocks** that say things like:

```
CHANGE YOUR NAME HERE
CHANGE PROJECT TITLE HERE
DROP YOUR VIDEO FILE HERE
ADD NEW PROJECTS BELOW THIS LINE
```

That's where you make changes. The rest of the file you can ignore.

### Change the basics

| Thing to change | Where in `index.html` |
|---|---|
| Page title (browser tab) | Top of file — `<title>...</title>` |
| Your name | Hero section — under `CHANGE YOUR NAME HERE` |
| Your role / location | Hero section — under `CHANGE YOUR ROLE...` |
| Tagline | Hero section — under `CHANGE YOUR TAGLINE HERE` |
| Bio | About section |
| Skills / tools | About section, inside the `<ul>` lists |
| Email | Contact section — `mailto:` link and visible text |
| Social links | Contact section |

### Add a new project

1. In `index.html`, find the comment that says **`ADD NEW PROJECTS BELOW THIS LINE`**.
2. Copy any existing `<article class="project"> ... </article>` block above it.
3. Paste it just below the comment.
4. Change:
   - The **title** (`<h3 class="project-name">...`)
   - The **meta line** (`<p class="project-meta">...`)
   - The **image path** (`<img src="images/...">`)
   - The **description text**
   - The **video / gallery / model paths**
   - The **external links** (or delete them)
5. Drop your media files into the matching folders:
   - thumbnails / gallery → `/images/`
   - videos → `/videos/`
   - 3D models → `/models/`
6. Save the file. Refresh your browser. Done.

### Remove a project

Delete its entire `<article class="project"> ... </article>` block from `index.html`.

### Reorder projects

Cut a whole `<article>` block and paste it in a different position.
Projects appear on the page in the order they appear in the file.

### Optional fields per project

Each project supports these — keep what you need, delete what you don't:

- **Thumbnail** (required) — the image visible on the card
- **Hover video** — short loop that plays when you hover the card
- **Short description** — the big lede inside the modal
- **Long description** — paragraph text below
- **Main video** — uploaded `.mp4` or YouTube/Vimeo embed
- **Image gallery** — any number of `<img>` tags
- **3D model** — a `<model-viewer>` tag pointing at a `.glb` file
- **External links** — case study, store, etc.

To remove any optional field, just delete its HTML tag inside the
`<template class="project-details">` block.

---

## Media tips

| Asset | Format | Size |
|---|---|---|
| Project thumbnail | `.jpg` or `.webp` | 1200 × 1500 px |
| Gallery images | `.jpg` or `.webp` | 2000 px wide is plenty |
| Hover video | `.mp4` (H.264) | 720p, short loop, < 3 MB |
| Main video | `.mp4` | 1080p, < 10 MB ideal |
| 3D model | `.glb` | Under 5 MB |
| Portrait | `.jpg` | 1200 × 1500 px |

Smaller files = faster site. Always.

---

## Changing the look

Open `style.css`. At the very top there's a `:root` block with the
color and font variables:

```css
--bg:        #07070a;     /* page background */
--fg:        #f6f5f1;     /* main text */
--muted:     #8a8a93;     /* secondary text */
--accent:    #e8e2d4;     /* highlight color */
```

Change a value, save, refresh. The whole site updates.

---

## Hosting (when you're ready)

Because this is just three files plus folders, you can host it for free on:

- **Netlify Drop** — drag the whole folder onto netlify.com/drop
- **Vercel** — drag the folder, done
- **GitHub Pages** — push to a repo, enable Pages in settings
- **Cloudflare Pages** — connect a repo or upload directly

No build settings needed. It's just static files.

---

## A note on the 3D viewer

The site uses Google's `<model-viewer>` web component for displaying
GLB/GLTF files. It's loaded from a CDN at the top of `index.html` —
nothing to install. If you don't use 3D models anywhere, you can delete
that `<script>` tag to make the page load very slightly faster.

---

That's everything. Happy designing. ✦
