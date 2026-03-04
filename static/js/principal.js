/* ============================================================
   PRINCIPAL.JS v6
   Fix: retroceder desde Frame 4 funciona siempre
   Fix: scroll en Frame 4 después de explosión → loop a Frame 1
   ============================================================ */
'use strict';

/*  UTILIDADES ─ */
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));
const eio   = t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
const rand  = (mn, mx) => Math.random()*(mx-mn)+mn;

/*  FONDO ─ */
const canvasFondo = document.getElementById('canvas-fondo');
const ctxF = canvasFondo.getContext('2d');
let particulasFondo = [];

function ajustarFondo() {
  canvasFondo.width  = window.innerWidth;
  canvasFondo.height = window.innerHeight;
}
function crearParticulas() {
  particulasFondo = [];
  for (let i = 0; i < 80; i++) {
    particulasFondo.push({
      x: rand(0, canvasFondo.width),  y: rand(0, canvasFondo.height),
      r: rand(0.3, 1.8), o: rand(0.05, 0.45),
      vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3),
    });
  }
}
function animarFondo() {
  ctxF.clearRect(0, 0, canvasFondo.width, canvasFondo.height);
  for (const p of particulasFondo) {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > canvasFondo.width)  p.vx *= -1;
    if (p.y < 0 || p.y > canvasFondo.height) p.vy *= -1;
    ctxF.beginPath();
    ctxF.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctxF.fillStyle = `rgba(255,255,255,${p.o})`;
    ctxF.fill();
  }
  requestAnimationFrame(animarFondo);
}
ajustarFondo(); crearParticulas(); animarFondo();
window.addEventListener('resize', () => { ajustarFondo(); crearParticulas(); });

/*  JUGADOR 14 VÉRTICES ─ */
const aristasJugador = [
  [0,1],[1,13],[13,2],[13,3],[2,4],[4,6],[3,5],[5,7],
  [1,8],[8,9],[8,10],[9,11],[10,12],
];

/*  FRAMES CLAVE  */
const FRAMES_CLAVE = [
  {
    titulo:0,
    pose:[
      [0.35,0.15],[0.35,0.24],[0.27,0.28],[0.43,0.28],
      [0.23,0.42],[0.44,0.40],[0.27,0.53],[0.44,0.50],
      [0.35,0.55],[0.30,0.70],[0.40,0.70],[0.28,0.88],[0.42,0.88],[0.35,0.38],
    ],
    balon:{xNorm:0.27,yNorm:0.56,radio:28,escalaX:1,escalaY:1},
    colorLineas:{r:255,g:255,b:255}, rotando:false,
    destello:0,llamas:0,estelas:0,opacidadJugador:1,
  },
  {
    titulo:1,
    pose:[
      [0.36,0.13],[0.36,0.22],[0.27,0.27],[0.45,0.27],
      [0.22,0.18],[0.46,0.38],[0.20,0.09],[0.46,0.48],
      [0.36,0.55],[0.28,0.70],[0.44,0.68],[0.24,0.87],[0.46,0.85],[0.36,0.38],
    ],
    balon:{xNorm:0.20,yNorm:0.05,radio:28,escalaX:1,escalaY:1},
    colorLineas:{r:0,g:200,b:83}, rotando:true,
    destello:0,llamas:0,estelas:0,opacidadJugador:1,
  },
  {
    titulo:2,
    pose:[
      [0.38,0.08],[0.38,0.17],[0.28,0.22],[0.48,0.22],
      [0.22,0.12],[0.50,0.30],[0.18,0.03],[0.50,0.40],
      [0.36,0.52],[0.28,0.66],[0.44,0.63],[0.25,0.80],[0.46,0.78],[0.37,0.35],
    ],
    balon:{xNorm:0.17,yNorm:0.02,radio:30,escalaX:1,escalaY:1},
    colorLineas:{r:229,g:57,b:53}, rotando:true,
    destello:1,llamas:0,estelas:0,opacidadJugador:1,
  },
  {
    titulo:3,
    pose:[
      [0.37,0.18],[0.37,0.27],[0.28,0.32],[0.46,0.30],
      [0.24,0.20],[0.48,0.40],[0.22,0.30],[0.48,0.50],
      [0.37,0.57],[0.30,0.72],[0.44,0.70],[0.28,0.88],[0.46,0.87],[0.37,0.41],
    ],
    balon:{xNorm:0.50,yNorm:0.42,radio:55,escalaX:0.75,escalaY:1.20},
    colorLineas:{r:229,g:57,b:53}, rotando:true,
    destello:0,llamas:1,estelas:1,opacidadJugador:0,
  },
];

