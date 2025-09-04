document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('header');
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    // --- Header Scroll Effect ---
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, { passive: true });

    // --- Scroll-triggered Animations ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, {
        threshold: 0.1 
    });

    animatedElements.forEach(el => {
        observer.observe(el);
    });
});