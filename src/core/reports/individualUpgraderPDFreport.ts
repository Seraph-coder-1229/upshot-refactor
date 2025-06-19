// src/core/pdfGeneratorService.ts

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Chart from "chart.js/auto";
import {
  type IndividualReport,
  type ProgressDataPoint,
} from "@/types/reportTypes";
import { RequirementType } from "@/types/syllabiTypes";
import { formatUtcDateToDisplay } from "@/utils/dateUtils";

type goalLines = ProgressDataPoint[][];
/**
 * Internal helper to create a line chart image for the PDF.
 */
function _createChartImage(
  report: IndividualReport,
  chartData: ProgressDataPoint[],
  goalLines: goalLines,
  chartType: RequirementType
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.style.display = "none";
    document.body.appendChild(canvas);

    canvas.width = 800;
    canvas.height = 400;

    const title =
      chartType === RequirementType.PQS
        ? `${report.upgrader.derivedPqsWorkingLevel} PQS Progress`
        : `${report.upgrader.derivedEventsWorkingLevel} Event Progress`;

    new Chart(canvas, {
      type: "line",
      data: {
        datasets: [
          {
            label: "Squadron Target",
            data: goalLines[0],
            borderColor: "rgba(234, 179, 8, 0.7)",
            borderDash: [5, 5],
            pointRadius: 0,
            fill: true,
            tension: 0.1,
          },
          {
            label: "Wing Deadline",
            data: goalLines[1],
            borderColor: "rgba(220, 38, 38, 0.7)", // red-600
            borderDash: [10, 5],
            pointRadius: 0,
            fill: false,
            borderWidth: 2,
          },
          {
            label: "% Progress",
            data: chartData,
            borderColor:
              chartType === RequirementType.PQS
                ? "rgb(54, 162, 235)"
                : "rgb(255, 99, 132)",
            fill: true,
            tension: 0.1,
          },
        ],
      },
      options: {
        animation: false,
        scales: {
          x: {
            type: "linear",
            title: { display: true, text: "Months Since Start Date" },
          },
          y: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: "Progress (%)" },
          },
        },
        plugins: { title: { display: true, text: title } },
      },
    });

    requestAnimationFrame(() => {
      resolve(canvas.toDataURL("image/png"));
      document.body.removeChild(canvas);
    });
  });
}

/**
 * Generates and triggers a download for the Individual Report PDF.
 * @param report The fully generated IndividualReport object.
 */
export async function generateAndDownloadIndividualReportPdf(
  report: IndividualReport
): Promise<void> {
  const doc = new jsPDF();
  const upgrader = report.upgrader;
  const today = new Date().toLocaleDateString();

  doc.setFontSize(10);
  doc.text("UPSHOT", 15, 15);
  doc.text(
    "Upgrader Performance Report",
    doc.internal.pageSize.getWidth() / 2,
    15,
    { align: "center" }
  );
  doc.text(
    `Report Generated: ${today}`,
    doc.internal.pageSize.getWidth() - 15,
    15,
    { align: "right" }
  );
  doc.line(15, 18, doc.internal.pageSize.getWidth() - 15, 18);

  // --- Identification Table ---
  doc.setFontSize(12);
  doc.setFont("bold");
  doc.text("Upgrader Identification", 15, 30);
  autoTable(doc, {
    startY: 34,
    body: [
      ["Rank", upgrader.rank ?? "N/A"],
      ["Name", upgrader.displayName],
      ["Assigned Position", upgrader.assignedPosition],
      ["Syllabus Year", upgrader.assignedSyllabusYear],
      ["Readiness Status", upgrader.readinessAgainstDeadline ?? "Unknown"],
    ],
    theme: "plain",
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: "auto" },
    },
  });

  // --- Status Table ---
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [["Overall Status"]],
    body: [
      [
        `Pacing (Deadline): ${
          upgrader.pacingAgainstDeadlineDays ?? "N/A"
        } days`,
        `Projected Completion: ${formatUtcDateToDisplay(
          upgrader.projectedTotalCompletionDate
        )}`,
      ],
      [`Cost Factor: ${upgrader.costFactor ?? "N/A"}`, ""],
    ],
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185] },
  });

  // --- Priority Tasks Table ---
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [["Priority Tasks", "Type", "Unlocks"]],
    body: report.priorityTasks
      .slice(0, 5)
      .map((task) => [task.displayName, task.type, task.unlocks]),
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185] },
  });

  const squadronGoal = report.pqsProgressHistory.pqsHistory.target;
  const deadline = report.pqsProgressHistory.pqsHistory.deadline;
  // --- Charts ---
  if (
    report.pqsProgressHistory.pqsHistory.progress.length > 0 &&
    report.pqsProgressHistory.eventsHistory.progress.length > 0
  ) {
    const pqsChartDataUrl = await _createChartImage(
      report,
      report.pqsProgressHistory.pqsHistory.progress,
      [squadronGoal, deadline],
      RequirementType.PQS
    );
    const eventChartDataUrl = await _createChartImage(
      report,
      report.pqsProgressHistory.eventsHistory.progress,
      [squadronGoal, deadline],
      RequirementType.Event
    );

    doc.addPage();
    doc.setFontSize(14);
    doc.text("PQS Progress Graph", 15, 20);
    doc.addImage(pqsChartDataUrl, "PNG", 15, 25, 180, 80);

    doc.text("Event Progress Graph", 15, 125);
    doc.addImage(eventChartDataUrl, "PNG", 15, 130, 180, 80);
  }

  // --- Footer ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`${upgrader.displayName}_Report.pdf`);
}