/*  SUB-KEYFRAMES (30 pasos)  */
const SUB_PASOS = 30;

function interpolarFrame(fA, fB, t) {
  const e = eio(t);
  return {
    pose: fA.pose.map((v,i)=>[lerp(v[0],fB.pose[i][0],e), lerp(v[1],fB.pose[i][1],e)]),
    balon:{
      xNorm:   lerp(fA.balon.xNorm,   fB.balon.xNorm,   e),
      yNorm:   lerp(fA.balon.yNorm,   fB.balon.yNorm,   e),
      radio:   lerp(fA.balon.radio,   fB.balon.radio,   e),
      escalaX: lerp(fA.balon.escalaX, fB.balon.escalaX, e),
      escalaY: lerp(fA.balon.escalaY, fB.balon.escalaY, e),
    },
    colorLineas:{
      r:Math.round(lerp(fA.colorLineas.r,fB.colorLineas.r,e)),
      g:Math.round(lerp(fA.colorLineas.g,fB.colorLineas.g,e)),
      b:Math.round(lerp(fA.colorLineas.b,fB.colorLineas.b,e)),
    },
    rotando:         t>0.1?(fA.rotando||fB.rotando):fA.rotando,
    destello:        lerp(fA.destello,        fB.destello,        e),
    llamas:          lerp(fA.llamas,          fB.llamas,          e),
    estelas:         lerp(fA.estelas,         fB.estelas,         e),
    opacidadJugador: lerp(fA.opacidadJugador, fB.opacidadJugador, e),
    titulo:          t>=0.5 ? fB.titulo : fA.titulo,
  };
}

const subKF = [];
for (let s=0; s<3; s++) {
  const seg=[];
  for (let p=0; p<=SUB_PASOS; p++)
    seg.push(interpolarFrame(FRAMES_CLAVE[s], FRAMES_CLAVE[s+1], p/SUB_PASOS));
  subKF.push(seg);
}

/*  PARTÍCULAS DE FUEGO / EXPLOSIÓN  */
let particulas = [];

function emitirParticula(cx, cy, r, tipo) {
  if (tipo === 'fuego') {
    const angulo = rand(-Math.PI, Math.PI);
    const dist   = rand(r*0.7, r*1.05);
    particulas.push({
      x: cx+Math.cos(angulo)*dist, y: cy+Math.sin(angulo)*dist,
      vx: Math.cos(angulo)*rand(0.4,2), vy: Math.sin(angulo)*rand(0.4,2)-rand(0.5,2.5),
      vida:1, decaida:rand(0.02,0.045), tamaño:rand(r*0.07,r*0.2),
      tipo:'fuego', color:Math.random()<0.5?0:1,
    });
  } else {
    const angulo = rand(0, Math.PI*2);
    const vel    = rand(3,16);
    particulas.push({
      x:cx, y:cy,
      vx:Math.cos(angulo)*vel, vy:Math.sin(angulo)*vel-rand(0,4),
      vida:1, decaida:rand(0.006,0.018), tamaño:rand(2,9),
      tipo:'explosion', color:Math.floor(rand(0,3)), gravedad:rand(0.08,0.25),
    });
  }
}

function actualizarParticulas() {
  particulas = particulas.filter(p=>p.vida>0&&p.tamaño>0.2);
  for (const p of particulas) {
    p.x+=p.vx; p.y+=p.vy;
    if (p.tipo==='explosion') { p.vy+=p.gravedad; p.vx*=0.985; }
    else { p.vx*=0.94; p.vy*=0.94; }
    p.vida-=p.decaida;
    p.tamaño*=0.975;
  }
}

