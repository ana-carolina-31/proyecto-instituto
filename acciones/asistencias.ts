"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function registrarAsistencia(formData: FormData) {
  const idEstudianteRaw = formData.get("idEstudiante") as string;
  const idProfesorRaw = formData.get("idProfesor") as string;
  const fechaStr = formData.get("fecha") as string;
  const estado = formData.get("estado") as string; 
  const observacion = formData.get("observacion") as string;

  if (!idEstudianteRaw || !idProfesorRaw || !fechaStr || !estado) {
    return;
  }

  await prisma.asistenciaEstudiante.create({
    data: {
      idEstudiante: parseInt(idEstudianteRaw, 10),
      idProfesor: parseInt(idProfesorRaw, 10),
      estado,
      fecha: new Date(fechaStr + "T00:00:00"),
      observacion: observacion || null,
    },
  });
  revalidatePath("/panel-de-control/asistencias"); // Cambia por tu ruta exacta si es diferente
}
export async function obtenerAsistenciasRecientes() {
  return await prisma.asistenciaEstudiante.findMany({
    take: 30,
    include: {
      estudiante: true,
      profesor: true,
    },
    orderBy: { fecha: "desc" },
  });
}
export async function obtenerAsistenciasPorEstudiante(idEstudiante: number) {
  return await prisma.asistenciaEstudiante.findMany({
    where: { idEstudiante },
    include: {
      profesor: true,
    },
    orderBy: { fecha: "desc" },
  });
}
// 1. EDITAR / ACTUALIZAR ASISTENCIA EXISTENTE
export async function actualizarAsistencia(formData: FormData) {
  const idRaw = formData.get("id") as string;
  const estado = formData.get("estado") as string;
  const observacion = formData.get("observacion") as string;

  if (!idRaw || !estado) return;

  await prisma.asistenciaEstudiante.update({
    where: { id: parseInt(idRaw, 10) },
    data: {
      estado,
      observacion: observacion || null,
    },
  });

  revalidatePath("/panel-de-control/admin/asistencias");
}

// 2. ELIMINAR REGISTRO DE ASISTENCIA
export async function eliminarAsistencia(formData: FormData) {
  const idRaw = formData.get("id") as string;
  if (!idRaw) return;

  await prisma.asistenciaEstudiante.delete({
    where: { id: parseInt(idRaw, 10) },
  });

  revalidatePath("/panel-de-control/admin/asistencias");
}
// Guardar lista completa en bloque con una sola acción
export async function registrarAsistenciaLote(formData: FormData) {
  const idProfesorRaw = formData.get("idProfesor") as string;
  const fechaStr = formData.get("fecha") as string;
  const totalEstudiantes = Number(formData.get("totalEstudiantes") || 0);

  if (!idProfesorRaw || !fechaStr || totalEstudiantes === 0) return;

  const idProfesor = parseInt(idProfesorRaw, 10);
  const fecha = new Date(fechaStr + "T12:00:00.000Z");

  const registros = [];

  for (let i = 0; i < totalEstudiantes; i++) {
    const idEstudiante = Number(formData.get(`idEstudiante_${i}`));
    const estado = formData.get(`estado_${i}`)?.toString() || "PRESENTE";
    const observacion = formData.get(`observacion_${i}`)?.toString() || null;

    if (idEstudiante) {
      registros.push({
        idEstudiante,
        idProfesor,
        fecha,
        estado,
        observacion: observacion ? observacion.trim() : null,
      });
    }
  }

  if (registros.length > 0) {
    await prisma.asistenciaEstudiante.createMany({
      data: registros,
    });
  }

  revalidatePath("/panel-de-control/profesor");
  revalidatePath("/panel-de-control/admin/asistencias");
}