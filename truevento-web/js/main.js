tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        display: ['Outfit', 'sans-serif'],
                    },
                    colors: {
                        primary: '#0ea5e9',
                        secondary: '#0284c7',
                        accent: '#38bdf8',
                        dark: '#0f172a',
                    }
                }
            }
        }

// Multi-language System (ES, PT, EN)
        const translations = {
            es: {
                nav_about: "La Escuela",
                nav_courses: "Cursos",
                nav_instructors: "Instructores",
                nav_book: "Reservar",
                nav_book_spot: "Reservar Spot",
                hero_location: "Ilha do Guajirú, Brasil",
                hero_title: 'Viento <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-pink-400" style="text-shadow: none;">Garantizado.</span><br>Agua 100% Plana.',
                hero_desc: "La experiencia definitiva de kiteboarding. Aprende, progresa y vuela en una de las mejores lagunas del mundo.",
                hero_btn_courses: "Ver Cursos",
                hero_btn_about: "Descubrir Más",
                about_exp: "Años de experiencia",
                about_tag: "Nosotros",
                about_title: "Tu paraíso del Kitesurf en Ceará",
                about_p1: "En Truevento Kiteschool no solo enseñamos un deporte, creamos kiteboarders independientes, seguros y apasionados. Ubicados en el corazón de Ilha do Guajirú, te ofrecemos las condiciones más seguras y perfectas de todo el norte de Brasil.",
                about_p2: "Nuestra metodología garantiza un aprendizaje rápido, divertido y sin frustraciones. Contamos con equipamiento de calidad y un equipo de instructores con gran experiencia y vocación por la enseñanza.",
                about_bullet1: "Equipamiento de alta calidad.",
                about_bullet2: "Instructores con experiencia y buena enseñanza.",
                about_bullet3: "Condiciones ideales: agua plana (flat) y viento garantizado todos los días.",
                about_btn_team: "Conoce a nuestro equipo",
                courses_tag: "Programas",
                courses_title: "Cursos para todos los niveles",
                courses_desc: "Desde tus primeros pasos en la arena hasta saltos profesionales y downwinds épicos en la costa brasileña.",
                c1_title: "Clases para niños",
                c1_desc: "El curso perfecto para niños principiantes. Su primera sensación con el kite y la mejor enseñanza para niños.",
                c1_b1: "Teoría de vuelo y seguridad",
                c1_b2: "Body drag en el agua",
                c1_b3: "Primeras sensaciones con el equipo de kite",
                course_btn_reserve: "Reservar Curso",
                c2_title: "Nivel inicial / intermedio / avanzado",
                c2_desc: "Mejora tu postura, aprende a navegar contra el viento (ceñir) y realiza tus primeras transiciones.",
                c2_b1: "Postura correcta y eficiencia",
                c2_b2: "Navegación upwind (ceñida)",
                c2_b3: "Transiciones básicas sin frenar",
                c3_title: "Full day en la lagoa",
                c3_desc: "Una experiencia inolvidable: viaje en camioneta, almuerzo incluido, sesión de navegación en agua plana y regreso a la ilha.",
                c3_b1: "Traslado ida y vuelta en camioneta 4x4",
                c3_b2: "Comida y refrigerios durante el día",
                c3_b3: "Navegada inolvidable en spot de agua plana",
                team_tag: "El Equipo",
                team_title: "Aprende de los mejores",
                team_desc: "Instructores apasionados por transmitir el deporte con seguridad y mucha buena onda.",
                seb_role: "Instructor 🇦🇷",
                seb_bio: "+5 años de experiencia. Instructor de todos los niveles, con muchísima paciencia para enseñar a personas de cualquier edad.",
                mika_role: "Instructor 🇦🇷",
                mika_bio: "+5 años de experiencia. Instructora de todos los niveles. Se destaca por su calidez y enorme paciencia para asegurar que aprendas de forma segura y divertida.",
                vic_role: "Head Coach 🇦🇷",
                vic_bio: "+20 años de experiencia. Instructora de todos los niveles. Tiene mucha paciencia con las personas y niños, garantizando la mejor base.",
                info_title: "Información Directa",
                info_location_title: "Ubicación",
                info_maps_link: "Abrir en Google Maps",
                info_wa_title: "WhatsApp (Respuesta Rápida)",
                footer_rights: "© 2026 Truevento Kiteschool. Todos los derechos reservados.",
                footer_privacy: "Política de Privacidad",
                                nav_app: "App",
                app_tag: "App de alumnos",
                app_title: "Truevento App",
                app_desc: "Pedí tus clases, seguí tu progreso paso a paso y mirá el viento de cada día. Se instala en un minuto, sin App Store ni Play Store.",
                app_btn_small: "Cómo instalarla",
                app_f1: "Pedí tu clase: día y horas",
                app_f2: "Tu progreso, paso a paso",
                app_f3: "El viento de cada día",
                                cookie_text: "Utilizamos cookies esenciales para asegurar el correcto funcionamiento de la web. Al continuar, aceptas nuestra",
                cookie_reject: "Rechazar",
                cookie_accept: "Aceptar",
                footer_terms: "Términos"
            },
            pt: {
                nav_about: "A Escola",
                nav_courses: "Cursos",
                nav_instructors: "Instrutores",
                nav_book: "Reservar",
                nav_book_spot: "Reservar Vaga",
                hero_location: "Ilha do Guajirú, Brasil",
                hero_title: 'Vento <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-pink-400" style="text-shadow: none;">Garantido.</span><br>Água 100% Plana.',
                hero_desc: "A melhor experiência de kiteboarding. Aprenda, evolua e voe em uma das melhores lagoas do mundo.",
                hero_btn_courses: "Ver Cursos",
                hero_btn_about: "Saiba Mais",
                about_exp: "Anos de experiência",
                about_tag: "Sobre Nós",
                about_title: "Seu paraíso do Kitesurf no Ceará",
                about_p1: "Na Truevento Kiteschool não ensinamos apenas um esporte, formamos velejadores independentes, confiantes e apaixonados. Localizados no coração da Ilha do Guajirú, oferecemos as condições mais seguras e perfeitas de todo o norte do Brasil.",
                about_p2: "Nossa metodologia garante um aprendizado rápido, divertido e sem frustrações. Contamos com equipamentos de alta qualidade e uma equipe com grande experiência e paixão pelo ensino.",
                about_bullet1: "Equipamentos de alta qualidade.",
                about_bullet2: "Instrutores experientes e didática excelente.",
                about_bullet3: "Condições perfeitas: água flat e vento garantido todos os dias.",
                about_btn_team: "Conheça nossa equipe",
                courses_tag: "Programas",
                courses_title: "Cursos para todos os níveis",
                courses_desc: "Desde os primeiros passos na areia até manobras avançadas e downwinds inesquecíveis pelo litoral brasileiro.",
                c1_title: "Aulas para crianças",
                c1_desc: "O curso ideal para iniciantes absolutos. Aprenda a pilotar o kite e deslizar na prancha.",
                c1_b1: "Teoria de voo e segurança",
                c1_b2: "Body drag na água",
                c1_b3: "Waterstart (primeiros metros na prancha)",
                course_btn_reserve: "Reservar Curso",
                c2_title: "Nível inicial / intermediário / avançado",
                c2_desc: "Aprimore sua postura, aprenda a orçar (contra o vento) e faça suas primeiras transições perfeitas.",
                c2_b1: "Postura correta e eficiência",
                c2_b2: "Navegação upwind (orça)",
                c2_b3: "Transições básicas fluidas",
                c3_title: "Full day na lagoa",
                c3_desc: "Uma experiência inesquecível: viagem de caminhonete 4x4, almoço incluído, velejo em água plana e retorno à ilha.",
                c3_b1: "Transporte ida e volta em caminhonete 4x4",
                c3_b2: "Almoço e bebidas durante o dia",
                c3_b3: "Sessão inesquecível de velejo em água flat",
                team_tag: "A Equipe",
                team_title: "Aprenda com os melhores",
                team_desc: "Instrutores apaixonados por transmitir o esporte com segurança e energia positiva.",
                seb_role: "Instrutor 🇦🇷",
                seb_bio: "+5 anos de experiência. Instrutor de todos os níveis, com muitíssima paciência para ensinar pessoas de qualquer idade.",
                mika_role: "Instrutora 🇦🇷",
                mika_bio: "+5 anos de experiência. Instrutora de todos os níveis. Destaca-se por sua simpatia e enorme paciência para garantir que você aprenda de forma segura e divertida.",
                vic_role: "Head Coach 🇦🇷",
                vic_bio: "+20 anos de experiência. Instrutora de todos os níveis. Tem muita paciência com as pessoas e crianças, garantindo a melhor base.",
                info_title: "Informações Diretas",
                info_location_title: "Localização",
                info_maps_link: "Abrir no Google Maps",
                info_wa_title: "WhatsApp (Resposta Rápida)",
                footer_rights: "© 2026 Truevento Kiteschool. Todos os direitos reservados.",
                footer_privacy: "Política de Privacidade",
                                nav_app: "App",
                app_tag: "App de alunos",
                app_title: "Truevento App",
                app_desc: "Peça suas aulas, acompanhe seu progresso passo a passo e veja o vento de cada dia. Instala em um minuto, sem App Store nem Play Store.",
                app_btn_small: "Como instalar",
                app_f1: "Peça sua aula: dia e horas",
                app_f2: "Seu progresso, passo a passo",
                app_f3: "O vento de cada dia",
                                cookie_text: "Usamos cookies essenciais para garantir o bom funcionamento do site. Ao continuar, você aceita nossa",
                cookie_reject: "Recusar",
                cookie_accept: "Aceitar",
                footer_terms: "Termos"
            },
            en: {
                nav_about: "About Us",
                nav_courses: "Courses",
                nav_instructors: "Instructors",
                nav_book: "Book Now",
                nav_book_spot: "Book Spot",
                hero_location: "Ilha do Guajirú, Brazil",
                hero_title: 'Guaranteed <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-pink-400" style="text-shadow: none;">Wind.</span><br>100% Flat Water.',
                hero_desc: "The ultimate kiteboarding experience. Learn, progress and fly in one of the world's finest lagoons.",
                hero_btn_courses: "Explore Courses",
                hero_btn_about: "Discover More",
                about_exp: "Years of experience",
                about_tag: "About Us",
                about_title: "Your Kitesurfing Paradise in Ceará",
                about_p1: "At Truevento Kiteschool, we don't just teach a sport—we create independent, confident, and passionate kiteboarders. Located in the heart of Ilha do Guajirú, we offer the safest and most optimal conditions in northern Brazil.",
                about_p2: "Our teaching methodology ensures fast, fun, and frustration-free progression. We provide top-grade equipment and an experienced, dedicated instructor crew.",
                about_bullet1: "Top-quality premium equipment.",
                about_bullet2: "Experienced instructors with dedicated teaching methods.",
                about_bullet3: "Ideal conditions: flat shallow water and guaranteed daily wind.",
                about_btn_team: "Meet Our Team",
                courses_tag: "Programs",
                courses_title: "Courses for all skill levels",
                courses_desc: "From your very first kite flight on the sand to big air boosts and coastal downwinders in Brazil.",
                c1_title: "Lessons for kids",
                c1_desc: "The ideal course for complete beginners. Learn wind awareness, kite control and get riding.",
                c1_b1: "Wind theory and safety protocols",
                c1_b2: "Body dragging in the water",
                c1_b3: "Waterstart & first board riding meters",
                course_btn_reserve: "Book Course",
                c2_title: "Beginner / Intermediate / Advanced",
                c2_desc: "Refine your body stance, ride upwind with ease, and nail clean directional transitions.",
                c2_b1: "Proper posture and efficient edging",
                c2_b2: "Consistent upwind riding",
                c2_b3: "Smooth basic transitions",
                c3_title: "Full day at the lagoon",
                c3_desc: "An unforgettable adventure: 4x4 truck trip, delicious lunch included, epic flat-water session and return to the island.",
                c3_b1: "Round-trip transfer in 4x4 truck",
                c3_b2: "Food and refreshments during the day",
                c3_b3: "Unforgettable kite session in flat water spot",
                team_tag: "Our Crew",
                team_title: "Learn from the best",
                team_desc: "Instructors dedicated to safe, enthusiastic, and joyful coaching.",
                seb_role: "Instructor 🇦🇷",
                seb_bio: "+5 years of experience. Instructor for all levels, with great patience to teach people of any age.",
                mika_role: "Instructor 🇦🇷",
                mika_bio: "+5 years of experience. Instructor for all levels. Stands out for her warmth and enormous patience to ensure you learn in a safe and fun way.",
                vic_role: "Head Coach 🇦🇷",
                vic_bio: "+20 years of experience. Instructor for all levels. Has great patience with people and children, guaranteeing the best foundation.",
                info_title: "Direct Information",
                info_location_title: "Location",
                info_maps_link: "Open in Google Maps",
                info_wa_title: "WhatsApp (Fast Response)",
                footer_rights: "© 2026 Truevento Kiteschool. All rights reserved.",
                footer_privacy: "Privacy Policy",
                                nav_app: "App",
                app_tag: "Student app",
                app_title: "Truevento App",
                app_desc: "Book your lessons, follow your progress step by step and check each day's wind. It installs in a minute, no App Store or Play Store needed.",
                app_btn_small: "How to install",
                app_f1: "Book your lesson: day and hours",
                app_f2: "Your progress, step by step",
                app_f3: "The wind, every day",
                                cookie_text: "We use essential cookies to make the website work properly. By continuing, you accept our",
                cookie_reject: "Decline",
                cookie_accept: "Accept",
                footer_terms: "Terms"
            }
        };

