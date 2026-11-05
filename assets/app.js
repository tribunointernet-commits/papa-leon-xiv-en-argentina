'use strict';
const TZ = 'America/Argentina/Buenos_Aires';
const TARGET = new Date('2026-11-08T16:30:00-03:00').getTime();
const $ = (id) => document.getElementById(id);
const pad = (v) => String(v).padStart(2,'0');
function countdown(){
  const diff = Math.max(0, Math.floor((TARGET-Date.now())/1000));
  if(diff===0){$('countdown-units').hidden=true;$('countdown-finished').hidden=false;return;}
  $('cd-days').textContent=pad(Math.floor(diff/86400));
  $('cd-hours').textContent=pad(Math.floor((diff%86400)/3600));
  $('cd-minutes').textContent=pad(Math.floor((diff%3600)/60));
  $('cd-seconds').textContent=pad(diff%60);
}
countdown();setInterval(countdown,1000);
const fmtTime = new Intl.DateTimeFormat('es-AR',{timeZone:TZ,hour:'2-digit',minute:'2-digit',hour12:false});
const fmtDay = new Intl.DateTimeFormat('es-AR',{timeZone:TZ,day:'2-digit',month:'short'});
const fmtFull = new Intl.DateTimeFormat('es-AR',{timeZone:TZ,dateStyle:'short',timeStyle:'short'});
function textEl(tag,className,value){const el=document.createElement(tag);if(className)el.className=className;el.textContent=value||'';return el;}
function validHttpUrl(u){try{const p=new URL(u);return ['https:','http:'].includes(p.protocol)?p.href:null;}catch{return null;}}
let currentSignature='';
function renderNews(items){
 const list=$('live-list');const signature=JSON.stringify(items.map(x=>[x.url,x.title,x.published_at]));
 if(signature===currentSignature)return;
 currentSignature=signature;list.replaceChildren();
 items.slice(0,5).forEach(item=>{
  const article=textEl('article','live-entry');
  const when=new Date(item.published_at);const dateValid=!Number.isNaN(when.getTime());
  const timeBox=textEl('div','live-clock');
  timeBox.append(textEl('span','live-time',dateValid?fmtTime.format(when):'—'));
  timeBox.append(textEl('span','live-date',dateValid?fmtDay.format(when):'Hora no informada'));
  const content=textEl('div','live-copy');const heading=textEl('h3');const link=textEl('a','',item.title);
  link.href=validHttpUrl(item.url)||'https://www.eltribuno.com/ttag/papa-leon-xiv-en-argentina';link.target='_blank';link.rel='noopener noreferrer';
  heading.append(link);content.append(heading);
  if(item.summary)content.append(textEl('p','',item.summary));
  const photoUrl=validHttpUrl(item.image);
  if(photoUrl){const photo=document.createElement('img');photo.className='live-photo';photo.loading='lazy';photo.decoding='async';photo.alt='';photo.src=photoUrl;photo.onerror=()=>photo.replaceWith(textEl('div','live-placeholder','✝'));article.append(timeBox,content,photo);}
  else{article.append(timeBox,content,textEl('div','live-placeholder','✝'));}
  list.append(article);
 });
}
async function refreshNews(){
 try{
  const response=await fetch(`data/latest.json?t=${Date.now()}`,{cache:'no-store'});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const data=await response.json();
  if(!Array.isArray(data.items)||!data.items.length)throw new Error('El archivo todavía no tiene noticias');
  const items=data.items.filter(x=>x&&typeof x.title==='string'&&validHttpUrl(x.url));
  if(!items.length)throw new Error('No hay noticias válidas');
  items.sort((a,b)=>Date.parse(b.published_at||0)-Date.parse(a.published_at||0));
  renderNews(items);
  $('live-status').textContent='5 últimas publicaciones';
  const updated=new Date(data.updated_at);
  $('last-update').textContent=Number.isNaN(updated.getTime())?'Cobertura de El Tribuno':'Datos actualizados: '+fmtFull.format(updated)+' (ARG)';
 }catch(err){
  $('live-status').textContent='Sin actualización disponible';
  if(!currentSignature){const p=textEl('p','error-state','El minuto a minuto todavía no tiene datos disponibles. ');const a=textEl('a','','Consultá las noticias de El Tribuno ↗');a.href='https://www.eltribuno.com/ttag/papa-leon-xiv-en-argentina';a.target='_blank';a.rel='noopener noreferrer';p.append(a);$('live-list').replaceChildren(p);}
  console.warn('No se pudo actualizar el minuto a minuto:',err.message);
 }
}
refreshNews();setInterval(refreshNews,60000);
if('IntersectionObserver'in window){const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');obs.unobserve(e.target);}})},{threshold:.08});document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));}else{document.querySelectorAll('.reveal').forEach(el=>el.classList.add('is-visible'));}