function dibujarParticulas() {
  for (const p of particulas) {
    if (p.vida<=0||p.tamaño<0.2) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0,p.vida)*0.9;
    if (p.tipo==='fuego') {
      const cols=[['rgba(255,200,0,1)','rgba(255,80,0,0)'],['rgba(255,255,150,1)','rgba(255,160,0,0)']];
      const [c1,c2]=cols[p.color];
      const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.tamaño);
      g.addColorStop(0,c1); g.addColorStop(1,c2);
      ctx.beginPath(); ctx.arc(p.x,p.y,p.tamaño,0,Math.PI*2);
      ctx.fillStyle=g; ctx.fill();
    } else {
      const pal=[['rgba(255,80,30,1)','rgba(200,0,0,0)'],['rgba(255,160,0,1)','rgba(255,60,0,0)'],['rgba(255,255,220,1)','rgba(255,200,100,0)']];
      const [c1,c2]=pal[p.color];
      const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.tamaño);
      g.addColorStop(0,c1); g.addColorStop(1,c2);
      ctx.beginPath(); ctx.arc(p.x,p.y,p.tamaño,0,Math.PI*2);
      ctx.fillStyle=g; ctx.shadowColor=c1; ctx.shadowBlur=p.tamaño*1.5; ctx.fill();
    }
    ctx.restore();
  }
}

/*  ESTADO FRAME 4  */
// Fase del frame 4:
//   'inactivo'   — no estamos en F4
//   'animando'   — balón viaja y crece con fuego
//   'explotando' — explosión activa (partículas volando)
//   'terminado'  — explosión acabó, esperando scroll
const f4 = {
  fase:     'inactivo',
  progreso: 0,
  tiempoExplosion: 0,
};

function resetearF4() {
  f4.fase     = 'inactivo';
  f4.progreso = 0;
  f4.tiempoExplosion = 0;
  particulas  = [];
}

/*  MÁQUINA DE ESTADOS  */
const maquina = {
  frameActual: 0,
  enViaje:     false,
  pasoViaje:   0,
  direccion:   1,
  ultimoTick:  0,
  MS_POR_PASO: 33,
};

let estadoVisual = {
  ...FRAMES_CLAVE[0],
  pose: FRAMES_CLAVE[0].pose.map(v=>[...v]),
};
let rotBalon = 0;

/*  DISPARADOR CENTRAL  */
function dispararViaje(dir) {
  // Nunca bloquear si hay un viaje — simplemente ignorar inputs durante viaje
  if (maquina.enViaje) return;

  /* --- Casos especiales del Frame 4 --- */
  if (maquina.frameActual === 3) {

    // Retroceder desde F4: SIEMPRE permitido, cancelar todo lo de F4
    if (dir === -1) {
      resetearF4();
      // Iniciar viaje normal hacia atrás (F4→F3)
      maquina.direccion  = -1;
      maquina.pasoViaje  = 0;
      maquina.enViaje    = true;
      maquina.ultimoTick = performance.now();
      return;
    }

    // Bajar en F4
    if (dir === 1) {
      if (f4.fase === 'inactivo' || f4.fase === 'animando') {
        // Todavía no hizo nada o está animando → no hacer nada, la animación sigue sola
        return;
      }
      if (f4.fase === 'terminado') {
        // Explosión terminó → LOOP: volver al Frame 1 limpiamente
        resetearF4();
        rotBalon = 0;
        maquina.frameActual = 0;
        estadoVisual = {
          ...FRAMES_CLAVE[0],
          pose: FRAMES_CLAVE[0].pose.map(v=>[...v]),
        };
        mostrarTexto(0);
        return;
      }
      if (f4.fase === 'explotando') {
        // Esperar a que termine la explosión
        return;
      }
    }
  }

  /* --- Comportamiento normal (Frames 0-2) --- */
  const destino = maquina.frameActual + dir;
  if (destino < 0) return;      // ya estamos al inicio
  if (destino > 3) return;      // nunca debe pasar, pero por seguridad

  maquina.direccion  = dir;
  maquina.pasoViaje  = 0;
  maquina.enViaje    = true;
  maquina.ultimoTick = performance.now();
}

/*  INPUTS  */
let cooldownWheel = false;
window.addEventListener('wheel', e => {
  e.preventDefault();
  if (cooldownWheel) return;
  cooldownWheel = true;
  setTimeout(() => { cooldownWheel = false; }, 400);
  dispararViaje(e.deltaY > 0 ? 1 : -1);
}, { passive: false });

