import type { Metadata } from "next";

import { LegalPage } from "@/app/(legal)/legal-content";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo Paradise Homes RD recopila, usa y protege tu información personal.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidad">
      <p>
        Esta Política de Privacidad explica qué datos personales recopila Paradise Homes RD (“la
        Plataforma”, “nosotros”), con qué finalidad, con quién los compartimos y qué derechos tienes
        sobre ellos. Al usar la Plataforma aceptas las prácticas aquí descritas. El tratamiento de
        datos se realiza conforme a la Ley No. 172-13 sobre Protección de Datos de Carácter Personal
        de la República Dominicana.
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        Paradise Homes RD es responsable de los datos personales que se recopilan a través de este
        sitio web. Puedes contactarnos por los medios indicados al final de este documento para
        cualquier asunto relacionado con tus datos.
      </p>

      <h2>2. Datos que recopilamos</h2>
      <ul>
        <li>
          <strong>Datos que nos das directamente:</strong> nombre, teléfono, WhatsApp y correo
          cuando envías una consulta sobre una propiedad, solicitas una visita, te registras, aplicas
          como socio (inmobiliaria, desarrolladora o asesor) o publicas una propiedad.
        </li>
        <li>
          <strong>Datos de tu cuenta:</strong> si creas una cuenta, guardamos tu perfil (nombre,
          correo, teléfono, foto opcional), tus favoritos, tus búsquedas guardadas y el historial de
          tus consultas y visitas.
        </li>
        <li>
          <strong>Datos de navegación y uso:</strong> páginas visitadas, propiedades vistas,
          búsquedas realizadas, dispositivo y navegador, y dirección IP aproximada.
        </li>
        <li>
          <strong>Datos de atribución de marketing:</strong> parámetros UTM, página de entrada y
          sitio de referencia, para saber por qué canal llegaste.
        </li>
        <li>
          <strong>Contenido que publicas:</strong> si eres asesor, inmobiliaria o desarrolladora,
          la información y fotos de las propiedades y proyectos que cargas, y las reseñas que dejas.
        </li>
      </ul>

      <h2>3. Para qué usamos tus datos</h2>
      <ul>
        <li>Conectarte con el asesor, la inmobiliaria o la desarrolladora de la propiedad que consultaste.</li>
        <li>Dar seguimiento a tus consultas, visitas y mensajes dentro de la Plataforma.</li>
        <li>Enviarte notificaciones y correos sobre la actividad de tu cuenta (nuevos mensajes, visitas agendadas, alertas de búsquedas guardadas, estado de tus publicaciones).</li>
        <li>Operar, mantener y mejorar la Plataforma, y prevenir fraude y abuso.</li>
        <li>Medir el rendimiento de nuestras campañas y entender qué contenido es útil.</li>
        <li>Cumplir con obligaciones legales cuando aplique.</li>
      </ul>

      <h2>4. Base legal</h2>
      <p>
        Tratamos tus datos con base en tu consentimiento (que otorgas al enviar un formulario o
        marcar la casilla correspondiente), en la ejecución de la relación que solicitas (ponerte en
        contacto con un asesor), y en nuestro interés legítimo de operar y mejorar la Plataforma de
        forma segura.
      </p>

      <h2>5. Con quién compartimos tus datos</h2>
      <ul>
        <li>
          <strong>El asesor, inmobiliaria o desarrolladora</strong> de la propiedad o proyecto que
          consultaste, para que puedan responderte. Ellos tratan tus datos bajo su propia
          responsabilidad.
        </li>
        <li>
          <strong>Proveedores tecnológicos</strong> que nos prestan servicios de infraestructura
          (hosting, base de datos y autenticación), envío de correos, mapas y analítica. Estos
          proveedores solo pueden usar los datos para prestarnos el servicio.
        </li>
        <li>
          <strong>Autoridades competentes</strong> cuando exista una obligación legal o una orden
          judicial válida.
        </li>
      </ul>
      <p>No vendemos tus datos personales a terceros.</p>

      <h2>6. Conservación</h2>
      <p>
        Conservamos tus datos mientras tu cuenta esté activa o mientras sean necesarios para las
        finalidades descritas. Los leads y consultas se conservan por el tiempo razonable para dar
        seguimiento comercial y cumplir obligaciones legales, y luego se anonimizan o eliminan.
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas razonables para proteger tus datos: cifrado en
        tránsito, control de acceso por roles y aislamiento de datos por usuario. Ningún sistema es
        100% infalible, pero trabajamos para minimizar los riesgos.
      </p>

      <h2>8. Tus derechos</h2>
      <p>Tienes derecho a:</p>
      <ul>
        <li>Acceder a los datos personales que tenemos sobre ti.</li>
        <li>Rectificar datos inexactos o incompletos (parte puedes hacerlo desde tu perfil).</li>
        <li>Solicitar la eliminación de tu cuenta y tus datos.</li>
        <li>Oponerte a ciertos tratamientos o retirar tu consentimiento.</li>
        <li>Solicitar una copia portable de tus datos.</li>
      </ul>
      <p>Para ejercer cualquiera de estos derechos, contáctanos por los medios indicados abajo.</p>

      <h2>9. Menores de edad</h2>
      <p>
        La Plataforma está dirigida a personas mayores de 18 años. No recopilamos intencionalmente
        datos de menores.
      </p>

      <h2>10. Cambios a esta política</h2>
      <p>
        Podemos actualizar esta política. Publicaremos la versión vigente en esta página con su fecha
        de actualización. Si el cambio es sustancial, procuraremos avisarte.
      </p>
    </LegalPage>
  );
}
