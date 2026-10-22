// ⚠️ TP9 §3.3 — CÓDIGO INSEGURO A PROPÓSITO. ESTA RAMA NO SE MERGEA.
// Dos hallazgos didácticos para ver a CodeQL cazarlos en el PR:
//   1) XSS reflejado (OWASP A05:2025 Injection): el nombre del usuario se mete en HTML sin escapar.
//   2) Path traversal (OWASP A01:2025 Broken Access Control): el usuario elige qué archivo leer del disco.
import { Router } from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const demoInseguroRouter = Router();

// GET /api/demo/saludo?nombre=<script>alert(1)</script>  → el navegador ejecuta el script
demoInseguroRouter.get("/saludo", (req, res) => {
  const nombre = String(req.query.nombre ?? "");
  res.send(`<h1>Hola, ${nombre}</h1>`);
});

// GET /api/demo/archivo?nombre=../../etc/passwd  → lee cualquier archivo del servidor
demoInseguroRouter.get("/archivo", async (req, res) => {
  const nombre = String(req.query.nombre ?? "");
  const contenido = await readFile(path.join("/app/publico", nombre), "utf-8");
  res.type("text/plain").send(contenido);
});
