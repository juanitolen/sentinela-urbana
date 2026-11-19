import { chromium } from 'playwright'
import { pathToFileURL } from 'url'; import path from 'path'
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
await p.goto(pathToFileURL(path.resolve('../video/thumb.html')).href, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: '../video/thumbnail.png' }); await b.close()
