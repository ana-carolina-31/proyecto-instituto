"use client";

import ExcelJS from "exceljs";

interface EstudianteInfo {
  nombres?: string;
  apellidos?: string;
}

interface CalificacionRow {
  id?: number;
  materia?: string;
  trimestre?: string;
  ser?: number | string;
  saber?: number | string;
  hacer?: number | string;
  autoevaluacion?: number | string;
  notaFinal?: number | string;
  estudiante?: EstudianteInfo;
  curso?: string;
  paralelo?: string;
  rude?: string;
  ci?: string;
  padre?: { nombre?: string; apellidos?: string; telefono?: string };
}

interface AsistenciaRow {
  id?: number;
  fecha: string | Date;
  estado: string;
  observacion?: string | null;
  estudiante?: EstudianteInfo;
}

type DatoExportar = CalificacionRow | AsistenciaRow;

export default function BotonesExportar({
  datos,
  tipo,
  curso = "General",
  soloPdf = false,
}: {
  datos: DatoExportar[];
  tipo: "calificaciones" | "asistencias" | "estudiantes";
  curso?: string;
  soloPdf?: boolean;
}) {
  const exportarExcelConEstilos = async () => {
    if (!datos || datos.length === 0) {
      alert("No hay registros para exportar en este curso.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reporte Oficial", {
      views: [{ showGridLines: true }],
    });
    const fechaHoy = new Date().toLocaleDateString("es-ES");

    const AZUL_DON_BOSCO = "FF0A10CC";
    const AMARILLO_DON_BOSCO = "FFF2D707";
    const GRIS_FONDO = "FFF4F6FB";
    const BLANCO = "FFFFFFFF";

    worksheet.mergeCells("A1:J1");
    const titulo1 = worksheet.getCell("A1");
    titulo1.value = "UNIDAD EDUCATIVA LIBERTAD EN LAS AMÉRICAS DON BOSCO";
    titulo1.font = { name: "Calibri", size: 14, bold: true, color: { argb: AZUL_DON_BOSCO } };
    titulo1.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getRow(1).height = 25;

    worksheet.mergeCells("A2:J2");
    const titulo2 = worksheet.getCell("A2");
    titulo2.value = `REPORTE OFICIAL DE ${tipo.toUpperCase()}`;
    titulo2.font = { name: "Calibri", size: 12, bold: true, color: { argb: "FF333333" } };
    titulo2.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getRow(2).height = 20;

    worksheet.getCell("A3").value = "CURSO:";
    worksheet.getCell("A3").font = { bold: true };
    worksheet.getCell("B3").value = curso.toUpperCase();
    worksheet.getCell("B3").font = { bold: true, color: { argb: AZUL_DON_BOSCO } };
    worksheet.getCell("C3").value = "FECHA DE EMISIÓN:";
    worksheet.getCell("C3").font = { bold: true };
    worksheet.getCell("D3").value = fechaHoy;
    worksheet.getRow(3).height = 18;

    let headers: string[] = [];
    if (tipo === "asistencias") {
      headers = ["N°", "FECHA", "APELLIDOS Y NOMBRES", "ESTADO", "OBSERVACIÓN"];
    } else if (tipo === "estudiantes") {
      headers = ["N°", "APELLIDOS Y NOMBRES", "CURSO", "PARALELO", "RUDE", "C.I.", "TUTOR / APODERADO", "CELULAR TUTOR"];
    } else {
      headers = ["N°", "APELLIDOS Y NOMBRES", "MATERIA", "TRIMESTRE", "SER (10)", "SABER (45)", "HACER (40)", "AUTO (5)", "NOTA FINAL", "ESTADO"];
    }

    const filaHeaders = worksheet.getRow(5);
    headers.forEach((h, index) => {
      const celda = filaHeaders.getCell(index + 1);
      celda.value = h;
      celda.font = { name: "Calibri", size: 10, bold: true, color: { argb: BLANCO } };
      celda.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: AZUL_DON_BOSCO },
      };
      celda.alignment = { vertical: "middle", horizontal: index === 0 ? "center" : "left" };
      celda.border = {
        top: { style: "medium", color: { argb: AZUL_DON_BOSCO } },
        bottom: { style: "medium", color: { argb: AMARILLO_DON_BOSCO } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      };
    });
    filaHeaders.height = 24;

    let filaIdx = 6;
    if (tipo === "asistencias") {
      datos.forEach((item, idx) => {
        const asis = item as AsistenciaRow;
        const row = worksheet.getRow(filaIdx);
        const fechaStr = new Date(asis.fecha).toLocaleDateString("es-ES");
        const nombreEst = `${asis.estudiante?.apellidos || ""} ${asis.estudiante?.nombres || ""}`.trim();
        row.values = [idx + 1, fechaStr, nombreEst, asis.estado, asis.observacion || "-"];
        const celdaEstado = row.getCell(4);
        celdaEstado.alignment = { horizontal: "center" };
        if (asis.estado === "PRESENTE") {
          celdaEstado.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F5E9" } };
          celdaEstado.font = { bold: true, color: { argb: "FF2E7D32" } };
        } else if (asis.estado === "FALTA") {
          celdaEstado.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEBEE" } };
          celdaEstado.font = { bold: true, color: { argb: "FFC62828" } };
        } else if (asis.estado === "ATRASO") {
          celdaEstado.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF9C4" } };
          celdaEstado.font = { bold: true, color: { argb: "FFF57F17" } };
        }
        for (let c = 1; c <= 5; c++) {
          const cld = row.getCell(c);
          cld.border = {
            top: { style: "thin", color: { argb: "FFE0E0E0" } },
            bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
            left: { style: "thin", color: { argb: "FFE0E0E0" } },
            right: { style: "thin", color: { argb: "FFE0E0E0" } },
          };
          if (idx % 2 === 1 && c !== 4) {
            cld.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRIS_FONDO } };
          }
        }
        filaIdx++;
      });
    } else if (tipo === "estudiantes") {
      datos.forEach((item, idx) => {
        const est = item as CalificacionRow;
        const row = worksheet.getRow(filaIdx);
        const nombreEst = `${est.estudiante?.apellidos || ""} ${est.estudiante?.nombres || ""}`.trim();
        const tutor = `${est.padre?.apellidos || ""} ${est.padre?.nombre || ""}`.trim();
        row.values = [
          idx + 1,
          nombreEst,
          est.curso || curso,
          est.paralelo || "-",
          est.rude || "-",
          est.ci || "-",
          tutor || "-",
          est.padre?.telefono || "-",
        ];
        for (let c = 1; c <= 8; c++) {
          const cld = row.getCell(c);
          cld.border = {
            top: { style: "thin", color: { argb: "FFE0E0E0" } },
            bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
            left: { style: "thin", color: { argb: "FFE0E0E0" } },
            right: { style: "thin", color: { argb: "FFE0E0E0" } },
          };
          if (idx % 2 === 1) {
            cld.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRIS_FONDO } };
          }
        }
        filaIdx++;
      });
    } else {
      datos.forEach((item, idx) => {
        const cal = item as CalificacionRow;
        const row = worksheet.getRow(filaIdx);
        const nombreEst = `${cal.estudiante?.apellidos || ""} ${cal.estudiante?.nombres || ""}`.trim();
        const nota = typeof cal.notaFinal === "number" ? cal.notaFinal : parseFloat(String(cal.notaFinal || 0));
        const esAprobado = nota >= 51;
        row.values = [
          idx + 1,
          nombreEst,
          cal.materia || "-",
          cal.trimestre || "-",
          Number(cal.ser || 0),
          Number(cal.saber || 0),
          Number(cal.hacer || 0),
          Number(cal.autoevaluacion || 0),
          nota,
          esAprobado ? "Aprobado" : "Reprobado",
        ];
        const celdaNota = row.getCell(9);
        const celdaEstado = row.getCell(10);
        celdaNota.alignment = { horizontal: "center" };
        celdaEstado.alignment = { horizontal: "center" };
        if (esAprobado) {
          celdaNota.font = { bold: true, color: { argb: "FF2E7D32" } };
          celdaEstado.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F5E9" } };
          celdaEstado.font = { bold: true, color: { argb: "FF2E7D32" } };
        } else {
          celdaNota.font = { bold: true, color: { argb: "FFC62828" } };
          celdaEstado.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEBEE" } };
          celdaEstado.font = { bold: true, color: { argb: "FFC62828" } };
        }
        for (let c = 1; c <= 10; c++) {
          const cld = row.getCell(c);
          cld.border = {
            top: { style: "thin", color: { argb: "FFE0E0E0" } },
            bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
            left: { style: "thin", color: { argb: "FFE0E0E0" } },
            right: { style: "thin", color: { argb: "FFE0E0E0" } },
          };
          if (idx % 2 === 1 && c !== 10) {
            cld.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRIS_FONDO } };
          }
        }
        filaIdx++;
      });
    }

    worksheet.columns = [
      { width: 6 },
      { width: 34 },
      { width: 28 },
      { width: 16 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 14 },
      { width: 14 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    const nombreLimpio = curso.replace(/[^a-zA-Z0-9]/g, "_");
    anchor.download = `Reporte_${tipo}_${nombreLimpio}_${new Date().toISOString().split("T")[0]}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      {!soloPdf && (
        <button
          type="button"
          onClick={exportarExcelConEstilos}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <span>📊</span> Descargar Excel
        </button>
      )}
      <button
        type="button"
        onClick={() => window.print()}
        className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
      >
        <span>🖨️</span> Imprimir / Guardar PDF
      </button>
    </div>
  );
}