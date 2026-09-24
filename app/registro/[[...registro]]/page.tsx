import { SignUp } from "@clerk/nextjs";

export default function PaginaRegistro() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface px-4 py-8 text-on-surface">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Registro Institucional</h1>
        <p className="text-on-surface-variant mt-2">Cree su cuenta para acceder al sistema escolar</p>
      </div>

      <SignUp 
        signInUrl="/iniciar-sesion" // Forzar enlace hacia inicio de sesión en español
        appearance={{
          elements: {
            formButtonPrimary: 
              "bg-primary hover:bg-primary-container text-white text-sm normal-case",
            card: "shadow-md border border-surface-dim",
          },
        }}
        routing="path"
        path="/registro"
      />
    </div>
  );
}