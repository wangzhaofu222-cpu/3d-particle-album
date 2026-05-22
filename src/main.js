import * as THREE from 'three'
import gsap from 'gsap'

/* ================================================================
   DATA — real images from data/ folder
   ================================================================ */
const albumData = [
  { src: '/data/2025年08月07日_0006.JPG', caption: '安静浅笑 / QUIET SMILE' },
  { src: '/data/2025年08月07日_0011.JPG', caption: '晨光微露 / DAWN LIGHT' },
  { src: '/data/IMG_5954.JPG', caption: '花间小径 / GARDEN PATH' },
  { src: '/data/IMG_5959.JPG', caption: '海风轻语 / SEA BREEZE' },
  { src: '/data/IMG_6040.JPG', caption: '城市霓虹 / CITY NEON' },
  { src: '/data/IMG_6352.JPG', caption: '午后时光 / AFTERNOON' },
  { src: '/data/IMG_6364.JPG', caption: '星空之约 / STARS' },
  { src: '/data/IMG_6383.JPG', caption: '雨后天晴 / AFTER RAIN' },
  { src: '/data/IMG_6387.JPG', caption: '甜蜜梦境 / SWEET DREAM' },
  { src: '/data/IMG_7213.JPG', caption: '林间小鹿 / FOREST DEER' },
  { src: '/data/IMG_7272.JPG', caption: '日落黄昏 / SUNSET' },
  { src: '/data/IMG_8907.jpg', caption: '云端漫步 / CLOUD WALK' },
  { src: '/data/IMG_8923.jpg', caption: '绿野仙踪 / EMERALD' },
  { src: '/data/IMG_8959.jpg', caption: '极光之夜 / AURORA' },
  { src: '/data/IMG_9017.jpg', caption: '咖啡时光 / COFFEE TIME' },
  { src: '/data/IMG_9031.jpg', caption: '海边日出 / SEASIDE DAWN' },
  { src: '/data/IMG_9075.jpg', caption: '秋叶之舞 / AUTUMN LEAVES' },
  { src: '/data/IMG_9087.jpg', caption: '月光水岸 / MOONLIGHT' },
  { src: '/data/IMG_9174.jpg', caption: '春风十里 / SPRING WIND' },
]

/* ================================================================
   THREE.JS — 3D Heart Particle Space Warp
   ================================================================ */

// Generate a heart-shaped canvas texture
function createHeartTexture() {
  const size = 64
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')

  ctx.translate(size / 2, size / 2 + 4)
  const s = size / 28
  ctx.beginPath()
  ctx.moveTo(0, 2 * s)
  ctx.bezierCurveTo(0, 5 * s, -8 * s, 10 * s, -12 * s, 10 * s)
  ctx.bezierCurveTo(-16 * s, 10 * s, -16 * s, 6 * s, -16 * s, 5 * s)
  ctx.bezierCurveTo(-16 * s, 1 * s, -12 * s, -3 * s, 0, -10 * s)
  ctx.moveTo(0, 2 * s)
  ctx.bezierCurveTo(0, 5 * s, 8 * s, 10 * s, 12 * s, 10 * s)
  ctx.bezierCurveTo(16 * s, 10 * s, 16 * s, 6 * s, 16 * s, 5 * s)
  ctx.bezierCurveTo(16 * s, 1 * s, 12 * s, -3 * s, 0, -10 * s)
  ctx.closePath()

  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 14 * s)
  grad.addColorStop(0, 'rgba(255, 180, 210, 1)')
  grad.addColorStop(0.6, 'rgba(255, 120, 180, 0.9)')
  grad.addColorStop(1, 'rgba(200, 60, 120, 0.7)')
  ctx.fillStyle = grad
  ctx.fill()

  // soft glow halo
  ctx.beginPath()
  ctx.arc(0, 0, 13 * s, 0, Math.PI * 2)
  const halo = ctx.createRadialGradient(0, 0, 3 * s, 0, 0, 13 * s)
  halo.addColorStop(0, 'rgba(255, 150, 200, 0.25)')
  halo.addColorStop(1, 'rgba(255, 100, 160, 0)')
  ctx.fillStyle = halo
  ctx.fill()

  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}

