import { readFileSync, existsSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = join(fileURLToPath(import.meta.url), '..');
const INDEX = join(HERE, 'index.html');

function serve(path) {
  // extensionless -> .html, preserving the path semantics Pages uses
  let file = path.endsWith('/') ? join(HERE, path.slice(0, -1), 'index.html') : join(HERE, path + '.html');
  if (!existsSync(file)) {
    file = join(HERE, '404.html');
  }
  const body = readFileSync(file);
  const ext = file.slice(file.lastIndexOf('.') + 1).toLowerCase();
  const mime = {
    html: 'text/html; charset=utf-8',
    css: 'text/css; charset=utf-8',
    js: 'application/javascript; charset=utf-8',
    svg: 'image/svg+xml',
    png: 'image/png',
    ico: 'image/x-icon',
    xml: 'application/xml',
    txt: 'text/plain',
  }[ext] || 'application/octet-stream';
  return new Response(body, {
    headers: {
      'Content-Type': mime,
      'Cache-Control': ext === 'html' ? 'public, max-age=0, must-revalidate' : 'public, max-age=3600',
    },
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    let path = url.pathname;
    // strip the file part if present (e.g. /en/word-counter.html -> /en/word-counter)
    if (path.endsWith('.html') && path !== '/404.html') {
      path = path.slice(0, -5);
    }
    if (path === '/') path = '/index.html';
    return serve(path);
  },
};
