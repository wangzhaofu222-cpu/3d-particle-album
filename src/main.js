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
   THREE.JS — 3D Heart Stream: Galaxy Ribbon Flow
   ================================================================ */

// Soft radial glow texture (used as particle sprite)
function createGlowTexture() {
  const size = 64
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')
  const r = size / 2
  const grad = ctx.createRadialGradient(r, r, 0, r, r, r)
  grad.addColorStop(0, 'rgba(255, 220, 235, 1)')
  grad.addColorStop(0.25, 'rgba(255, 170, 205, 0.8)')
  grad.addColorStop(0.55, 'rgba(255, 130, 185, 0.35)')
  grad.addColorStop(1, 'rgba(255, 100, 170, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}

// Heart outline texture (delicate line heart)
function createHeartTexture() {
  const size = 64
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')
  const r = size / 2
  // soft glow background
  const bg = ctx.createRadialGradient(r, r, 0, r, r, r)
  bg.addColorStop(0, 'rgba(255, 200, 220, 0.5)')
  bg.addColorStop(1, 'rgba(255, 100, 160, 0)')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, size, size)
  // draw heart shape
  ctx.save()
  ctx.translate(r, r + 3)
  const s = size / 30
  ctx.beginPath()
  ctx.moveTo(0, 2 * s)
  ctx.bezierCurveTo(0, 5 * s, -8 * s, 10 * s, -12 * s, 10 * s)
  ctx.bezierCurveTo(-15 * s, 10 * s, -15 * s, 6 * s, -15 * s, 5 * s)
  ctx.bezierCurveTo(-15 * s, 1 * s, -11 * s, -3 * s, 0, -9 * s)
  ctx.moveTo(0, 2 * s)
  ctx.bezierCurveTo(0, 5 * s, 8 * s, 10 * s, 12 * s, 10 * s)
  ctx.bezierCurveTo(15 * s, 10 * s, 15 * s, 6 * s, 15 * s, 5 * s)
  ctx.bezierCurveTo(15 * s, 1 * s, 11 * s, -3 * s, 0, -9 * s)
  ctx.closePath()
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 12 * s)
  grad.addColorStop(0, 'rgba(255, 210, 230, 1)')
  grad.addColorStop(0.7, 'rgba(255, 160, 200, 0.85)')
  grad.addColorStop(1, 'rgba(255, 120, 180, 0.5)')
  ctx.fillStyle = grad
  ctx.fill()
  ctx.restore()
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
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300)
  camera.position.z = 3

  const PARTICLE_COUNT = 1200
  const glowTex = createGlowTexture()
  const heartTex = createHeartTexture()

  // Each particle has: position, color, size, alpha, phase offset, stream index
  const posArr = new Float32Array(PARTICLE_COUNT * 3)
  const colArr = new Float32Array(PARTICLE_COUNT * 3)
  const sizeArr = new Float32Array(PARTICLE_COUNT)
  const alphaArr = new Float32Array(PARTICLE_COUNT)
  const phaseArr = new Float32Array(PARTICLE_COUNT)    // random phase for variety
  const streamArr = new Float32Array(PARTICLE_COUNT)   // which stream ribbon

  const STREAM_COUNT = 5 // number of parallel ribbon streams

  // Place a particle along the stream at a given Z with stream offset
  function placeParticle(i, zPos) {
    const i3 = i * 3
    const stream = streamArr[i]
    const phase = phaseArr[i]

    // S-curve ribbon: gentle sinusoidal path along Z
    const ribbonCenterX = Math.sin(zPos * 0.035 + stream * 1.8) * 2.5
    const ribbonCenterY = Math.cos(zPos * 0.028 + stream * 2.2) * 1.8

    // Scatter particles around the ribbon center
    const scatterR = 1.2 + Math.abs(Math.sin(phase * 17)) * 0.8
    const angle = phase * Math.PI * 2
    const offsetX = Math.cos(angle) * scatterR
    const offsetY = Math.sin(angle) * scatterR * 0.6

    posArr[i3] = ribbonCenterX + offsetX
    posArr[i3 + 1] = ribbonCenterY + offsetY
    posArr[i3 + 2] = zPos
  }

  // Spawn one particle at far Z
  function spawnParticle(i) {
    streamArr[i] = Math.floor(Math.random() * STREAM_COUNT)
    phaseArr[i] = Math.random()

    const zFar = -(50 + Math.random() * 80)
    placeParticle(i, zFar)

    // soft warm pink — low saturation, not garish
    const warmth = 0.55 + Math.random() * 0.45
    colArr[i * 3] = 1.0
    colArr[i * 3 + 1] = 0.6 + warmth * 0.3
    colArr[i * 3 + 2] = 0.72 + warmth * 0.2

    sizeArr[i] = 0.8 + Math.random() * 2.5
    alphaArr[i] = 0.15 + Math.random() * 0.4
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) spawnParticle(i)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colArr, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizeArr, 1))
  geometry.setAttribute('alpha', new THREE.BufferAttribute(alphaArr, 1))

  // Vertex shader passes depth for DOF
  const vertexShader = `
    attribute float size;
    attribute float alpha;
    varying vec3 vColor;
    varying float vAlpha;
    varying float vDepth;
    void main() {
      vColor = color;
      vAlpha = alpha;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vDepth = -mv.z;
      gl_PointSize = size * (150.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }
  `

  // Fragment shader: sample texture, apply DOF blur via alpha falloff
  const fragmentShader = `
    uniform sampler2D uTexture;
    varying vec3 vColor;
    varying float vAlpha;
    varying float vDepth;
    void main() {
      vec4 tex = texture2D(uTexture, gl_PointCoord);
      // DOF: visible band 5-40, faded at extremes
      float nearFade = smoothstep(1.5, 6.0, vDepth);
      float farFade = 1.0 - smoothstep(35.0, 60.0, vDepth);
      float dof = nearFade * farFade;
      tex.a *= dof * vAlpha;
      if (tex.a < 0.005) discard;
      // additive: multiply color by alpha so overlapping = brighter (white-hot)
      gl_FragColor = vec4(vColor * tex.rgb * tex.a, tex.a);
    }
  `

  const material = new THREE.ShaderMaterial({
    uniforms: { uTexture: { value: glowTex } },
    vertexShader,
    fragmentShader,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  // Second material for heart particles (mixed in)
  const heartMaterial = new THREE.ShaderMaterial({
    uniforms: { uTexture: { value: heartTex } },
    vertexShader,
    fragmentShader: `
      uniform sampler2D uTexture;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vDepth;
      void main() {
        vec4 tex = texture2D(uTexture, gl_PointCoord);
        float nearFade = smoothstep(2.0, 7.0, vDepth);
        float farFade = 1.0 - smoothstep(30.0, 55.0, vDepth);
        float dof = nearFade * farFade;
        tex.a *= dof * vAlpha;
        if (tex.a < 0.005) discard;
        gl_FragColor = vec4(vColor * tex.rgb * tex.a, tex.a);
      }
    `,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  // Split particles: first 800 are glow dots, last 400 are hearts
  const glowGeo = new THREE.BufferGeometry()
  const heartGeo = new THREE.BufferGeometry()

  // Shared attributes — both geos reference the same arrays
  for (const geo of [glowGeo, heartGeo]) {
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizeArr, 1))
    geo.setAttribute('alpha', new THREE.BufferAttribute(alphaArr, 1))
  }

  // Draw ranges: glow particles 0..799, heart particles 800..1199
  glowGeo.setDrawRange(0, 800)
  heartGeo.setDrawRange(800, 400)

  const glowPoints = new THREE.Points(glowGeo, material)
  const heartPoints = new THREE.Points(heartGeo, heartMaterial)
  scene.add(glowPoints)
  scene.add(heartPoints)

  // Slow global rotation for organic feel
  const group = new THREE.Group()
  scene.remove(glowPoints)
  scene.remove(heartPoints)
  group.add(glowPoints)
  group.add(heartPoints)
  scene.add(group)

  // Mouse parallax
  let mouseX = 0, mouseY = 0
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2
  })

  let time = 0
  function animate() {
    requestAnimationFrame(animate)
    time += 0.005

    // Advance all particles along Z toward camera
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      const z = posArr[i3 + 2]

      // Speed varies by depth: far = slow, near = faster
      const depthNorm = 1.0 - (Math.abs(z) / 130) // 0=far, 1=near
      const speed = 0.06 + depthNorm * 0.22
      posArr[i3 + 2] += speed

      // Gently follow ribbon as it moves forward
      const newZ = posArr[i3 + 2]
      const stream = streamArr[i]
      const phase = phaseArr[i]
      const targetX = Math.sin(newZ * 0.035 + stream * 1.8) * 2.5
      const targetY = Math.cos(newZ * 0.028 + stream * 2.2) * 1.8
      const scatterR = 1.2 + Math.abs(Math.sin(phase * 17)) * 0.8
      const angle = phase * Math.PI * 2
      posArr[i3] += (targetX + Math.cos(angle) * scatterR - posArr[i3]) * 0.015
      posArr[i3 + 1] += (targetY + Math.sin(angle) * scatterR * 0.6 - posArr[i3 + 1]) * 0.015

      // Passed camera — respawn
      if (newZ > camera.position.z + 3) {
        spawnParticle(i)
      }
    }

    geometry.attributes.position.needsUpdate = true
    glowGeo.attributes.position.needsUpdate = true
    heartGeo.attributes.position.needsUpdate = true

    // Very slow group rotation for organic drift
    group.rotation.y = Math.sin(time * 0.3) * 0.04
    group.rotation.x = Math.cos(time * 0.2) * 0.02

    // Parallax camera
    camera.position.x += (mouseX * 0.35 - camera.position.x) * 0.015
    camera.position.y += (-mouseY * 0.2 - camera.position.y) * 0.015
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