function initBackground() {
  const canvas = document.getElementById('bg-canvas')
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500)
  camera.position.z = 2

  const PARTICLE_COUNT = 800
  const heartTex = createHeartTexture()

  const positions = new Float32Array(PARTICLE_COUNT * 3)
  const colors = new Float32Array(PARTICLE_COUNT * 3)
  const sizes = new Float32Array(PARTICLE_COUNT)
  const alphas = new Float32Array(PARTICLE_COUNT)

  // Spawn a single particle in the far Z
  function spawnParticle(i) {
    const i3 = i * 3
    const spread = 12
    positions[i3] = (Math.random() - 0.5) * spread
    positions[i3 + 1] = (Math.random() - 0.5) * (spread * 0.7)
    positions[i3 + 2] = -(40 + Math.random() * 60) // far away

    // warm pink tones
    const pinkness = 0.6 + Math.random() * 0.4
    colors[i3] = 1.0
    colors[i3 + 1] = 0.45 + pinkness * 0.35
    colors[i3 + 2] = 0.55 + pinkness * 0.35

    sizes[i] = 1.5 + Math.random() * 3.5
    alphas[i] = 0.3 + Math.random() * 0.5
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) spawnParticle(i)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))

  const material = new THREE.ShaderMaterial({
    uniforms: { uTexture: { value: heartTex } },
    vertexShader: `
      attribute float size;
      attribute float alpha;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vDepth;
      void main() {
        vColor = color;
        vAlpha = alpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vDepth = -mvPosition.z;
        gl_PointSize = size * (180.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vDepth;
      void main() {
        vec4 tex = texture2D(uTexture, gl_PointCoord);
        // depth-of-field: blur edges for very near / very far particles
        float dofFactor = smoothstep(2.0, 8.0, vDepth) * (1.0 - smoothstep(30.0, 50.0, vDepth));
        tex.a *= dofFactor;
        tex.a *= vAlpha;
        if (tex.a < 0.01) discard;
        gl_FragColor = vec4(vColor * tex.rgb, tex.a);
      }
    `,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const points = new THREE.Points(geometry, material)
  scene.add(points)

  // Mouse tracking for subtle parallax
  let mouseX = 0, mouseY = 0
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2
  })

  function animate() {
    requestAnimationFrame(animate)
    const posArr = geometry.attributes.position.array
    const speed = 0.35 // toward camera

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      posArr[i3 + 2] += speed

      // slight horizontal sway
      posArr[i3] += Math.sin(posArr[i3 + 2] * 0.1 + i) * 0.008
      posArr[i3 + 1] += Math.cos(posArr[i3 + 2] * 0.08 + i * 0.5) * 0.005

      // passed the camera — respawn
      if (posArr[i3 + 2] > camera.position.z + 2) {
        spawnParticle(i)
      }
    }
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.size.needsUpdate = true
    geometry.attributes.alpha.needsUpdate = true

    // Parallax
    camera.position.x += (mouseX * 0.4 - camera.position.x) * 0.02
    camera.position.y += (-mouseY * 0.25 - camera.position.y) * 0.02
    camera.lookAt(0, 0, 0)

    renderer.render(scene, camera)
  }
  animate()

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })
}

/* ================================================================
   CARD SYSTEM — create DOM cards and animate between layouts
   ================================================================ */
const CARD_W = 180
const CARD_H = 260
const CARD_GAP = 20

let cards = []
let currentLayout = 'arrival'

function createCards() {
  const container = document.getElementById('cards-container')
  container.innerHTML = ''
  cards = []

  albumData.forEach((item, i) => {
    const el = document.createElement('div')
    el.className = 'card'
    el.innerHTML = `
      <img src="${item.src}" alt="${item.caption}" />
      <div class="label">${item.caption}</div>
    `
    container.appendChild(el)
    cards.push({ el, index: i })

    // Hover scale
    el.addEventListener('mouseenter', () => {
      gsap.to(el, { scale: 1.12, duration: 0.35, ease: 'power2.out' })
    })
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { scale: 1, duration: 0.35, ease: 'power2.out' })
    })

    // Click modal
    el.addEventListener('click', () => openModal(item))
  })
}

/* ── Layout calculators ────────────────────── */

function layoutArrival(cards, w, h) {
  const margin = 80
  const usableW = w - margin * 2 - CARD_W
  const usableH = h - margin * 2 - CARD_H
  return cards.map((_, i) => ({
    x: margin + Math.random() * usableW,
    y: margin + Math.random() * usableH,
    z: (Math.random() - 0.5) * 300,
    rotY: (Math.random() - 0.5) * 40,
    rotX: (Math.random() - 0.5) * 25,
    rotZ: (Math.random() - 0.5) * 15,
  }))
}

function layoutCross(cards, w, h) {
  const cx = w / 2 - CARD_W / 2
  const cy = h / 2 - CARD_H / 2
  const half = Math.floor(cards.length / 2)
  const vertCount = cards.length - half

  // Horizontal arm — use a spacing that fits in the viewport
  const hSpacing = Math.min(CARD_W + CARD_GAP, (w - 120) / half)
  const vSpacing = Math.min(CARD_H + CARD_GAP, (h - 120) / vertCount)

  return cards.map((_, i) => {
    if (i < half) {
      const startX = cx - ((half - 1) * hSpacing) / 2
      return { x: startX + i * hSpacing, y: cy, z: 0, rotY: 0, rotX: 0, rotZ: 0 }
    } else {
      const vi = i - half
      const startY = cy - ((vertCount - 1) * vSpacing) / 2
      return { x: cx, y: startY + vi * vSpacing, z: vi * 12, rotY: 10, rotX: 0, rotZ: 0 }
    }
  })
}

