import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Chart from "chart.js/auto";
import { formatUtcDateToDisplay } from "@/utils/dateUtils";
import { RequirementType, type Syllabus } from "@/types/syllabiTypes";
import type { Upgrader } from "@/types/personnelTypes";
import {
  type TrackReportPdfData,
  type ProgressDataPoint,
} from "@/types/reportTypes";
import { calculateProgressHistory } from "../reportGeneratorService"; // Import the correct, existing function
import { useAppConfigStore } from "@/stores/appConfigStore";

function generateColor(index: number, alpha = 1): string {
  const colors = [
    `rgba(59, 130, 246, ${alpha})`, // blue
    `rgba(16, 185, 129, ${alpha})`, // green
    `rgba(239, 68, 68, ${alpha})`, // red
    `rgba(245, 158, 11, ${alpha})`, // amber
    `rgba(139, 92, 246, ${alpha})`, // violet
    `rgba(236, 72, 153, ${alpha})`, // pink
    `rgba(20, 184, 166, ${alpha})`, // teal
    `rgba(99, 102, 241, ${alpha})`, // indigo
  ];
  return colors[index % colors.length];
}
/**
 * Internal helper to create a line chart image for the PDF, now correctly
 * plotting each upgrader as a separate line alongside the goal curves.
 * This function is modeled directly on the individual report's chart generator.
 */
function _createTrackLevelChartImage(
  upgraders: Upgrader[],
  syllabus: Syllabus,
  chartType: RequirementType,
  level: string
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 450; // Increased height for better legend spacing

    // --- Generate Datasets ---
    const datasets: any[] = [];
    let goalLinesGenerated = false;

    // For each upgrader, calculate their history and add it as a dataset
    upgraders.forEach((u, index) => {
      const history = calculateProgressHistory(
        u,
        syllabus,
        useAppConfigStore().config
      );
      const progressData =
        chartType === RequirementType.PQS
          ? history.pqsHistory
          : history.eventsHistory;

      // Add each upgrader as a thin, semi-transparent line
      datasets.push({
        label: u.displayName,
        data: progressData.progress,
        borderColor: generateColor(index), // Subtle blue
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0.1,
      });

      // Use the goal lines from the first upgrader for the chart background
      if (!goalLinesGenerated) {
        datasets.push({
          label: "Squadron Target",
          data: progressData.target,
          borderColor: "rgba(234, 179, 8, 0.7)",
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        });
        datasets.push({
          label: "Wing Deadline",
          data: progressData.deadline,
          borderColor: "rgba(231, 76, 60, 0.7)",
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        });
        goalLinesGenerated = true;
      }
    });

    // --- Create Chart ---
    new Chart(canvas, {
      type: "line",
      data: { datasets },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          title: {
            display: true,
            text: `${chartType} Progress - Level ${level}`,
            font: { size: 16 },
          },
          legend: {
            display: true,
            position: "top",
          },
        },
        scales: {
          x: {
            type: "linear",
            title: { display: true, text: "Days In Training" },
            min: 0,
          },
          y: {
            title: { display: true, text: "Completion %" },
            min: 0,
            max: 100,
          },
        },
      },
    });

    setTimeout(() => {
      resolve(canvas.toDataURL("image/png"));
    }, 500); // Delay to ensure full render
  });
}

/**
 * Generates the Track Report PDF with all requested components.
 */
export async function generateTrackReportPdf(
  data: TrackReportPdfData,
  syllabus: Syllabus
): Promise<void> {
  const doc = new jsPDF();
  const reportDate = formatUtcDateToDisplay(new Date());

  // --- Page 1: Summary Tables ---
  doc.setFontSize(18);
  doc.text(`Track Report: ${data.selectedPosition}`, 14, 22);
  doc.setFontSize(11);
  doc.text(`Generated on: ${reportDate}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [["Track Health Summary", "Count"]],
    body: [
      ["Total Upgraders", data.healthSummary.total],
      ["Behind Schedule", data.healthSummary.behind],
      ["At Risk", data.healthSummary.atRisk],
      ["Blocked", data.healthSummary.blocked],
      ["Ready for Next Level", data.healthSummary.readyForNext],
    ],
    theme: "grid",
  });

  const startY = (doc as any).lastAutoTable.finalY + 10;

  if (data.priorityUpgraders.length > 0) {
    doc.setFontSize(12);
    doc.text("Top Priority Students", 14, startY);
    autoTable(doc, {
      startY: startY + 2,
      head: [["Upgrader", "Status", "Pacing (Days)"]],
      body: data.priorityUpgraders.map((u) => [
        u.displayName,
        u.readinessAgainstDeadline ?? "Unknown", // Fix for the TypeScript error
        u.pacingAgainstDeadlineDays ?? "N/A",
      ]),
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185] },
    });
  }

  // --- Generate and Add Charts ---
  const levelsToChart = ["200", "300"];

  for (const level of levelsToChart) {
    const upgradersForLevel = data.filteredUpgraders.filter(
      (u) => u.derivedPqsWorkingLevel === level
    );

    if (upgradersForLevel.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text(`Level ${level} Charts`, 14, 20);

      // PQS Chart
      const pqsChartUrl = await _createTrackLevelChartImage(
        upgradersForLevel,
        syllabus,
        RequirementType.PQS,
        level
      );
      doc.addImage(pqsChartUrl, "PNG", 15, 30, 180, 100);

      // Events Chart
      const eventsChartUrl = await _createTrackLevelChartImage(
        upgradersForLevel,
        syllabus,
        RequirementType.Event,
        level
      );
      doc.addImage(eventsChartUrl, "PNG", 15, 140, 180, 100);
    }
  }

  doc.save(`Track_Report_${data.selectedPosition}_${reportDate}.pdf`);
}