let touchStartY = 0;
window.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
window.addEventListener('touchend',   e => {
  const diff = touchStartY - e.changedTouches[0].clientY;
  if (Math.abs(diff) > 40) dispararViaje(diff > 0 ? 1 : -1);
}, { passive: true });

window.addEventListener('keydown', e => {
  if (['ArrowDown','ArrowRight','PageDown',' '].includes(e.key)) { e.preventDefault(); dispararViaje(1); }
  if (['ArrowUp','ArrowLeft','PageUp'].includes(e.key))          { e.preventDefault(); dispararViaje(-1); }
});

/*  CANVAS ANIMACIÓN  */
const canvasAnim = document.getElementById('canvas-animacion');
const ctx = canvasAnim.getContext('2d');
let anchoCanvas, altoCanvas;
function ajustarCanvasAnim() {
  anchoCanvas = canvasAnim.width  = window.innerWidth;
  altoCanvas  = canvasAnim.height = window.innerHeight;
}
ajustarCanvasAnim();
window.addEventListener('resize', ajustarCanvasAnim);

/*  TEXTOS  */
const textosFrame = [
  document.getElementById('texto-frame-1'),
  document.getElementById('texto-frame-2'),
  document.getElementById('texto-frame-3'),
  document.getElementById('texto-frame-4'),
];
let tituloActual = -1;
function mostrarTexto(i) {
  if (i === tituloActual) return;
  tituloActual = i;
  textosFrame.forEach((el, idx) => el.classList.toggle('oculto', idx !== i));
}

