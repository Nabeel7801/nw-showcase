import '/src/style.css'
import * as THREE from 'three'

// ─── Year ─────────────────────────────────────────────────────
document.getElementById('year').textContent = new Date().getFullYear()

// ─── Three.js particle network ────────────────────────────────
;(function initCanvas() {
  const canvas = document.getElementById('bg-canvas')
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.z = 160

  // Particle data
  const COUNT = 120
  const positions = []
  const velocities = []
  const spread = 160

  for (let i = 0; i < COUNT; i++) {
    positions.push(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * 60
    )
    velocities.push(
      (Math.random() - 0.5) * 0.04,
      (Math.random() - 0.5) * 0.04,
      (Math.random() - 0.5) * 0.01
    )
  }

  // Dot geometry
  const dotGeo = new THREE.BufferGeometry()
  const posArr = new Float32Array(positions)
  dotGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
  const dotMat = new THREE.PointsMaterial({
    color: 0xCAFF00,
    size: 1.5,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
  })
  const dots = new THREE.Points(dotGeo, dotMat)
  scene.add(dots)

  // Line geometry (dynamic — updated each frame)
  const maxLines = COUNT * 4
  const linePos = new Float32Array(maxLines * 6)
  const lineGeo = new THREE.BufferGeometry()
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3))
  lineGeo.setDrawRange(0, 0)
  const lineMat = new THREE.LineSegments(
    lineGeo,
    new THREE.LineBasicMaterial({ color: 0xCAFF00, transparent: true, opacity: 0.12 })
  )
  scene.add(lineMat)

  // Mouse world position
  let mouseX = 0, mouseY = 0
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * spread
    mouseY = -(e.clientY / window.innerHeight - 0.5) * spread
  })

  const THRESHOLD = 38
  const REPEL_RADIUS = 24
  const REPEL_FORCE = 0.4

  function animate() {
    requestAnimationFrame(animate)

    const pos = dotGeo.attributes.position.array
    let lineIdx = 0

    // Update positions
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      pos[i3]     += velocities[i * 3]
      pos[i3 + 1] += velocities[i * 3 + 1]
      pos[i3 + 2] += velocities[i * 3 + 2]

      // Bounce walls
      if (Math.abs(pos[i3]) > spread / 2)     velocities[i * 3]     *= -1
      if (Math.abs(pos[i3+1]) > spread / 2)   velocities[i * 3 + 1] *= -1
      if (Math.abs(pos[i3+2]) > 30)           velocities[i * 3 + 2] *= -1

      // Cursor repel
      const dx = pos[i3] - mouseX
      const dy = pos[i3+1] - mouseY
      const dist = Math.sqrt(dx*dx + dy*dy)
      if (dist < REPEL_RADIUS && dist > 0) {
        const force = (REPEL_RADIUS - dist) / REPEL_RADIUS * REPEL_FORCE
        pos[i3]     += (dx / dist) * force
        pos[i3 + 1] += (dy / dist) * force
      }
    }

    // Build connection lines
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const ax = pos[i*3], ay = pos[i*3+1], az = pos[i*3+2]
        const bx = pos[j*3], by = pos[j*3+1], bz = pos[j*3+2]
        const d = Math.sqrt((ax-bx)**2 + (ay-by)**2 + (az-bz)**2)
        if (d < THRESHOLD && lineIdx < maxLines * 6 - 6) {
          linePos[lineIdx++] = ax; linePos[lineIdx++] = ay; linePos[lineIdx++] = az
          linePos[lineIdx++] = bx; linePos[lineIdx++] = by; linePos[lineIdx++] = bz
        }
      }
    }

    dotGeo.attributes.position.needsUpdate = true
    lineGeo.attributes.position.array.set(linePos)
    lineGeo.attributes.position.needsUpdate = true
    lineGeo.setDrawRange(0, lineIdx / 3)

    renderer.render(scene, camera)
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', resize)
  resize()
  animate()
})()

// ─── Custom cursor ────────────────────────────────────────────
;(function initCursor() {
  const cursor = document.getElementById('cursor')
  if (!cursor || window.matchMedia('(max-width:600px)').matches) return
  const dot  = cursor.querySelector('.cursor__dot')
  const ring = cursor.querySelector('.cursor__ring')

  let rx = 0, ry = 0, tx = 0, ty = 0
  let raf

  document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY })

  function lerp(a, b, t) { return a + (b - a) * t }
  function tick() {
    rx = lerp(rx, tx, 0.14)
    ry = lerp(ry, ty, 0.14)
    dot.style.transform  = `translate(${tx}px,${ty}px) translate(-50%,-50%)`
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`
    raf = requestAnimationFrame(tick)
  }
  tick()

  document.querySelectorAll('a, button, [data-tilt]').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('cursor--hover'))
    el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--hover'))
  })
})()

// ─── Scroll-based nav opacity ─────────────────────────────────
;(function initNav() {
  const nav = document.getElementById('nav')
  const links = nav.querySelectorAll('.nav__link')
  const sections = ['about','projects','skills','connect'].map(id => document.getElementById(id))

  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) nav.classList.add('scrolled')
    else nav.classList.remove('scrolled')

    // Active link
    const scrollMid = window.scrollY + window.innerHeight * 0.4
    sections.forEach((sec, i) => {
      if (!sec) return
      if (sec.offsetTop <= scrollMid && sec.offsetTop + sec.offsetHeight > scrollMid) {
        links.forEach(l => l.classList.remove('active'))
        links[i]?.classList.add('active')
      }
    })
  }, { passive: true })
})()

// ─── Scroll reveal (IntersectionObserver) ─────────────────────
;(function initReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed')
        io.unobserve(e.target)
      }
    })
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })

  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el))

  // Hero reveals immediately
  document.querySelectorAll('.hero [data-reveal]').forEach((el, i) => {
    setTimeout(() => el.classList.add('revealed'), 100 + i * 80)
  })
})()

// ─── 3D card tilt ─────────────────────────────────────────────
;(function initTilt() {
  document.querySelectorAll('[data-tilt]').forEach(card => {
    const inner = card.querySelector('.project-card__inner')
    if (!inner) return

    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width  - 0.5
      const y = (e.clientY - r.top)  / r.height - 0.5
      inner.style.transform = `perspective(1000px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) translateZ(6px)`
      inner.style.setProperty('--mx', (x + 0.5) * 100 + '%')
      inner.style.setProperty('--my', (y + 0.5) * 100 + '%')
    })

    card.addEventListener('mouseleave', () => {
      inner.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)'
    })
  })
})()

// ─── Skill tag stagger ────────────────────────────────────────
;(function initSkillStagger() {
  const cloud = document.querySelector('.skill-cloud')
  if (!cloud) return
  const tags = cloud.querySelectorAll('.skill-tag')
  const io = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      tags.forEach((tag, i) => {
        tag.style.opacity = '0'
        tag.style.transform = 'translateY(12px)'
        tag.style.transition = `opacity 0.5s, transform 0.5s`
        tag.style.transitionDelay = `${i * 35}ms`
        setTimeout(() => {
          tag.style.opacity = '1'
          tag.style.transform = 'translateY(0)'
        }, 50)
      })
      io.disconnect()
    }
  }, { threshold: 0.2 })
  io.observe(cloud)
})()
