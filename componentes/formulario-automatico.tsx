"use client";

import { ReactNode } from "react";

interface PropsFormularioAutomatico {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
  className?: string;
}

export default function FormularioAutomatico({ action, children, className }: PropsFormularioAutomatico) {
  return (
    <form 
      action={action} 
      className={className} 
      onChange={(e) => e.currentTarget.requestSubmit()}
    >
      {children}
    </form>
  );
}