import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { obtenerOCrearUsuarioActual } from "@/lib/usuario";

export default async function PanelDistribuidor() {
  const user = await currentUser();

  if (!user) {
    redirect("/iniciar-sesion");
  }

  const email = user.emailAddresses[0]?.emailAddress?.toLowerCase();

  if (!email) {
    redirect("/iniciar-sesion");
  }

  // Sincroniza al usuario interno con Clerk si corresponde (Admin o Profesor)
  await obtenerOCrearUsuarioActual();

  // 1. Buscamos primero en el modelo Usuario (Dirección/Admin y Profesores)
  const usuarioDb = await prisma.usuario.findFirst({
    where: { 
      email: {
        equals: email,
        mode: "insensitive"
      }
    },
  });

  if (usuarioDb) {
    const rol = usuarioDb.rol?.toUpperCase();
    if (rol === "ADMIN") {
      redirect("/panel-de-control/admin");
    }
    if (rol === "PROFESOR") {
      redirect("/panel-de-control/profesor");
    }
  }

  // 2. Si no es Admin ni Profesor, buscamos en el modelo Padre
  const padreDb = await prisma.padre.findFirst({
    where: { 
      email: {
        equals: email,
        mode: "insensitive"
      }
    },
  });

  // Si existe en la tabla Padre, lo enviamos a su panel (en plural: /padres)
  if (padreDb) {
    redirect("/panel-de-control/padres");
  }

  // 3. Si no existe en ninguna de las dos tablas, mostramos la pantalla de cuenta pendiente
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 p-4 text-center text-gray-800">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md border-t-8 border-[#F2D707]">
        <span className="text-5xl block mb-3">⏳</span>
        <h2 className="text-2xl font-bold text-[#0A10CC] mb-2">Cuenta no vinculada</h2>
        <p className="text-gray-600 text-sm mb-4">
          El correo <strong>{email}</strong> no está asignado a un profesor, administrador ni apoderado en el sistema escolar.
        </p>
        <p className="text-xs text-gray-500 bg-gray-100 p-3 rounded-lg">
          Por favor, comunícate con la Dirección Académica para verificar tu registro.
        </p>
      </div>
    </div>
  );
}