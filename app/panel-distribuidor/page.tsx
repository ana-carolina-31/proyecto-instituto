import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";


export default async function PanelDistribuidor() {
  const user = await currentUser();
  if (!user) redirect("/iniciar-sesion");

  const email = user.emailAddresses[0]?.emailAddress?.toLowerCase();
  if (!email) redirect("/iniciar-sesion");

  const usuarioDb = await prisma.usuario.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (usuarioDb) {
    const rol = usuarioDb.rol?.toUpperCase();
    if (rol === "ADMIN" || rol === "DIRECTOR") redirect("/panel-de-control/admin");
    if (rol === "PROFESOR" || rol === "DOCENTE") redirect("/panel-de-control/profesor");
  }

  const padreDb = await prisma.padre.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (padreDb) redirect("/panel-de-control/padres");

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 p-4 text-center text-gray-800">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md border-t-8 border-[#F2D707]">
        <span className="text-5xl block mb-3">⏳</span>
        <h2 className="text-2xl font-bold text-[#0A10CC] mb-2">Cuenta en espera</h2>
        <p className="text-gray-600 text-sm mb-4">
          El correo <strong>{email}</strong> no está asignado a un profesor, administrador ni apoderado registrado en el sistema escolar.
        </p>
      </div>
    </div>
  );
}