import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { sessionFrom } from './_common.js';
export default async function handler(req,res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    if (!(await sessionFrom(req))) {res.setHeader('Location','/'); return res.status(302).end();}
    const html = await readFile(join(process.cwd(),'private','equidad.html'),'utf8');
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','private, no-store, max-age=0');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options','DENY');
    // Inserta cierre de sesión sin alterar el HTML de origen.
    const logout=`<div style="position:fixed;right:16px;bottom:16px;z-index:99999"><button id="eq-logout" style="padding:12px 18px;border:0;border-radius:10px;background:#0e574e;color:#fff;font-weight:bold;cursor:pointer">Cerrar sesión</button></div><script>document.getElementById('eq-logout').addEventListener('click',async()=>{await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})});location.replace('/')});</script>`;
    return res.status(200).send(html.replace(/<\/body>/i,logout+'</body>'));
  } catch(e) { console.error('page:',e.message); return res.status(500).send('Error al cargar la página protegida'); }
}