// ---------------------------------------------------------------------------
// Behaviour of the page
// ---------------------------------------------------------------------------

// Some browsers block storage (Safari private mode, blocked cookies): the page must work anyway.
const store = {
    get(k) { try { return window.localStorage.getItem(k) } catch (e) { return null } },
    set(k, v) { try { window.localStorage.setItem(k, v) } catch (e) { /* not remembered */ } },
};

// Language
window.currentLang = 'es';

function setLanguage(lang) {
    if (!translations[lang]) return;
    window.currentLang = lang;
    store.set('truevento_lang', lang);
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const text = translations[lang][el.getAttribute('data-i18n')];
        if (text) el.innerHTML = text;
    });

    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
        const on = btn.getAttribute('data-lang-btn') === lang;
        btn.classList.toggle('bg-primary', on);
        btn.classList.toggle('text-white', on);
        btn.classList.toggle('text-white/60', !on);
        btn.setAttribute('aria-pressed', String(on));
    });
}

// Navbar: more compact once you scroll
const navbar = document.getElementById('navbar');
function updateNavbar() {
    const scrolled = window.scrollY > 50;
    navbar.classList.toggle('scrolled', scrolled);
    navbar.classList.toggle('py-2', scrolled);
    navbar.classList.toggle('py-3', !scrolled);
    navbar.classList.toggle('md:py-4', !scrolled);
}
window.addEventListener('scroll', updateNavbar, { passive: true });

