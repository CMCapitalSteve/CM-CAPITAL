// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(anchor.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});
// 3D Tilt on Hover (Certificates)
document.querySelectorAll('.cert-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 8;
    const rotateY = (centerX - x) / 8;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.08)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = `perspective(1000px) scale(1)`;
  });
});
// Lightbox config
lightbox.option({
  'resizeDuration': 300,
  'fadeDuration': 400,
  'imageFadeDuration': 400,
  'wrapAround': true
});
// Form Success Message
const form = document.querySelector('.contact-form');
if (form) {
  form.addEventListener('submit', function() {
    setTimeout(() => {
      const success = document.getElementById('form-success');
      if (success) {
        success.style.display = 'block';
        form.style.display = 'none';
      }
    }, 500);
  });
}
