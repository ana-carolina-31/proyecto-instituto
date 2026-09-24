import { SignIn } from "@clerk/nextjs";

export default function PaginaIniciarSesion() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-950 via-[#0A10CC] to-slate-900 px-4 py-8">
      {/* Título institucional centrado */}
      <div className="text-center mb-6 max-w-lg">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide drop-shadow-md">
          Unidad Educativa Libertad en Las Américas Don Bosco
        </h1>
        <p className="text-sm text-[#F2D707] font-semibold mt-2">
          Ingrese los datos necesarios
        </p>
      </div>

      {/* Tarjeta de inicio de sesión centrada */}
      <div className="w-full max-w-md flex justify-center">
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: "bg-[#0A10CC] hover:bg-blue-900 text-white text-sm font-bold normal-case transition-colors",
              card: "shadow-2xl border-t-8 border-t-[#F2D707] rounded-2xl bg-white w-full",
              headerTitle: "text-[#0A10CC] font-bold",
              footerActionLink: "text-[#0A10CC] hover:text-[#F2D707] font-semibold",
            },
          }}
          routing="path"
          path="/iniciar-sesion"
          forceRedirectUrl="/panel-distribuidor"
        />
      </div>
    </main>
  );
}