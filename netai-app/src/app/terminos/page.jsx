import Link from 'next/link';
import LegalPage, { LEGAL, Pendiente, Seccion } from '@/components/legal/LegalPage';

export const metadata = {
  title: 'Términos de uso · NetAI',
  description: 'Condiciones para usar NetAI y sus planes.',
};

export default function TerminosPage() {
  return (
    <LegalPage title="Términos de uso">
      <p>
        Al usar NetAI aceptás estos términos. Si no estás de acuerdo con ellos, no uses la app.
      </p>

      <Seccion titulo="Qué es NetAI">
        <p>
          NetAI es una app de acompañamiento para comer con atención, basada en el Método del Plato, la escala de hambre y
          saciedad y las Guías Alimentarias para la Población Argentina. En el modo Bienestar tiene un enfoque neutral al
          peso y no propone dietas restrictivas. El Modo Sport, opcional y solo para mayores de 18 años, permite trabajar un
          objetivo de peso o de masa muscular con valores orientativos y límites de seguridad; no está disponible para
          quien indica estar en tratamiento por un trastorno de la conducta alimentaria.
        </p>
      </Seccion>

      <Seccion titulo="No es un servicio médico">
        <p>
          La información de NetAI es educativa e inspiradora. No es un diagnóstico, un tratamiento ni una indicación
          médica, y no reemplaza la consulta con un profesional de la salud matriculado. Si tenés una condición de salud,
          un trastorno de la conducta alimentaria o dudas sobre tu alimentación o tu actividad física, consultá con un
          profesional.
        </p>
      </Seccion>

      <Seccion titulo="Acceso y código">
        <p>
          El acceso se hace con un código que te damos al aceptar tu solicitud. Cuidalo y no lo publiques. Si creés que alguien que
          no corresponde lo conoce, avisanos a <Pendiente>{LEGAL.contacto}</Pendiente> para cambiarlo.
        </p>
      </Seccion>

      <Seccion titulo="Tus registros">
        <p>
          Tus registros se guardan en tu dispositivo (ver la <Link href="/privacidad" className="text-hoja-700 underline underline-offset-4">política de privacidad</Link>).
          Sos responsable de hacer copias si las necesitás: si borrás los datos del navegador, se pierden.
        </p>
      </Seccion>

      <Seccion titulo="Planes y pagos">
        <p>
          El plan Gratis no tiene costo. Los planes Plus y Pro son suscripciones mensuales con el precio que se muestra al
          contratarlos. Podés cancelarlos cuando quieras y conservás el acceso hasta el final del período pagado. Si
          contratás desde una tienda de aplicaciones, también se aplican sus condiciones de pago y reembolso.
        </p>
        <p>
          Las funciones de análisis por foto con inteligencia artificial dan estimaciones aproximadas. Siempre podés
          corregir el resultado.
        </p>
      </Seccion>

      <Seccion titulo="Uso aceptable">
        <p>
          No uses NetAI para fines ilegales, para intentar acceder a datos de otras personas ni para dañar el servicio.
        </p>
      </Seccion>

      <Seccion titulo="Responsabilidad">
        <p>
          Hacemos lo posible para que NetAI funcione bien, pero puede tener interrupciones o errores. En la medida en que
          la ley lo permita, no somos responsables por decisiones de salud tomadas solo a partir de la app.
        </p>
      </Seccion>

      <Seccion titulo="Cambios">
        <p>
          Podemos actualizar estos términos. Si el cambio es importante, te lo vamos a avisar dentro de la app antes de que
          empiece a regir.
        </p>
      </Seccion>

      <Seccion titulo="Ley aplicable y contacto">
        <p>
          Estos términos se rigen por las leyes de <Pendiente>[país]</Pendiente>. Para cualquier consulta, escribinos a{' '}
          <Pendiente>{LEGAL.contacto}</Pendiente>. Responsable: <Pendiente>{LEGAL.responsable}</Pendiente>.
        </p>
      </Seccion>
    </LegalPage>
  );
}
