import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { sessionFrom } from './_common.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    if (!sessionFrom(req)) {
      res.setHeader('Location', '/login');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(302).end();
    }
    const html = await readFile(join(process.cwd(), 'private', 'consulta.html'), 'utf8');
    const logout = `<div style="position:fixed;right:16px;bottom:16px;z-index:99999;display:flex;gap:8px">
      <a href="/" style="padding:12px 16px;border-radius:9px;background:white;color:#0e574e;border:1px solid #0e574e;text-decoration:none;font-weight:bold">Página pública</a>
      <button id="eq-logout" type="button" style="padding:12px 16px;border:0;border-radius:9px;background:#0e574e;color:white;font-weight:bold;cursor:pointer">Cerrar sesión</button>
    </div><script>document.getElementById('eq-logout').addEventListener('click',async()=>{try{await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})})}finally{location.replace('/')}});</script>
    <script>window.addEventListener('load',()=>{if(!location.hash)document.getElementById('estudiantes-tutor')?.scrollIntoView({block:'start'})});</script>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    return res.status(200).send(html.replace(/<\/body>/i, logout + '</body>'));
  } catch (err) {
    console.error('consulta:', err.message);
    return res.status(500).send('No fue posible cargar la consulta.');
  }
}
