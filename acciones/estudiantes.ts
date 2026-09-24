"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function obtenerEstudiantes(curso?: string) {
  return await prisma.estudiante.findMany({
    where: curso ? { curso: { equals: curso, mode: "insensitive" } } : undefined,
    include: {
      padre: true,
      calificaciones: true,
    },
    orderBy: [
      { apellidos: "asc" },
      { nombres: "asc" }
    ],
  });
}
export async function crearEstudiante(formData: FormData) {
  const nombres = formData.get("nombres") as string;
  const apellidos = formData.get("apellidos") as string;
  const idPadreRaw = formData.get("idPadre") as string;
  const idPadre = idPadreRaw ? parseInt(idPadreRaw, 10) : null;
  
  const curso = formData.get("curso") as string;
  const paralelo = formData.get("paralelo") as string;
  
  // Hacemos que el RUDE y el CI sean estrictamente obligatorios
  const rude = formData.get("rude") as string;
  const ci = formData.get("ci") as string;

  // Capitalización por seguridad
  const nombresCap = nombres ? nombres.charAt(0).toUpperCase() + nombres.slice(1).toLowerCase() : "";
  const apellidosCap = apellidos ? apellidos.charAt(0).toUpperCase() + apellidos.slice(1).toLowerCase() : "";

  // Validación estricta: Si falta cualquiera de estos datos clave (incluyendo rude y ci), se detiene y no guarda
  if (!nombresCap || !apellidosCap || !idPadre || !curso || !rude || !ci) {
    throw new Error("Todos los campos obligatorios, incluyendo el RUDE y el CI, deben ser completados.");
  }

  await prisma.estudiante.create({
    data: { 
      nombres: nombresCap, 
      apellidos: apellidosCap, 
      email: `${nombresCap.toLowerCase()}.${apellidosCap.toLowerCase()}@donbosco.edu`,
      curso,
      paralelo,
      rude,
      ci, 
      idPadre 
    }
  });

  revalidatePath("/panel-de-control/admin/estudiante");
}