/* Datos del negocio — edita aquí el número de WhatsApp y los horarios.
   (El HTML también los tiene escritos para que la página funcione sin JS.) */
(function () {
  "use strict";
  window.__BRAND__ = {
    name: "Taquería El Fogón",
    // Número de ejemplo: código de país + número, sin espacios ni "+"
    whatsapp: "5215512345678",
    email: "hola@taqueriaelfogon.mx",
    // Horario por día (0 = domingo … 6 = sábado). Formato 24 h. null = cerrado.
    // Si cierra después de medianoche, la hora de cierre es menor que la de apertura.
    hours: {
      0: ["14:00", "23:00"],
      1: ["18:00", "01:00"],
      2: null,
      3: ["18:00", "01:00"],
      4: ["18:00", "01:00"],
      5: ["18:00", "03:00"],
      6: ["18:00", "03:00"]
    }
  };
})();
