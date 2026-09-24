import { currentUser } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export const revalidate = 0;

export default async function DespachadorPanelControl() {
  const usuarioClerk = await currentUser();

  if (!usuarioClerk) {
    redirect("/iniciar-sesion");
  }

  const emailUsuario = usuarioClerk.emailAddresses[0]?.emailAddress?.toLowerCase().trim() || "";

  // 1. Verificamos si en la base de datos es ADMINISTRADOR o PROFESOR (Tabla Usuario)
  const usuarioBD = await prisma.usuario.findFirst({
    where: {
      email: {
        equals: emailUsuario,
        mode: "insensitive"
      }
    }
  });

  // 2. Verificamos si en la base de datos es PADRE DE FAMILIA (Tabla Padre)
  const padreBD = await prisma.padre.findFirst({
    where: {
      email: {
        equals: emailUsuario,
        mode: "insensitive"
      }
    }
  });

  // Determinamos el rol definitivo en orden de jerarquía
  let rolDefinitivo = "padre"; // Rol por defecto si no es admin ni profesor

  if (usuarioBD) {
    const rolEnBD = usuarioBD.rol.toUpperCase();
    if (rolEnBD === "ADMIN" || rolEnBD === "DIRECTOR") {
      rolDefinitivo = "admin";
    } else if (rolEnBD === "PROFESOR" || rolEnBD === "DOCENTE") {
      rolDefinitivo = "profesor";
    }
  } else if (padreBD) {
    rolDefinitivo = "padre";
  }

  // 3. Sincronizamos Clerk automáticamente en segundo plano (para que ya quede grabado para siempre)
  const rolActualEnClerk = (usuarioClerk.publicMetadata as { rol?: string })?.rol;
  if (rolActualEnClerk !== rolDefinitivo) {
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(usuarioClerk.id, {
        publicMetadata: {
          rol: rolDefinitivo,
        },
      });
    } catch (e) {
      console.error("No se pudo actualizar metadata en Clerk, pero se redirige igual:", e);
    }
  }

  // 4. Redirección instantánea a su pantalla correspondiente
  if (rolDefinitivo === "admin") {
    redirect("/panel-de-control/admin");
  } else if (rolDefinitivo === "profesor") {
    redirect("/panel-de-control/profesor");
  } else {
    redirect("/panel-de-control/padres");
  }
}