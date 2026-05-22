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
   THREE.JS — background heart particles
   ================================================================ */
function initBackground() {
  const canvas = document.getElementById('bg-canvas')
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.z = 5

  const PARTICLE_COUNT = 600

  // Heart curve function
  function heartShape(t) {
    const x = 16 * Math.pow(Math.sin(t), 3)
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    return { x: x / 17, y: y / 17 }
  }

  const positions = new Float32Array(PARTICLE_COUNT * 3)
  const velocities = new Float32Array(PARTICLE_COUNT * 3)
  const colors = new Float32Array(PARTICLE_COUNT * 3)
  const sizes = new Float32Array(PARTICLE_COUNT)

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3
    // Random position in 3D space
    positions[i3] = (Math.random() - 0.5) * 14
    positions[i3 + 1] = (Math.random() - 0.5) * 10
    positions[i3 + 2] = (Math.random() - 0.5) * 8

    // Slow upward drift
    velocities[i3] = (Math.random() - 0.5) * 0.003
    velocities[i3 + 1] = Math.random() * 0.004 + 0.001
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.002

    // Pink / warm tones
    const pinkness = 0.5 + Math.random() * 0.5
    colors[i3] = 1.0
    colors[i3 + 1] = 0.4 + pinkness * 0.4
    colors[i3 + 2] = 0.6 + pinkness * 0.3

    sizes[i] = Math.random() * 4 + 1.5
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const vertexShader = `
    attribute float size;
    varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (200.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  const fragmentShader = `
    varying vec3 vColor;
    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;
      float alpha = smoothstep(0.5, 0.15, d) * 0.6;
      gl_FragColor = vec4(vColor, alpha);
    }
  `

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const points = new THREE.Points(geometry, material)
  scene.add(points)

  // Also add a few larger "glow" particles shaped as hearts
  const glowCount = 30
  const glowPositions = new Float32Array(glowCount * 3)
  const glowColors = new Float32Array(glowCount * 3)
  const glowSizes = new Float32Array(glowCount)

  for (let i = 0; i < glowCount; i++) {
    const i3 = i * 3
    const t = (i / glowCount) * Math.PI * 2
    const h = heartShape(t)
    glowPositions[i3] = h.x * 3 + (Math.random() - 0.5) * 2
    glowPositions[i3 + 1] = h.y * 3 + (Math.random() - 0.5) * 2
    glowPositions[i3 + 2] = (Math.random() - 0.5) * 2
    glowColors[i3] = 1.0
    glowColors[i3 + 1] = 0.3
    glowColors[i3 + 2] = 0.55
    glowSizes[i] = Math.random() * 6 + 4
  }

  const glowGeo = new THREE.BufferGeometry()
  glowGeo.setAttribute('position', new THREE.BufferAttribute(glowPositions, 3))
  glowGeo.setAttribute('color', new THREE.BufferAttribute(glowColors, 3))
  glowGeo.setAttribute('size', new THREE.BufferAttribute(glowSizes, 1))

  const glowMat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.0, d) * 0.35;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const glowPoints = new THREE.Points(glowGeo, glowMat)
  scene.add(glowPoints)

  // Mouse tracking for subtle parallax
  let mouseX = 0, mouseY = 0
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2
  })

  function animate() {
    requestAnimationFrame(animate)
    const posArr = geometry.attributes.position.array
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      posArr[i3] += velocities[i3]
      posArr[i3 + 1] += velocities[i3 + 1]
      posArr[i3 + 2] += velocities[i3 + 2]
      // Wrap around
      if (posArr[i3 + 1] > 6) posArr[i3 + 1] = -6
      if (posArr[i3] > 8) posArr[i3] = -8
      if (posArr[i3] < -8) posArr[i3] = 8
    }
    geometry.attributes.position.needsUpdate = true

    // Rotate glow
    glowPoints.rotation.y += 0.0008
    glowPoints.rotation.x += 0.0003

    // Parallax
    camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.02
    camera.position.y += (-mouseY * 0.3 - camera.position.y) * 0.02
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
  return cards.map((_, i) => {
    if (i < half) {
      // Horizontal arm
      const spacing = CARD_W + CARD_GAP
      const startX = cx - ((half - 1) * spacing) / 2
      return { x: startX + i * spacing, y: cy, z: 0, rotY: 0, rotX: 0, rotZ: 0 }
    } else {
      // Vertical arm
      const vi = i - half
      const vertCount = cards.length - half
      const spacing = CARD_H + CARD_GAP
      const startY = cy - ((vertCount - 1) * spacing) / 2
      return { x: cx, y: startY + vi * spacing, z: vi * 15, rotY: 10, rotX: 0, rotZ: 0 }
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
  const baseY = h - CARD_H - 60
  const totalAngle = Math.min(cards.length * 8, 140)
  const startAngle = -totalAngle / 2
  const angleStep = cards.length > 1 ? totalAngle / (cards.length - 1) : 0
  const radius = 320

  return cards.map((_, i) => {
    const angle = startAngle + i * angleStep
    const rad = (angle * Math.PI) / 180
    return {
      x: cx + Math.sin(rad) * radius,
      y: baseY - Math.cos(rad) * radius + radius,
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

const LAYOUTS = {
  arrival: layoutArrival,
  cross: layoutCross,
  gather: layoutGather,
  fan: layoutFan,
  spiral: layoutSpiral,
  depart: layoutDepart,
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
    // Small randomisation for arrival so it looks fresh each time
    gsap.to(el, {
      left: p.x,
      top: p.y,
      duration: 1.0,
      ease: 'power3.inOut',
      delay: i * 0.03,
    })

    gsap.to(el, {
      rotateY: p.rotY,
      rotateX: p.rotX,
      rotateZ: p.rotZ,
      z: p.z,
      duration: 1.0,
      ease: 'power3.inOut',
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

/* ── Modal ──────────────────────────────────── */
function openModal(item) {
  const overlay = document.getElementById('modal-overlay')
  document.getElementById('modal-img').src = item.src
  document.getElementById('modal-caption').textContent = item.caption
  overlay.classList.remove('hidden')
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden')
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
  document.querySelectorAll('#layout-bar button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const layout = btn.dataset.layout
      if (layout === 'arrival') {
        // Re-randomise
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

  // Initial layout
  applyLayout('arrival')

  // Re-layout on resize
  window.addEventListener('resize', () => {
    applyLayout(currentLayout)
  })
}

init()
