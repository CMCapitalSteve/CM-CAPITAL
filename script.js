document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', event => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
    document.querySelector('.nav-links')?.classList.remove('is-open');
    document.querySelector('.nav-toggle')?.setAttribute('aria-expanded', 'false');
  });
});

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

document.querySelectorAll('.cert-card').forEach(card => {
  card.addEventListener('mousemove', event => {
    if (window.matchMedia('(max-width: 992px)').matches) return;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateX = (y - rect.height / 2) / 16;
    const rotateY = (rect.width / 2 - x) / 16;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

if (window.lightbox) {
  lightbox.option({
    resizeDuration: 260,
    fadeDuration: 320,
    imageFadeDuration: 320,
    wrapAround: true
  });
}

const form = document.querySelector('.contact-form');
if (form) {
  form.addEventListener('submit', () => {
    setTimeout(() => {
      const success = document.getElementById('form-success');
      if (success) {
        success.style.display = 'block';
        form.style.display = 'none';
      }
    }, 500);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('christmas-popup');
  if (!popup) return;

  const closeBtn = document.getElementById('close-popup');
  const snowfall = popup.querySelector('.snowfall');
  const currentMonth = new Date().getMonth();

  if (currentMonth === 11) {
    popup.style.display = 'flex';
    if (snowfall) snowfall.style.display = 'block';
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      popup.style.display = 'none';
      if (snowfall) snowfall.style.display = 'none';
    });
  }

  window.addEventListener('click', event => {
    if (event.target === popup) {
      popup.style.display = 'none';
      if (snowfall) snowfall.style.display = 'none';
    }
  });
});

const roleButtons = document.querySelectorAll('[data-role]');
const accessSections = document.querySelectorAll('[data-access]');
const accessLabel = document.getElementById('portal-access-label');
const roleLabels = {
  academy: 'Academy access preview',
  ebook: 'Ebook buyer access preview',
  discord: 'Paid Discord access preview',
  free: 'Free member access preview'
};

function setPortalRole(role) {
  if (!roleButtons.length || !accessSections.length) return;
  roleButtons.forEach(button => button.classList.toggle('is-selected', button.dataset.role === role));
  accessSections.forEach(section => {
    const allowed = section.dataset.access.split(' ').includes(role);
    section.classList.toggle('is-locked', !allowed);
  });
  if (accessLabel) accessLabel.textContent = roleLabels[role] || 'Access preview';
}

roleButtons.forEach(button => {
  button.addEventListener('click', () => setPortalRole(button.dataset.role));
});
setPortalRole('academy');
