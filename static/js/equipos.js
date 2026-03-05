'use strict';

/* ── Datos de equipos desde la API ── */
let EQUIPOS = {};
async function cargarDatos() {
  try {
    const res = await fetch('/equipos/api/equipos/?v=' + Date.now());
    EQUIPOS = await res.json();
  } catch (e) { console.error('Error cargando equipos:', e); }
}
const rutaImg = nombre => `/static/img/${nombre}`;

/* ── Partículas de fondo ── */
(function() {
  const cv = document.getElementById('lienzo-fondo');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let pts = [];
  function reiniciar() {
    cv.width = innerWidth; cv.height = innerHeight;
    pts = Array.from({length:70}, () => ({
      x:Math.random()*cv.width, y:Math.random()*cv.height,
      r:Math.random()*1.4+0.3, op:Math.random()*.5+.1,
      vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3,
    }));
  }
  reiniciar();
  addEventListener('resize', reiniciar);
  (function loop() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cv.width, cv.height);
    pts.forEach(p => {
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0)p.x=cv.width; if(p.x>cv.width)p.x=0;
      if(p.y<0)p.y=cv.height; if(p.y>cv.height)p.y=0;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(255,255,255,${p.op})`; ctx.fill();
    });
    requestAnimationFrame(loop);
  })();
})();

/* ── Borde serpiente (arco verde→rojo que recorre el perímetro) ── */
function bordeSerpiente(lienzo, velBase) {
  const ctx = lienzo.getContext('2d');
  let t=0, vel=velBase, raf;
  const LONG = 0.32;

  function colorArco(p) {
    if (p<.5) { const f=p/.5; return `rgb(${~~(f*255)},${~~(200+f*55)},${~~(83+f*172)})`; }
    const f=(p-.5)/.5; return `rgb(255,${~~(255-f*255)},${~~(255-f*255)})`;
  }
  function generarPuntos(w,h,r,n) {
    const pts=[], paso=(2*(w-2*r)+2*(h-2*r)+2*Math.PI*r)/n;
    function seg(x0,y0,x1,y1){const d=Math.hypot(x1-x0,y1-y0),s=Math.max(1,~~(d/paso));for(let i=0;i<s;i++){const f=i/s;pts.push({x:x0+f*(x1-x0),y:y0+f*(y1-y0)});}}
    function arco(cx,cy,ra,a0,a1){const s=Math.max(2,~~(ra*Math.abs(a1-a0)/paso));for(let i=0;i<s;i++){const a=a0+i/s*(a1-a0);pts.push({x:cx+Math.cos(a)*ra,y:cy+Math.sin(a)*ra});}}
    const PI=Math.PI;
    seg(r,0,w-r,0);arco(w-r,r,r,-PI/2,0);seg(w,r,w,h-r);arco(w-r,h-r,r,0,PI/2);
    seg(w-r,h,r,h);arco(r,h-r,r,PI/2,PI);seg(0,h-r,0,r);arco(r,r,r,PI,3*PI/2);
    return pts;
  }
  let ptsCache=[],anchoC=0,altoC=0;
  function dibujar() {
    const w=lienzo.width,h=lienzo.height;
    ctx.clearRect(0,0,w,h);
    if(!w||!h){raf=requestAnimationFrame(dibujar);return;}
    if(w!==anchoC||h!==altoC){ptsCache=generarPuntos(w,h,6,300);anchoC=w;altoC=h;}
    const n=ptsCache.length; if(n<2){raf=requestAnimationFrame(dibujar);return;}
    t=(t+vel)%1;
    const cola=~~(((t-LONG+1)%1)*n), pasos=~~(n*LONG);
    for(let i=0;i<pasos;i++){
      const idx=(cola+i)%n,sig=(idx+1)%n,p=i/pasos;
      ctx.beginPath();ctx.moveTo(ptsCache[idx].x,ptsCache[idx].y);ctx.lineTo(ptsCache[sig].x,ptsCache[sig].y);
      ctx.strokeStyle=colorArco(p);ctx.globalAlpha=.4+p*.6;ctx.lineWidth=1.5+p*2.5;
      ctx.shadowColor=colorArco(p);ctx.shadowBlur=8+p*12;ctx.stroke();
    }
    ctx.globalAlpha=1;ctx.shadowBlur=0;
    raf=requestAnimationFrame(dibujar);
  }
  raf=requestAnimationFrame(dibujar);
  return { acelerar(){vel=velBase*3.5;}, normal(){vel=velBase;}, detener(){cancelAnimationFrame(raf);} };
}

/* ── Tarjetas de selección ── */
function iniciarTarjetas() {
  document.querySelectorAll('.tarjeta-equipo').forEach(tarjeta => {
    const lb = tarjeta.querySelector('.lienzo-borde');
    function ajustar(){const r=tarjeta.getBoundingClientRect();if(r.width>0){lb.width=r.width+4;lb.height=r.height+4;}}
    new ResizeObserver(ajustar).observe(tarjeta);
    addEventListener('resize',ajustar);
    requestAnimationFrame(ajustar);
    const borde = bordeSerpiente(lb, .0025);
    tarjeta.addEventListener('mouseenter', ()=>borde.acelerar());
    tarjeta.addEventListener('mouseleave', ()=>borde.normal());
    tarjeta.addEventListener('click', ()=>seleccionarEquipo(tarjeta.dataset.equipo));
    tarjeta.addEventListener('keydown', e=>{if(e.key==='Enter'||e.key===' ')seleccionarEquipo(tarjeta.dataset.equipo);});
  });
}

/* ── Navegación entre vistas ── */
function seleccionarEquipo(id) {
  const vSel = document.getElementById('vista-seleccion');
  const vCan = document.getElementById('vista-cancha');
  vSel.addEventListener('transitionend', function handler(e) {
    if (e.propertyName !== 'opacity') return;
    vSel.removeEventListener('transitionend', handler);
    cargarEquipo(id);
    requestAnimationFrame(() => vCan.classList.add('visible'));
  });
  vSel.classList.add('oculta');
}
function volverSeleccion() {
  const vSel = document.getElementById('vista-seleccion');
  const vCan = document.getElementById('vista-cancha');
  ocultarTarjetaJugador();
  vCan.addEventListener('transitionend', function handler(e) {
    if (e.propertyName !== 'opacity') return;
    vCan.removeEventListener('transitionend', handler);
    vSel.classList.remove('oculta');
  });
  vCan.classList.remove('visible');
}

/* ── SVG de avatar busto ── */
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
    <g filter="url(#${id}s)"><g filter="url(#${id}g)">
      <ellipse cx="50" cy="26" rx="18" ry="21" fill="#000" stroke="#fff" stroke-width="2.2"/>
      <path d="M 32 18 Q 33 6 50 5 Q 67 6 68 18 Q 60 11 50 12 Q 40 11 32 18 Z" fill="#000" stroke="#fff" stroke-width="1.5"/>
      <rect x="43" y="45" width="14" height="9" rx="3" fill="#000" stroke="#fff" stroke-width="1.8"/>
      <path d="M 2 90 C 2 65 10 60 22 57 C 30 54 40 53 43 52 L 57 52 C 60 53 70 54 78 57 C 90 60 98 65 98 90 Z" fill="#000" stroke="#fff" stroke-width="2.2"/>
      <path d="M 35 57 Q 50 52 65 57" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.2"/>
    </g></g>
  </svg>`;
}

/* ── Dibujar cancha ── */
function dibujarCancha() {
  const canvas = document.getElementById('lienzo-cancha');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function render() {
    const W = canvas.parentElement.offsetWidth||800, H = canvas.parentElement.offsetHeight||600;
    canvas.width=W; canvas.height=H; ctx.clearRect(0,0,W,H);

    const yTop=H*.10,yBot=H*.95,xCx=W*.50;
    const xTL=xCx-W*.28,xTR=xCx+W*.28,xBL=xCx-W*.46,xBR=xCx+W*.46;

    function pt(fx,fy){const xl=xTL+(xBL-xTL)*fy,xr=xTR+(xBR-xTR)*fy;return{x:xl+(xr-xl)*fx,y:yTop+(yBot-yTop)*fy};}

    const gSuelo=ctx.createLinearGradient(0,yTop,0,yBot);
    gSuelo.addColorStop(0,'#1c0e00');gSuelo.addColorStop(.4,'#321500');gSuelo.addColorStop(.8,'#3e1c00');gSuelo.addColorStop(1,'#260f00');
    ctx.beginPath();ctx.moveTo(xTL,yTop);ctx.lineTo(xTR,yTop);ctx.lineTo(xBR,yBot);ctx.lineTo(xBL,yBot);ctx.closePath();ctx.fillStyle=gSuelo;ctx.fill();

    ctx.save();ctx.beginPath();ctx.moveTo(xTL,yTop);ctx.lineTo(xTR,yTop);ctx.lineTo(xBR,yBot);ctx.lineTo(xBL,yBot);ctx.closePath();ctx.clip();
    for(let i=0;i<50;i++){const ty=i/50,y=yTop+(yBot-yTop)*ty,xl=xTL+(xBL-xTL)*ty,xr=xTR+(xBR-xTR)*ty;ctx.beginPath();ctx.moveTo(xl,y);ctx.lineTo(xr,y);ctx.strokeStyle=`rgba(255,160,40,${.03+Math.sin(i*.9)*.015})`;ctx.lineWidth=.7;ctx.stroke();}
    ctx.restore();

    ctx.beginPath();ctx.moveTo(pt(0,0).x,pt(0,0).y);ctx.lineTo(pt(1,0).x,pt(1,0).y);ctx.lineTo(pt(1,.33).x,pt(1,.33).y);ctx.lineTo(pt(0,.33).x,pt(0,.33).y);ctx.closePath();ctx.fillStyle='rgba(160,20,20,0.14)';ctx.fill();

    function lin(p1,p2,c,w,bl){ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.strokeStyle=c;ctx.lineWidth=w;if(bl){ctx.shadowColor=c;ctx.shadowBlur=bl;}ctx.stroke();ctx.shadowBlur=0;}
    ctx.beginPath();ctx.moveTo(xTL,yTop);ctx.lineTo(xTR,yTop);ctx.lineTo(xBR,yBot);ctx.lineTo(xBL,yBot);ctx.closePath();ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=2.5;ctx.shadowColor='#fff';ctx.shadowBlur=14;ctx.stroke();ctx.shadowBlur=0;
    lin(pt(0,.33),pt(1,.33),'rgba(255,255,255,.85)',2,8);
    lin(pt(.5,0),pt(.5,1),'rgba(255,255,255,.2)',1,0);

    const gRef=ctx.createRadialGradient(W/2,(yTop+yBot)/2,10,W/2,(yTop+yBot)/2,W*.35);
    gRef.addColorStop(0,'rgba(255,200,100,.06)');gRef.addColorStop(1,'rgba(0,0,0,0)');
    ctx.save();ctx.beginPath();ctx.moveTo(xTL,yTop);ctx.lineTo(xTR,yTop);ctx.lineTo(xBR,yBot);ctx.lineTo(xBL,yBot);ctx.closePath();ctx.clip();ctx.fillStyle=gRef;ctx.fillRect(0,0,W,H);ctx.restore();

    const redY=yTop,postH=110,redTop=redY-postH,mP=W*.045,pxL=xTL-mP,pxR=xTR+mP,netAncho=pxR-pxL;
    function poste(x){const gp=ctx.createLinearGradient(x-5,0,x+5,0);gp.addColorStop(0,'#666');gp.addColorStop(.4,'#eee');gp.addColorStop(1,'#333');ctx.beginPath();ctx.rect(x-4,redTop-10,8,postH+10);ctx.fillStyle=gp;ctx.fill();ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=.5;ctx.stroke();ctx.beginPath();ctx.ellipse(x,redY+4,11,5,0,0,Math.PI*2);ctx.fillStyle='#444';ctx.fill();ctx.beginPath();ctx.ellipse(x,redTop-10,5,3,0,0,Math.PI*2);ctx.fillStyle='#bbb';ctx.fill();}
    poste(pxL);poste(pxR);

    ctx.beginPath();ctx.moveTo(pxL,redTop);ctx.bezierCurveTo(pxL+netAncho*.25,redTop+5,pxR-netAncho*.25,redTop+5,pxR,redTop);ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.shadowColor='#fff';ctx.shadowBlur=20;ctx.stroke();ctx.shadowBlur=0;

    const bandH=10,gBanda=ctx.createLinearGradient(0,redTop,0,redTop+bandH);gBanda.addColorStop(0,'rgba(255,255,255,.98)');gBanda.addColorStop(1,'rgba(210,210,210,.7)');ctx.beginPath();ctx.rect(pxL,redTop,netAncho,bandH);ctx.fillStyle=gBanda;ctx.fill();
    const bandBotY=redY-bandH,gVerde=ctx.createLinearGradient(0,bandBotY,0,redY);gVerde.addColorStop(0,'rgba(0,160,55,.75)');gVerde.addColorStop(1,'rgba(0,200,75,.95)');ctx.beginPath();ctx.rect(pxL,bandBotY,netAncho,bandH);ctx.fillStyle=gVerde;ctx.fill();

    const mTop2=redTop+bandH,mBot2=bandBotY,mH=mBot2-mTop2,cH2=10,cW2=12;
    ctx.save();ctx.beginPath();ctx.rect(pxL,mTop2,netAncho,mH);ctx.clip();
    const gMalla=ctx.createLinearGradient(pxL,mTop2,pxL,mBot2);gMalla.addColorStop(0,'rgba(10,10,20,.8)');gMalla.addColorStop(1,'rgba(5,5,10,.9)');ctx.fillStyle=gMalla;ctx.fillRect(pxL,mTop2,netAncho,mH);
    const cH='rgba(180,190,200,.55)',cHG='rgba(220,230,240,.8)';
    for(let x=pxL;x<=pxR;x+=cW2){ctx.beginPath();ctx.moveTo(x,mTop2);ctx.lineTo(x,mBot2);const g=((x-pxL)%36<2);ctx.strokeStyle=g?cHG:cH;ctx.lineWidth=g?1.4:.7;if(g){ctx.shadowColor='rgba(200,220,255,.4)';ctx.shadowBlur=3;}ctx.stroke();ctx.shadowBlur=0;}
    for(let y=mTop2;y<=mBot2;y+=cH2){ctx.beginPath();ctx.moveTo(pxL,y);ctx.lineTo(pxR,y);const g=((y-mTop2)%30<2);ctx.strokeStyle=g?cHG:cH;ctx.lineWidth=g?1.4:.7;ctx.stroke();}
    const gPers=ctx.createLinearGradient(pxL,0,pxR,0);gPers.addColorStop(0,'rgba(0,0,0,.35)');gPers.addColorStop(.15,'rgba(0,0,0,0)');gPers.addColorStop(.85,'rgba(0,0,0,0)');gPers.addColorStop(1,'rgba(0,0,0,.35)');ctx.fillStyle=gPers;ctx.fillRect(pxL,mTop2,netAncho,mH);
    ctx.restore();
    ctx.beginPath();ctx.rect(pxL,redTop,netAncho,postH);ctx.strokeStyle='rgba(255,255,255,.1)';ctx.lineWidth=1;ctx.stroke();

    function antena(x){const segH=6,tot=postH*.7,sy=redTop+postH*.15;for(let s=0;s<Math.ceil(tot/segH);s++){ctx.beginPath();ctx.rect(x-2.5,sy+s*segH,5,Math.min(segH,tot-s*segH));ctx.fillStyle=s%2===0?'rgba(255,30,30,.95)':'rgba(255,255,255,.95)';ctx.fill();}}
    antena(xTL-1);antena(xTR+1);

    const gSombra=ctx.createLinearGradient(0,redY,0,redY+50);gSombra.addColorStop(0,'rgba(0,0,0,.5)');gSombra.addColorStop(1,'rgba(0,0,0,0)');
    ctx.save();ctx.beginPath();ctx.moveTo(xTL,yTop);ctx.lineTo(xTR,yTop);ctx.lineTo(xBR,yBot);ctx.lineTo(xBL,yBot);ctx.closePath();ctx.clip();
    const sR=pt(0,.06),sL=pt(1,.06);ctx.beginPath();ctx.moveTo(xTL,yTop);ctx.lineTo(xTR,yTop);ctx.lineTo(sL.x,sL.y);ctx.lineTo(sR.x,sR.y);ctx.closePath();ctx.fillStyle=gSombra;ctx.fill();ctx.restore();

    [.25,.5,.75].forEach(fx=>{const gF=ctx.createRadialGradient(W*fx,yTop,0,W*fx,yTop,W*.22);gF.addColorStop(0,'rgba(255,240,200,.12)');gF.addColorStop(1,'rgba(0,0,0,0)');ctx.save();ctx.beginPath();ctx.moveTo(xTL,yTop);ctx.lineTo(xTR,yTop);ctx.lineTo(xBR,yBot);ctx.lineTo(xBL,yBot);ctx.closePath();ctx.clip();ctx.fillStyle=gF;ctx.fillRect(0,0,W,H);ctx.restore();});
  }
  render();
  addEventListener('resize', render);
}

/* ── Cargar equipo en la cancha ── */
let equipoActual = null;
const POSICIONES = ['pos-4','pos-3','pos-2','pos-5','pos-6','pos-1'];

function cargarEquipo(id) {
  const datos = EQUIPOS[id]; if (!datos) return;
  equipoActual = id;
  document.getElementById('cancha-titulo-equipo').textContent = datos.nombre;
  document.getElementById('cancha-subtitulo').textContent     = datos.subtitulo;
  document.getElementById('tarjeta-jugador').className        = `tarjeta-jugador ${datos.claseColor}`;

  datos.jugadores.forEach((j, i) => {
    const el = document.getElementById(POSICIONES[i]); if (!el) return;
    const nc = el.cloneNode(true);
    el.parentNode.replaceChild(nc, el);
    const nuevo = document.getElementById(POSICIONES[i]);
    nuevo.querySelector('.icono-jugador').innerHTML = avatarSVG();
    nuevo.querySelector('.nombre-jugador').textContent = j.nombre;
    nuevo.addEventListener('mouseenter', ()=>mostrarTarjetaJugador(j, nuevo, datos.claseColor));
    nuevo.addEventListener('mouseleave', ()=>ocultarTarjetaJugador());
  });

  actualizarFlechas();
}

/* ── Flechas entre equipos ── */
function actualizarFlechas() {
  const orden = Object.keys(EQUIPOS);
  const idx   = orden.indexOf(equipoActual);
  document.getElementById('btn-equipo-anterior').classList.toggle('oculto', idx <= 0);
  document.getElementById('btn-equipo-siguiente').classList.toggle('oculto', idx >= orden.length - 1);
}

document.getElementById('btn-equipo-anterior').addEventListener('click', () => {
  const orden = Object.keys(EQUIPOS);
  const idx   = orden.indexOf(equipoActual);
  if (idx > 0) cargarEquipo(orden[idx - 1]);
});

document.getElementById('btn-equipo-siguiente').addEventListener('click', () => {
  const orden = Object.keys(EQUIPOS);
  const idx   = orden.indexOf(equipoActual);
  if (idx < orden.length - 1) cargarEquipo(orden[idx + 1]);
});

/* ── Tarjeta de jugador ── */
const tarjetaJugador = document.getElementById('tarjeta-jugador');
let temporizadorTarjeta = null;

function mostrarTarjetaJugador(j, el, claseColor) {
  clearTimeout(temporizadorTarjeta);
  document.getElementById('jugador-nombre').textContent   = j.nombreCompleto;
  document.getElementById('jugador-posicion').textContent = j.posicion;
  document.getElementById('jugador-edad').textContent     = j.edad + ' años';
  document.getElementById('jugador-altura').textContent   = j.altura;
  document.getElementById('jugador-peso').textContent     = j.peso;
  const foto = document.getElementById('jugador-foto');
  foto.src = rutaImg(j.foto); foto.alt = j.nombreCompleto;
  tarjetaJugador.className = `tarjeta-jugador ${claseColor}`;
  tarjetaJugador.style.display = 'block';
  posicionarTarjeta(el);
  requestAnimationFrame(()=>requestAnimationFrame(()=>tarjetaJugador.classList.add('visible')));
}
function ocultarTarjetaJugador() {
  tarjetaJugador.classList.remove('visible');
  temporizadorTarjeta = setTimeout(()=>{ tarjetaJugador.style.display='none'; }, 320);
}
function posicionarTarjeta(el) {
  const icono = el.querySelector('.icono-jugador');
  const r = (icono || el).getBoundingClientRect();
  const tj = tarjetaJugador.getBoundingClientRect();
  const H2 = tj.height || 320;
  const W2 = tj.width  || 230;
  const mg = 8;
  let top  = r.top - H2 - mg;
  let left = r.left + r.width / 2 - W2 / 2;
  top  = Math.max(mg, top);
  left = Math.max(mg, Math.min(left, innerWidth - W2 - mg));
  tarjetaJugador.style.left = left + 'px';
  tarjetaJugador.style.top  = top  + 'px';
}

/* ── Logo → volver al inicio ── */
document.getElementById('logo-inicio').addEventListener('click', ()=>{ window.location.href='/'; });

/* ── Botón volver ── */
document.getElementById('btn-volver').addEventListener('click', volverSeleccion);

/* ── Init ── */
document.addEventListener('DOMContentLoaded', async () => {
  await cargarDatos();
  iniciarTarjetas();
  dibujarCancha();
});