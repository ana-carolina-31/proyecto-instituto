import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Rutas públicas accesibles sin necesidad de iniciar sesión
const isPublicRoute = createRouteMatcher([
  "/",
  "/iniciar-sesion(.*)",
  "/registro(.*)",
  "/api(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});
export const runtime = "nodejs";
export const config = {
  matcher: [
    // Omitir archivos estáticos internos de Next.js y extensiones comunes
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Siempre ejecutar para rutas API
    '/(api|trpc)(.*)',
  ],
};