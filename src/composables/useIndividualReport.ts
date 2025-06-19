// src/composables/useIndividualReport.ts

import { ref, computed, onMounted } from "vue";
import { generateAndDownloadIndividualReportPdf } from "@/core/reports/individualUpgraderPDFreport";
import type { IndividualReport } from "@/types/reportTypes";
import { ReadinessStatus } from "@/types/personnelTypes";
import { formatUtcDateToDisplay } from "@/utils/dateUtils";
import {
  ScaleIcon,
  ClockIcon,
  RocketLaunchIcon,
  ChartPieIcon,
} from "@heroicons/vue/24/outline";
import { generateIndividualReport } from "@/core/reportGeneratorService";
import { loggingService } from "@/utils/loggingService";

export function useIndividualReport(upgraderId: string) {
  const report = ref<IndividualReport | null>(null);
  const isLoading = ref(true);

  onMounted(async () => {
    isLoading.value = true;
    report.value = generateIndividualReport(upgraderId);
    isLoading.value = false;
  });

  const summaryNarrative = computed(() => {
    if (!report.value) return "";
    const { upgrader, summary } = report.value;
    const pacing = summary.pacingAgainstDeadlineDays;
    const pacingText =
      pacing >= 0
        ? `${pacing} days ahead of`
        : `${Math.abs(pacing)} days behind`;
    return `${upgrader.displayName} is currently rated as ${summary.readinessAgainstDeadline}. They are pacing ${pacingText} schedule to meet their deadline.`;
  });
  const summaryStats = computed(() => {
    if (!report.value) return [];
    const { summary, upgrader } = report.value;
    return [
      {
        name: "Readiness Status",
        value: summary.readinessAgainstDeadline,
        icon: ScaleIcon,
        color: readinessColorClass(summary.readinessAgainstDeadline),
      },
      {
        name: "Pacing (Deadline)",
        value: `${summary.pacingAgainstDeadlineDays ?? "N/A"} days`,
        icon: ClockIcon,
        color:
          (summary.pacingAgainstDeadlineDays ?? 0) < 0
            ? "text-red-600"
            : "text-green-600",
      },
      {
        name: "Projected Completion",
        value: formatUtcDateToDisplay(summary.projectedCompletionDate),
        icon: RocketLaunchIcon,
        color: "text-gray-900",
      },
      {
        name: "Overall Progress",
        value: `${(
          ((upgrader.pqsProgressPercentage ?? 0) +
            (upgrader.eventsProgressPercentage ?? 0)) /
          2
        ).toFixed(0)}%`,
        icon: ChartPieIcon,
        color: "text-gray-900",
      },
    ];
  });
  const readinessColorClass = (status: ReadinessStatus) => {
    switch (status) {
      case ReadinessStatus.OnTrack:
        return "text-green-600 font-semibold";
      case ReadinessStatus.AtRisk:
        return "text-yellow-600 font-semibold";
      case ReadinessStatus.BehindSchedule:
        return "text-red-600 font-semibold";
      case ReadinessStatus.Blocked:
        return "text-red-800 font-bold";
      default:
        return "text-gray-900 font-semibold";
    }
  };

  // The downloadPdf function is now just a simple wrapper
  const downloadPdf = () => {
    if (report.value) {
      generateAndDownloadIndividualReportPdf(report.value);
    } else {
      loggingService.logError("No report available to generate PDF.");
    }
  };

  return {
    report,
    isLoading,
    summaryNarrative,
    summaryStats,
    readinessColorClass,
    downloadPdf, // Expose the new simplified function
  };
}
