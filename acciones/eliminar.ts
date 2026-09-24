"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function eliminarEstudiante(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;

  // Usamos los nombres exactos de tu Prisma Schema
  await prisma.calificacion.deleteMany({ where: { idEstudiante: id } });
  await prisma.asistenciaEstudiante.deleteMany({ where: { idEstudiante: id } });
  
  await prisma.estudiante.delete({ where: { id } });
  revalidatePath("/panel-de-control/admin"); 
}

export async function eliminarPadre(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;

  const estudiantesVinculados = await prisma.estudiante.count({ where: { idPadre: id } });
  if (estudiantesVinculados > 0) {
    throw new Error("Tiene estudiantes inscritos. Elimina a sus hijos primero.");
  }

  await prisma.padre.delete({ where: { id } });
  revalidatePath("/panel-de-control/admin");
}

export async function eliminarUsuario(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;

  await prisma.asistenciaEstudiante.deleteMany({ where: { idProfesor: id } });
  await prisma.asistenciaProfesor.deleteMany({ where: { idProfesor: id } });

  await prisma.usuario.delete({ where: { id } });
  revalidatePath("/panel-de-control/admin");
}