function layoutGather(cards, w, h) {
  const cx = w / 2 - CARD_W / 2
  const cy = h / 2 - CARD_H / 2
  return cards.map((_, i) => ({
    x: cx + (Math.random() - 0.5) * 40,
    y: cy + (Math.random() - 0.5) * 40,
    z: i * 8,
    rotY: (Math.random() - 0.5) * 10,
    rotX: (Math.random() - 0.5) * 10,
    rotZ: (Math.random() - 0.5) * 5,
  }))
}

function layoutFan(cards, w, h) {
  const cx = w / 2 - CARD_W / 2
  const cy = h / 2 - CARD_H / 2
  const totalAngle = Math.min(cards.length * 8, 140)
  const startAngle = -totalAngle / 2
  const angleStep = cards.length > 1 ? totalAngle / (cards.length - 1) : 0
  const radius = 280

  return cards.map((_, i) => {
    const angle = startAngle + i * angleStep
    const rad = (angle * Math.PI) / 180
    return {
      x: cx + Math.sin(rad) * radius,
      y: cy - Math.cos(rad) * radius + radius,
      z: Math.sin(rad) * 100,
      rotY: 0,
      rotX: 0,
      rotZ: angle * 0.6,
    }
  })
}

function layoutSpiral(cards, w, h) {
  const cx = w / 2 - CARD_W / 2
  const cy = h / 2 - CARD_H / 2
  const turns = 2.5
  const heightRange = h * 0.7

  return cards.map((_, i) => {
    const t = i / (cards.length - 1 || 1)
    const angle = t * turns * Math.PI * 2
    const r = 140 + t * 80
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + heightRange / 2 - t * heightRange,
      z: Math.sin(angle) * r,
      rotY: (angle * 180) / Math.PI,
      rotX: 0,
      rotZ: 0,
    }
  })
}

function layoutDepart(cards, w, h) {
  const cx = w / 2 - CARD_W / 2
  const cy = h / 2 - CARD_H / 2
  const radius = 280

  return cards.map((_, i) => {
    const angle = (i / cards.length) * Math.PI * 2
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy,
      z: Math.sin(angle) * radius,
      rotY: -(angle * 180) / Math.PI,
      rotX: 0,
      rotZ: 0,
    }
  })
}

/* ── New layouts ────────────────────────────── */

function layoutWave(cards, w, h) {
  const cx = w / 2 - CARD_W / 2
  const cy = h / 2 - CARD_H / 2
  const totalW = cards.length * (CARD_W + CARD_GAP)
  const startX = cx - totalW / 2 + CARD_W / 2
  const ampY = 120
  const ampZ = 160

  return cards.map((_, i) => {
    const phase = (i / cards.length) * Math.PI * 3
    return {
      x: startX + i * (CARD_W + CARD_GAP),
      y: cy + Math.sin(phase) * ampY,
      z: Math.cos(phase) * ampZ,
      rotY: 0,
      rotX: Math.sin(phase) * 12,
      rotZ: Math.cos(phase) * 6,
    }
  })
}

function layoutDNA(cards, w, h) {
  const cx = w / 2 - CARD_W / 2
  const cy = h / 2 - CARD_H / 2
  const turns = 2
  const heightRange = h * 0.65
  const helixRadius = 140

  return cards.map((_, i) => {
    const t = i / (cards.length - 1 || 1)
    const angle = t * turns * Math.PI * 2
    const strand = i % 2
    const offsetAngle = angle + strand * Math.PI
    return {
      x: cx + Math.cos(offsetAngle) * helixRadius,
      y: cy + heightRange / 2 - t * heightRange,
      z: Math.sin(offsetAngle) * helixRadius,
      rotY: -(offsetAngle * 180) / Math.PI,
      rotX: 0,
      rotZ: 0,
    }
  })
}

function layoutSphere(cards, w, h) {
  const cx = w / 2 - CARD_W / 2
  const cy = h / 2 - CARD_H / 2
  const radius = 260
  const n = cards.length

  return cards.map((_, i) => {
    // Fibonacci sphere distribution for even spacing
    const golden = (1 + Math.sqrt(5)) / 2
    const theta = Math.acos(1 - 2 * (i + 0.5) / n)
    const phi = 2 * Math.PI * i / golden
    return {
      x: cx + radius * Math.sin(theta) * Math.cos(phi),
      y: cy + radius * Math.cos(theta),
      z: radius * Math.sin(theta) * Math.sin(phi),
      rotY: -(phi * 180) / Math.PI,
      rotX: (theta * 180) / Math.PI - 90,
      rotZ: 0,
    }
  })
}

