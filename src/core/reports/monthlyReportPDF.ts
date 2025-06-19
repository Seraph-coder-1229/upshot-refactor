import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { MonthlyReportData } from "@/types/reportTypes";
import { formatUtcDateToDisplay } from "@/utils/dateUtils";

export function generateMonthlyReportPdf(report: MonthlyReportData): void {
  const doc = new jsPDF();
  const reportDate = formatUtcDateToDisplay(new Date());
  const startDate = formatUtcDateToDisplay(report.startDate);

  // Header
  doc.setFontSize(18);
  doc.text("Monthly Training Report", 14, 22);
  doc.setFontSize(11);
  doc.text(`Report for period: ${startDate} to ${reportDate}`, 14, 30);

  // Summary Stats
  const summary = report.summaryStats;
  const summaryText = `
    Track Health: ${summary.trackHealthPercentage.toFixed(0)}% (${
    summary.upgradersOnTrack
  }/${summary.totalUpgraders} On Track)
    Average Cost Factor: ${summary.averageCostFactor.toFixed(2)}
    Items needed for Ideal Pace: ${
      summary.totalEventsNeededThisMonth
    } Events / ${summary.totalPqsNeededThisMonth} PQS
  `;
  doc.setFontSize(10);
  doc.text(summaryText, 14, 40);

  // Priority Task Tables
  let startY = 65;

  if (report.priorityTasks.pqs.length > 0) {
    doc.setFontSize(12);
    doc.text("PQS Priorities", 14, startY);
    autoTable(doc, {
      startY: startY + 2,
      head: [["Task", "Upgrader", "Score"]],
      body: report.priorityTasks.pqs.map((t) => [
        t.displayName,
        t.upgraderName,
        t.priorityScore.toFixed(0),
      ]),
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185] },
    });
    startY = (doc as any).lastAutoTable.finalY + 10;
  }

  if (report.priorityTasks.events.length > 0) {
    doc.setFontSize(12);
    doc.text("Event Priorities", 14, startY);
    autoTable(doc, {
      startY: startY + 2,
      head: [["Task", "Upgrader", "Score"]],
      body: report.priorityTasks.events.map((t) => [
        t.displayName,
        t.upgraderName,
        t.priorityScore.toFixed(0),
      ]),
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185] },
    });
  }

  doc.save(`Monthly_Report_${reportDate}.pdf`);
}
