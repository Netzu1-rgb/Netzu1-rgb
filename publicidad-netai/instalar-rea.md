# Instalar REA como herramienta

REA (`github.com/morluto/rea`) es un servidor MCP y una herramienta de línea de comandos para analizar apps ya hechas. Es un proyecto de otra persona: **no se sube nada de NetAI a ese repositorio**. Se instala en tu computadora y se conecta a Claude Code.

Los pasos salen de `docs/installation.md` de REA (versión 6.8.0). Si algo cambió, manda la documentación oficial del repo.

## Requisitos
- **Node.js** en una versión compatible: `^22.23.4`, `^24.22.1` o `>=26.12.1` (el repo usa 24.22.1).
- **Linux:** hace falta un `ps` compatible con procps para el análisis de JavaScript y Electron.
- Para analizar **binarios nativos**, un motor instalado: Hopper, Ghidra, IDA o Kuna. Para analizar **JavaScript, Electron y sitios web** no hace falta ninguno.

## Opción 1: instalador de REA (recomendada)
```bash
npx rea-agents setup
```
1. Elige los agentes que quieres conectar (por ejemplo Claude Code).
2. Revisa los cambios que propone y apruébalos. Hace copias de seguridad de la configuración anterior.
3. Reinicia Claude Code.

Ejecútalo desde una carpeta de confianza, fuera del proyecto que vas a analizar.

## Opción 2: complemento (plugin) de Claude Code
Dentro de Claude Code:
```text
/plugin marketplace add morluto/rea
/plugin install rea@rea
```

## Opción 3: registro manual del MCP
```bash
claude mcp add --scope local rea -- "/ruta/absoluta/a/node" "/ruta/absoluta/a/rea/scripts/rea.mjs" mcp
```
La documentación de REA recomienda **no** usar `--scope project`, porque escribiría un `.mcp.json` dentro del repositorio.

## Usar REA desde la terminal
```bash
npm install --global rea-agents
rea --help
rea update      # mantenerlo al día
```
Ejemplo para analizar una app web de JavaScript ya extraída:
```bash
npx -y rea-agents@latest analyze-javascript-application /ruta/a/la/app --json
```

## Reglas de uso para NetAI
REA está pensado para análisis legítimo. Su propio `DISCLAIMER.md` excluye copiar software propietario, reproducir su código o recursos protegidos y saltarse protecciones o licencias.

Para estudiar las apps de gimnasio:
- **Primero**, sin REA: usar la app como usuario, leer su ficha de tienda, precios y reseñas.
- **REA solo** sobre webs públicas o software que estés autorizado a examinar, y respetando sus términos de uso.
- **Nunca** copiar código, textos, imágenes ni la estructura exacta de otra app. El resultado debe ser una lista de funciones y un aprendizaje, no una réplica.
- Usar tu propia cuenta y no tocar datos de otras personas.
- Guardar las conclusiones con la plantilla de `competidores-gym.md`, que también lista qué apps estudiar y con qué método.

## Pedirle a Claude Code que lo use
Una vez instalado, por ejemplo:
```text
Con REA, analiza la web pública de [app de gimnasio]: qué módulos y librerías usa,
qué secciones tiene y cómo está organizada. No copies código ni recursos; dame un resumen
de funciones para compararlas con las 12 de NetAI Fit.
```

## Nota
En una sesión en la nube, como la que usé para preparar este repositorio, la instalación no sirve: se pierde al cerrarse. Hay que hacerla en tu computadora.
