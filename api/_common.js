import { createHmac, createHash, randomBytes, timingSafeEqual, createCipheriv, createDecipheriv } from 'node:crypto';
export const SESSION_SECONDS = 3600;
const secret = () => { const s=process.env.AUTH_SECRET; if(!s || s.length<32) throw Error('AUTH_SECRET debe tener al menos 32 caracteres'); return s; };
const key = () => createHash('sha256').update(secret()).digest();
const sign = value => createHmac('sha256',key()).update(value).digest('base64url');
export const authorized = email => typeof email==='string' && email.length<=254 && /^[a-z0-9._%+-]+@unal\.edu\.co$/.test(email) && (process.env.ALLOWED_EMAILS||'').split(',').map(e=>e.trim().toLowerCase()).filter(Boolean).includes(email);
export const send = (res,status,data) => {res.setHeader('Cache-Control','no-store');return res.status(status).json(data);};
export const cookie = (req,name) => (req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1);
export const setCookie = (res,token,maxAge) => res.setHeader('Set-Cookie',`eq_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`);
export const newToken = () => randomBytes(24).toString('base64url');
export function seal(data){ const iv=randomBytes(12), c=createCipheriv('aes-256-gcm',key(),iv);const body=Buffer.concat([c.update(JSON.stringify(data),'utf8'),c.final()]);return Buffer.concat([iv,c.getAuthTag(),body]).toString('base64url'); }
export function unseal(token){try{if(typeof token!=='string'||token.length>2000)return null;const raw=Buffer.from(token,'base64url');if(raw.length<29)return null;const d=createDecipheriv('aes-256-gcm',key(),raw.subarray(0,12));d.setAuthTag(raw.subarray(12,28));return JSON.parse(Buffer.concat([d.update(raw.subarray(28)),d.final()]).toString('utf8'));}catch{return null;}}
export const codeHash=(nonce,code)=>sign('otp:'+nonce+':'+code);
export function equal(a,b){if(typeof a!=='string'||typeof b!=='string')return false;const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
export function makeSession(email){const payload=Buffer.from(JSON.stringify({email,exp:Date.now()+SESSION_SECONDS*1000})).toString('base64url');return payload+'.'+sign('session:'+payload);}
export function sessionFrom(req){const token=cookie(req,'eq_session');if(!token||token.length>1500)return null;const parts=token.split('.');if(parts.length!==2||!equal(sign('session:'+parts[0]),parts[1]))return null;try{const data=JSON.parse(Buffer.from(parts[0],'base64url').toString());return data.exp>Date.now()&&authorized(data.email)?data:null;}catch{return null;}}
