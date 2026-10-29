# REA y opciones para crear la app

## REA (`morluto/rea`)
- Servidor MCP y herramienta de línea de comandos para **analizar otras apps ya hechas** (binarios, Electron, JavaScript, sitios web). Licencia MIT.
- No es un framework ni una plantilla, y no ayuda a publicar en las tiendas. **No sirve para construir NetAI ni NetAI Fit.**
- Su `DISCLAIMER.md` dice que no apoya copiar software propietario ni reproducir su código y recursos protegidos. El análisis puede estar limitado por la licencia del software o por la ley de cada país.
- Uso posible: estudiar a la competencia. Para NetAI es más seguro estudiar las apps desde fuera, como usuario, y diseñar las funciones propias.

## Opciones para construir la app
Contexto: el código actual es una web en Next.js 14, con rutas de API, un middleware de acceso y un PWA.

| Opción | Ventaja | Inconveniente |
|---|---|---|
| **Capacitor** (recomendada para empezar) | Envuelve la web actual en una app nativa para iOS y Android. Se reutiliza casi todo | Apple puede rechazar apps que sean solo una web envuelta. Se siente "web" |
| **Expo (React Native)** | Se siente nativa y fluida. Se reutiliza la lógica (`nutritionEngine.js`, `i18n`) | Hay que reescribir las pantallas |
| **Flutter** | Muy fluida, un solo código para las dos plataformas | No se reutiliza nada |
| **Nativo (Swift y Kotlin)** | Máximo control | Doble trabajo |
| **Seguir como PWA** | Sin comisiones ni revisión de las tiendas | No cumple el objetivo de salir en App Store y Play Store |

**Recomendación**
1. Primera versión con Capacitor, para validar la idea y lanzar la beta. Añadir funciones nativas (notificaciones, Apple Salud y Health Connect).
2. Pasar a Expo si NetAI Fit se vuelve el centro del producto.
3. Pestaña "Mover" dentro de la app antes de separar NetAI Fit.

**Puntos técnicos a resolver:** Capacitor tendrá que apuntar al despliegue en Vercel, porque las rutas de API y el middleware necesitan servidor. En iOS, las suscripciones deben usar el sistema de pago de Apple.