// Mobile menu
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const menuSpans = menuBtn.querySelectorAll('span');
let isMenuOpen = false;

function setMenu(open) {
    isMenuOpen = open;
    mobileMenu.classList.toggle('opacity-0', !open);
    mobileMenu.classList.toggle('pointer-events-none', !open);
    document.body.classList.toggle('menu-open', open); // hides the cookie notice and WhatsApp button over the menu
    document.body.style.overflow = open ? 'hidden' : '';
    menuBtn.setAttribute('aria-expanded', String(open));
    menuSpans[0].style.transform = open ? 'rotate(45deg) translate(5px, 5px)' : '';
    menuSpans[1].style.opacity = open ? '0' : '';
    menuSpans[2].style.transform = open ? 'rotate(-45deg) translate(5px, -5px)' : '';
    menuSpans.forEach((s) => { s.style.background = open ? '#fff' : ''; });
}

menuBtn.addEventListener('click', () => setMenu(!isMenuOpen));
document.querySelectorAll('.mobile-link').forEach((link) => link.addEventListener('click', () => setMenu(false)));

// Sections appear as you scroll
const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
    });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// Privacy and terms windows
let openModalId = null;

function openModal(modalId, event) {
    if (event) event.preventDefault();
    const modal = document.getElementById(modalId);
    const content = modal.querySelector('div.relative');
    openModalId = modalId;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const content = modal.querySelector('div.relative');
    openModalId = null;
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
        if (!isMenuOpen) document.body.style.overflow = '';
    }, 300);
}

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (openModalId) closeModal(openModalId);
    else if (isMenuOpen) setMenu(false);
});

