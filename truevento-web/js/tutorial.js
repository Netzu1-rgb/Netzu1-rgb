// Installation guide on the website: as you scroll, the phone on one side changes screen
// and the step it shows is explained on the other side. iPhone / Android, es / pt / en.
(function () {
  const APP = 'app.truevento.com'
  const IMG = { icon: 'assets/app-icon.png', shot: { es: 'assets/tut-es.jpg', pt: 'assets/tut-pt.jpg', en: 'assets/tut-en.jpg' } }
  const UI = {
    es: { tag: 'Instalá la app', title: 'Tené Truevento en tu pantalla de inicio', desc: 'Seguí los pasos: deslizá hacia abajo y el celular te muestra dónde tocar. Es un minuto y no hace falta ninguna tienda de apps.', step: 'Paso', of: 'de', open: 'Abrir la app', openSub: 'Creá tu cuenta y pedí tu clase', guide: 'Tutorial para compartir', guideSub: 'Mandáselo a quien quieras' },
    pt: { tag: 'Instale o app', title: 'Tenha a Truevento na sua tela inicial', desc: 'Siga os passos: role para baixo e o celular mostra onde tocar. Leva um minuto e não precisa de loja de apps.', step: 'Passo', of: 'de', open: 'Abrir o app', openSub: 'Crie sua conta e peça sua aula', guide: 'Tutorial para compartilhar', guideSub: 'Envie para quem quiser' },
    en: { tag: 'Install the app', title: 'Put Truevento on your home screen', desc: 'Follow the steps: scroll down and the phone shows you where to tap. It takes a minute and no app store is needed.', step: 'Step', of: 'of', open: 'Open the app', openSub: 'Create your account and book', guide: 'Shareable guide', guideSub: 'Send it to anyone' },
  }
const TT = {
    es: {
      title: 'Tené Truevento en la pantalla de inicio de tu celular',
      intro: 'En un minuto la app queda instalada como cualquier otra: con su ícono, se abre de un toque y a pantalla completa. No hace falta bajarla de ninguna tienda.',
      perk1: 'Se abre de un toque', perk2: 'Te avisa cuando confirmamos tu clase', perk3: 'Sin App Store ni Play Store',
      detected: { ios: 'Detectamos un iPhone. ¿Tenés Android? Tocá “Android”.', android: 'Detectamos un Android. ¿Tenés iPhone? Tocá “iPhone”.', other: 'Elegí tu celular. Hacé estos pasos desde el celular, no desde la computadora.' },
      step: 'Paso', share: 'Compartir', more: 'Más',
      ui: { addHome: 'Agregar a pantalla de inicio', add: 'Agregar', cancel: 'Cancelar', addTitle: 'Agregar a inicio', webApp: 'Abrir como app web', copy: 'Copiar', fav: 'Agregar a favoritos', read: 'Agregar a la lista de lectura',
        install: 'Instalar app', installBtn: 'Instalar', installQ: 'Instalar app', newTab: 'Nueva pestaña', history: 'Historial', downloads: 'Descargas', shareA: 'Compartir…', addHomeA: 'Agregar a la pantalla principal', bannerA: 'Instalar Truevento' },
      ios: [
        ['Abrí el link en Safari', 'Abrí <b>{url}</b> en <b>Safari</b>, el navegador de la brújula azul. Si te llegó por WhatsApp, mantené apretado el link y elegí “Abrir en Safari”.'],
        ['Tocá el botón Compartir', 'Abajo en el centro está el botón <span class="tm-kbd">{shareIcon} Compartir</span>, un cuadrado con una flecha hacia arriba.', 'Con iOS 26 la barra es más chica: tocá <span class="tm-kbd">•••</span> abajo a la derecha y después <b>Compartir</b>.'],
        ['Elegí “Agregar a pantalla de inicio”', 'Deslizá el menú hacia arriba y tocá <span class="tm-kbd">{plusIcon} Agregar a pantalla de inicio</span>.', 'Si no la ves, bajá hasta el final de la lista. En algunos iPhone dice “Agregar a inicio”.'],
        ['Tocá “Agregar”', 'Arriba a la derecha tocá <b>Agregar</b>. Si aparece la opción <b>Abrir como app web</b>, dejala activada.'],
        ['¡Listo! Abrila desde el ícono', 'Truevento ya está en tu pantalla de inicio. Abrila siempre desde ahí: ingresás una sola vez y la próxima vez entra directo.'],
      ],
      android: [
        ['Abrí el link en Chrome', 'Abrí <b>{url}</b> en <b>Google Chrome</b>. Si te llegó por WhatsApp, tocá el link y elegí Chrome.'],
        ['Tocá el menú ⋮', 'Arriba a la derecha tocá los <span class="tm-kbd">{dotsIcon} tres puntos</span>.', 'A veces Chrome muestra abajo el aviso “Instalar Truevento”: si lo ves, tocá <b>Instalar</b> y saltá al paso 4.'],
        ['Elegí “Instalar app”', 'En el menú tocá <span class="tm-kbd">{installIcon} Instalar app</span>.', 'En algunos celulares dice “Agregar a la pantalla principal”. En Samsung Internet: menú ≡ → “Agregar página a” → “Pantalla de inicio”.'],
        ['Confirmá con “Instalar”', 'Aparece una ventana con el ícono de Truevento. Tocá <b>Instalar</b>.'],
        ['¡Listo! Abrila desde el ícono', 'Truevento aparece en tu pantalla principal y en el cajón de apps. Abrila siempre desde ahí: ingresás una sola vez y la próxima vez entra directo.'],
      ],
      afterTitle: 'Después de instalarla',
      after1: 'Ingresá con tu usuario y contraseña, o tocá <b>Crear cuenta</b> si es la primera vez.',
      after2: 'En <b>Ajustes → Notificaciones</b> tocá <b>Activar</b> para enterarte cuando confirmamos o cambiamos tu clase.',
      after3: 'En iPhone, las notificaciones funcionan solo con la app instalada (iOS 16.4 o más nuevo).',
      helpTitle: '¿No te aparece la opción?',
      help: { ios: ['Fijate de estar en <b>Safari</b>: desde la app de WhatsApp o Instagram no aparece. Usá “Abrir en Safari”.', 'Si el iPhone tiene iOS 26, Compartir está dentro de <b>•••</b>.', '¿Ya la instalaste? Buscá el ícono deslizando hacia abajo en la pantalla de inicio y escribiendo “Truevento”.'],
              android: ['Usá <b>Chrome</b>: desde WhatsApp o Instagram no aparece. Tocá el link y elegí abrir en Chrome.', 'Si no dice “Instalar app”, buscá <b>Agregar a la pantalla principal</b>.', 'Si ya está instalada, el menú dice “Abrir app”: buscá el ícono en el cajón de apps.'] },
      shareTitle: 'Pasale el link a un amigo', shareText: 'Mandale este link por WhatsApp y que siga estos mismos pasos.', copy: 'Copiar link', copied: 'Link copiado',
      footer: 'Truevento Kiteschool · Ilha do Guajirú, Itarema, Ceará. Las imágenes de los celulares son ilustrativas: los menús pueden verse un poco distintos según el modelo.',
    },
    pt: {
      title: 'Tenha a Truevento na tela inicial do seu celular',
      intro: 'Em um minuto o app fica instalado como qualquer outro: com ícone, abre com um toque e em tela cheia. Não precisa baixar de nenhuma loja.',
      perk1: 'Abre com um toque', perk2: 'Avisa quando confirmamos sua aula', perk3: 'Sem App Store nem Play Store',
      detected: { ios: 'Detectamos um iPhone. Tem Android? Toque em “Android”.', android: 'Detectamos um Android. Tem iPhone? Toque em “iPhone”.', other: 'Escolha o seu celular. Faça estes passos no celular, não no computador.' },
      step: 'Passo', share: 'Compartilhar', more: 'Mais',
      ui: { addHome: 'Adicionar à Tela de Início', add: 'Adicionar', cancel: 'Cancelar', addTitle: 'Adicionar à Tela de Início', webApp: 'Abrir como App Web', copy: 'Copiar', fav: 'Adicionar aos Favoritos', read: 'Adicionar à Lista de Leitura',
        install: 'Instalar app', installBtn: 'Instalar', installQ: 'Instalar app', newTab: 'Nova guia', history: 'Histórico', downloads: 'Downloads', shareA: 'Compartilhar…', addHomeA: 'Adicionar à tela inicial', bannerA: 'Instalar Truevento' },
      ios: [
        ['Abra o link no Safari', 'Abra <b>{url}</b> no <b>Safari</b>, o navegador da bússola azul. Se recebeu pelo WhatsApp, segure o link e escolha “Abrir no Safari”.'],
        ['Toque em Compartilhar', 'Embaixo, no centro, está o botão <span class="tm-kbd">{shareIcon} Compartilhar</span>: um quadrado com uma seta para cima.', 'No iOS 26 a barra é menor: toque em <span class="tm-kbd">•••</span> embaixo à direita e depois em <b>Compartilhar</b>.'],
        ['Escolha “Adicionar à Tela de Início”', 'Deslize o menu para cima e toque em <span class="tm-kbd">{plusIcon} Adicionar à Tela de Início</span>.', 'Se não aparecer, role até o final da lista.'],
        ['Toque em “Adicionar”', 'No canto superior direito, toque em <b>Adicionar</b>. Se aparecer a opção <b>Abrir como App Web</b>, deixe ativada.'],
        ['Pronto! Abra pelo ícone', 'A Truevento já está na sua tela inicial. Abra sempre por ali: você entra uma vez só e nas próximas vezes entra direto.'],
      ],
      android: [
        ['Abra o link no Chrome', 'Abra <b>{url}</b> no <b>Google Chrome</b>. Se recebeu pelo WhatsApp, toque no link e escolha o Chrome.'],
        ['Toque no menu ⋮', 'No canto superior direito, toque nos <span class="tm-kbd">{dotsIcon} três pontinhos</span>.', 'Às vezes o Chrome mostra embaixo o aviso “Instalar Truevento”: se aparecer, toque em <b>Instalar</b> e pule para o passo 4.'],
        ['Escolha “Instalar app”', 'No menu, toque em <span class="tm-kbd">{installIcon} Instalar app</span>.', 'Em alguns celulares aparece “Adicionar à tela inicial”. No Samsung Internet: menu ≡ → “Adicionar página a” → “Tela inicial”.'],
        ['Confirme com “Instalar”', 'Aparece uma janela com o ícone da Truevento. Toque em <b>Instalar</b>.'],
        ['Pronto! Abra pelo ícone', 'A Truevento aparece na tela inicial e na gaveta de apps. Abra sempre por ali: você entra uma vez só e nas próximas vezes entra direto.'],
      ],
      afterTitle: 'Depois de instalar',
      after1: 'Entre com seu usuário e senha, ou toque em <b>Criar conta</b> se for a primeira vez.',
      after2: 'Em <b>Ajustes → Notificações</b>, toque em <b>Ativar</b> para saber quando confirmamos ou mudamos sua aula.',
      after3: 'No iPhone, as notificações só funcionam com o app instalado (iOS 16.4 ou mais novo).',
      helpTitle: 'A opção não aparece?',
      help: { ios: ['Confira se está no <b>Safari</b>: dentro do WhatsApp ou do Instagram a opção não aparece. Use “Abrir no Safari”.', 'Se o iPhone tem iOS 26, Compartilhar fica dentro de <b>•••</b>.', 'Já instalou? Procure o ícone deslizando para baixo na tela inicial e digitando “Truevento”.'],
              android: ['Use o <b>Chrome</b>: dentro do WhatsApp ou do Instagram a opção não aparece. Toque no link e escolha abrir no Chrome.', 'Se não aparecer “Instalar app”, procure <b>Adicionar à tela inicial</b>.', 'Se já estiver instalado, o menu mostra “Abrir app”: procure o ícone na gaveta de apps.'] },
      shareTitle: 'Mande o link para um amigo', shareText: 'Envie este link pelo WhatsApp para ele seguir estes mesmos passos.', copy: 'Copiar link', copied: 'Link copiado',
      footer: 'Truevento Kiteschool · Ilha do Guajirú, Itarema, Ceará. As imagens dos celulares são ilustrativas: os menus podem ser um pouco diferentes conforme o modelo.',
    },
    en: {
      title: 'Put Truevento on your phone’s home screen',
      intro: 'In a minute the app is installed like any other: with its own icon, it opens in one tap and full screen. No app store needed.',
      perk1: 'Opens in one tap', perk2: 'Tells you when your lesson is confirmed', perk3: 'No App Store or Play Store',
      detected: { ios: 'We detected an iPhone. On Android? Tap “Android”.', android: 'We detected an Android phone. On iPhone? Tap “iPhone”.', other: 'Choose your phone. Follow these steps on your phone, not on a computer.' },
      step: 'Step', share: 'Share', more: 'More',
      ui: { addHome: 'Add to Home Screen', add: 'Add', cancel: 'Cancel', addTitle: 'Add to Home Screen', webApp: 'Open as Web App', copy: 'Copy', fav: 'Add to Favourites', read: 'Add to Reading List',
        install: 'Install app', installBtn: 'Install', installQ: 'Install app', newTab: 'New tab', history: 'History', downloads: 'Downloads', shareA: 'Share…', addHomeA: 'Add to Home screen', bannerA: 'Install Truevento' },
      ios: [
        ['Open the link in Safari', 'Open <b>{url}</b> in <b>Safari</b>, the browser with the blue compass. If you got it on WhatsApp, press and hold the link and choose “Open in Safari”.'],
        ['Tap the Share button', 'At the bottom in the middle there is the <span class="tm-kbd">{shareIcon} Share</span> button: a square with an arrow pointing up.', 'On iOS 26 the bar is smaller: tap <span class="tm-kbd">•••</span> at the bottom right, then <b>Share</b>.'],
        ['Choose “Add to Home Screen”', 'Swipe the menu up and tap <span class="tm-kbd">{plusIcon} Add to Home Screen</span>.', 'If you can’t see it, scroll to the end of the list.'],
        ['Tap “Add”', 'At the top right, tap <b>Add</b>. If you see <b>Open as Web App</b>, leave it on.'],
        ['Done! Open it from the icon', 'Truevento is now on your home screen. Always open it from there: you sign in once and next time it goes straight in.'],
      ],
      android: [
        ['Open the link in Chrome', 'Open <b>{url}</b> in <b>Google Chrome</b>. If you got it on WhatsApp, tap the link and choose Chrome.'],
        ['Tap the ⋮ menu', 'At the top right, tap the <span class="tm-kbd">{dotsIcon} three dots</span>.', 'Sometimes Chrome shows an “Install Truevento” message at the bottom: if you see it, tap <b>Install</b> and skip to step 4.'],
        ['Choose “Install app”', 'In the menu, tap <span class="tm-kbd">{installIcon} Install app</span>.', 'On some phones it says “Add to Home screen”. In Samsung Internet: menu ≡ → “Add page to” → “Home screen”.'],
        ['Confirm with “Install”', 'A window with the Truevento icon appears. Tap <b>Install</b>.'],
        ['Done! Open it from the icon', 'Truevento shows up on your home screen and in the app drawer. Always open it from there: you sign in once and next time it goes straight in.'],
      ],
      afterTitle: 'After installing',
      after1: 'Sign in with your username and password, or tap <b>Create account</b> the first time.',
      after2: 'In <b>Settings → Notifications</b>, tap <b>Turn on</b> to hear when we confirm or move your lesson.',
      after3: 'On iPhone, notifications only work with the app installed (iOS 16.4 or newer).',
      helpTitle: 'Can’t see the option?',
      help: { ios: ['Make sure you are in <b>Safari</b>: inside WhatsApp or Instagram it does not appear. Use “Open in Safari”.', 'If the iPhone has iOS 26, Share is inside <b>•••</b>.', 'Already installed? Swipe down on the home screen and type “Truevento” to find the icon.'],
              android: ['Use <b>Chrome</b>: inside WhatsApp or Instagram it does not appear. Tap the link and choose to open it in Chrome.', 'If it does not say “Install app”, look for <b>Add to Home screen</b>.', 'If it is already installed, the menu says “Open app”: look for the icon in the app drawer.'] },
      shareTitle: 'Send the link to a friend', shareText: 'Send this link on WhatsApp so they can follow the same steps.', copy: 'Copy link', copied: 'Link copied',
      footer: 'Truevento Kiteschool · Ilha do Guajirú, Itarema, Ceará. The phone pictures are illustrations: menus may look slightly different depending on the model.',
    },
  }
  
  const ICONS = {
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>',
    dots: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
    install: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M12 7v7M9 11l3 3 3-3"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg>',
    fwd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 5l7 7-7 7"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 6c-2-1.5-5-2-8-1.5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-14C17 4 14 4.5 12 6zM12 6v14"/></svg>',
    tabs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="7" width="13" height="13" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1zm2 0h6V8a3 3 0 0 0-6 0v2z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
    tab: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M12 9v6M9 12h6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 4v11M8 11l4 4 4-4M5 20h14"/></svg>',
  }
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const lang = () => (UI[window.currentLang] ? window.currentLang : 'es')
  let os = /android/i.test(navigator.userAgent) ? 'android' : 'ios'
  let active = 0

  // ---- phone screens (drawn with the real app on screen)
  const frame = (inner, light) => `<div class="tm-phone ${os === 'android' ? 'tm-android' : ''}"><div class="tm-screen"${light ? ` style="background:${os === 'android' ? '#f1f3f4' : '#f2f2f7'}"` : ''}>
    <div class="tm-notch"></div><div class="tm-sb ${light ? 'tm-dark' : ''}"><span>9:41</span><span>●●● ▮</span></div>${inner}</div></div>`
  const safari = (hl) => `<div class="tm-safari"><div class="tm-url">${ICONS.lock}${APP}</div><div class="tm-tools"><span>${ICONS.back}</span><span>${ICONS.fwd}</span><span class="${hl ? 'tm-tap' : ''}">${ICONS.share}</span><span>${ICONS.book}</span><span>${ICONS.tabs}</span></div></div>`
  const chrome = (hl) => `<div class="tm-chrome"><div class="tm-url">${ICONS.lock}&nbsp;${APP}</div><span class="tm-dots ${hl ? 'tm-tap' : ''}">${ICONS.dots}</span></div>`
  const home = () => `<div class="tm-home"></div><div class="tm-grid">${'<div class="tm-app"><i></i></div>'.repeat(11)}<div class="tm-app tm-tap"><img src="${IMG.icon}" alt=""><span>Truevento</span></div></div><div class="tm-dock"></div>`
  function screen(i) {
    const L = TT[lang()].ui, shot = `<img class="tm-shot ${os === 'android' ? 'tm-low' : ''}" src="${IMG.shot[lang()]}" alt="">`
    if (os === 'ios') {
      if (i === 0) return frame(shot + safari(false))
      if (i === 1) return frame(shot + safari(true))
      if (i === 2) return frame(shot + `<div class="tm-veil"></div><div class="tm-sheet"><div class="tm-grab"></div><div class="tm-site"><img src="${IMG.icon}" alt=""><span><b>Truevento</b>${APP}</span></div>
        <div class="tm-apps"><i style="background:#5ac8fa"></i><i style="background:#34c759"></i><i style="background:#25d366"></i><i style="background:#ff9500"></i><i style="background:#af52de"></i></div>
        <div class="tm-rows"><div class="tm-row">${esc(L.copy)}${ICONS.copy}</div><div class="tm-row">${esc(L.read)}${ICONS.book}</div><div class="tm-row">${esc(L.fav)}${ICONS.star}</div><div class="tm-row tm-hl tm-tap">${esc(L.addHome)}${ICONS.plus}</div></div></div>`)
      if (i === 3) return frame(`<div class="tm-dialog"><div class="tm-dbar"><span class="tm-blue" style="font-weight:400">${esc(L.cancel)}</span><b>${esc(L.addTitle)}</b><span class="tm-blue tm-tap">${esc(L.add)}</span></div>
        <div class="tm-dcard"><img src="${IMG.icon}" alt=""><div style="flex:1;min-width:0"><div class="tm-name">Truevento</div><div class="tm-addr">https://${APP}/</div></div></div><div class="tm-toggle"><span>${esc(L.webApp)}</span><i></i></div></div>`, true)
      return frame(home())
    }
    if (i === 0) return frame(chrome(false) + shot, true)
    if (i === 1) return frame(chrome(true) + shot, true)
    if (i === 2) return frame(chrome(false) + shot + `<div class="tm-menu"><div class="tm-mi">${ICONS.tab}${esc(L.newTab)}</div><div class="tm-mi">${ICONS.clock}${esc(L.history)}</div><div class="tm-mi">${ICONS.dl}${esc(L.downloads)}</div><div class="tm-mi">${ICONS.share}${esc(L.shareA)}</div><div class="tm-mi tm-hl tm-tap">${ICONS.install}${esc(L.install)}</div></div>`, true)
    if (i === 3) return frame(chrome(false) + shot + `<div class="tm-veil"></div><div class="tm-adlg"><h4>${esc(L.installQ)}</h4><div class="tm-who"><img src="${IMG.icon}" alt=""><div><b>Truevento</b><div class="tm-addr">${APP}</div></div></div>
      <div class="tm-btns"><span>${esc(L.cancel)}</span><span class="tm-tap">${esc(L.installBtn)}</span></div></div>`, true)
    return frame(home())
  }

  // ---- text
  const fill = (s) => s.replace('{url}', `<a href="https://${APP}" target="_blank" rel="noopener" class="tm-link">${APP}</a>`)
    .replace('{shareIcon}', ICONS.share).replace('{plusIcon}', ICONS.plus).replace('{dotsIcon}', ICONS.dots).replace('{installIcon}', ICONS.install)

  function render() {
    const root = document.getElementById('instalar')
    if (!root) return
    const t = TT[lang()], u = UI[lang()], steps = t[os]
    root.querySelector('[data-tm="tag"]').textContent = u.tag
    root.querySelector('[data-tm="title"]').textContent = u.title
    root.querySelector('[data-tm="desc"]').textContent = u.desc
    root.querySelectorAll('[data-tm-os]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tmOs === os)))
    root.querySelector('[data-tm="steps"]').innerHTML = steps.map(([title, body, tip], i) => `
      <li class="tm-step${i === active ? ' is-active' : ''}" data-i="${i}">
        <div class="tm-card"><span class="tm-num">${u.step} ${i + 1} ${u.of} ${steps.length}</span>
          <h3>${esc(title)}</h3><p>${fill(body)}</p>${tip ? `<p class="tm-tip">${fill(tip)}</p>` : ''}</div>
      </li>`).join('')
    const links = root.querySelector('[data-tm="links"]')
    if (links) links.innerHTML = `
      <a class="tm-applink main" href="https://${APP}" target="_blank" rel="noopener"><img src="${IMG.icon}" alt=""><span><strong>${u.open}</strong><small>${u.openSub} · ${APP}</small></span></a>
      <a class="tm-applink" href="https://${APP}/instalar" target="_blank" rel="noopener"><span class="tm-applink-ico">↗</span><span><strong>${u.guide}</strong><small>${u.guideSub}</small></span></a>`
    document.querySelectorAll('[data-tm="dots"]').forEach((d) => { d.innerHTML = steps.map((_, i) => `<span class="${i === active ? 'on' : ''}"></span>`).join('') })
    show(active, true)
    watch()
  }

  function show(i, now) {
    active = i
    const stage = document.querySelector('#instalar [data-tm="phone"]')
    if (!stage) return
    const html = screen(i)
    if (now) { stage.innerHTML = html; return }
    stage.classList.add('tm-fade')
    setTimeout(() => { stage.innerHTML = html; stage.classList.remove('tm-fade') }, 160)
    document.querySelectorAll('#instalar .tm-step').forEach((s) => s.classList.toggle('is-active', +s.dataset.i === i))
    document.querySelectorAll('[data-tm="dots"] span').forEach((d, k) => d.classList.toggle('on', k === i))
  }

  // the step in the middle of the screen is the one the phone shows
  // the step being read is the one in the middle of the free space: the middle of the screen
  // on a computer; on a phone, the middle of what is left under the phone (fixed at the top)
  let ticking = false
  function focusLine() {
    const wrap = document.querySelector("#instalar .tm-stage-wrap")
    if (!wrap || !matchMedia("(max-width: 767px)").matches) return innerHeight / 2
    return (wrap.getBoundingClientRect().bottom + innerHeight) / 2
  }
  function pick() {
    ticking = false
    const steps = document.querySelectorAll("#instalar .tm-step")
    if (!steps.length) return
    const line = focusLine()
    let best = 0, dist = Infinity
    steps.forEach((s, i) => {
      const r = s.querySelector(".tm-card").getBoundingClientRect()
      const d = line < r.top ? r.top - line : line > r.bottom ? line - r.bottom : 0
      if (d < dist) { dist = d; best = i }
    })
    if (best !== active) show(best)
  }
  function watch() { pick() }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(pick) } }, { passive: true })
  addEventListener("resize", pick, { passive: true })

  // buttons: choose the phone (here and in the app section) and scroll to the guide
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tm-os]')
    if (!b) return
    os = b.dataset.tmOs; active = 0; render()
    if (b.dataset.tmJump !== undefined) {
      e.preventDefault()
      document.getElementById('instalar').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    }
  })

  // follow the page's language buttons
  const original = window.setLanguage
  if (typeof original === 'function') window.setLanguage = function (l) { original(l); render() }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render)
  else render()
})()
