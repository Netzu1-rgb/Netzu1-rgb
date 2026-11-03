#!/usr/bin/env bash
# Levanta NetAI en tu computadora: http://localhost:3000
# Uso: ./iniciar-local.sh          (solo en esta computadora)
#      ./iniciar-local.sh --red    (también desde tu celular en la misma red Wi-Fi)
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Falta Node.js. Instalalo desde https://nodejs.org (versión 20 o superior) y volvé a ejecutar este archivo."
  exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Tu Node.js es la versión $(node -v). NetAI necesita la 20 o superior."
  exit 1
fi

if [ ! -f .env.local ]; then
  echo "Creando .env.local con valores de prueba..."
  SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
  cat > .env.local <<ENV
# Solo para probar en tu computadora. No se sube al repositorio.
APP_FAMILY_PASSWORD=familia-local
SESSION_SECRET=$SECRET
ENV
fi

if [ ! -d node_modules ]; then
  echo "Instalando dependencias (solo la primera vez)..."
  npm install
fi

PASS=$(grep '^APP_FAMILY_PASSWORD=' .env.local | cut -d= -f2-)
echo ""
echo "NetAI se está iniciando."
echo "  Inicio:      http://localhost:3000"
echo "  App:         http://localhost:3000/app"
echo "  Contraseña:  $PASS   (la podés cambiar en .env.local)"

if [ "$1" = "--red" ]; then
  IP=$(node -e "const o=require('os').networkInterfaces();for(const k in o)for(const i of o[k])if(i.family==='IPv4'&&!i.internal){console.log(i.address);process.exit()}")
  echo "  Desde el celular (misma red Wi-Fi): http://$IP:3000"
  echo ""
  exec npx next dev -H 0.0.0.0 -p 3000
else
  echo ""
  exec npx next dev -p 3000
fi