// Cookie notice
function closeCookieBanner() {
    const banner = document.getElementById('cookieBanner');
    banner.style.transform = 'translateY(100%)';
    setTimeout(() => { banner.style.display = 'none'; }, 500);
}
function acceptCookies() { store.set('truevento_cookies_accepted', 'true'); closeCookieBanner(); }
function rejectCookies() { store.set('truevento_cookies_accepted', 'false'); closeCookieBanner(); }

// Photo carousel: arrows, dots, swipe, and it moves by itself only while you can see it
const carousel = document.getElementById('about-carousel');
const dots = document.querySelectorAll('.carousel-dot');
const totalSlides = carousel.children.length;
let currentSlide = 0;
let autoSlideInterval = null;
let carouselVisible = false;

function updateCarousel() {
    carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.forEach((dot, index) => {
        const on = index === currentSlide;
        dot.classList.toggle('bg-white/40', !on);
        dot.classList.toggle('bg-white/80', on);
        dot.classList.toggle('w-4', on);
        dot.setAttribute('aria-current', String(on));
    });
}

function goToSlide(index) {
    currentSlide = (index + totalSlides) % totalSlides;
    updateCarousel();
    resetAutoSlide();
}
function nextSlide() { goToSlide(currentSlide + 1); }
function prevSlide() { goToSlide(currentSlide - 1); }

function resetAutoSlide() {
    clearInterval(autoSlideInterval);
    autoSlideInterval = carouselVisible && !document.hidden ? setInterval(nextSlide, 4000) : null;
}

dots.forEach((dot, index) => dot.addEventListener('click', () => goToSlide(index)));

let touchX = null;
carousel.parentElement.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
carousel.parentElement.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 40) (dx < 0 ? nextSlide : prevSlide)();
}, { passive: true });

new IntersectionObserver(([entry]) => { carouselVisible = entry.isIntersecting; resetAutoSlide(); }).observe(carousel.parentElement);
document.addEventListener('visibilitychange', resetAutoSlide);

// Start
function start() {
    setLanguage(store.get('truevento_lang') || 'es');
    updateNavbar();
    updateCarousel();
    if (!store.get('truevento_cookies_accepted')) {
        setTimeout(() => { document.getElementById('cookieBanner').style.transform = 'translateY(0)'; }, 1000);
    }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