/*  DIBUJO: JUGADOR ─ */
function dibujarJugador(vertices, col, opacidad) {
  if (opacidad <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = opacidad;
  const cStr = `rgb(${col.r},${col.g},${col.b})`;
  ctx.shadowColor = cStr; ctx.shadowBlur = 15;
  ctx.strokeStyle = cStr; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  for (const [i,j] of aristasJugador) {
    ctx.beginPath();
    ctx.moveTo(vertices[i][0]*anchoCanvas, vertices[i][1]*altoCanvas);
    ctx.lineTo(vertices[j][0]*anchoCanvas, vertices[j][1]*altoCanvas);
    ctx.stroke();
  }
  ctx.fillStyle = cStr; ctx.shadowBlur = 20;
  for (const v of vertices) {
    ctx.beginPath(); ctx.arc(v[0]*anchoCanvas, v[1]*altoCanvas, 3, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

/*  DIBUJO: BALÓN FOTORREALISTA (A+B)  */
/*  DIBUJO: BALÓN NEÓN (sin relleno, líneas brillantes)  */
function dibujarBalonFoto(cx, cy, r, rot, escX, escY, destello, opacidad) {
  if (opacidad <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = opacidad;
  ctx.translate(cx, cy);
  ctx.scale(escX, escY);
  ctx.rotate(rot);

  // Destello de impacto (halo exterior)
  if (destello > 0.01) {
    const rd = r*(1+destello*3.5);
    const gd = ctx.createRadialGradient(0,0,r*0.5,0,0,rd);
    gd.addColorStop(0,`rgba(255,230,100,${destello*0.7})`);
    gd.addColorStop(0.4,`rgba(255,80,20,${destello*0.4})`);
    gd.addColorStop(1,'rgba(229,57,53,0)');
    ctx.beginPath(); ctx.arc(0,0,rd,0,Math.PI*2);
    ctx.fillStyle=gd; ctx.fill();
  }

  // Halo de brillo suave alrededor del balón (neón ambiental)
  const gHalo = ctx.createRadialGradient(0,0,r*0.85,0,0,r*1.5);
  gHalo.addColorStop(0,'rgba(255,255,255,0.06)');
  gHalo.addColorStop(1,'rgba(255,255,255,0)');
  ctx.beginPath(); ctx.arc(0,0,r*1.5,0,Math.PI*2);
  ctx.fillStyle=gHalo; ctx.fill();

  // Círculo exterior — neón blanco
  ctx.shadowColor='#ffffff'; ctx.shadowBlur=22;
  ctx.strokeStyle='rgba(255,255,255,0.92)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke();

  // Segunda pasada más fina para el brillo interno del borde
  ctx.shadowBlur=8;
  ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=0.8;
  ctx.beginPath(); ctx.arc(0,0,r*0.94,0,Math.PI*2); ctx.stroke();

  // Panel superior — neón verde
  ctx.shadowColor='#00C853'; ctx.shadowBlur=18;
  ctx.strokeStyle='#00C853'; ctx.lineWidth=2.2; ctx.lineCap='round';
  ctx.beginPath();
  ctx.moveTo(-r*0.88,-r*0.25);
  ctx.bezierCurveTo(-r*0.4,-r*0.92, r*0.4,-r*0.92, r*0.88,-r*0.25);
  ctx.stroke();
  // Borde interior más fino (profundidad)
  ctx.strokeStyle='rgba(0,200,83,0.35)'; ctx.lineWidth=1; ctx.shadowBlur=6;
  ctx.beginPath();
  ctx.moveTo(-r*0.82,-r*0.28);
  ctx.bezierCurveTo(-r*0.38,-r*0.84, r*0.38,-r*0.84, r*0.82,-r*0.28);
  ctx.stroke();

  // Panel inferior — neón rojo
  ctx.shadowColor='#FF1744'; ctx.shadowBlur=18;
  ctx.strokeStyle='#FF1744'; ctx.lineWidth=2.2;
  ctx.beginPath();
  ctx.moveTo(-r*0.88,r*0.25);
  ctx.bezierCurveTo(-r*0.4,r*0.92, r*0.4,r*0.92, r*0.88,r*0.25);
  ctx.stroke();
  ctx.strokeStyle='rgba(255,23,68,0.35)'; ctx.lineWidth=1; ctx.shadowBlur=6;
  ctx.beginPath();
  ctx.moveTo(-r*0.82,r*0.28);
  ctx.bezierCurveTo(-r*0.38,r*0.84, r*0.38,r*0.84, r*0.82,r*0.28);
  ctx.stroke();

  // Costuras meridiano y ecuador — neón blanco
  ctx.shadowColor='rgba(255,255,255,0.9)'; ctx.shadowBlur=12;
  ctx.strokeStyle='rgba(255,255,255,0.85)'; ctx.lineWidth=1.6;
  const curvas=[
    [0,-r, r*0.45,-r*0.5, r*0.45,r*0.5, 0,r],
    [0,-r,-r*0.45,-r*0.5,-r*0.45,r*0.5, 0,r],
    [-r,0,-r*0.5,-r*0.35,r*0.5,-r*0.35,r,0],
    [-r,0,-r*0.5, r*0.35,r*0.5, r*0.35,r,0],
  ];
  for (const [x1,y1,cx1,cy1,cx2,cy2,x2,y2] of curvas) {
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.bezierCurveTo(cx1,cy1,cx2,cy2,x2,y2); ctx.stroke();
  }

  // Reflejo especular pequeño (punto de luz cristal)
  ctx.shadowBlur=0;
  const gSpec = ctx.createRadialGradient(-r*0.38,-r*0.40,0,-r*0.38,-r*0.40,r*0.22);
  gSpec.addColorStop(0,'rgba(255,255,255,0.55)');
  gSpec.addColorStop(1,'rgba(255,255,255,0)');
  ctx.beginPath(); ctx.arc(-r*0.38,-r*0.40,r*0.22,0,Math.PI*2);
  ctx.fillStyle=gSpec; ctx.fill();

  ctx.restore();
}

/*  DIBUJO: FUEGO EN BORDE EXTERIOR (orientado hacia atrás) */
// dirX: dirección horizontal del movimiento (positivo=derecha, negativo=izquierda)
// En Frame 4 el balón va hacia la derecha, así que el fuego sale hacia la izquierda
function dibujarLlamas(cx, cy, r, intensidad, dirX) {
  if (intensidad <= 0.01) return;
  const t = performance.now()*0.001;
  // Ángulo base: el fuego sale opuesto a la dirección de movimiento
  // dirX > 0 (va a la derecha) → fuego en el lado izquierdo (ángulo base = PI)
  // dirX <= 0 → fuego en el lado derecho (ángulo base = 0)
  const angBase = (dirX > 0) ? Math.PI : 0;
  const spread  = Math.PI * 0.52;  // apertura del cono de fuego

  ctx.save();
  const n = 18;
  for (let i=0; i<n; i++) {
    // Distribuir llamas en el semicírculo trasero del balón
    const fraccion  = (i / (n-1)) - 0.5;                  // -0.5 .. 0.5
    const angLlama  = angBase + fraccion * spread * 2;
    const oscAng    = Math.sin(t*3.8 + i*0.65) * 0.18;
    const ang       = angLlama + oscAng;

    // Punto de origen: en el borde exterior del balón
    const origenX = cx + Math.cos(ang) * r;
    const origenY = cy + Math.sin(ang) * r;

    // Longitud: más largas en el centro, más cortas en los extremos
    const centrado = 1 - Math.abs(fraccion)*2;            // 0..1, máx en centro
    const oscLen   = Math.sin(t*5.2 + i*1.1) * 0.35 + 1;
    const largo    = r * (0.9 + centrado*1.6 + oscLen*0.5) * intensidad;

    // Punto final: se aleja en la dirección del fuego (opuesto al movimiento)
    const finX = origenX + Math.cos(ang) * largo;
    const finY = origenY + Math.sin(ang) * largo * 0.7;   // aplanado en Y = más dinámico

    ctx.globalAlpha = intensidad * (0.5 + centrado*0.45);
    const gl = ctx.createLinearGradient(origenX, origenY, finX, finY);
    gl.addColorStop(0,   'rgba(255,255,180,1)');
    gl.addColorStop(0.1, 'rgba(255,200,0,0.95)');
    gl.addColorStop(0.35,'rgba(255,100,0,0.75)');
    gl.addColorStop(0.65,'rgba(200,20,0,0.4)');
    gl.addColorStop(1,   'rgba(80,0,0,0)');

    ctx.beginPath();
    // Curva suave que simula turbulencia
    const ctrlX = origenX + Math.cos(ang + Math.sin(t*2+i)*0.3) * largo*0.5;
    const ctrlY = origenY + Math.sin(ang + Math.sin(t*2+i)*0.3) * largo*0.5;
    ctx.moveTo(origenX, origenY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, finX, finY);
    ctx.lineWidth   = (r*0.55 * centrado * oscLen) * intensidad;
    ctx.strokeStyle = gl;
    ctx.lineCap     = 'round';
    ctx.shadowColor = '#ff6a00'; ctx.shadowBlur = 28;
    ctx.stroke();
  }

  // Núcleo brillante en el borde trasero (punto más caliente)
  ctx.globalAlpha = intensidad * 0.7;
  const origenCentro = {
    x: cx + Math.cos(angBase) * r,
    y: cy + Math.sin(angBase) * r,
  };
  const gNucleo = ctx.createRadialGradient(origenCentro.x, origenCentro.y, 0, origenCentro.x, origenCentro.y, r*0.45);
  gNucleo.addColorStop(0, 'rgba(255,255,220,0.9)');
  gNucleo.addColorStop(0.5,'rgba(255,160,0,0.5)');
  gNucleo.addColorStop(1, 'rgba(255,60,0,0)');
  ctx.beginPath(); ctx.arc(origenCentro.x, origenCentro.y, r*0.45, 0, Math.PI*2);
  ctx.fillStyle=gNucleo; ctx.fill();

  ctx.globalAlpha=1; ctx.shadowBlur=0; ctx.restore();
}

/*  PARTÍCULAS DE VIENTO (reemplazo de estelas)  */
// Partículas de viento: se generan en el borde trasero y se desplazan
let particulasViento = [];

function emitirViento(cx, cy, r, intensidad) {
  if (Math.random() > intensidad * 0.85) return;
  // Origen: semicírculo trasero del balón (izquierda, ya que va a la derecha)
  const ang   = rand(Math.PI*0.55, Math.PI*1.45);
  const dist  = rand(r*0.95, r*1.15);
  const px    = cx + Math.cos(ang)*dist;
  const py    = cy + Math.sin(ang)*dist;
  // Velocidad: hacia la izquierda con turbulencia vertical pequeña
  const velBase = rand(3, 9) * intensidad;
  particulasViento.push({
    x: px, y: py,
    vx: -velBase,                         // hacia la izquierda (estela)
    vy: rand(-1.2, 1.2),
    vida: 1,
    decaida: rand(0.025, 0.06),
    ancho: rand(r*0.04, r*0.14),          // grosor de la partícula
    largo: rand(r*0.3, r*1.1),            // longitud inicial
    tipo: Math.random() < 0.5 ? 'linea' : 'humo',
  });
}

function actualizarViento() {
  particulasViento = particulasViento.filter(p => p.vida > 0);
  for (const p of particulasViento) {
    p.x  += p.vx;
    p.y  += p.vy;
    p.vx *= 0.96;   // desaceleración
    p.vy *= 0.92;
    p.vida -= p.decaida;
    p.largo *= 0.97;
    p.ancho *= 0.96;
  }
}

function dibujarViento() {
  for (const p of particulasViento) {
    if (p.vida <= 0 || p.largo < 0.5) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.vida) * 0.65;

    if (p.tipo === 'linea') {
      // Línea fina con degradado — simula corriente de aire
      const grad = ctx.createLinearGradient(p.x, p.y, p.x + p.largo, p.y);
      grad.addColorStop(0, `rgba(255,180,60,${p.vida*0.9})`);
      grad.addColorStop(0.3, `rgba(255,120,20,${p.vida*0.5})`);
      grad.addColorStop(1, 'rgba(200,50,0,0)');
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      // Curvatura suave según vy
      ctx.quadraticCurveTo(p.x + p.largo*0.5, p.y + p.vy*3, p.x + p.largo, p.y + p.vy*1.5);
      ctx.strokeStyle = grad;
      ctx.lineWidth   = Math.max(0.3, p.ancho);
      ctx.lineCap     = 'round';
      ctx.shadowColor = '#ff6a00'; ctx.shadowBlur = 8;
      ctx.stroke();
    } else {
      // Mancha de humo difusa
      const gHumo = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.largo*0.5);
      gHumo.addColorStop(0, `rgba(255,120,30,${p.vida*0.35})`);
      gHumo.addColorStop(1, 'rgba(100,20,0,0)');
      ctx.beginPath(); ctx.arc(p.x, p.y, p.largo*0.5, 0, Math.PI*2);
      ctx.fillStyle=gHumo; ctx.fill();
    }
    ctx.restore();
  }
}

/* dibujarEstelas queda como wrapper que llama al sistema de viento */
function dibujarEstelas(cx, cy, r, intensidad) {
  if (intensidad <= 0.01) return;
  emitirViento(cx, cy, r, intensidad);
  actualizarViento();
  dibujarViento();
}

/*  RENDER LOOP ─ */
function renderLoop(ahora) {

  /* — Avanzar viaje automático entre frames — */
  if (maquina.enViaje) {
    const elapsed = ahora - maquina.ultimoTick;
    if (elapsed >= maquina.MS_POR_PASO) {
      maquina.ultimoTick = ahora;
      maquina.pasoViaje += 1;

      if (maquina.pasoViaje >= SUB_PASOS) {
        // Llegamos al destino
        maquina.frameActual = clamp(maquina.frameActual + maquina.direccion, 0, 3);
        maquina.pasoViaje   = 0;
        maquina.enViaje     = false;
        estadoVisual = {
          ...FRAMES_CLAVE[maquina.frameActual],
          pose: FRAMES_CLAVE[maquina.frameActual].pose.map(v=>[...v]),
        };
        mostrarTexto(FRAMES_CLAVE[maquina.frameActual].titulo);

        // Al llegar al Frame 4, arrancar su animación propia
        if (maquina.frameActual === 3 && maquina.direccion === 1) {
          f4.fase     = 'animando';
          f4.progreso = 0;
        }
        // Al llegar al Frame 3 viniendo desde F4 (retroceso), resetear F4
        if (maquina.frameActual === 2 && maquina.direccion === -1) {
          resetearF4();
        }
      } else {
        // Sub-keyframe intermedio
        const seg  = maquina.direccion === 1 ? maquina.frameActual     : maquina.frameActual - 1;
        const paso = maquina.direccion === 1 ? maquina.pasoViaje       : SUB_PASOS - maquina.pasoViaje;
        if (seg >= 0 && seg <= 2) {
          estadoVisual = subKF[seg][paso];
          mostrarTexto(estadoVisual.titulo);
        }
      }
    }
  }

  /* — Animación autónoma del Frame 4 — */
  if (f4.fase === 'animando') {
    f4.progreso = Math.min(1, f4.progreso + 0.007);

    const bCx = anchoCanvas * 0.5;
    const bCy = altoCanvas  * 0.42;
    const rZoom = 55 * (1 + f4.progreso * 2.8);

    // Emitir fuego
    if (Math.random() < 0.75) emitirParticula(bCx, bCy, rZoom, 'fuego');
    if (Math.random() < 0.75) emitirParticula(bCx, bCy, rZoom, 'fuego');

    // Cuando llega al máximo → explotar
    if (f4.progreso >= 1) {
      f4.fase = 'explotando';
      f4.tiempoExplosion = ahora;
      for (let i = 0; i < 220; i++) emitirParticula(bCx, bCy, rZoom, 'explosion');
    }
  }

  if (f4.fase === 'explotando') {
    // Cuando las partículas se apagan (~2.5s) → fase terminada
    if (ahora - f4.tiempoExplosion > 2500) {
      f4.fase = 'terminado';
      particulas = [];  // limpiar partículas residuales
    }
  }

  actualizarParticulas();

  /* — Velocidad de rotación del balón — */
  if (estadoVisual.rotando || f4.fase === 'animando' || f4.fase === 'explotando') {
    const velRot = f4.fase === 'animando'
      ? 0.04 + f4.progreso * 0.1   // cada vez más rápido en F4
      : 0.018;
    rotBalon += velRot;
  }

  /* — Render — */
  ctx.clearRect(0, 0, anchoCanvas, altoCanvas);

  if (f4.fase !== 'inactivo') {
    /* ---- Frame 4 activo ---- */
    const bCx    = anchoCanvas * 0.5;
    const bCy    = altoCanvas  * 0.42;
    const zoom   = 1 + f4.progreso * 2.8;
    const rZoom  = 55 * zoom;
    const escX   = lerp(0.75, 0.55, f4.progreso);  // se aplana más con velocidad
    const escY   = lerp(1.20, 1.40, f4.progreso);  // se estira verticalmente
    const llamas = f4.fase === 'animando' ? Math.min(1, f4.progreso * 1.8) : 0;
    const estelas= f4.fase === 'animando' ? Math.min(1, f4.progreso * 1.8) : 0;
    const opBal  = f4.fase === 'explotando'
      ? Math.max(0, 1 - (ahora - f4.tiempoExplosion) / 350)
      : f4.fase === 'terminado' ? 0 : 1;

    dibujarEstelas(bCx, bCy, rZoom * escX, estelas);
    dibujarLlamas(bCx, bCy, rZoom, llamas, 1);   // va hacia la derecha
    dibujarParticulas();
    if (opBal > 0.01) dibujarBalonFoto(bCx, bCy, rZoom, rotBalon, escX, escY, 0, opBal);

    // Indicador visual cuando está en fase 'terminado': texto pequeño parpadeante
    if (f4.fase === 'terminado') {
      ctx.save();
      ctx.globalAlpha = 0.5 + Math.sin(ahora*0.004)*0.4;
      ctx.fillStyle   = 'rgba(255,255,255,0.7)';
      ctx.font        = '500 14px "Chakra Petch", sans-serif';
      ctx.letterSpacing = '0.3em';
      ctx.textAlign   = 'center';
      ctx.fillText('SCROLL PARA CONTINUAR', anchoCanvas*0.5, altoCanvas*0.9);
      ctx.restore();
    }

  } else {
    /* ---- Frames 1-3 normales ---- */
    const b  = estadoVisual.balon;
    const cx = b.xNorm * anchoCanvas;
    const cy = b.yNorm * altoCanvas;

    dibujarEstelas(cx, cy, b.radio, estadoVisual.estelas);
    dibujarLlamas(cx, cy, b.radio, estadoVisual.llamas, 0);   // Frame 3: fuego centrado arriba
    dibujarParticulas();
    dibujarJugador(estadoVisual.pose, estadoVisual.colorLineas, estadoVisual.opacidadJugador);
    dibujarBalonFoto(cx, cy, b.radio, rotBalon, b.escalaX, b.escalaY, estadoVisual.destello, 1);
  }

  requestAnimationFrame(renderLoop);
}

/*  INICIO  */
document.body.style.overflow = 'hidden';
window.scrollTo(0, 0);
mostrarTexto(0);
requestAnimationFrame(renderLoop);