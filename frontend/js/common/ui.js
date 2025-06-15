// frontend/js/common/ui.js

document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenuWrapper = document.querySelector('.nav-menu-wrapper');

    if (navToggle && navMenuWrapper) {
        navToggle.addEventListener('click', () => {
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', !isExpanded);
            navMenuWrapper.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
        });
    }
});