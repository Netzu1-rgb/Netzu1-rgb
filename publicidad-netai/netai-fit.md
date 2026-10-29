# NetAI Fit: app de gimnasio vinculada a NetAI

Documento de planificación. No incluye código. El nombre elegido es **NetAI Fit**.

## Objetivos
**Lanzamiento de NetAI**
- Publicar en App Store y Play Store, con una app fluida.
- Publicidad con Claude y una automatización.
- Beta con fecha de lanzamiento y un % de descuento para quienes entren en ella.

**NetAI Fit**
- Vincular NetAI con una app de gimnasio mediante la dieta y los objetivos.
- Buscar en estudios científicos rutinas para esos objetivos.
- Crear un plan que use las dos apps, con un descuento.
- Decidir cómo vincular las dos apps.
- Dar un beneficio en ambas apps para crear motivación y que se usen juntas.
- La web ocupa dos ventanas: NetAI (ya existe) y NetAI Fit.

## Nombres considerados
| Nombre | Idea | Nota |
|---|---|---|
| **NetAI Fit** (elegido) | Misma familia, enfocada en el movimiento | Fácil de explicar y de anunciar como pack |
| NetAI Move | Movimiento | Alternativa más cercana al tono de bienestar |
| NetAI Fuerza | Entrenamiento de fuerza | Tono local, para Argentina |
| Vita, Raíz, Ritmo, Paso a Paso | Marca independiente | Solo si el gym se vende por separado |

## Funciones, por prioridad
**Base de la app de gym**
1. Rutinas por objetivo: fuerza, resistencia, movilidad o "moverme más". Sin "bajar de peso" como opción.
2. Registro de entrenamientos: series, repeticiones, carga y sensación de esfuerzo.
3. Biblioteca de ejercicios con vídeo corto y variantes para principiantes y para casa.
4. Progreso por constancia y fuerza ganada, no por kilos ni medidas.

**Vínculo con NetAI**
5. Día de entreno o descanso: las recetas sugeridas en NetAI cambian según el día.
6. Hidratación compartida, con un vaso extra los días de entreno.
7. Meta única compartida ("más energía", "ganar fuerza") que ajusta rutina y comidas.
8. Plan semanal combinado: entrenos y comidas en una sola vista.
9. Modo Intuitivo también en Fit, para ocultar pesos y números.

**Lanzamiento**
10. Lista de espera y beta con fecha y código de descuento.
11. Pack NetAI + Fit con precio conjunto menor que la suma de ambos.
12. Extensión del Plan Familiar a entrenar en pareja o en familia.

## Cómo vincular las dos apps
| Opción | Ventaja | Inconveniente |
|---|---|---|
| Una sola app con una pestaña "Mover" | La más simple, un acceso y una tienda | La app crece y se mezcla con el mensaje de bienestar |
| Dos apps con una cuenta compartida | Cada app tiene su público | Hay que construir el inicio de sesión compartido |
| Dos apps sin cuenta, con Apple Salud y Health Connect | No exige servidor propio | Solo comparten datos básicos |
| App de gym externa ya existente | No construyes el gym | Depende de un tercero y de su API |

**Recomendación:** empezar con una sola app y una pestaña, porque hoy NetAI guarda los datos en el teléfono (`localStorage`) y entra con contraseña familiar. Una segunda app obligaría a crear cuentas y servidores antes de validar la idea.

## Beneficios cruzados para la motivación
| Opción | Cómo funciona | Riesgo |
|---|---|---|
| Racha de constancia compartida | Cuenta los días con actividad en cualquiera de las dos apps | Bajo, si no se "rompe" de forma punitiva |
| Desbloqueos cruzados | Registros en NetAI desbloquean rutinas en Fit y entrenos en Fit desbloquean recetas | Bajo |
| Descuento por uso | % de descuento en la renovación si usas las dos apps | Medio, premia el uso y no la salud |
| Pack con precio conjunto | Un plan con las dos apps, más barato que sumarlas | Bajo |
| Logros suaves | Insignias como "Una semana de equilibrio" | Bajo, sin rankings ni comparaciones |
| Resumen semanal conjunto | Mensaje del domingo con la semana en ambas apps | Bajo |
| Metas familiares | Una meta compartida en el Plan Familiar | Bajo |

**Recomendación inicial:** pack con precio conjunto, racha compartida y desbloqueos cruzados.

## La web en dos ventanas
| Opción | Ventaja | Inconveniente |
|---|---|---|
| Pestañas o selector arriba | Funciona en móvil y es lo más sencillo | No se ven las dos a la vez |
| Pantalla dividida | Es lo que anotaste | En móvil no cabe |
| Dos direcciones separadas (`netai.app` y `fit.netai.app`) | Cada una crece sola | Dos sitios que mantener y un inicio de sesión compartido |
| Ventana emergente | Muy fácil de hacer | Los bloqueadores de ventanas pueden molestar |

**Recomendación:** pestañas arriba en móvil y pantalla dividida en ordenador. El diseño móvil va primero, porque la meta es subir a las tiendas.

## Cuidados
- **Ética.** NetAI es anti-TCA y neutral al peso. Mantener el piso de 1.500 kcal, sin metas de pérdida de peso, sin compensar lo comido con ejercicio y con avisos de descanso.
- **Motivación sin presión.** Sin rachas que se pierdan con un fallo, sin rankings ni comparaciones, sin mensajes del tipo "perdiste tu racha".
- **Descuentos.** Premiar probar las dos apps, no entrenar más ni comer menos.
- **Estudios científicos.** Citar fuentes reales (revisiones en PubMed, guías de la OMS) y que las revise un profesional del ejercicio. No dejar que la IA invente referencias.
- **Privacidad.** Si las apps comparten datos, el usuario decide qué se comparte.
- **Tiendas.** Piden política de privacidad y tratan con cuidado las apps de salud. Las suscripciones dentro de la app pagan comisión y en iOS exigen el sistema de pago de Apple, así que Mercado Pago y cripto no valen allí.

## Pendiente de decidir
- Si NetAI Fit va dentro de NetAI (pestaña) o como app aparte.
- Fecha de lanzamiento de la beta y porcentaje de descuento.
- Quién revisa las rutinas desde el punto de vista profesional.
