"use server";

import prisma from "@/lib/prisma";

export async function obtenerDatosPadrePorEmail(email: string) {
  // Buscamos al padre usando su correo y traemos la información de sus hijos
  return await prisma.padre.findFirst({
    where: { 
      email: email 
    },
    include: {
      estudiantes: {
        include: {
          calificaciones: {
            orderBy: { trimestre: "asc" }
          }
        }
      }
    }
  });
}

export async function obtenerComunicadosPadres() {
  // Solo traemos comunicados dirigidos a "TODOS" o "PADRES"
  return await prisma.comunicado.findMany({
    where: {
      dirigidoA: {
        in: ["TODOS", "PADRES"]
      }
    },
    orderBy: { fecha: "desc" },
    take: 5 // Mostramos solo los 5 más recientes
  });
}