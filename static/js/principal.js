'use strict';

/* ═══════════════════════════════════════════════════════════
   LIENZO DE FONDO — estrellas + borde serpiente
   Un solo canvas fixed, z-index alto, pointer-events:none
   Las estrellas se ven siempre porque este canvas está
   ENCIMA de los slides (que son position:absolute dentro
   de escena-principal, un stacking context separado).
═══════════════════════════════════════════════════════════ */
const lienzoFondo = document.getElementById('lienzo-fondo');
const ctxF        = lienzoFondo.getContext('2d');

/* Garantizar z-index alto directamente en el elemento */
lienzoFondo.style.zIndex        = '50';
lienzoFondo.style.pointerEvents = 'none';
lienzoFondo.style.position      = 'fixed';
lienzoFondo.style.inset         = '0';
lienzoFondo.style.width         = '100%';
lienzoFondo.style.height        = '100%';

let estrellas = [];
const SERPIENTE = { t: 0, vel: 0.0018, long: 0.32, pts: [], anchoC: 0, altoC: 0 };

function reiniciarFondo() {
  lienzoFondo.width  = innerWidth;
  lienzoFondo.height = innerHeight;
  estrellas = Array.from({ length: 80 }, () => ({
    x:  Math.random() * lienzoFondo.width,
    y:  Math.random() * lienzoFondo.height,
    r:  Math.random() * 1.4 + 0.3,
    op: Math.random() * 0.5 + 0.1,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
  }));
  SERPIENTE.pts = []; // fuerza recalculo
}
reiniciarFondo();
addEventListener('resize', reiniciarFondo);

/* Genera los puntos del perímetro para la serpiente */
function generarPerimetro(w, h, r, n) {
  const pts = [], paso = (2*(w-2*r) + 2*(h-2*r) + 2*Math.PI*r) / n;
  function seg(x0,y0,x1,y1) {
    const d=Math.hypot(x1-x0,y1-y0), s=Math.max(1,~~(d/paso));
    for(let i=0;i<s;i++){const f=i/s; pts.push({x:x0+f*(x1-x0),y:y0+f*(y1-y0)});}
  }
  function arco(cx,cy,ra,a0,a1) {
    const s=Math.max(2,~~(ra*Math.abs(a1-a0)/paso));
    for(let i=0;i<s;i++){const a=a0+i/s*(a1-a0); pts.push({x:cx+Math.cos(a)*ra,y:cy+Math.sin(a)*ra});}
  }
  const PI=Math.PI;
  seg(r,0,w-r,0); arco(w-r,r,r,-PI/2,0);
  seg(w,r,w,h-r); arco(w-r,h-r,r,0,PI/2);
  seg(w-r,h,r,h); arco(r,h-r,r,PI/2,PI);
  seg(0,h-r,0,r); arco(r,r,r,PI,3*PI/2);
  return pts;
}
function colorArco(p) {
  if (p < .5) { const f=p/.5; return `rgb(${~~(f*255)},${~~(200+f*55)},${~~(83+f*172)})`; }
  const f=(p-.5)/.5; return `rgb(255,${~~(255-f*255)},${~~(255-f*255)})`;
}

(function loop() {
  const w = lienzoFondo.width, h = lienzoFondo.height;
  ctxF.clearRect(0, 0, w, h);

  /* ── Estrellas ── */
  estrellas.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
    if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
    ctxF.beginPath(); ctxF.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctxF.fillStyle = `rgba(255,255,255,${p.op})`; ctxF.fill();
  });

  /* ── Serpiente ── */
  if (!w || !h) { requestAnimationFrame(loop); return; }
  if (w !== SERPIENTE.anchoC || h !== SERPIENTE.altoC) {
    SERPIENTE.pts = generarPerimetro(w, h, 6, 300);
    SERPIENTE.anchoC = w; SERPIENTE.altoC = h;
  }
  const pts = SERPIENTE.pts, n = pts.length;
  if (n >= 2) {
    SERPIENTE.t = (SERPIENTE.t + SERPIENTE.vel) % 1;
    const cola  = ~~(((SERPIENTE.t - SERPIENTE.long + 1) % 1) * n);
    const pasos = ~~(n * SERPIENTE.long);
    for (let i = 0; i < pasos; i++) {
      const idx=(cola+i)%n, sig=(idx+1)%n, p=i/pasos;
      ctxF.beginPath(); ctxF.moveTo(pts[idx].x, pts[idx].y); ctxF.lineTo(pts[sig].x, pts[sig].y);
      ctxF.strokeStyle=colorArco(p); ctxF.globalAlpha=.4+p*.6;
      ctxF.lineWidth=1.5+p*2.5; ctxF.shadowColor=colorArco(p); ctxF.shadowBlur=8+p*12;
      ctxF.stroke();
    }
    ctxF.globalAlpha = 1; ctxF.shadowBlur = 0;
  }

  requestAnimationFrame(loop);
})();