const LAYOUTS = {
  arrival: layoutArrival,
  cross: layoutCross,
  gather: layoutGather,
  fan: layoutFan,
  spiral: layoutSpiral,
  depart: layoutDepart,
  wave: layoutWave,
  dna: layoutDNA,
  sphere: layoutSphere,
}

function applyLayout(name) {
  currentLayout = name
  const w = window.innerWidth
  const h = window.innerHeight
  const layoutFn = LAYOUTS[name]
  if (!layoutFn) return

  const positions = layoutFn(cards, w, h)

  cards.forEach(({ el }, i) => {
    const p = positions[i]
    gsap.to(el, {
      left: p.x,
      top: p.y,
      duration: 1.0,
      ease: 'power2.inOut',
      delay: i * 0.03,
    })

    gsap.to(el, {
      rotateY: p.rotY,
      rotateX: p.rotX,
      rotateZ: p.rotZ,
      z: p.z,
      duration: 1.0,
      ease: 'power2.inOut',
      delay: i * 0.03,
    })
  })

  // Update active button
  document.querySelectorAll('#layout-bar button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.layout === name)
  })
}

/* ── Auto-rotate for depart mode ────────────── */
let autoRotateTween = null
function startAutoRotate() {
  stopAutoRotate()
  const container = document.getElementById('cards-container')
  autoRotateTween = gsap.to(container, {
    rotateY: '+=360',
    duration: 30,
    ease: 'none',
    repeat: -1,
  })
}

function stopAutoRotate() {
  if (autoRotateTween) {
    autoRotateTween.kill()
    autoRotateTween = null
  }
  gsap.set('#cards-container', { rotateY: 0 })
}

/* ── Auto-play ──────────────────────────────── */
const AUTO_PLAY_LAYOUTS = ['arrival', 'cross', 'gather', 'fan', 'spiral', 'depart', 'wave', 'dna', 'sphere']
let autoPlayTimer = null
let autoPlayIndex = 0
let autoPlayWasActive = false  // remember if autoplay was on before modal

function autoPlayTick() {
  autoPlayIndex = (autoPlayIndex + 1) % AUTO_PLAY_LAYOUTS.length
  const layout = AUTO_PLAY_LAYOUTS[autoPlayIndex]
  applyLayout(layout)
  if (layout === 'depart') {
    startAutoRotate()
  } else {
    stopAutoRotate()
  }
}

function startAutoPlay() {
  stopAutoPlay()
  const btn = document.getElementById('auto-play-btn')
  btn.classList.add('playing')
  btn.textContent = '暂停'
  autoPlayTick() // advance immediately on start
  autoPlayTimer = setInterval(autoPlayTick, 2000)
}

function stopAutoPlay() {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
    autoPlayTimer = null
  }
  const btn = document.getElementById('auto-play-btn')
  btn.classList.remove('playing')
  btn.textContent = '自动播放'
}

/* ── Modal ──────────────────────────────────── */
function openModal(item) {
  // pause auto-play while modal is open
  autoPlayWasActive = !!autoPlayTimer
  if (autoPlayWasActive) stopAutoPlay()

  const overlay = document.getElementById('modal-overlay')
  document.getElementById('modal-img').src = item.src
  document.getElementById('modal-caption').textContent = item.caption
  overlay.classList.remove('hidden')
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden')
  // resume auto-play if it was active before
  if (autoPlayWasActive) startAutoPlay()
}

document.getElementById('modal-close').addEventListener('click', closeModal)
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal()
})
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal()
})

/* ── Init ───────────────────────────────────── */
function init() {
  initBackground()
  createCards()

  // Layout buttons
  document.querySelectorAll('#layout-bar button[data-layout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      stopAutoPlay()
      const layout = btn.dataset.layout
      if (layout === 'arrival') {
        applyLayout('arrival')
      } else {
        applyLayout(layout)
      }
      if (layout === 'depart') {
        startAutoRotate()
      } else {
        stopAutoRotate()
      }
    })
  })

  // Auto-play button
  document.getElementById('auto-play-btn').addEventListener('click', () => {
    if (autoPlayTimer) {
      stopAutoPlay()
    } else {
      startAutoPlay()
    }
  })

  // Initial layout
  applyLayout('arrival')

  // Re-layout on resize
  window.addEventListener('resize', () => {
    applyLayout(currentLayout)
  })
}

init()
