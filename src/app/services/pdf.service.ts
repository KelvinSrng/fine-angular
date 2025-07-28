import { Injectable } from '@angular/core';
import { Schedule, Teacher, Classroom } from './data.service';
import { AuthService } from './auth.service';

// Import jsPDF with proper typing
declare var jsPDF: any;

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  constructor(private authService: AuthService) {}

  async generateSchedulePDF(schedules: Schedule[], title: string = 'Horarios'): Promise<void> {
    // Dynamic import to avoid build issues
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();
    const user = this.authService.getCurrentUser();
    const currentDate = new Date().toLocaleDateString('es-ES');

    // Header
    pdf.setFontSize(18);
    pdf.text('Sistema de Distribución de Carga Horaria', 20, 20);
    
    pdf.setFontSize(14);
    pdf.text(title, 20, 35);
    
    pdf.setFontSize(10);
    pdf.text(`Generado por: ${user?.name || 'Usuario'}`, 20, 50);
    pdf.text(`Fecha de exportación: ${currentDate}`, 20, 60);

    // Table header
    let yPosition = 80;
    pdf.setFontSize(12);
    pdf.text('Día', 20, yPosition);
    pdf.text('Hora', 60, yPosition);
    pdf.text('Aula', 100, yPosition);
    pdf.text('Docente', 130, yPosition);
    pdf.text('Paralelo', 170, yPosition);

    // Table content
    yPosition += 10;
    pdf.setFontSize(10);
    
    schedules.forEach((schedule, index) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.text(schedule.dia, 20, yPosition);
      pdf.text(`${schedule.hora_inicio}-${schedule.hora_fin}`, 60, yPosition);
      pdf.text(schedule.aula, 100, yPosition);
      pdf.text(schedule.docente, 130, yPosition);
      pdf.text(schedule.paralelo, 170, yPosition);
      
      yPosition += 10;
    });

    // Save PDF
    const fileName = `${title.replace(/\s+/g, '_')}_${currentDate.replace(/\//g, '-')}.pdf`;
    pdf.save(fileName);
  }

  async generateReportFromElement(elementId: string, fileName: string): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found');
      return;
    }

    try {
      // Dynamic import to avoid build issues
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback: show alert with instructions
      alert('Para generar el PDF, por favor instale las dependencias necesarias o use la función de impresión del navegador.');
    }
  }

  // Alternative method using browser's print functionality
  printElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Reporte de Horarios</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 30px; }
              @media print { 
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${element.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }
}