"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const capitalizar = (texto: string) => {
  if (!texto) return "";
  return texto
    .toLowerCase()
    .split(" ")
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ");
};

export async function obtenerProfesores() {
  try {
    return await prisma.usuario.findMany({
      where: { rol: "PROFESOR" },
      orderBy: [
        { apellidos: "asc" },
        { nombre: "asc" }
      ],
    });
  } catch (error) {
    console.error("Error al obtener profesores:", error);
    return [];
  }
}

export async function crearProfesor(formData: FormData) {
  const nombreBruto = formData.get("nombre")?.toString().trim();
  const apellidosBruto = (formData.get("apellidos") || formData.get("apellido"))?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const materia = (formData.get("materia") || formData.get("especialidad"))?.toString().trim() || "General";
  const ci = (formData.get("ci") || formData.get("carnet"))?.toString().replace(/[^0-9]/g, "").trim() || "";

  const dias = ["lunes", "martes", "miercoles", "jueves", "viernes"];
  const horarioObj: Record<string, { activo: boolean; entrada: string; salida: string }> = {};

  dias.forEach((dia) => {
    const activo = formData.get(`dia_${dia}`) === "on";
    const entrada = formData.get(`entrada_${dia}`)?.toString() || "07:30";
    const salida = formData.get(`salida_${dia}`)?.toString() || "12:30";
    if (activo) {
      horarioObj[dia] = { activo: true, entrada, salida };
    }
  });

  const horarioSemanal = JSON.stringify(horarioObj);
  const primerDiaActivo = Object.values(horarioObj)[0];
  const horaIngreso = primerDiaActivo?.entrada || "07:30";

  if (!nombreBruto || !apellidosBruto || !email || !ci) {
    console.warn("Faltan campos obligatorios para el profesor.");
    return;
  }

  const nombre = capitalizar(nombreBruto);
  const apellidos = capitalizar(apellidosBruto);

  try {
    const usuarioExistente = await prisma.usuario.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: "insensitive" } },
          { ci: ci }
        ]
      },
    });

    if (usuarioExistente) {
      await prisma.usuario.update({
        where: { id: usuarioExistente.id },
        data: {
          nombre,
          apellidos,
          ci,
          rol: "PROFESOR",
          materia,
          horaIngreso,
          horarioSemanal,
        },
      });
    } else {
      const clerkIdProvisional = `prof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await prisma.usuario.create({
        data: {
          clerkId: clerkIdProvisional,
          nombre,
          apellidos,
          ci,
          email,
          rol: "PROFESOR",
          materia,
          horaIngreso,
          horarioSemanal,
        },
      });
    }

    revalidatePath("/panel-de-control/admin/profesor");
    revalidatePath("/panel-de-control/admin/profesor/asistencia");
  } catch (error) {
    console.error("Error al guardar profesor:", error);
  }
}