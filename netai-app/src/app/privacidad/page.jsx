import LegalPage, { LEGAL, Pendiente, Seccion } from '@/components/legal/LegalPage';

export const metadata = {
  title: 'Política de privacidad · NetAI',
  description: 'Qué datos usa NetAI, dónde se guardan y cómo ejercer tus derechos.',
};

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de privacidad">
      <p>
        Esta política explica qué datos usa NetAI, dónde se guardan y qué derechos tenés. NetAI está pensada para que tus
        registros de comida se queden en tu teléfono.
      </p>

      <Seccion titulo="Quién es responsable">
        <p>
          El responsable de NetAI es <Pendiente>{LEGAL.responsable}</Pendiente>, con domicilio en{' '}
          <Pendiente>{LEGAL.domicilio}</Pendiente>. Podés escribirnos a <Pendiente>{LEGAL.contacto}</Pendiente>.
        </p>
      </Seccion>

      <Seccion titulo="Tus registros y tus datos se guardan en tu teléfono">
        <p>
          Las comidas, los vasos de agua, la escala de hambre y saciedad, tus notas y la preferencia del Modo Intuitivo se
          guardan en el almacenamiento del navegador de tu dispositivo. No se envían a nuestros servidores y nosotros no
          podemos verlos.
        </p>
        <p>
          Si completás “Tus datos”, también se guardan solo en tu dispositivo: nombre, edad, sexo, altura, peso, nivel de
          actividad, objetivos, preferencias de alimentación y alergias, y tu respuesta sobre si estás en tratamiento por un
          trastorno de la conducta alimentaria. Todo es opcional. En el modo Bienestar, la altura y el peso se usan
          únicamente para estimar tu rango de energía: la app no los muestra, no calcula tu índice de masa corporal y no
          propone metas de peso. A menores de 18 años no les pedimos datos físicos.
        </p>
        <p>
          Si elegís el Modo Sport, además se guardan en tu dispositivo tu deporte, tus días y minutos de entrenamiento, tu
          objetivo, tu peso objetivo, el historial de pesos que registres y las proteínas de cada comida. En ese modo vos
          ves tu peso y tu progreso; nadie más.
        </p>
        <p>
          Algunos de estos datos son datos de salud. Podés cambiarlos o borrarlos cuando quieras desde Ajustes, en “Tus
          datos” o en “Borrar todos mis datos”.
        </p>
        <p>
          Si borrás los datos del navegador o desinstalás la app, esos registros se eliminan y no podemos recuperarlos.
        </p>
      </Seccion>

      <Seccion titulo="Acceso con código">
        <p>
          Para entrar a la app escribís el código de acceso que te dimos. Se envía al servidor solo para comprobarlo y
          no se guarda. Si es correcta, guardamos en tu navegador una cookie de sesión llamada{' '}
          <code className="text-loza-900">netai_family_session</code>, que dura 30 días y sirve únicamente para que no
          tengas que escribir el código cada vez. No usamos cookies de publicidad ni de seguimiento.
        </p>
      </Seccion>

      <Seccion titulo="Servicios de terceros">
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-loza-900">Alojamiento:</strong> la app funciona en un proveedor de alojamiento web que,
            como cualquier servidor, registra datos técnicos de cada visita (dirección IP, navegador y fecha) para operar y
            proteger el servicio.
          </li>
          <li>
            <strong className="text-loza-900">Análisis de platos por foto:</strong> si sacás una foto de tu comida, la foto
            (reducida) se envía a Google Gemini, un servicio de inteligencia artificial de Google, para reconocer el plato y
            estimar calorías, proteínas, carbohidratos y grasas. Nosotros no guardamos la foto: solo se usa para ese
            análisis. Antes de la primera foto te pedimos permiso; si no lo das, podés seguir registrando a mano.
          </li>
          <li>
            <strong className="text-loza-900">Pagos:</strong> los pagos de los planes los procesa la plataforma de pago que
            elijas (por ejemplo, Mercado Pago o la tienda de aplicaciones). Nosotros no vemos ni guardamos los datos de tu
            tarjeta.
          </li>
        </ul>
      </Seccion>

      <Seccion titulo="Tus derechos">
        <p>
          Podés pedir acceso, corrección o eliminación de los datos personales que tengamos sobre vos escribiendo a{' '}
          <Pendiente>{LEGAL.contacto}</Pendiente>. En Argentina, estos derechos están protegidos por la Ley 25.326 de
          Protección de los Datos Personales. La Agencia de Acceso a la Información Pública es el órgano de control y
          recibe denuncias y reclamos sobre el incumplimiento de esa ley.
        </p>
      </Seccion>

      <Seccion titulo="Menores de edad">
        <p>
          NetAI puede usarse en familia. Si sos menor de edad, usala junto a una persona adulta responsable.
        </p>
      </Seccion>

      <Seccion titulo="Información de salud">
        <p>
          NetAI es una herramienta educativa. No ofrece diagnósticos ni tratamientos y no reemplaza la consulta con un
          profesional de la salud matriculado.
        </p>
      </Seccion>

      <Seccion titulo="Cambios en esta política">
        <p>
          Si cambiamos esta política, vamos a actualizar la fecha de arriba y, si el cambio es importante, te lo vamos a
          avisar dentro de la app.
        </p>
      </Seccion>
    </LegalPage>
  );
}
