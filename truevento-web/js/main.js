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
                hero_explore: "Explorar",
                badge_aak_title: "Intercomunicadores",
                badge_aak_desc: "Comunicación directa con el instructor durante tu clase.",
                badge_wind_title: "Viento Constante",
                badge_wind_desc: "Temporada de julio a enero asegurada.",
                badge_flat_title: "Agua Plana",
                badge_flat_desc: "Laguna gigante ideal para principiantes y avanzados.",
                badge_lang_title: "Multilingüe",
                badge_lang_desc: "Clases en Español, Inglés y Portugués.",
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
                c1_badge: "INICIACIÓN",
                c1_title: "Clases para niños",
                c1_desc: "El curso perfecto para niños principiantes. Su primera sensación con el kite y la mejor enseñanza para niños.",
                c1_hours: "9 Horas",
                c1_b1: "Teoría de vuelo y seguridad",
                c1_b2: "Body drag en el agua",
                c1_b3: "Primeras sensaciones con el equipo de kite",
                course_btn_reserve: "Reservar Curso",
                c2_popular: "Popular",
                c2_badge: "INTERMEDIO",
                c2_title: "Nivel inicial / intermedio / avanzado",
                c2_desc: "Mejora tu postura, aprende a navegar contra el viento (ceñir) y realiza tus primeras transiciones.",
                c2_hours: "6 Horas",
                c2_b1: "Postura correcta y eficiencia",
                c2_b2: "Navegación upwind (ceñida)",
                c2_b3: "Transiciones básicas sin frenar",
                c3_title: "Full day en la lagoa",
                c3_desc: "Una experiencia inolvidable: viaje en camioneta, almuerzo incluido, sesión de navegación en agua plana y regreso a la ilha.",
                c3_hours: "Día Completo",
                c3_type: "Aventura & Velejo",
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
                contact_tag: "Contacto",
                contact_title: "Reservá tu clase en la app",
                contact_desc: "Pedí tu clase desde la app: elegís el día y cuántas horas, y te escribimos por WhatsApp para coordinar el horario y el precio. Ahí también ves tus clases y tu progreso.",
                contact_s1: "Abrí la app y creá tu cuenta (es gratis).",
                contact_s2: "Tocá “Pedir clase” y elegí el día y las horas.",
                contact_s3: "Te escribimos por WhatsApp y confirmamos tu clase.",
                contact_app_btn: "Pedir mi clase en la app",
                contact_install_btn: "Cómo instalarla",
                form_name: "Nombre Completo",
                form_email: "Correo Electrónico",
                form_phone: "Teléfono / WhatsApp",
                opt_select: "Selecciona tu nivel/curso",
                opt_ninos: "Clases para niños",
                opt_inicial: "Nivel inicial",
                opt_intermedio: "Nivel intermedio",
                opt_avanzado: "Nivel avanzado",
                opt_lagoa: "Reservar sesión en la lagoa",
                form_message: "Mensaje (Fechas deseadas, dudas, etc.)",
                form_privacy: "He leído y acepto la política de privacidad. Acepto ser contactado respecto a mi reserva.",
                form_submit: "Enviar Solicitud",
                info_title: "Información Directa",
                info_location_title: "Ubicación",
                info_maps_link: "Abrir en Google Maps",
                info_wa_title: "WhatsApp (Respuesta Rápida)",
                footer_rights: "© 2026 Truevento Kiteschool. Todos los derechos reservados.",
                footer_privacy: "Política de Privacidad",
                                nav_app: "App",
                app_tag: "App de alumnos",
                app_title: "Tu escuela en el celular",
                app_desc: "Pedí tus clases, seguí tu progreso paso a paso y mirá el viento de cada día. Se instala en un minuto, sin App Store ni Play Store.",
                app_open_title: "Abrí la app",
                app_open_desc: "Creá tu cuenta o ingresá con tu usuario.",
                app_open_btn: "Ir a la app",
                app_install_title: "Instalala en tu celular",
                app_install_desc: "Tutorial paso a paso con imágenes para iPhone y Android.",
                app_install_btn: "Ver el tutorial",
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
                hero_explore: "Explorar",
                badge_aak_title: "Intercomunicadores",
                badge_aak_desc: "Comunicação direta com o instrutor durante sua aula.",
                badge_wind_title: "Vento Constante",
                badge_wind_desc: "Temporada de julho a janeiro garantida.",
                badge_flat_title: "Água Plana",
                badge_flat_desc: "Lagoa gigante perfeita para iniciantes e avançados.",
                badge_lang_title: "Multilíngue",
                badge_lang_desc: "Aulas em Espanhol, Inglês e Português.",
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
                c1_badge: "INICIAÇÃO",
                c1_title: "Aulas para crianças",
                c1_desc: "O curso ideal para iniciantes absolutos. Aprenda a pilotar o kite e deslizar na prancha.",
                c1_hours: "9 Horas",
                c1_b1: "Teoria de voo e segurança",
                c1_b2: "Body drag na água",
                c1_b3: "Waterstart (primeiros metros na prancha)",
                course_btn_reserve: "Reservar Curso",
                c2_popular: "Popular",
                c2_badge: "INTERMEDIÁRIO",
                c2_title: "Nível inicial / intermediário / avançado",
                c2_desc: "Aprimore sua postura, aprenda a orçar (contra o vento) e faça suas primeiras transições perfeitas.",
                c2_hours: "6 Horas",
                c2_b1: "Postura correta e eficiência",
                c2_b2: "Navegação upwind (orça)",
                c2_b3: "Transições básicas fluidas",
                c3_title: "Full day na lagoa",
                c3_desc: "Uma experiência inesquecível: viagem de caminhonete 4x4, almoço incluído, velejo em água plana e retorno à ilha.",
                c3_hours: "Dia Completo",
                c3_type: "Aventura & Velejo",
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
                contact_tag: "Contato",
                contact_title: "Reserve sua aula no app",
                contact_desc: "Peça sua aula pelo app: você escolhe o dia e quantas horas, e falamos pelo WhatsApp para combinar o horário e o valor. Lá você também vê suas aulas e seu progresso.",
                contact_s1: "Abra o app e crie sua conta (é grátis).",
                contact_s2: "Toque em “Pedir aula” e escolha o dia e as horas.",
                contact_s3: "Falamos pelo WhatsApp e confirmamos sua aula.",
                contact_app_btn: "Pedir minha aula no app",
                contact_install_btn: "Como instalar",
                form_name: "Nome Completo",
                form_email: "E-mail",
                form_phone: "Telefone / WhatsApp",
                opt_select: "Selecione seu nível/curso",
                opt_ninos: "Aulas para crianças",
                opt_inicial: "Nível iniciante",
                opt_intermedio: "Nível intermediário",
                opt_avanzado: "Nível avançado",
                opt_lagoa: "Reservar sessão na lagoa",
                form_message: "Mensagem (Datas desejadas, dúvidas, etc.)",
                form_privacy: "Li e concordo com a política de privacidade. Autorizo o contato sobre minha reserva.",
                form_submit: "Enviar Solicitação",
                info_title: "Informações Diretas",
                info_location_title: "Localização",
                info_maps_link: "Abrir no Google Maps",
                info_wa_title: "WhatsApp (Resposta Rápida)",
                footer_rights: "© 2026 Truevento Kiteschool. Todos os direitos reservados.",
                footer_privacy: "Política de Privacidade",
                                nav_app: "App",
                app_tag: "App de alunos",
                app_title: "A escola no seu celular",
                app_desc: "Peça suas aulas, acompanhe seu progresso passo a passo e veja o vento de cada dia. Instala em um minuto, sem App Store nem Play Store.",
                app_open_title: "Abra o app",
                app_open_desc: "Crie sua conta ou entre com seu usuário.",
                app_open_btn: "Ir para o app",
                app_install_title: "Instale no seu celular",
                app_install_desc: "Tutorial passo a passo com imagens para iPhone e Android.",
                app_install_btn: "Ver o tutorial",
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
                hero_explore: "Scroll",
                badge_aak_title: "Radio Intercoms",
                badge_aak_desc: "Direct communication with your instructor during your lesson.",
                badge_wind_title: "Steady Wind",
                badge_wind_desc: "Reliable season from July to January.",
                badge_flat_title: "Flat Water",
                badge_flat_desc: "Gigantic lagoon perfect for beginners and advanced riders.",
                badge_lang_title: "Multilingual",
                badge_lang_desc: "Lessons in Spanish, English and Portuguese.",
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
                c1_badge: "BEGINNER",
                c1_title: "Lessons for kids",
                c1_desc: "The ideal course for complete beginners. Learn wind awareness, kite control and get riding.",
                c1_hours: "9 Hours",
                c1_b1: "Wind theory and safety protocols",
                c1_b2: "Body dragging in the water",
                c1_b3: "Waterstart & first board riding meters",
                course_btn_reserve: "Book Course",
                c2_popular: "Popular",
                c2_badge: "INTERMEDIATE",
                c2_title: "Beginner / Intermediate / Advanced",
                c2_desc: "Refine your body stance, ride upwind with ease, and nail clean directional transitions.",
                c2_hours: "6 Hours",
                c2_b1: "Proper posture and efficient edging",
                c2_b2: "Consistent upwind riding",
                c2_b3: "Smooth basic transitions",
                c3_title: "Full day at the lagoon",
                c3_desc: "An unforgettable adventure: 4x4 truck trip, delicious lunch included, epic flat-water session and return to the island.",
                c3_hours: "Full Day",
                c3_type: "Adventure & Riding",
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
                contact_tag: "Contact",
                contact_title: "Book your lesson in the app",
                contact_desc: "Ask for your lesson in the app: choose the day and how many hours, and we message you on WhatsApp to agree on the time and price. You also see your lessons and progress there.",
                contact_s1: "Open the app and create your account (it's free).",
                contact_s2: "Tap “Book” and choose the day and hours.",
                contact_s3: "We message you on WhatsApp and confirm your lesson.",
                contact_app_btn: "Book my lesson in the app",
                contact_install_btn: "How to install it",
                form_name: "Full Name",
                form_email: "Email Address",
                form_phone: "Phone / WhatsApp",
                opt_select: "Select your level / course",
                opt_ninos: "Lessons for kids",
                opt_inicial: "Beginner level",
                opt_intermedio: "Intermediate level",
                opt_avanzado: "Advanced level",
                opt_lagoa: "Book lagoon session",
                form_message: "Message (Dates, questions, special requests...)",
                form_privacy: "I have read and agree to the privacy policy. I consent to be contacted regarding my booking.",
                form_submit: "Send Request",
                info_title: "Direct Information",
                info_location_title: "Location",
                info_maps_link: "Open in Google Maps",
                info_wa_title: "WhatsApp (Fast Response)",
                footer_rights: "© 2026 Truevento Kiteschool. All rights reserved.",
                footer_privacy: "Privacy Policy",
                                nav_app: "App",
                app_tag: "Student app",
                app_title: "Your school on your phone",
                app_desc: "Book your lessons, follow your progress step by step and check each day's wind. It installs in a minute, no App Store or Play Store needed.",
                app_open_title: "Open the app",
                app_open_desc: "Create your account or sign in with your username.",
                app_open_btn: "Go to the app",
                app_install_title: "Install it on your phone",
                app_install_desc: "Step-by-step guide with pictures for iPhone and Android.",
                app_install_btn: "See the guide",
                app_f1: "Book your lesson: day and hours",
                app_f2: "Your progress, step by step",
                app_f3: "The wind, every day",
                                cookie_text: "We use essential cookies to make the website work properly. By continuing, you accept our",
                cookie_reject: "Decline",
                cookie_accept: "Accept",
                footer_terms: "Terms"
            }
        };

        window.currentLang = 'es';

        function setLanguage(lang) {
            if (!translations[lang]) return;
            window.currentLang = lang;
            localStorage.setItem('truevento_lang', lang);
            document.documentElement.lang = lang;

            // Update all elements with data-i18n
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (translations[lang] && translations[lang][key]) {
                    el.innerHTML = translations[lang][key];
                }
            });

            // Update custom dropdown selected label if an option is active
            if (window.currentSelectedOptionKey && translations[lang] && translations[lang][window.currentSelectedOptionKey]) {
                const courseText = document.getElementById('course-selected-text');
                if (courseText) {
                    courseText.innerHTML = translations[lang][window.currentSelectedOptionKey];
                }
            }

            // Update language switcher buttons appearance
            document.querySelectorAll('[data-lang-btn]').forEach(btn => {
                const btnLang = btn.getAttribute('data-lang-btn');
                if (btnLang === lang) {
                    btn.className = btn.className.replace('text-slate-400', 'text-white').replace('hover:text-white', '');
                    if (!btn.classList.contains('bg-primary')) {
                        btn.classList.add('bg-primary', 'text-white');
                    }
                } else {
                    btn.classList.remove('bg-primary', 'text-white');
                    if (!btn.classList.contains('text-slate-400')) {
                        btn.classList.add('text-slate-400', 'hover:text-white');
                    }
                }
            });
        }

        // Initialize default or stored language
        document.addEventListener('DOMContentLoaded', () => {
            const savedLang = localStorage.getItem('truevento_lang') || 'es';
            setLanguage(savedLang);
        });

        // Navbar Scroll Effect
        const navbar = document.getElementById('navbar');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
                navbar.classList.remove('py-3', 'md:py-4');
                navbar.classList.add('py-2');
            } else {
                navbar.classList.remove('scrolled');
                navbar.classList.add('py-3', 'md:py-4');
                navbar.classList.remove('py-2');
            }
        });

        // Mobile Menu
        const menuBtn = document.getElementById('menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const menuSpans = menuBtn.querySelectorAll('span');
        const mobileLinks = document.querySelectorAll('.mobile-link');
        let isMenuOpen = false;

        const toggleMenu = () => {
            isMenuOpen = !isMenuOpen;
            if (isMenuOpen) {
                mobileMenu.classList.remove('opacity-0', 'pointer-events-none');
                menuSpans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                menuSpans[1].style.opacity = '0';
                menuSpans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
                menuSpans.forEach(s => s.style.background = '#fff'); // force white on dark overlay
                document.body.style.overflow = 'hidden';
            } else {
                mobileMenu.classList.add('opacity-0', 'pointer-events-none');
                menuSpans[0].style.transform = 'none';
                menuSpans[1].style.opacity = '1';
                menuSpans[2].style.transform = 'none';
                if (window.scrollY > 50) menuSpans.forEach(s => s.style.background = '#f8fafc');
                document.body.style.overflow = 'auto';
            }
        };

        menuBtn.addEventListener('click', toggleMenu);
        mobileLinks.forEach(link => link.addEventListener('click', toggleMenu));

        // Scroll Reveal
        const revealElements = document.querySelectorAll('.reveal');
        const revealOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };
        const revealObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            });
        }, revealOptions);

        revealElements.forEach(el => revealObserver.observe(el));

        // Modals Logic
        function openModal(modalId, event) {
            if (event) event.preventDefault();
            const modal = document.getElementById(modalId);
            const content = modal.querySelector('div.relative');
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
            
            // Trigger animation
            setTimeout(() => {
                content.classList.remove('scale-95', 'opacity-0');
                content.classList.add('scale-100', 'opacity-100');
            }, 10);
        }

        function closeModal(modalId) {
            const modal = document.getElementById(modalId);
            const content = modal.querySelector('div.relative');
            
            // Animate out
            content.classList.remove('scale-100', 'opacity-100');
            content.classList.add('scale-95', 'opacity-0');
            
            setTimeout(() => {
                modal.classList.add('hidden');
                document.body.style.overflow = 'auto'; // Restore background scrolling
            }, 300);
        }

        // Cookie Banner Logic
        function acceptCookies() {
            localStorage.setItem('truevento_cookies_accepted', 'true');
            closeCookieBanner();
        }

        function rejectCookies() {
            localStorage.setItem('truevento_cookies_accepted', 'false');
            closeCookieBanner();
        }

        function closeCookieBanner() {
            const banner = document.getElementById('cookieBanner');
            banner.style.transform = 'translateY(100%)';
            setTimeout(() => {
                banner.style.display = 'none';
            }, 500);
        }

        // Custom Course Dropdown Logic
        window.currentSelectedOptionKey = null;

        function toggleCourseDropdown() {
            const menu = document.getElementById('course-dropdown-menu');
            const btn = document.getElementById('course-dropdown-btn');
            const arrow = document.getElementById('course-arrow-icon');
            if (!menu) return;

            const isClosed = menu.classList.contains('hidden');
            if (isClosed) {
                menu.classList.remove('hidden');
                setTimeout(() => {
                    menu.classList.remove('opacity-0', 'scale-95');
                    menu.classList.add('opacity-100', 'scale-100');
                    btn.classList.add('active');
                    arrow.style.transform = 'rotate(180deg)';
                }, 10);
            } else {
                closeCourseDropdown();
            }
        }

        function closeCourseDropdown() {
            const menu = document.getElementById('course-dropdown-menu');
            const btn = document.getElementById('course-dropdown-btn');
            const arrow = document.getElementById('course-arrow-icon');
            if (!menu || menu.classList.contains('hidden')) return;

            menu.classList.remove('opacity-100', 'scale-100');
            menu.classList.add('opacity-0', 'scale-95');
            btn.classList.remove('active');
            arrow.style.transform = 'rotate(0deg)';
            setTimeout(() => {
                menu.classList.add('hidden');
            }, 200);
        }

        function selectCourseOption(val) {
            const hiddenInput = document.getElementById('course-select');
            const labelEl = document.getElementById('course-selected-text');
            const menu = document.getElementById('course-dropdown-menu');
            const options = menu.querySelectorAll('.custom-dropdown-option');

            const keyMap = {
                'ninos': 'opt_ninos',
                'inicial': 'opt_inicial',
                'intermedio': 'opt_intermedio',
                'avanzado': 'opt_avanzado',
                'lagoa': 'opt_lagoa'
            };

            hiddenInput.value = val;
            window.currentSelectedOptionKey = keyMap[val];

            const currentLang = window.currentLang || 'es';
            if (translations[currentLang] && translations[currentLang][window.currentSelectedOptionKey]) {
                labelEl.innerHTML = translations[currentLang][window.currentSelectedOptionKey];
            }
            labelEl.classList.remove('text-slate-400');
            labelEl.classList.add('text-white', 'font-medium');

            options.forEach(opt => {
                if (opt.getAttribute('data-value') === val) {
                    opt.classList.add('selected');
                } else {
                    opt.classList.remove('selected');
                }
            });

            closeCourseDropdown();
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const container = document.getElementById('custom-course-dropdown');
            if (container && !container.contains(e.target)) {
                closeCourseDropdown();
            }
        });

        // Contact Form Submission Handler
        async function submitContactForm(event) {
            event.preventDefault();

            const form = event.target;
            const btn = form.querySelector('button[type="submit"]');
            const originalBtnText = btn.innerHTML;
            btn.innerHTML = 'Enviando...';
            btn.disabled = true;
            btn.classList.add('opacity-75');

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim() || 'No especificado';
            const courseVal = document.getElementById('course-select').value;
            const message = document.getElementById('message').value.trim() || 'Sin comentarios adicionales';

            // Resolve course text
            const keyMap = {
                'ninos': 'opt_ninos',
                'inicial': 'opt_inicial',
                'intermedio': 'opt_intermedio',
                'avanzado': 'opt_avanzado',
                'lagoa': 'opt_lagoa'
            };
            const currentLang = window.currentLang || 'es';
            let courseText = 'General / No especificado';
            if (courseVal && keyMap[courseVal] && translations[currentLang] && translations[currentLang][keyMap[courseVal]]) {
                courseText = translations[currentLang][keyMap[courseVal]];
            }

            // Fill summary modal values
            document.getElementById('summary-name').textContent = name;
            document.getElementById('summary-email').textContent = email;
            document.getElementById('summary-phone').textContent = phone;
            document.getElementById('summary-course').textContent = courseText;

            // Multilingual modal texts
            const titles = {
                es: '¡Gracias por elegirnos!',
                pt: 'Obrigado por nos escolher!',
                en: 'Thank you for choosing us!'
            };
            const descs = {
                es: 'En Truevento agradecemos tu solicitud de reserva. Trabajamos con el mayor profesionalismo para garantizarte una experiencia cómoda e inolvidable. Nos pondremos en contacto a la brevedad.',
                pt: 'Na Truevento agradecemos a sua solicitação de reserva. Trabalhamos com o maior profissionalismo para garantir uma experiência confortável e inesquecível. Entraremos em contato em breve.',
                en: 'At Truevento we appreciate your booking request. We work with the utmost professionalism to guarantee you a comfortable and unforgettable experience. We will get back to you shortly.'
            };
            document.getElementById('modal-success-title').textContent = titles[currentLang] || titles.es;
            document.getElementById('modal-success-desc').textContent = descs[currentLang] || descs.es;

            try {
                // Send form data via FormSubmit asynchronously
                await fetch("https://formsubmit.co/ajax/Truevento7@gmail.com", {
                    method: "POST",
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        _subject: `Nueva Reserva Web - ${name}`,
                        Nombre: name,
                        Email: email,
                        Telefono: phone,
                        Interes: courseText,
                        Mensaje: message
                    })
                });
            } catch (error) {
                console.error("Error al enviar el formulario:", error);
            }

            // Restore button
            btn.innerHTML = originalBtnText;
            btn.disabled = false;
            btn.classList.remove('opacity-75');

            // Open confirmation modal
            openModal('successModal');
            
            // Reset form visually
            form.reset();
            const courseTextEl = document.getElementById('course-selected-text');
            if (courseTextEl) {
                courseTextEl.innerHTML = translations[currentLang]?.opt_select || 'Selecciona tu nivel/curso';
                courseTextEl.classList.remove('text-white', 'font-medium');
                courseTextEl.classList.add('text-slate-400');
            }
            document.querySelectorAll('.custom-dropdown-option').forEach(opt => opt.classList.remove('selected'));
            document.getElementById('course-select').value = '';
            window.currentSelectedOptionKey = null;
        }

        document.addEventListener('DOMContentLoaded', () => {
            const savedLang = localStorage.getItem('truevento_lang') || 'es';
            setLanguage(savedLang);

            const dropdownBtn = document.getElementById('course-dropdown-btn');
            if (dropdownBtn) {
                dropdownBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleCourseDropdown();
                });
            }

            // Check Cookie Consent
            if (!localStorage.getItem('truevento_cookies_accepted')) {
                setTimeout(() => {
                    const banner = document.getElementById('cookieBanner');
                    banner.style.transform = 'translateY(0)';
                }, 1000);
            }
        });

let currentSlide = 0;
        const totalSlides = 9;
        const carousel = document.getElementById('about-carousel');
        const dots = document.querySelectorAll('.carousel-dot');
        let autoSlideInterval;

        function updateCarousel() {
            carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
            dots.forEach((dot, index) => {
                if (index === currentSlide) {
                    dot.classList.remove('bg-white/40');
                    dot.classList.add('bg-white/80', 'w-4');
                } else {
                    dot.classList.add('bg-white/40');
                    dot.classList.remove('bg-white/80', 'w-4');
                }
            });
        }

        function nextSlide() {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateCarousel();
            resetAutoSlide();
        }

        function prevSlide() {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateCarousel();
            resetAutoSlide();
        }

        function goToSlide(index) {
            currentSlide = index;
            updateCarousel();
            resetAutoSlide();
        }

        function resetAutoSlide() {
            clearInterval(autoSlideInterval);
            autoSlideInterval = setInterval(nextSlide, 4000);
        }

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => goToSlide(index));
        });

        // Initialize auto-slide
        resetAutoSlide();

