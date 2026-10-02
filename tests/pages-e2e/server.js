import { createServer } from 'node:http'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
)
const buildRoot = path.join(projectRoot, 'dist')
const basePath = '/Abyrvalg/'
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

const server = createServer(async (request, response) => {
  let pathname
  try {
    pathname = decodeURIComponent(
      new URL(request.url, 'http://localhost').pathname,
    )
  } catch {
    response.writeHead(400).end()
    return
  }

  if (!pathname.startsWith(basePath)) {
    response.writeHead(404).end()
    return
  }

  // Constrain decoded request paths to the build directory before reading files.
  const relativePath = pathname.slice(basePath.length) || 'index.html'
  const filePath = path.resolve(buildRoot, relativePath)
  if (!filePath.startsWith(buildRoot + path.sep) && filePath !== buildRoot) {
    response.writeHead(404).end()
    return
  }

  let body
  let statusCode = 200
  let servedPath = filePath
  try {
    await access(filePath)
    body = await readFile(filePath)
  } catch {
    // Match GitHub Pages: unknown routes serve the custom 404, not the app shell.
    statusCode = 404
    servedPath = path.join(buildRoot, '404.html')
    body = await readFile(servedPath)
  }

  response.writeHead(statusCode, {
    'Content-Type':
      contentTypes[path.extname(servedPath)] || 'application/octet-stream',
  })
  response.end(body)
})

server.listen(4174, '127.0.0.1')
