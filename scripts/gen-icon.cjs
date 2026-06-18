/**
 * Regenerate build/icon.png (1024×1024) — the Catch app icon used by
 * electron-builder to produce the macOS .icns, Windows .ico, and Linux .png.
 *
 * The mark is ported from the Claude Design "캐치 로고" file: a rounded green
 * gradient tile with a white open ring (capture loop) and a gold spark dot.
 *
 * Run:  npx electron scripts/gen-icon.cjs
 * (Renders the SVG onto an HTML canvas and reads back PNG bytes with alpha.)
 */
const { app, BrowserWindow } = require('electron')
const fs = require('fs')
const path = require('path')

const SIZE = 1024
const RADIUS = 230 // ~0.225 · 1024, matches the design's corner ratio
// Mark: 100×100 viewBox scaled to 0.59·1024 and centered (viewBox-centered, as in the design).
const MARK = 0.59 * SIZE
const SCALE = MARK / 100
const OFFSET = SIZE / 2 - 50 * SCALE

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="g" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color="#1B6B58"/>
      <stop offset="0.52" stop-color="#14584A"/>
      <stop offset="1" stop-color="#0E3F34"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${SIZE}" height="${SIZE}" rx="${RADIUS}" ry="${RADIUS}" fill="url(#g)"/>
  <g transform="translate(${OFFSET},${OFFSET}) scale(${SCALE})">
    <path d="M68 28 A26 26 0 1 0 68 72" fill="none" stroke="#fff" stroke-width="12.5" stroke-linecap="round"/>
    <circle cx="76" cy="50" r="8.5" fill="#F0C36B"/>
  </g>
</svg>`

const HTML = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0}</style></head>
<body><canvas id="c" width="${SIZE}" height="${SIZE}"></canvas>
<script>
  const svg = ${JSON.stringify(SVG)};
  const url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  const img = new Image();
  img.onload = () => {
    const ctx = document.getElementById('c').getContext('2d');
    ctx.clearRect(0,0,${SIZE},${SIZE});
    ctx.drawImage(img, 0, 0, ${SIZE}, ${SIZE});
    window.__png = document.getElementById('c').toDataURL('image/png');
  };
  img.onerror = () => { window.__png = 'ERR'; };
  img.src = url;
</script></body></html>`

app.disableHardwareAcceleration()
app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: SIZE, height: SIZE, show: false, webPreferences: { offscreen: true } })
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(HTML))
  let dataUrl = ''
  for (let i = 0; i < 50; i++) {
    dataUrl = await win.webContents.executeJavaScript('window.__png || ""')
    if (dataUrl && dataUrl !== 'ERR') break
    await new Promise((r) => setTimeout(r, 100))
  }
  if (!dataUrl || dataUrl === 'ERR') {
    console.error('failed to rasterize SVG')
    app.exit(1)
    return
  }
  const b64 = dataUrl.replace(/^data:image\/png;base64,/, '')
  const out = path.join(__dirname, '..', 'build', 'icon.png')
  fs.writeFileSync(out, Buffer.from(b64, 'base64'))
  console.log('wrote', out, Buffer.from(b64, 'base64').length, 'bytes')
  app.quit()
})
