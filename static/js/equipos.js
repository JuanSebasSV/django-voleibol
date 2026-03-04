/* ============================================================
   EQUIPOS.JS
   ============================================================ */
'use strict';

// Los datos ahora vienen de la API Django
let EQUIPOS = {};

async function cargarDatosAPI() {
  try {
    const res = await fetch('/equipos/api/equipos/?v=' + Date.now());  // ← aquí adentro
    EQUIPOS   = await res.json();
  } catch (e) {
    console.error('Error cargando equipos:', e);
  }
}

function rutaImg(nombre) { return `/static/img/${nombre}`; }

/* ── Partículas ───────────────────────────────────────────── */
(function() {
  const cv = document.getElementById('canvas-fondo');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let pts = [];
  function resize() { cv.width=innerWidth; cv.height=innerHeight; }
  function mkP() { return {x:Math.random()*cv.width,y:Math.random()*cv.height,r:Math.random()*1.4+0.3,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,op:Math.random()*.5+.1}; }
  resize();
  pts = Array.from({length:70},mkP);
  addEventListener('resize',resize);
  (function loop(){
    ctx.clearRect(0,0,cv.width,cv.height);
    pts.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0)p.x=cv.width; if(p.x>cv.width)p.x=0;
      if(p.y<0)p.y=cv.height; if(p.y>cv.height)p.y=0;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(255,255,255,${p.op})`; ctx.fill();
    });
    requestAnimationFrame(loop);
  })();
})();

/* ── Borde serpiente ──────────────────────────────────────── */
function iniciarBorde(canvas, vel0) {
  const ctx = canvas.getContext('2d');
  let t=0, vel=vel0, raf;
  const LEN=0.32;
  function col(p) {
    if(p<.5){const f=p/.5;return `rgb(${~~(f*255)},${~~(200+f*55)},${~~(83+f*172)})`;}
    else{const f=(p-.5)/.5;return `rgb(255,${~~(255-f*255)},${~~(255-f*255)})`;}
  }
  function genPts(w,h,r,n){
    const ps=[], paso=(2*(w-2*r)+2*(h-2*r)+2*Math.PI*r)/n;
    function seg(x0,y0,x1,y1){const d=Math.hypot(x1-x0,y1-y0),s=Math.max(1,~~(d/paso));for(let i=0;i<s;i++){const f=i/s;ps.push({x:x0+f*(x1-x0),y:y0+f*(y1-y0)});}}
    function arc(cx,cy,ra,a0,a1){const s=Math.max(2,~~(ra*Math.abs(a1-a0)/paso));for(let i=0;i<s;i++){const a=a0+i/s*(a1-a0);ps.push({x:cx+Math.cos(a)*ra,y:cy+Math.sin(a)*ra});}}
    const PI=Math.PI;
    seg(r,0,w-r,0);arc(w-r,r,r,-PI/2,0);seg(w,r,w,h-r);arc(w-r,h-r,r,0,PI/2);
    seg(w-r,h,r,h);arc(r,h-r,r,PI/2,PI);seg(0,h-r,0,r);arc(r,r,r,PI,3*PI/2);
    return ps;
  }
  let pts=[],uw=0,uh=0;
  function draw(){
    const w=canvas.width,h=canvas.height;
    ctx.clearRect(0,0,w,h);
    if(!w||!h){raf=requestAnimationFrame(draw);return;}
    if(w!==uw||h!==uh){pts=genPts(w,h,6,300);uw=w;uh=h;}
    const n=pts.length; if(n<2){raf=requestAnimationFrame(draw);return;}
    t=(t+vel)%1;
    const cola=~~(((t-LEN+1)%1)*n), pasos=~~(n*LEN);
    for(let i=0;i<pasos;i++){
      const idx=(cola+i)%n,sig=(idx+1)%n,p=i/pasos;
      ctx.beginPath();ctx.moveTo(pts[idx].x,pts[idx].y);ctx.lineTo(pts[sig].x,pts[sig].y);
      ctx.strokeStyle=col(p);ctx.globalAlpha=.4+p*.6;ctx.lineWidth=1.5+p*2.5;
      ctx.shadowColor=col(p);ctx.shadowBlur=8+p*12;ctx.stroke();
    }
    ctx.globalAlpha=1;ctx.shadowBlur=0;
    raf=requestAnimationFrame(draw);
  }
  raf=requestAnimationFrame(draw);
  return {up(){vel=vel0*3.5;},dn(){vel=vel0;},off(){cancelAnimationFrame(raf);}};
}

/* ── Tarjetas de selección ────────────────────────────────── */
function iniciarTarjetas() {
  document.querySelectorAll('.tarjeta-equipo').forEach(t=>{
    const cb=t.querySelector('.canvas-borde');
    function aj(){const r=t.getBoundingClientRect();if(r.width>0&&r.height>0){cb.width=r.width+4;cb.height=r.height+4;}}
    new ResizeObserver(aj).observe(t);
    addEventListener('resize',aj);
    requestAnimationFrame(aj);
    const b=iniciarBorde(cb,.0025);
    t.addEventListener('mouseenter',()=>b.up());
    t.addEventListener('mouseleave',()=>b.dn());
    t.addEventListener('click',()=>seleccionarEquipo(t.dataset.equipo));
    t.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')seleccionarEquipo(t.dataset.equipo);});
  });
}

/* ── Transiciones ─────────────────────────────────────────── */
function seleccionarEquipo(id){
  const vs=document.getElementById('vista-seleccion');
  const vc=document.getElementById('vista-cancha');
  vs.classList.add('oculta');
  setTimeout(()=>{cargarEquipo(id);requestAnimationFrame(()=>vc.classList.add('visible'));},650);
}
function volverSeleccion(){
  const vs=document.getElementById('vista-seleccion');
  const vc=document.getElementById('vista-cancha');
  ocultarFifa();
  vc.classList.remove('visible');
  setTimeout(()=>vs.classList.remove('oculta'),650);
}

/* ── Avatar busto SVG ─────────────────────────────────────── */
function avatarSVG() {
  const id='av'+Math.random().toString(36).slice(2,7);
  return `<svg viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg" overflow="visible">
    <defs>
      <filter id="${id}g" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b"/>
        <feColorMatrix in="b" type="matrix" values="1 1 1 0 0 1 1 1 0 0 1 1 1 0 0 0 0 0 22 -8" result="glow"/>
        <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="${id}s">
        <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#00ff88" flood-opacity="0.5"/>
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.9"/>
      </filter>
    </defs>
    <g filter="url(#${id}s)">
      <g filter="url(#${id}g)">
        <!-- Cabeza: forma humana realista -->
        <ellipse cx="50" cy="26" rx="18" ry="21" fill="#000" stroke="#fff" stroke-width="2.2"/>
        <!-- Pelo -->
        <path d="M 32 18 Q 33 6 50 5 Q 67 6 68 18 Q 60 11 50 12 Q 40 11 32 18 Z" fill="#000" stroke="#fff" stroke-width="1.5"/>
        <!-- Cuello -->
        <rect x="43" y="45" width="14" height="9" rx="3" fill="#000" stroke="#fff" stroke-width="1.8"/>
        <!-- Hombros y busto — silueta tipo perfil Facebook exacta -->
        <path d="M 2 90 C 2 65 10 60 22 57 C 30 54 40 53 43 52 L 57 52 C 60 53 70 54 78 57 C 90 60 98 65 98 90 Z"
              fill="#000" stroke="#fff" stroke-width="2.2"/>
        <!-- Clavícula detalle -->
        <path d="M 35 57 Q 50 52 65 57" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.2"/>
      </g>
    </g>
  </svg>`;
}

/* ── Cancha Canvas realista ───────────────────────────────── */
function dibujarCancha() {
  const canvas = document.getElementById('canvas-cancha');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function render() {
    const contenedor = canvas.parentElement;
    const W = contenedor.offsetWidth  || 800;
    const H = contenedor.offsetHeight || 600;
    canvas.width  = W;
    canvas.height = H;
    ctx.clearRect(0,0,W,H);

    /* ── Trapecio perspectiva ── */
    const yTop = H * 0.10;
    const yBot = H * 0.95;
    const xCx  = W * 0.50;
    const xTL  = xCx - W * 0.28;
    const xTR  = xCx + W * 0.28;
    const xBL  = xCx - W * 0.46;
    const xBR  = xCx + W * 0.46;

    function pt(fx,fy){
      const xl=xTL+(xBL-xTL)*fy, xr=xTR+(xBR-xTR)*fy;
      return {x:xl+(xr-xl)*fx, y:yTop+(yBot-yTop)*fy};
    }

    /* ── Suelo parqué ── */
    const gSuelo=ctx.createLinearGradient(0,yTop,0,yBot);
    gSuelo.addColorStop(0,'#1c0e00');
    gSuelo.addColorStop(0.4,'#321500');
    gSuelo.addColorStop(0.8,'#3e1c00');
    gSuelo.addColorStop(1,'#260f00');
    ctx.beginPath();
    ctx.moveTo(xTL,yTop);ctx.lineTo(xTR,yTop);ctx.lineTo(xBR,yBot);ctx.lineTo(xBL,yBot);
    ctx.closePath();ctx.fillStyle=gSuelo;ctx.fill();

    /* vetas de madera */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xTL,yTop);ctx.lineTo(xTR,yTop);ctx.lineTo(xBR,yBot);ctx.lineTo(xBL,yBot);
    ctx.closePath();ctx.clip();
    for(let i=0;i<50;i++){
      const ty=i/50;
      const y=yTop+(yBot-yTop)*ty;
      const xl=xTL+(xBL-xTL)*ty, xr=xTR+(xBR-xTR)*ty;
      ctx.beginPath();ctx.moveTo(xl,y);ctx.lineTo(xr,y);
      ctx.strokeStyle=`rgba(255,160,40,${0.03+Math.sin(i*.9)*.015})`;
      ctx.lineWidth=0.7;ctx.stroke();
    }
    ctx.restore();

    /* ── Zona delantera color rojo ── */
    ctx.beginPath();
    ctx.moveTo(pt(0,0).x,pt(0,0).y);ctx.lineTo(pt(1,0).x,pt(1,0).y);
    ctx.lineTo(pt(1,.33).x,pt(1,.33).y);ctx.lineTo(pt(0,.33).x,pt(0,.33).y);
    ctx.closePath();ctx.fillStyle='rgba(160,20,20,0.14)';ctx.fill();

    /* ── Líneas del campo ── */
    function lin(p1,p2,c,w,bl){
      ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);
      ctx.strokeStyle=c;ctx.lineWidth=w;
      if(bl){ctx.shadowColor=c;ctx.shadowBlur=bl;}
      ctx.stroke();ctx.shadowBlur=0;
    }

    /* contorno */
    ctx.beginPath();
    ctx.moveTo(xTL,yTop);ctx.lineTo(xTR,yTop);ctx.lineTo(xBR,yBot);ctx.lineTo(xBL,yBot);
    ctx.closePath();ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=2.5;
    ctx.shadowColor='#fff';ctx.shadowBlur=14;ctx.stroke();ctx.shadowBlur=0;

    /* línea de ataque */
    lin(pt(0,.33),pt(1,.33),'rgba(255,255,255,.85)',2,8);
    /* línea central vertical */
    lin(pt(.5,0),pt(.5,1),'rgba(255,255,255,.2)',1,0);

    /* ── Reflejo central ── */
    const gRef=ctx.createRadialGradient(W/2,(yTop+yBot)/2,10,W/2,(yTop+yBot)/2,W*.35);
    gRef.addColorStop(0,'rgba(255,200,100,.06)');gRef.addColorStop(1,'rgba(0,0,0,0)');
    ctx.save();
    ctx.beginPath();ctx.moveTo(xTL,yTop);ctx.lineTo(xTR,yTop);ctx.lineTo(xBR,yBot);ctx.lineTo(xBL,yBot);
    ctx.closePath();ctx.clip();ctx.fillStyle=gRef;ctx.fillRect(0,0,W,H);
    ctx.restore();

    /* ═══════════════════════════════════════════════════════
       RED DE VOLEIBOL REALISTA
       ═══════════════════════════════════════════════════════ */
    const redY     = yTop;          /* base de la red = borde superior de cancha */
    const postH    = 110;           /* altura de los postes */
    const redTop   = redY - postH;
    const mP       = W * 0.045;     /* cuánto sobresalen los postes */
    const pxL      = xTL - mP;
    const pxR      = xTR + mP;
    const netAncho = pxR - pxL;

    /* Postes — cilindros con degradado */
    function poste(x) {
      const gp=ctx.createLinearGradient(x-5,0,x+5,0);
      gp.addColorStop(0,'#666');gp.addColorStop(.4,'#eee');gp.addColorStop(1,'#333');
      ctx.beginPath();ctx.rect(x-4,redTop-10,8,postH+10);
      ctx.fillStyle=gp;ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=.5;ctx.stroke();
      /* base */
      ctx.beginPath();ctx.ellipse(x,redY+4,11,5,0,0,Math.PI*2);
      ctx.fillStyle='#444';ctx.fill();
      /* remate superior */
      ctx.beginPath();ctx.ellipse(x,redTop-10,5,3,0,0,Math.PI*2);
      ctx.fillStyle='#bbb';ctx.fill();
    }
    poste(pxL);poste(pxR);

    /* Cable superior con catenaria */
    ctx.beginPath();
    ctx.moveTo(pxL,redTop);
    ctx.bezierCurveTo(pxL+netAncho*.25,redTop+5,pxR-netAncho*.25,redTop+5,pxR,redTop);
    ctx.strokeStyle='#fff';ctx.lineWidth=3;
    ctx.shadowColor='#fff';ctx.shadowBlur=20;ctx.stroke();ctx.shadowBlur=0;

    /* Banda blanca superior */
    const bandH=10;
    const gBanda=ctx.createLinearGradient(0,redTop,0,redTop+bandH);
    gBanda.addColorStop(0,'rgba(255,255,255,.98)');
    gBanda.addColorStop(1,'rgba(210,210,210,.7)');
    ctx.beginPath();ctx.rect(pxL,redTop,netAncho,bandH);
    ctx.fillStyle=gBanda;ctx.fill();

    /* Banda verde inferior */
    const bandBotY=redY-bandH;
    const gVerde=ctx.createLinearGradient(0,bandBotY,0,redY);
    gVerde.addColorStop(0,'rgba(0,160,55,.75)');
    gVerde.addColorStop(1,'rgba(0,200,75,.95)');
    ctx.beginPath();ctx.rect(pxL,bandBotY,netAncho,bandH);
    ctx.fillStyle=gVerde;ctx.fill();

    /* ── Malla central ── */
    const mTop2 = redTop+bandH;
    const mBot2 = bandBotY;
    const mH    = mBot2-mTop2;
    const cH2   = 10;
    const cW2   = 12;

    ctx.save();
    ctx.beginPath();ctx.rect(pxL,mTop2,netAncho,mH);ctx.clip();

    /* Fondo oscuro de la malla */
    const gMalla=ctx.createLinearGradient(pxL,mTop2,pxL,mBot2);
    gMalla.addColorStop(0,'rgba(10,10,20,0.8)');
    gMalla.addColorStop(1,'rgba(5,5,10,0.9)');
    ctx.fillStyle=gMalla;ctx.fillRect(pxL,mTop2,netAncho,mH);

    /* Hilos de la malla */
    const colHilo='rgba(180,190,200,0.55)';
    const colHiloG='rgba(220,230,240,0.8)';

    /* Verticales */
    for(let x=pxL;x<=pxR;x+=cW2){
      ctx.beginPath();ctx.moveTo(x,mTop2);ctx.lineTo(x,mBot2);
      const grueso=((x-pxL)%36<2);
      ctx.strokeStyle=grueso?colHiloG:colHilo;
      ctx.lineWidth=grueso?1.4:0.7;
      if(grueso){ctx.shadowColor='rgba(200,220,255,.4)';ctx.shadowBlur=3;}
      ctx.stroke();ctx.shadowBlur=0;
    }
    /* Horizontales */
    for(let y=mTop2;y<=mBot2;y+=cH2){
      ctx.beginPath();ctx.moveTo(pxL,y);ctx.lineTo(pxR,y);
      const grueso=((y-mTop2)%30<2);
      ctx.strokeStyle=grueso?colHiloG:colHilo;
      ctx.lineWidth=grueso?1.4:0.7;
      ctx.stroke();
    }

    /* Efecto de perspectiva en la malla (ligero oscurecimiento en los extremos) */
    const gPers=ctx.createLinearGradient(pxL,0,pxR,0);
    gPers.addColorStop(0,'rgba(0,0,0,.35)');
    gPers.addColorStop(.15,'rgba(0,0,0,0)');
    gPers.addColorStop(.85,'rgba(0,0,0,0)');
    gPers.addColorStop(1,'rgba(0,0,0,.35)');
    ctx.fillStyle=gPers;ctx.fillRect(pxL,mTop2,netAncho,mH);
    ctx.restore();

    /* Borde exterior de la malla */
    ctx.beginPath();ctx.rect(pxL,redTop,netAncho,postH);
    ctx.strokeStyle='rgba(255,255,255,.1)';ctx.lineWidth=1;ctx.stroke();

    /* Antenas (rayas rojo/blanco) */
    function antena(x){
      const segH=6,tot=postH*.7,startY=redTop+(postH*.15);
      for(let s=0;s<Math.ceil(tot/segH);s++){
        const y=startY+s*segH;
        ctx.beginPath();ctx.rect(x-2.5,y,5,Math.min(segH,tot-(s*segH)));
        ctx.fillStyle=s%2===0?'rgba(255,30,30,.95)':'rgba(255,255,255,.95)';ctx.fill();
      }
    }
    antena(xTL-1);antena(xTR+1);

    /* Sombra de la red sobre la cancha */
    const gSombra=ctx.createLinearGradient(0,redY,0,redY+50);
    gSombra.addColorStop(0,'rgba(0,0,0,.5)');gSombra.addColorStop(1,'rgba(0,0,0,0)');
    ctx.save();
    ctx.beginPath();ctx.moveTo(xTL,yTop);ctx.lineTo(xTR,yTop);ctx.lineTo(xBR,yBot);ctx.lineTo(xBL,yBot);ctx.closePath();ctx.clip();
    const sR=pt(0,.06),sL=pt(1,.06);
    ctx.beginPath();ctx.moveTo(xTL,yTop);ctx.lineTo(xTR,yTop);ctx.lineTo(sL.x,sL.y);ctx.lineTo(sR.x,sR.y);ctx.closePath();
    ctx.fillStyle=gSombra;ctx.fill();
    ctx.restore();

    /* ── Focos cenitales ── */
    [.25,.5,.75].forEach(fx=>{
      const gFoco=ctx.createRadialGradient(W*fx,yTop,0,W*fx,yTop,W*.22);
      gFoco.addColorStop(0,'rgba(255,240,200,.12)');gFoco.addColorStop(1,'rgba(0,0,0,0)');
      ctx.save();
      ctx.beginPath();ctx.moveTo(xTL,yTop);ctx.lineTo(xTR,yTop);ctx.lineTo(xBR,yBot);ctx.lineTo(xBL,yBot);ctx.closePath();ctx.clip();
      ctx.fillStyle=gFoco;ctx.fillRect(0,0,W,H);ctx.restore();
    });
  }

  render();
  addEventListener('resize',render);
}

/* ── Cargar equipo ────────────────────────────────────────── */
let equipoActual=null;
const MAPA=['pos-4','pos-3','pos-2','pos-5','pos-6','pos-1'];

function cargarEquipo(id){
  const datos=EQUIPOS[id]; if(!datos)return;
  equipoActual=id;
  document.getElementById('cancha-titulo-equipo').textContent=datos.nombre;
  document.getElementById('cancha-subtitulo').textContent=datos.subtitulo;
  document.getElementById('tarjeta-fifa').className=`tarjeta-fifa ${datos.claseColor}`;

  datos.jugadores.forEach((j,i)=>{
    const el=document.getElementById(MAPA[i]); if(!el)return;
    el.querySelector('.icono-jugador').innerHTML=avatarSVG();
    el.querySelector('.nombre-jugador').textContent=j.nombre;
    /* clonar para limpiar listeners previos */
    const nc=el.cloneNode(true);
    el.parentNode.replaceChild(nc,el);
    const nuevo=document.getElementById(MAPA[i]);
    nuevo.querySelector('.icono-jugador').innerHTML=avatarSVG();
    nuevo.querySelector('.nombre-jugador').textContent=j.nombre;
    nuevo.addEventListener('mouseenter',()=>mostrarFifa(j,nuevo,datos.claseColor));
    nuevo.addEventListener('mouseleave',()=>ocultarFifa());
  });
}

/* ── Tarjeta FIFA ─────────────────────────────────────────── */
const tfifa=document.getElementById('tarjeta-fifa');
let timerFifa=null;

function mostrarFifa(j,el,clase){
  clearTimeout(timerFifa);
  document.getElementById('fifa-nombre').textContent   = j.nombreCompleto;
  document.getElementById('fifa-posicion').textContent = j.posicion;
  document.getElementById('fifa-edad').textContent     = j.edad+' años';
  document.getElementById('fifa-altura').textContent   = j.altura;
  document.getElementById('fifa-peso').textContent     = j.peso;

  /* ↓ Ruta de imagen del jugador — modifica solo rutaImg() si cambia la carpeta */
  const foto=document.getElementById('fifa-foto');
  foto.src=rutaImg(j.foto);
  foto.alt=j.nombreCompleto;

  tfifa.className=`tarjeta-fifa ${clase}`;
  posicionarFifa(el);
  tfifa.style.display='block';
  requestAnimationFrame(()=>requestAnimationFrame(()=>tfifa.classList.add('visible')));
}

function ocultarFifa(){
  tfifa.classList.remove('visible');
  timerFifa=setTimeout(()=>{ tfifa.style.display='none'; },320);
}

function posicionarFifa(el){
  const r=el.getBoundingClientRect();
  const W2=240, H2=360, mg=12;
  let left=r.left+r.width/2-W2/2;
  let top =r.top - H2 - mg;
  if(top<70) top=r.bottom+mg;
  left=Math.max(mg,Math.min(left,innerWidth-W2-mg));
  tfifa.style.left=left+'px';
  tfifa.style.top =top+'px';
}

/* ── Botón volver ─────────────────────────────────────────── */
document.getElementById('btn-volver').addEventListener('click',volverSeleccion);

/* ── Init ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  await cargarDatosAPI();   // ← primero carga datos
  iniciarTarjetas();
  dibujarCancha();
});