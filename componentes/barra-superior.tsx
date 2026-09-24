import { UserButton } from "@clerk/nextjs";

interface PropsBarraSuperior {
  titulo?: string;
  subtitle?: string;
}

export default function BarraSuperior({ titulo }: PropsBarraSuperior) {
  return (
    <header className="bg-white h-16 flex items-center justify-between px-8 shadow-sm border-b border-gray-200">
      <div>
        <h2 className="text-lg font-bold text-primary">{titulo || "Panel de Control"}</h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-on-surface">Administrador</span>
        <UserButton />
      </div>
    </header>
  );
}