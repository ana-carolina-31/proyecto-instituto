import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { obtenerOCrearUsuarioActual } from "@/lib/usuario";

export default async function DistribuidorPage() {
  const usuarioClerk = await currentUser();
  if (!usuarioClerk) redirect("/iniciar-sesion");

  const email = usuarioClerk.emailAddresses[0]?.emailAddress?.toLowerCase() || "";
  const rolClerk = ((usuarioClerk.publicMetadata?.role as string) || "").toUpperCase();

  // 1. Si Clerk ya lo marca como ADMIN o PROFESOR, sincronizamos/creamos en la BD y redirigimos
  if (rolClerk === "ADMIN" || rolClerk === "PROFESOR") {
    await obtenerOCrearUsuarioActual();
    if (rolClerk === "ADMIN") redirect("/panel-de-control/admin");
    if (rolClerk === "PROFESOR") redirect("/panel-de-control/profesor");
  }

  // 2. Buscamos en la base de datos si ya existe como Usuario interno
  const usuarioInterno = await prisma.usuario.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
  });

  if (usuarioInterno) {
    const rolBD = usuarioInterno.rol?.toUpperCase();
    if (rolBD === "ADMIN") redirect("/panel-de-control/admin");
    if (rolBD === "PROFESOR") redirect("/panel-de-control/profesor");
  }

  // 3. Buscamos si es un Padre registrado
  const padre = await prisma.padre.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
  });

  if (padre) redirect("/panel-de-control/padres");

  // 4. Si no tiene rol asignado ni alumnos vinculados: pantalla de espera
  return (
    <div className="min-h-screen bg-blue-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md border-t-8 border-yellow-400 transform transition-all duration-300 hover:scale-105">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
          <span className="text-4xl">⏳</span>
        </div>
        <h1 className="text-3xl font-extrabold text-blue-900 mb-2 tracking-tight">Cuenta en Espera</h1>
        <p className="text-gray-600 mb-6 text-sm">
          Tu correo electrónico ({email}) está validado, pero aún no tienes estudiantes asignados.
        </p>
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg font-medium text-sm border border-yellow-200">
          ⚠️ Advertencia: El registro del Padre o Tutor debe ser realizado por la Administración institucional antes de poder visualizar a los estudiantes (Nivel Inicial, Primaria o Secundaria).
        </div>
      </div>
    </div>
  );
}