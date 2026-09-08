import type { Metadata } from "next";

import { LegalPage } from "@/app/(legal)/legal-content";

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "Qué cookies y tecnologías similares usa Paradise Homes RD.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <LegalPage title="Política de cookies">
      <p>
        Esta política explica qué cookies y almacenamiento local usa Paradise Homes RD, para qué
        sirven y cómo puedes gestionarlos. Forma parte de nuestra{" "}
        <a href="/privacy">Política de Privacidad</a>.
      </p>

      <h2>1. Qué son</h2>
      <p>
        Las cookies son pequeños archivos que un sitio guarda en tu navegador. También usamos
        <em> almacenamiento local</em> (localStorage), que cumple una función parecida pero no se
        envía automáticamente al servidor.
      </p>

      <h2>2. Cookies y almacenamiento que usamos</h2>
      <ul>
        <li>
          <strong>Esenciales (sesión de usuario):</strong> mantienen tu sesión iniciada de forma
          segura. Las gestiona nuestro proveedor de autenticación (Supabase). Sin ellas no puedes
          iniciar sesión.
        </li>
        <li>
          <strong>Preferencias:</strong> recuerdan ajustes como el tema claro/oscuro, tu vista
          preferida de resultados o un formulario a medio llenar. Se guardan en tu navegador y no se
          comparten.
        </li>
        <li>
          <strong>Favoritos y comparador (invitados):</strong> si no tienes cuenta, tus favoritos y
          las propiedades del comparador se guardan localmente en tu dispositivo. Al iniciar sesión
          se sincronizan con tu cuenta.
        </li>
        <li>
          <strong>Identificador de sesión de analítica:</strong> un identificador anónimo para
          entender el uso agregado de la Plataforma sin identificarte personalmente.
        </li>
        <li>
          <strong>Atribución de marketing:</strong> una cookie que guarda de qué campaña o enlace
          llegaste (parámetros UTM), para medir el rendimiento de nuestra difusión.
        </li>
        <li>
          <strong>Terceros (opcionales):</strong> si están configurados, servicios como Google
          Analytics, Meta Pixel, TikTok Pixel o PostHog pueden colocar sus propias cookies con fines
          de medición y publicidad. Google Maps también puede usar cookies para mostrar el mapa.
        </li>
      </ul>

      <h2>3. Cómo gestionarlas</h2>
      <p>
        Puedes borrar o bloquear cookies desde la configuración de tu navegador. Ten en cuenta que si
        bloqueas las esenciales no podrás iniciar sesión ni usar ciertas funciones. Para el
        almacenamiento local, borrar los datos del sitio elimina tus favoritos de invitado y tus
        preferencias.
      </p>

      <h2>4. Cambios</h2>
      <p>
        Si añadimos o quitamos cookies actualizaremos esta página. La versión vigente aparece siempre
        aquí con su fecha.
      </p>
    </LegalPage>
  );
}
