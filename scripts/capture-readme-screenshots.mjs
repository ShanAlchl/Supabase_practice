import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const port = 4174
const baseURL = `http://127.0.0.1:${port}`
const screenshotDir = 'docs/images'

const waitForServer = async () => {
  const startedAt = Date.now()
  while (Date.now() - startedAt < 30_000) {
    try {
      const response = await fetch(baseURL)
      if (response.ok) return
    } catch {
      // Vite is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  throw new Error(`Timed out waiting for ${baseURL}`)
}

const server = spawn(
  process.execPath,
  ['./node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port)],
  {
    env: {
      ...process.env,
      VITE_SUPABASE_URL: 'https://your-project.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'your-anon-key',
    },
    stdio: 'inherit',
    shell: false,
  },
)

let browser

try {
  await mkdir(screenshotDir, { recursive: true })
  await waitForServer()

  browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 } })

  await page.goto(`${baseURL}/login-preview`)
  await page.screenshot({
    fullPage: true,
    path: `${screenshotDir}/login.png`,
  })

  await page.goto(baseURL)
  await page.screenshot({
    fullPage: true,
    path: `${screenshotDir}/desktop-feed.png`,
  })

  await page.getByRole('button', { name: '发布新动态' }).click()
  await page.screenshot({
    fullPage: true,
    path: `${screenshotDir}/compose-dialog.png`,
  })

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await mobile.goto(baseURL)
  await mobile.screenshot({
    fullPage: true,
    path: `${screenshotDir}/mobile-feed.png`,
  })
} finally {
  await browser?.close()
  server.kill()
}
