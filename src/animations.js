// Importáld a GSAP-et, ha telepítetted: npm install gsap
// const gsap = require('gsap');

// Animáld a sidebar ikonokat
document.querySelectorAll('.nav-items a').forEach((item, index) => {
    gsap.from(item, {
        opacity: 0,
        x: -20,
        delay: 0.2 + index * 0.1,
        duration: 0.5,
        ease: "power3.out",
    });
});

// Dinamikus háttér animáció
const body = document.body;
let hue = 200;
setInterval(() => {
    hue += 1;
    body.style.background = `linear-gradient(135deg, hsl(${hue}, 80%, 50%), hsl(${hue + 60}, 80%, 50%))`;
}, 50);
