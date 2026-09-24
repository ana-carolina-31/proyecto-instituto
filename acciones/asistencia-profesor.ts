"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface DocenteConHorario {
  id: number;
  nombre: string;
  apellidos: string;
  ci: string;
  rol: string;
  materia?: string | null;
  horaIngreso?: string | null;
  horarioSemanal?: string | null;
}

export async function marcarAsistenciaProfesorPorCI(formData: FormData): Promise<void> {
  const ciRaw = formData.get("ci")?.toString() || "";
  const ci = ciRaw.replace(/[^0-9]/g, "").trim();
  const accionTipo = formData.get("tipo")?.toString() || "ENTRADA";

  if (!ci || ci === "0") return;

  try {
    const docenteRaw = await prisma.usuario.findFirst({
      where: {
        ci,
        rol: { in: ["PROFESOR", "DOCENTE"] }
      }
    });

    if (!docenteRaw) return;
    const docente = docenteRaw as unknown as DocenteConHorario;

    const ahora = new Date();
    const nombresDias = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    const diaHoy = nombresDias[ahora.getDay()];

    let horaPactada = docente.horaIngreso || "07:30";

    if (docente.horarioSemanal) {
      try {
        const schedule = JSON.parse(docente.horarioSemanal);
        if (schedule[diaHoy]?.activo && schedule[diaHoy]?.entrada) {
          horaPactada = schedule[diaHoy].entrada;
        }
      } catch {
        horaPactada = docente.horaIngreso || "07:30";
      }
    }

    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);
    const finHoy = new Date();
    finHoy.setHours(23, 59, 59, 999);

    const registrosHoy = await prisma.asistenciaProfesor.findMany({
      where: {
        idProfesor: docente.id,
        fechaHora: { gte: inicioHoy, lte: finHoy }
      }
    });

    if (accionTipo === "ENTRADA" && registrosHoy.some((r) => r.tipo === "ENTRADA")) return;
    if (accionTipo === "SALIDA" && registrosHoy.some((r) => r.tipo === "SALIDA")) return;

    let estadoCalculado = "PRESENTE";
    let observacion = accionTipo === "ENTRADA" ? "Ingreso a tiempo" : "Salida registrada";

    if (accionTipo === "ENTRADA") {
      const [hRef, mRef] = horaPactada.split(":").map(Number);
      const minutosMarcado = ahora.getHours() * 60 + ahora.getMinutes();
      const minutosEsperados = hRef * 60 + mRef;
      const diferencia = minutosMarcado - minutosEsperados;

      if (diferencia > 30) {
        estadoCalculado = "FALTA";
        observacion = `Retraso severo (+${diferencia} min)`;
      } else if (diferencia > 10) {
        estadoCalculado = "ATRASO";
        observacion = `Atraso de ${diferencia} min`;
      }
    }

    await prisma.asistenciaProfesor.create({
      data: {
        idProfesor: docente.id,
        tipo: accionTipo,
        estado: estadoCalculado,
        observacion,
        fechaHora: ahora
      }
    });

    revalidatePath("/panel-de-control/admin/profesor/asistencia");
    revalidatePath("/panel-de-control/profesor/asistencia");
  } catch (error) {
    console.error("Error al registrar asistencia:", error);
  }
}

export async function obtenerAsistenciasProfesor() {
  try {
    return await prisma.asistenciaProfesor.findMany({
      take: 50,
      include: { profesor: true },
      orderBy: { fechaHora: "desc" }
    });
  } catch {
    return [];
  }
}

export async function justificarAsistenciaSecretaria(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const nuevoEstado = formData.get("estado")?.toString() || "LICENCIA";

  if (!id) return;

  try {
    await prisma.asistenciaProfesor.update({
      where: { id },
      data: {
        estado: nuevoEstado,
        observacion: "Justificado por Dirección / Secretaría"
      }
    });

    revalidatePath("/panel-de-control/admin/profesor/asistencia");
    revalidatePath("/panel-de-control/profesor/asistencia");
  } catch (error) {
    console.error("Error al justificar asistencia:", error);
  }
}