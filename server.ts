import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Obfuscated Proxy API to bypass basic local network query-string inspection
  app.get('/api/proxy', async (req, res) => {
    const b64url = req.query.b64url as string;
    if (!b64url) {
      return res.status(400).send('Missing b64url parameter');
    }

    try {
      const targetUrl = Buffer.from(b64url, 'base64').toString('utf-8');
      const targetUrlObj = new URL(targetUrl);
      const fetchRes = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        // We do not forward any client cookies to the destination
        redirect: 'follow'
      });

      const contentType = fetchRes.headers.get('content-type') || '';
      
      // Privacy Headers for the client browser
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      if (contentType.includes('text/html')) {
        let html = await fetchRes.text();
        const safeUrl = fetchRes.url.replace(/"/g, '&quot;');
        const injection = `<base href="${safeUrl}">
        <script>
          window.addEventListener('click', function(e) {
            var a = e.target.closest('a');
            if (a && a.href && !a.href.startsWith('javascript:') && !a.href.startsWith('blob:') && !a.href.startsWith('data:')) {
              e.preventDefault();
              e.stopPropagation();
              window.parent.postMessage({ type: 'proxy_navigate', url: a.href }, '*');
            }
          }, true);
          window.addEventListener('submit', function(e) {
            if (e.target && (!e.target.method || e.target.method.toLowerCase() === 'get')) {
              e.preventDefault();
              e.stopPropagation();
              var url = new URL(e.target.action || "${safeUrl}");
              var formData = new FormData(e.target);
              var params = new URLSearchParams(formData).toString();
              url.search = url.search ? url.search + '&' + params : '?' + params;
              window.parent.postMessage({ type: 'proxy_navigate', url: url.toString() }, '*');
            }
          }, true);
        </script>`;
        
        // Inject into <head> if present, otherwise just prepend
        if (html.match(/<head[^>]*>/i)) {
          html = html.replace(/(<head[^>]*>)/i, `$1${injection}`);
        } else {
          html = injection + html;
        }
        
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } else {
        // Forward binary data directly
        const arrayBuffer = await fetchRes.arrayBuffer();
        res.setHeader('Content-Type', contentType);
        res.send(Buffer.from(arrayBuffer));
      }
    } catch (error: any) {
      console.error('Proxy error:', error);
      res.status(500).send(`Proxy failed: ${error.message}`);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
