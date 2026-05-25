import { spawn } from 'node:child_process'

const port = 4173
const baseURL = `http://127.0.0.1:${port}`

const run = (command, args, options = {}) =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
      ...options,
    })

    child.on('exit', (code) => resolve(code ?? 1))
    child.on('error', () => resolve(1))
  })

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

try {
  await waitForServer()
  const code = await run(process.execPath, [
    './node_modules/playwright/cli.js',
    'test',
    ...process.argv.slice(2),
  ])
  server.kill()
  process.exitCode = code
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  server.kill()
  process.exitCode = 1
}
