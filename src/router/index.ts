// src/router/index.ts

import { createRouter, createWebHistory } from "vue-router";
import DashboardView from "../views/DashboardView.vue";

// Report Views
import ReportsView from "../views/ReportsView.vue";
import IndividualReportListView from "../views/IndividualReportListView.vue";
import TrackReportView from "../views/TrackReportView.vue";
import MonthlyReportView from "../views/MonthlyReportView.vue";
import LlmReportView from "../views/LlmReportView.vue";
import StudentDetailView from "../views/StudentDetailView.vue";

// Settings & Syllabus Views
import SettingsSyllabiView from "../views/SettingsSyllabiView.vue"; // Renamed from SettingsSyllabiView
import SyllabusManagementView from "../views/SyllabusManagementView.vue";
import SyllabusUploadView from "../views/SyllabusUploadView.vue";
import SyllabusUploadConfirmation from "../components/specific/SyllabusManager/SyllabusUploadConfirmation.vue";
import SyllabusEditView from "../views/SyllabusEditView.vue";
import AppSettingsView from "../views/AppSettingsView.vue";
// Other Main Views
import PersonnelUploadView from "../views/PersonnelUploadView.vue";
import TrainingUploadView from "../views/TrainingUploadView.vue";
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

  // Report Routes
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

  // Settings & Syllabus Routes
  { path: "/settings", name: "Settings", component: SettingsSyllabiView },
  {
    path: "/syllabi",
    name: "SyllabusManagement",
    component: SyllabusManagementView,
  },
  {
    path: "/settings/app",
    name: "App Config",
    component: AppSettingsView,
  },
  {
    path: "/syllabi/confirm",
    name: "SyllabusConfirm",
    component: SyllabusUploadConfirmation,
  },
  {
    path: "/syllabi/edit/:id",
    name: "SyllabusEdit",
    component: SyllabusEditView,
    props: true,
  },

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
