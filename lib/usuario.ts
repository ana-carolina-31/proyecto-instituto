import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function obtenerOCrearUsuarioActual() {
  const user = await currentUser();
  if (!user) return null;

  const email = user.emailAddresses[0]?.emailAddress?.toLowerCase().trim() || "";
  const rolClerk = ((user.publicMetadata?.rol as string) || (user.publicMetadata?.role as string) || "").toUpperCase();

  try {
    // 1. Vincular o actualizar Usuario (Admin / Profesor)
    const usuarioExistente = await prisma.usuario.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: "insensitive" } },
          { clerkId: user.id }
        ]
      }
    });

    if (usuarioExistente) {
      if (usuarioExistente.clerkId !== user.id) {
        await prisma.usuario.update({
          where: { id: usuarioExistente.id },
          data: { clerkId: user.id }
        });
      }
      return usuarioExistente;
    }

    // 2. Si no existe en Usuario pero es Padre registrado previamente por secretaría
    const padreExistente = await prisma.padre.findFirst({
      where: { email: { equals: email, mode: "insensitive" } }
    });

    if (padreExistente) {
      return { ...padreExistente, rol: "PADRE" };
    }

    // 3. Si en Clerk se le asignó rol pero no estaba en BD, crearlo
    if (rolClerk === "ADMIN" || rolClerk === "PROFESOR") {
      return await prisma.usuario.create({
        data: {
          clerkId: user.id,
          email,
          nombre: user.firstName || "Docente",
          apellidos: user.lastName || "Institucional",
          ci: "0",
          rol: rolClerk,
        }
      });
    }

    return null;
  } catch (error) {
    console.error("Error al sincronizar con Clerk:", error);
    return null;
  }
}