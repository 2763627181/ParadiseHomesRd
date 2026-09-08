import type { Metadata } from "next";

import { LegalPage } from "@/app/(legal)/legal-content";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Condiciones de uso de la plataforma Paradise Homes RD.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Términos y condiciones">
      <p>
        Estos Términos regulan el uso de Paradise Homes RD (“la Plataforma”). Al acceder o usar la
        Plataforma aceptas estos Términos. Si no estás de acuerdo, no la uses.
      </p>

      <h2>1. Qué es Paradise Homes RD</h2>
      <p>
        Paradise Homes RD es un portal que conecta a personas interesadas en comprar, alquilar o
        invertir en inmuebles en República Dominicana con asesores, inmobiliarias y desarrolladoras.
        <strong> No somos parte de ninguna transacción inmobiliaria, no somos corredores ni
        representamos a las partes, y no cobramos comisión por conectar.</strong> El acuerdo se
        celebra directamente entre el interesado y el vendedor o su representante.
      </p>

      <h2>2. Cuentas</h2>
      <ul>
        <li>Debes ser mayor de edad y proporcionar información veraz.</li>
        <li>Eres responsable de mantener la seguridad de tu contraseña y de la actividad de tu cuenta.</li>
        <li>Las cuentas de asesor, inmobiliaria o desarrolladora se otorgan tras una revisión de nuestro equipo y pueden ser suspendidas si se incumplen estos Términos.</li>
      </ul>

      <h2>3. Publicaciones de propiedades y proyectos</h2>
      <ul>
        <li>
          Quien publica declara tener la autorización para ofrecer el inmueble y se compromete a que
          la información (precio, ubicación, características, disponibilidad, fotos) sea veraz y esté
          actualizada.
        </li>
        <li>
          Toda publicación pasa por una revisión (“moderación”) antes de mostrarse. Podemos rechazar,
          editar o retirar una publicación que consideremos inexacta, duplicada, engañosa o
          contraria a estos Términos o a la ley.
        </li>
        <li>
          El sello <strong>Paradise Verified</strong> indica que nuestro equipo revisó ciertos datos
          de la publicación o del perfil; no es una garantía sobre el estado legal o físico del
          inmueble.
        </li>
        <li>Está prohibido publicar contenido discriminatorio, fraudulento, o que infrinja derechos de terceros.</li>
      </ul>

      <h2>4. Contenido de los usuarios</h2>
      <p>
        Al subir fotos, descripciones, reseñas u otro contenido, nos concedes una licencia no
        exclusiva y gratuita para mostrarlo y distribuirlo dentro de la Plataforma y en materiales de
        promoción del propio anuncio. Sigues siendo el titular de tu contenido. Las reseñas deben
        basarse en una experiencia real; podemos moderar o retirar reseñas falsas, ofensivas o
        irrelevantes.
      </p>

      <h2>5. Uso permitido</h2>
      <p>No está permitido:</p>
      <ul>
        <li>Extraer datos de forma masiva (scraping) sin autorización.</li>
        <li>Contactar a usuarios con fines distintos a la consulta inmobiliaria (spam).</li>
        <li>Interferir con el funcionamiento de la Plataforma o intentar vulnerar su seguridad.</li>
        <li>Suplantar a otra persona u organización.</li>
      </ul>

      <h2>6. Sin garantías sobre las transacciones</h2>
      <p>
        La Plataforma se ofrece “tal cual”. No garantizamos la exactitud de las publicaciones de
        terceros, la disponibilidad de los inmuebles, ni el resultado de ninguna negociación. Antes
        de comprar, alquilar o reservar, verifica de forma independiente el estado legal del inmueble
        (título, cargas, impuestos), su estado físico y las condiciones ofrecidas. Cualquier cálculo
        (por ejemplo, la calculadora de cuota) es solo informativo.
      </p>

      <h2>7. Limitación de responsabilidad</h2>
      <p>
        En la medida permitida por la ley, Paradise Homes RD no será responsable por daños indirectos
        o lucro cesante derivados del uso de la Plataforma, de la información publicada por terceros,
        o de tratos realizados con asesores, inmobiliarias, desarrolladoras o vendedores.
      </p>

      <h2>8. Propiedad intelectual</h2>
      <p>
        La marca, el diseño, el código y los textos propios de Paradise Homes RD están protegidos y
        no pueden usarse sin autorización.
      </p>

      <h2>9. Suspensión y terminación</h2>
      <p>
        Podemos suspender o cancelar el acceso de un usuario que incumpla estos Términos o la ley.
        Puedes cerrar tu cuenta en cualquier momento contactándonos.
      </p>

      <h2>10. Cambios</h2>
      <p>
        Podemos modificar estos Términos. La versión vigente estará siempre en esta página con su
        fecha. El uso continuado tras un cambio implica su aceptación.
      </p>

      <h2>11. Ley aplicable</h2>
      <p>
        Estos Términos se rigen por las leyes de la República Dominicana. Cualquier controversia se
        someterá a los tribunales competentes del Distrito Nacional, salvo disposición legal en
        contrario.
      </p>
    </LegalPage>
  );
}
