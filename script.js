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
const portalHeroCopy = document.getElementById('portal-hero-copy');
const portalSidebarCopy = document.getElementById('portal-sidebar-copy');
const portalStatusKicker = document.getElementById('portal-status-kicker');
const portalAuthActions = document.getElementById('portal-auth-actions');
const portalLoginLink = document.getElementById('portal-login-link');
const portalLogoutLink = document.getElementById('portal-logout-link');
const readerWatermark = document.getElementById('reader-watermark');
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

function lockAllPortalSections(message = 'Log in with Whop to unlock your member areas.') {
  accessSections.forEach(section => section.classList.add('is-locked'));
  if (accessLabel) accessLabel.textContent = message;
}

function setPortalAccess(access) {
  if (!accessSections.length) return;
  accessSections.forEach(section => {
    const allowed = section.dataset.access
      .split(' ')
      .some(key => Boolean(access[key]));
    section.classList.toggle('is-locked', !allowed);
  });
}

function strongestAccessLabel(access) {
  if (access.academy) return 'Academy member access';
  if (access.ebook) return 'Ebook reader access';
  if (access.discord) return 'Discord community access';
  if (access.free) return 'Free community access';
  return 'No paid access found';
}

async function hydrateMemberPortal() {
  if (!document.body.classList.contains('portal-body')) {
    if (roleButtons.length) setPortalRole('academy');
    return;
  }

  lockAllPortalSections('Checking Whop access...');

  try {
    const response = await fetch('/api/member/status', { credentials: 'include' });
    const data = await response.json().catch(() => ({}));

    if (response.status === 401 || !data.authenticated) {
      if (portalStatusKicker) portalStatusKicker.textContent = 'Login required';
      if (portalHeroCopy) portalHeroCopy.textContent = 'Log in through Whop so we can check your Academy, Discord, Ebook, or Free access.';
      if (portalSidebarCopy) portalSidebarCopy.textContent = 'Your access is managed by Whop. Sign in and the right areas will open automatically.';
      if (portalAuthActions) portalAuthActions.hidden = false;
      if (portalLoginLink) portalLoginLink.hidden = false;
      if (portalLogoutLink) portalLogoutLink.hidden = true;
      lockAllPortalSections('Log in with Whop to unlock your member areas.');
      return;
    }

    const access = data.access || {};
    setPortalAccess(access);

    if (portalStatusKicker) portalStatusKicker.textContent = 'Whop verified';
    if (accessLabel) accessLabel.textContent = strongestAccessLabel(access);
    if (portalHeroCopy) {
      portalHeroCopy.textContent = `Welcome back${data.user?.name ? `, ${data.user.name}` : ''}. Your member areas below are unlocked based on your Whop access.`;
    }
    if (portalSidebarCopy) portalSidebarCopy.textContent = 'Your Whop login is active. Only the areas included with your access are open.';
    if (portalAuthActions) portalAuthActions.hidden = true;
    if (portalLoginLink) portalLoginLink.hidden = true;
    if (portalLogoutLink) portalLogoutLink.hidden = false;
    if (readerWatermark) {
      const label = data.user?.email || data.user?.username || data.user?.id || 'verified member';
      readerWatermark.textContent = `C|M Strategy Ebook | ${label}`;
    }

    if (data.missing?.ebookProductId && !access.academy) {
      console.info('Standalone ebook access needs WHOP_PRODUCT_EBOOK to be added in Vercel.');
    }
  } catch (error) {
    if (portalStatusKicker) portalStatusKicker.textContent = 'Connection issue';
    if (portalHeroCopy) portalHeroCopy.textContent = 'The portal could not check Whop access yet. Try again after the next Vercel deploy.';
    if (portalAuthActions) portalAuthActions.hidden = false;
    lockAllPortalSections('Whop access check unavailable.');
  }
}

hydrateMemberPortal();