/* ═══════════════════════════════════════════════════════════
   DIAPOSITIVAS
   Reemplaza imagen: null con la ruta real, ej: "/static/img/italia.jpg"
═══════════════════════════════════════════════════════════ */
const DIAPOSITIVAS = [
  { imagen: null, tinte: 'rgba(0,0,0,0.45)',   acento: '#ffffff', entrada: 'zoom' },
  { imagen: null, tinte: 'rgba(0,20,70,0.50)', acento: '#00C853', entrada: 'izq'  },
  { imagen: null, tinte: 'rgba(30,20,0,0.50)', acento: '#FFD600', entrada: 'der'  },
  { imagen: null, tinte: 'rgba(50,0,10,0.50)', acento: '#E53935', entrada: 'izq'  },
];
const PAISES = ['', '🇮🇹 ITALIA', '🇧🇷 BRASIL', '🇵🇱 POLONIA'];
const FONDOS = [
  'linear-gradient(135deg,#0a0a0a,#1a1a1a)',
  'linear-gradient(135deg,#000814,#001d3d)',
  'linear-gradient(135deg,#1a0a00,#2d1600)',
  'linear-gradient(135deg,#1a0000,#2d0010)',
];

document.getElementById('lienzo-animacion').style.display = 'none';
const envoltura = Object.assign(document.createElement('div'), {
  style: 'position:absolute;inset:0;overflow:hidden;z-index:1;',
});
document.querySelector('.escena-principal').prepend(envoltura);

const diapositivas = DIAPOSITIVAS.map((cfg, i) => {
  const el = Object.assign(document.createElement('div'), {
    style: `position:absolute;inset:0;will-change:transform;z-index:${i === 0 ? 2 : 1};
            opacity:1;
            background:${cfg.imagen ? `url(${cfg.imagen}) center/cover` : FONDOS[i]};
            display:${i === 0 ? 'block' : 'none'};`,
  });
  el.insertAdjacentHTML('beforeend',
    `<div style="position:absolute;inset:0;background:${cfg.tinte}"></div>`);
  const lineaAcento = Object.assign(document.createElement('div'), {
    style: `position:absolute;bottom:0;left:0;width:100%;height:3px;
            background:${cfg.acento};box-shadow:0 0 20px ${cfg.acento};
            opacity:${i ? 0 : 1};transition:opacity .4s ease;`,
  });
  el.append(lineaAcento); el._lineaAcento = lineaAcento;
  if (PAISES[i]) el.insertAdjacentHTML('beforeend',
    `<div style="position:absolute;top:50%;right:8vw;transform:translateY(-50%);
      font-family:'Bebas Neue',sans-serif;font-size:clamp(3rem,9vw,8rem);
      color:${cfg.acento};opacity:.15;letter-spacing:.1em;pointer-events:none;
      text-shadow:0 0 40px ${cfg.acento}80;">${PAISES[i]}</div>`);
  envoltura.append(el);
  return el;
});

/* ── Textos ── */
const bloqueTextos = [1,2,3,4].map(n => document.getElementById(`texto-slide-${n}`));
let slideActual = 0;
function mostrarTexto(idx) {
  bloqueTextos.forEach((t, i) => {
    if (!t) return;
    t.classList.toggle('visible', i === idx);
    t.classList.toggle('oculto',  i !== idx);
  });
}

/* ── Transición sin pallor ──
   Técnica: el entrante empieza invisible encima (z-index mayor),
   hace fade-in. El saliente nunca se desvanece — simplemente queda
   debajo y se oculta con display:none al terminar.
   Resultado: siempre hay un slide 100% opaco visible → cero pallor.
═══════════════════════════════════════════════════════════ */
const DURACION = 320;
let animando = false;

