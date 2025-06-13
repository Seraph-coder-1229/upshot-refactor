// src/router/index.ts

import { createRouter, createWebHistory } from "vue-router";
import DashboardView from "../views/DashboardView.vue";

// Report Views
import ReportsView from "../views/ReportsView.vue"; // This is the new dashboard
import IndividualReportListView from "../views/IndividualReportListView.vue";
import TrackReportView from "../views/TrackReportView.vue"; // The old reports view, now for tracks
import MonthlyReportView from "../views/MonthlyReportView.vue";
import LlmReportView from "../views/LlmReportView.vue";
import StudentDetailView from "../views/StudentDetailView.vue";

// Other Main Views
import PersonnelUploadView from "../views/PersonnelUploadView.vue";
import TrainingUploadView from "../views/TrainingUploadView.vue";
import SettingsSyllabiView from "../views/SettingsSyllabiView.vue";
import HelpView from "../views/HelpView.vue";
import LogsView from "../views/LogsView.vue";

const routes = [
  { path: "/", name: "Dashboard", component: DashboardView },
  {
    path: "/personnel-upload",
    name: "PersonnelUpload",
    component: PersonnelUploadView,
  },
  {
    path: "/training-upload",
    name: "TrainingUpload",
    component: TrainingUploadView,
  },

  // New Nested Report Routes
  { path: "/reports", name: "Reports", component: ReportsView },
  {
    path: "/reports/individual",
    name: "IndividualReportList",
    component: IndividualReportListView,
  },
  { path: "/reports/track", name: "TrackReport", component: TrackReportView },
  {
    path: "/reports/monthly",
    name: "MonthlyReport",
    component: MonthlyReportView,
  },
  { path: "/reports/llm", name: "LlmReport", component: LlmReportView },

  {
    path: "/student/:id",
    name: "StudentDetail",
    component: StudentDetailView,
    props: true,
  },

  { path: "/settings", name: "Settings", component: SettingsSyllabiView },
  { path: "/help", name: "Help", component: HelpView },
  { path: "/logs", name: "Logs", component: LogsView },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
