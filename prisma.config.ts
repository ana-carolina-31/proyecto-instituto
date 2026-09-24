import { defineConfig } from "@prisma/config";

export default defineConfig({
  // @ts-expect-error: 'skills' no es una propiedad oficial de Prisma, pero se requiere para herramientas de IA
  skills: {
    agents: ["claude", "cursor", "agents", "devin"],
  },
});