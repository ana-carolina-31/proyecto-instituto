"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Función auxiliar para acotar dimensiones a sus topes pedagógicos
function acotarDimension(valor: number, maximo: number): number {
  if (isNaN(valor) || valor < 0) return 0;
  if (valor > maximo) return maximo;
  return parseFloat(valor.toFixed(1));
}

// 1. REGISTRAR CALIFICACIÓN (Con prevención de duplicados)
export async function registrarCalificacion(formData: FormData): Promise<void> {
  const idEstudianteRaw = formData.get("idEstudiante") as string;
  const idProfesorRaw = formData.get("idProfesor") as string;
  const materia = formData.get("materia")?.toString().trim();
  const trimestre = formData.get("trimestre")?.toString().trim();

  if (!idEstudianteRaw || !idProfesorRaw || !materia || !trimestre) {
    return;
  }

  const idEstudiante = parseInt(idEstudianteRaw, 10);
  const idProfesor = parseInt(idProfesorRaw, 10);

  // Dimensiones acotadas a la norma: SER (10), SABER (45), HACER (40), AUTO (5)
  const ser = acotarDimension(parseFloat((formData.get("ser") as string) || "0"), 10);
  const saber = acotarDimension(parseFloat((formData.get("saber") as string) || "0"), 45);
  const hacer = acotarDimension(parseFloat((formData.get("hacer") as string) || "0"), 40);
  const autoevaluacion = acotarDimension(parseFloat((formData.get("autoevaluacion") as string) || "0"), 5);

  const notaFinal = parseFloat((ser + saber + hacer + autoevaluacion).toFixed(1));

  try {
    // Si ya existe nota de este estudiante, materia y trimestre, se actualiza en lugar de duplicar
    const calificacionExistente = await prisma.calificacion.findFirst({
      where: {
        idEstudiante,
        materia,
        trimestre,
      },
    });

    if (calificacionExistente) {
      await prisma.calificacion.update({
        where: { id: calificacionExistente.id },
        data: {
          idProfesor,
          ser,
          saber,
          hacer,
          autoevaluacion,
          notaFinal,
        },
      });
    } else {
      await prisma.calificacion.create({
        data: {
          idEstudiante,
          idProfesor,
          materia,
          trimestre,
          ser,
          saber,
          hacer,
          autoevaluacion,
          notaFinal,
        },
      });
    }

    // Revalidación de todas las rutas donde se visualizan notas
    revalidatePath("/panel-de-control/profesor");
    revalidatePath("/panel-de-control/admin/calificaciones");
    revalidatePath("/panel-de-control/padres");
  } catch (error) {
    console.error("Error al registrar calificación:", error);
  }
}

// Alias de compatibilidad
export const crearCalificacion = registrarCalificacion;

// 2. ACTUALIZAR CALIFICACIÓN EXISTENTE (Edición en línea)
export async function actualizarCalificacion(formData: FormData): Promise<void> {
  const idRaw = formData.get("id") as string;
  if (!idRaw) return;

  const id = parseInt(idRaw, 10);

  const ser = acotarDimension(parseFloat((formData.get("ser") as string) || "0"), 10);
  const saber = acotarDimension(parseFloat((formData.get("saber") as string) || "0"), 45);
  const hacer = acotarDimension(parseFloat((formData.get("hacer") as string) || "0"), 40);
  const autoevaluacion = acotarDimension(parseFloat((formData.get("autoevaluacion") as string) || "0"), 5);

  const notaFinal = parseFloat((ser + saber + hacer + autoevaluacion).toFixed(1));

  try {
    await prisma.calificacion.update({
      where: { id },
      data: {
        ser,
        saber,
        hacer,
        autoevaluacion,
        notaFinal,
      },
    });

    // Revalida la pantalla activa del profesor para ver el cambio inmediatamente
    revalidatePath("/panel-de-control/profesor");
    revalidatePath("/panel-de-control/admin/calificaciones");
    revalidatePath("/panel-de-control/padres");
  } catch (error) {
    console.error("Error al actualizar calificación:", error);
  }
}

// 3. ELIMINAR CALIFICACIÓN
export async function eliminarCalificacion(formData: FormData): Promise<void> {
  const idRaw = formData.get("id") as string;
  if (!idRaw) return;

  const id = parseInt(idRaw, 10);

  try {
    await prisma.calificacion.delete({
      where: { id },
    });

    revalidatePath("/panel-de-control/profesor");
    revalidatePath("/panel-de-control/admin/calificaciones");
    revalidatePath("/panel-de-control/padres");
  } catch (error) {
    console.error("Error al eliminar calificación:", error);
  }
}

// 4. CONSULTAS AUXILIARES
export async function obtenerprofesor() {
  try {
    return await prisma.usuario.findMany({
      where: { rol: "PROFESOR" },
      select: { id: true, nombre: true, apellidos: true, email: true, materia: true },
      orderBy: [{ apellidos: "asc" }, { nombre: "asc" }],
    });
  } catch {
    return [];
  }
}

export async function obtenerCalificaciones() {
  try {
    return await prisma.calificacion.findMany({
      include: {
        estudiante: true,
        profesor: true,
      },
      orderBy: { id: "desc" },
    });
  } catch {
    return [];
  }
}

export async function obtenerCalificacionesPorEstudiante(idEstudiante: number) {
  try {
    return await prisma.calificacion.findMany({
      where: { idEstudiante },
      orderBy: { id: "desc" },
    });
  } catch {
    return [];
  }
}