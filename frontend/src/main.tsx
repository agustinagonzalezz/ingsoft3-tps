import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import * as Sentry from "@sentry/react";
import { App } from "./App";
import "./index.css";

// TP9 §3.5: Sentry en el front, antes de renderizar.
// El DSN va escrito acá a propósito: el de un front NO es un secreto. Sólo sirve para ENVIAR
// datos (no para leerlos), y viaja igual en el JavaScript que baja cualquier navegador.
Sentry.init({
  dsn: "https://c3b78a4915370b0dd2475a1e90843e85@o4512301471825920.ingest.us.sentry.io/4512301505511424",
  // De qué sitio vino el dato: teampay-front-prod, teampay-front-qa o localhost.
  environment: window.location.hostname,
  // Mide cuánto tardan las páginas y los pedidos a la api (qué tarda / qué se usa).
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
});

createRoot(document.getElementById("root")!, {
  // React 19: los errores que rompen un componente también van a Sentry.
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
