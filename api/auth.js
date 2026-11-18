import {randomInt} from 'node:crypto';
import {authorized,send,seal,unseal,newToken,codeHash,equal,makeSession,sessionFrom,setCookie,SESSION_SECONDS} from './_common.js';
const OTP_MS=5*60*1000;
async function sendOtp(email,code){
 const {EMAILJS_SERVICE_ID:service_id,EMAILJS_TEMPLATE_ID:template_id,EMAILJS_PUBLIC_KEY:user_id,EMAILJS_PRIVATE_KEY:accessToken}=process.env;
 if(!service_id||!template_id||!user_id||!accessToken)throw Error('Configuración EmailJS incompleta');
 const response=await fetch('https://api.emailjs.com/api/v1.0/email/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({service_id,template_id,user_id,accessToken,template_params:{to_email:email,passcode:code,time:'5 minutos',otp_code:code,expires_minutes:'5',app_name:'Grupo de Equidad en Salud'}})});
 if(!response.ok){console.error('EmailJS',response.status,(await response.text()).slice(0,150));throw Error('No se pudo enviar el correo');}
}
export default async function handler(req,res){
 try{
  if(req.method!=='POST')return send(res,405,{error:'Método no permitido'});
  const {action,email:raw,code,challenge}=req.body||{};
  if(action==='logout'){setCookie(res,'',0);return send(res,200,{ok:true});}
  if(action==='session')return send(res,200,{authenticated:!!sessionFrom(req)});
  const email=typeof raw==='string'?raw.trim().toLowerCase():'';
  if(!authorized(email))return send(res,403,{error:'Correo no autorizado.'});
  if(action==='request_code'){
   const otp=String(randomInt(100000,1000000));const nonce=newToken();
   const token=seal({email,hash:codeHash(nonce,otp),nonce,exp:Date.now()+OTP_MS});
   await sendOtp(email,otp);
   return send(res,200,{challenge:token,message:'Código enviado.'});
  }
  if(action==='verify_code'){
   const payload=unseal(challenge);
   if(!payload||payload.exp<=Date.now()||payload.email!==email||!/^\d{6}$/.test(String(code||''))||!equal(payload.hash,codeHash(payload.nonce,String(code))))return send(res,401,{error:'Código incorrecto o vencido.'});
   setCookie(res,makeSession(email),SESSION_SECONDS);
   return send(res,200,{ok:true});
  }
  return send(res,400,{error:'Acción desconocida'});
 }catch(e){console.error('auth:',e.message);return send(res,500,{error:'No fue posible completar la operación.'});}
}
