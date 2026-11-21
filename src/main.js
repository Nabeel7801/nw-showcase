import '/src/style.css'

// ─── Year ─────────────────────────────────────────────────────
document.getElementById('year').textContent = new Date().getFullYear()

// ─── Nav scroll state + active spy ───────────────────────────
;(function () {
  const nav = document.getElementById('nav')
  const links = document.querySelectorAll('.nav__link')
  const sections = ['expertise', 'work', 'connect'].map(id => document.getElementById(id))

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60)

    const mid = window.scrollY + window.innerHeight * 0.4
    sections.forEach((sec, i) => {
      if (!sec) return
      const active = sec.offsetTop <= mid && sec.offsetTop + sec.offsetHeight > mid
      links[i]?.classList.toggle('active', active)
    })
  }, { passive: true })
})()

// ─── Scroll reveal ────────────────────────────────────────────
;(function () {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in')
        io.unobserve(e.target)
      }
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })

  document.querySelectorAll('.reveal').forEach(el => io.observe(el))
})()

// ─── Stagger reveal groups ────────────────────────────────────
;(function () {
  document.querySelectorAll('.exp-block').forEach((el, i) => {
    el.style.setProperty('--delay', `${i * 0.07}s`)
  })
  document.querySelectorAll('.work-item').forEach((el, i) => {
    el.style.setProperty('--delay', `${i * 0.06}s`)
  })
})()
