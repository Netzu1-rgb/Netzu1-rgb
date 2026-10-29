(function () {
  "use strict";
  // Datos que se rellenan al publicar. Mientras estén vacíos, la web
  // muestra los botones como "Próximamente" y oculta la lista de espera.
  window.__BRAND__ = {
    apps: {
      // Dirección pública de la app NetAI en Vercel, por ejemplo "https://netai.vercel.app/app"
      netai: { url: "" },
      // Dirección de NetAI Fit cuando exista la beta
      fit: { url: "" }
    },
    stores: {
      appStore: "",   // enlace a la ficha de App Store, cuando exista
      playStore: ""   // enlace a la ficha de Google Play, cuando exista
    },
    // Dirección de un servicio de formularios (Formspree, Getform, etc.) que reciba
    // un POST con los campos "email" y "app". Vacío = se oculta el formulario.
    waitlistEndpoint: "",
    // Texto libre para la fecha de la beta, por ejemplo "15 de diciembre". Vacío = "Fecha por confirmar".
    betaDate: ""
  };
})();
