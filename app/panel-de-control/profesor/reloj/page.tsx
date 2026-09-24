import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export default async function RelojDocentePage() {
  // Obtenemos el profesor conectado mediante Clerk
  const usuarioClerk = await currentUser();
  const emailProfesor = usuarioClerk?.emailAddresses[0]?.emailAddress;

  const profesorActual = await prisma.usuario.findUnique({
    where: { email: emailProfesor }
  });

  const idProfesorReal = profesorActual?.id || 0;

  // Action Server embebida con el ID dinámico real
  async function marcarAsistencia() {
    "use server";
    
    if (idProfesorReal === 0) {
      console.error("No se pudo identificar al profesor para marcar asistencia.");
      return;
    }

    await prisma.asistenciaProfesor.create({
      data: {
        idProfesor: idProfesorReal, 
        tipo: "INGRESO",
        estado: "PRESENTE",
      }
    });
    revalidatePath("/panel-de-control/profesor/reloj");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-blue-50 rounded-xl shadow-sm border border-blue-200 p-8 text-center">
      <div className="text-6xl mb-4">⏱️</div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Reloj de Asistencia</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        Registra tu hora de llegada institucional. El sistema capturará automáticamente la hora oficial del servidor de Don Bosco.
      </p>
      <form action={marcarAsistencia}>
        <button 
          type="submit" 
          className="bg-[#0A10CC] hover:bg-blue-900 text-white font-bold py-5 px-10 rounded-full shadow-lg text-lg transition-transform hover:scale-105 active:scale-95"
        >
          Marcar Llegada Ahora
        </button>
      </form>
    </div>
  );
}