"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Definimos una interfaz limpia para los datos de los hijos
interface HijoData {
  id?: number;
  nombres: string;
  apellidos: string;
  ci?: string;
  rude?: string;
  curso: string;
  paralelo: string;
}

// Capitaliza nombres para mantener la base de datos ordenada
const capitalizar = (texto: string) => {
  if (!texto) return "";
  return texto
    .toLowerCase()
    .split(" ")
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ");
};

export async function obtenerPadres() {
  try {
    return await prisma.padre.findMany({
      include: { estudiantes: true },
      orderBy: { apellidos: "asc" },
    });
  } catch {
    return [];
  }
}

export async function obtenerPadrePorId(id: number) {
  try {
    return await prisma.padre.findUnique({
      where: { id },
      include: { estudiantes: true },
    });
  } catch {
    return null;
  }
}

// FUNCIÓN MAESTRA: Crea o Edita Padres e Hijos
export async function guardarPadreConHijos(formData: FormData) {
  const idTexto = formData.get("id")?.toString();
  const idPadre = idTexto ? Number(idTexto) : null;

  // Limpieza estricta: Letras para nombres, números para CI y teléfono
  const nombreRaw = (formData.get("nombre")?.toString() || "").replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "").trim();
  const apellidosRaw = (formData.get("apellidos")?.toString() || "").replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "").trim();
  const ci = (formData.get("ci")?.toString() || "").replace(/[^0-9]/g, "").trim();
  const telefono = (formData.get("telefono")?.toString() || "").replace(/[^0-9]/g, "").trim();
  let email = formData.get("email")?.toString().trim().toLowerCase();

  // Si no proporcionó correo o no tiene, se auto-genera con su CI
  if (!email && ci) {
    email = `padre.${ci}@donbosco.local`;
  }

  if (!nombreRaw || !apellidosRaw || !email) return;

  const nombre = capitalizar(nombreRaw);
  const apellidos = capitalizar(apellidosRaw);

  const hijosJson = formData.get("hijos")?.toString();
  const hijosBrutos: HijoData[] = hijosJson ? JSON.parse(hijosJson) : [];

  // Leemos los hijos que fueron eliminados desde el formulario
  const eliminadosJson = formData.get("hijosEliminados")?.toString();
  const hijosEliminados: number[] = eliminadosJson ? JSON.parse(eliminadosJson) : [];

  // Limpiamos los datos de cada hijo
  const hijos: HijoData[] = hijosBrutos.map((h) => ({
    ...h,
    nombres: h.nombres.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "").trim(),
    apellidos: h.apellidos.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "").trim(),
    ci: (h.ci || "").replace(/[^0-9]/g, "").trim(),
    rude: (h.rude || "").replace(/[^0-9]/g, "").trim(),
  }));

  try {
    if (idPadre) {
      // 1. MODO EDICIÓN: Actualizamos al padre
      await prisma.padre.update({
        where: { id: idPadre },
        data: { nombre, apellidos, email, telefono, ci },
      });

      // 2. Borramos los hijos que el usuario eliminó haciendo clic en "X Quitar"
      if (hijosEliminados.length > 0) {
        await prisma.estudiante.deleteMany({
          where: { id: { in: hijosEliminados } },
        });
      }

      // 3. Actualizamos a los hijos existentes o creamos los nuevos
      for (const hijo of hijos) {
        const emailEstudiante = `${hijo.nombres.trim().toLowerCase().replace(/\s+/g, "")}.${hijo.apellidos.trim().toLowerCase().replace(/\s+/g, "")}@donbosco.edu`;

        if (hijo.id) {
          await prisma.estudiante.update({
            where: { id: hijo.id },
            data: {
              nombres: capitalizar(hijo.nombres),
              apellidos: capitalizar(hijo.apellidos),
              email: emailEstudiante,
              ci: hijo.ci || "",
              rude: hijo.rude || "",
              curso: hijo.curso,
              paralelo: hijo.paralelo,
            },
          });
        } else {
          await prisma.estudiante.create({
            data: {
              nombres: capitalizar(hijo.nombres),
              apellidos: capitalizar(hijo.apellidos),
              email: emailEstudiante,
              ci: hijo.ci || "",
              rude: hijo.rude || "",
              curso: hijo.curso,
              paralelo: hijo.paralelo,
              idPadre: idPadre,
            },
          });
        }
      }
    } else {
      // 4. MODO CREACIÓN: Familia totalmente nueva
      await prisma.padre.create({
        data: {
          nombre,
          apellidos,
          email,
          telefono,
          ci,
          relacion: "Tutor",
          estudiantes: {
            create: hijos.map((hijo: HijoData) => ({
              nombres: capitalizar(hijo.nombres),
              apellidos: capitalizar(hijo.apellidos),
              email: `${hijo.nombres.trim().toLowerCase().replace(/\s+/g, "")}.${hijo.apellidos.trim().toLowerCase().replace(/\s+/g, "")}@donbosco.edu`,
              ci: hijo.ci || "",
              rude: hijo.rude || "",
              curso: hijo.curso,
              paralelo: hijo.paralelo,
            })),
          },
        },
      });
    }

    revalidatePath("/panel-de-control/admin/padres");
    revalidatePath("/panel-de-control/admin/estudiante");
  } catch (error) {
    console.error("Error al guardar familia:", error);
  }

  redirect("/panel-de-control/admin/padres");
}

// Elimina al padre y a TODOS sus hijos en cascada
export async function eliminarPadre(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  try {
    await prisma.estudiante.deleteMany({ where: { idPadre: id } });
    await prisma.padre.delete({ where: { id } });
    revalidatePath("/panel-de-control/admin/padres");
    revalidatePath("/panel-de-control/admin/estudiante");
  } catch (error) {
    console.error("Error al eliminar familia:", error);
  }
}