"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function guardarComunicado(formData: FormData) {
  const idTexto = formData.get("id")?.toString();
  const titulo = formData.get("titulo")?.toString().trim();
  const contenido = formData.get("contenido")?.toString().trim();
  const dirigidoA = formData.get("dirigidoA")?.toString().trim() || "TODOS";

  if (!titulo || !contenido) return;

  try {
    if (idTexto && idTexto !== "undefined" && idTexto !== "") {
      const idNumero = Number(idTexto);
      
      await prisma.comunicado.update({
        where: { id: idNumero },
        data: { titulo, contenido, dirigidoA },
      });
    } else {
      let autor = await prisma.usuario.findFirst({ 
        where: { 
          rol: {
            equals: "ADMIN",
            mode: "insensitive"
          }
        } 
      });

      if (!autor) {
        autor = await prisma.usuario.findFirst();
      }

      if (!autor) {
        autor = await prisma.usuario.create({
          data: {
            clerkId: "admin_sistema",
            nombre: "Dirección",
            apellidos: "General",
            email: "direccion@donbosco.edu",
            rol: "ADMIN",
            ci: "0000000",
          }
        });
      }

      await prisma.comunicado.create({
        data: {
          titulo,
          contenido,
          dirigidoA,
          autorId: autor.id,
        },
      });
    }
  } catch (error) {
    console.error("Error al procesar el comunicado:", error);
    return;
  }

  // Actualiza los datos en todas las pantallas sin forzar redirect
  revalidatePath("/panel-de-control/profesor");
  revalidatePath("/panel-de-control/admin/comunicados");
  revalidatePath("/panel-de-control/padres");
}

export async function obtenerTodosLosComunicados() {
  try {
    return await prisma.comunicado.findMany({
      orderBy: { fecha: "desc" },
      include: { autor: true },
    });
  } catch {
    return [];
  }
}

export async function obtenerComunicadoPorId(id: number) {
  try {
    return await prisma.comunicado.findUnique({
      where: { id },
    });
  } catch {
    return null; // Retorna null en lugar de 0 para mantener la coherencia de tipos
  }
}

export async function eliminarComunicado(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;

  try {
    await prisma.comunicado.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Error al eliminar comunicado:", error);
  }

  revalidatePath("/panel-de-control/admin/comunicados");
  revalidatePath("/panel-de-control/profesor");
  revalidatePath("/panel-de-control/padres");
}

export async function marcarComunicadoComoLeido(formData: FormData) {
  const comunicadoId = Number(formData.get("comunicadoId"));
  const emailPadre = formData.get("emailPadre")?.toString();

  if (!comunicadoId || !emailPadre) return;

  try {
    const padre = await prisma.padre.findUnique({
      where: { email: emailPadre }
    });

    if (!padre) return;

    await prisma.lecturaComunicado.upsert({
      where: {
        comunicadoId_idPadre: {
          comunicadoId: comunicadoId,
          idPadre: padre.id,
        },
      },
      update: { leidoEn: new Date() },
      create: {
        comunicadoId: comunicadoId,
        idPadre: padre.id,
      },
    });

    revalidatePath("/panel-de-control/padres");
    revalidatePath("/panel-de-control/admin/comunicados");
    revalidatePath("/panel-de-control/profesor");
  } catch (error) {
    console.error("Error al marcar comunicado como leído:", error);
  }
}