function irASlide(destino) {
  if (destino < 0 || destino >= diapositivas.length || destino === slideActual || animando) return;
  animando = true;

  const { entrada } = DIAPOSITIVAS[destino];
  const entrante = diapositivas[destino];
  const saliente = diapositivas[slideActual];

  /* Preparar entrante: visible en DOM pero invisible, encima del saliente */
  entrante.style.transition = 'none';
  entrante.style.opacity    = '0';
  entrante.style.zIndex     = '3';
  entrante.style.display    = 'block';
  const dir = destino > slideActual ? 1 : -1;
  entrante.style.transform  =
    entrada === 'zoom' ? 'scale(1.06)' :
    entrada === 'izq'  ? `translateX(${dir > 0 ? '5%' : '-5%'})` :
                         `translateX(${dir > 0 ? '-5%' : '5%'})`;

  saliente.style.zIndex = '2';

  entrante.getBoundingClientRect(); // reflow

  /* Animar solo el entrante — el saliente queda quieto y opaco debajo */
  entrante.style.transition = `opacity ${DURACION}ms ease, transform ${DURACION}ms ease`;
  entrante.style.opacity    = '1';
  entrante.style.transform  = 'none';

  saliente._lineaAcento && (saliente._lineaAcento.style.opacity = '0');
  setTimeout(() => {
    entrante._lineaAcento && (entrante._lineaAcento.style.opacity = '1');
  }, DURACION * .5);

  setTimeout(() => {
    /* Ocultar el saliente ahora que el entrante ya está encima al 100% */
    saliente.style.display = 'none';
    saliente.style.zIndex  = '1';
    animando = false;
  }, DURACION + 20);

  slideActual = destino;
  mostrarTexto(destino);
  actualizarPuntos();
}

/* ── Puntos de navegación ── */
const navPuntos = Object.assign(document.createElement('div'), {
  style: 'position:fixed;right:1.8rem;top:50%;transform:translateY(-50%);z-index:60;display:flex;flex-direction:column;gap:.7rem;',
});
const puntos = DIAPOSITIVAS.map((_, i) => {
  const p = Object.assign(document.createElement('div'), {
    style: 'width:6px;height:6px;border-radius:50%;cursor:pointer;transition:.3s;background:rgba(255,255,255,.25);',
  });
  p.onclick = () => irASlide(i); navPuntos.append(p); return p;
});
document.body.append(navPuntos);

function actualizarPuntos() {
  puntos.forEach((p, i) => {
    const activo = i === slideActual;
    p.style.background = activo ? DIAPOSITIVAS[i].acento : 'rgba(255,255,255,.25)';
    p.style.boxShadow  = activo ? `0 0 10px ${DIAPOSITIVAS[i].acento}` : 'none';
    p.style.transform  = activo ? 'scale(1.5)' : 'scale(1)';
  });
}

/* ── Logo → primer slide ── */
document.getElementById('logo-inicio').addEventListener('click', () => irASlide(0));

/* ── Inputs ── */
let enfriamientoRueda = false;
window.addEventListener('wheel', e => {
  e.preventDefault();
  if (enfriamientoRueda) return;
  enfriamientoRueda = true;
  setTimeout(() => enfriamientoRueda = false, 180);
  irASlide(slideActual + (e.deltaY > 0 ? 1 : -1));
}, { passive: false });

let inicioToque = 0;
window.addEventListener('touchstart', e => inicioToque = e.touches[0].clientY, { passive: true });
window.addEventListener('touchend', e => {
  const diff = inicioToque - e.changedTouches[0].clientY;
  if (Math.abs(diff) > 40) irASlide(slideActual + (diff > 0 ? 1 : -1));
}, { passive: true });

window.addEventListener('keydown', e => {
  if (['ArrowDown','ArrowRight','PageDown',' '].includes(e.key)) { e.preventDefault(); irASlide(slideActual + 1); }
  if (['ArrowUp','ArrowLeft','PageUp'].includes(e.key))          { e.preventDefault(); irASlide(slideActual - 1); }
});

/* ── Init ── */
document.body.style.overflow = 'hidden';
mostrarTexto(0);
actualizarPuntos();