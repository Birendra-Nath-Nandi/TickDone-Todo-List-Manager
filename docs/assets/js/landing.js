document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('header');
    const heroGraphic = document.getElementById('hero-graphic');
    const showcaseGraphic = document.getElementById('showcase-graphic'); // New mockup graphic
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    // --- Header Scroll Effect ---
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, { passive: true });

    // --- Parallax Mouse Move Effect ---
    document.body.addEventListener('mousemove', (e) => {
        // Prevent effect on smaller screens where it might be distracting
        if (window.innerWidth < 1024) {
             if (heroGraphic) heroGraphic.style.transform = `rotateY(-15deg) rotateX(10deg)`;
             if (showcaseGraphic) showcaseGraphic.style.transform = `rotateY(15deg) rotateX(5deg)`;
             return;
        }

        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;

        const xRotation = (clientY / innerHeight - 0.5) * -20;
        const yRotation = (clientX / innerWidth - 0.5) * 20;

        // Apply effect to hero graphic
        if (heroGraphic) {
            heroGraphic.style.transform = `rotateX(${10 + xRotation}deg) rotateY(${-15 + yRotation}deg)`;
        }
        
        // Apply effect to showcase graphic (with slightly different rotation for variety)
        if (showcaseGraphic) {
            showcaseGraphic.style.transform = `rotateX(${5 + xRotation * 0.5}deg) rotateY(${15 + yRotation * 0.8}deg)`;
        }
    });

    // --- Scroll-triggered Animations ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Optional: Stop observing after animation
                // observer.unobserve(entry.target); 
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of the element is visible
    });

    animatedElements.forEach(el => {
        observer.observe(el);
    });
});