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
    // Adónde llegan las solicitudes de acceso. Usa FormSubmit (formsubmit.co), que reenvía cada solicitud por correo.
    // La primera solicitud dispara un correo de activación a esa casilla: hay que abrirlo y confirmar.
    // Después FormSubmit da una dirección alternativa para no mostrar el correo en el código.
    requestEndpoint: "https://formsubmit.co/ajax/musarrajuan99@gmail.com",
    // Texto libre para la fecha de la beta, por ejemplo "15 de diciembre". Vacío = "Fecha por confirmar".
    betaDate: ""
  };
})();
