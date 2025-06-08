import {
  createRouter,
  createWebHashHistory,
  type RouteRecordRaw,
} from "vue-router";
// Import your new views
import DashboardView from "../views/DashboardView.vue";
import AppSettingsView from "../views/AppSettingsView.vue";
import SyllabusManagementView from "../views/SyllabusManagementView.vue";
import SyllabusEditView from "@/views/SyllabusEditView.vue";
import HelpView from "../views/HelpView.vue";
import PersonnelView from "../views/PersonnelView.vue";

// You can lazy-load other views if they are large or not immediately needed
// For now, direct imports are fine for simplicity during setup.

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "dashboard",
    component: DashboardView,
  },
  {
    path: "/settings",
    name: "settings",
    // Example of direct import if you created AppSettingsView.vue
    component: AppSettingsView,
  },
  {
    path: "/syllabi",
    name: "syllabi",
    component: SyllabusManagementView,
  },
  {
    path: "/syllabi/edit/:id", // Uses a dynamic parameter for the syllabus ID
    name: "SyllabusEdit",
    component: SyllabusEditView,
    props: true, // This allows the :id to be passed as a prop, which can be useful
  },
  {
    path: "/personnel",
    name: "personnel",
    component: PersonnelView,
  },
  // {
  //   path: "/import",
  //   name: "import",
  //   component: () =>
  //     import(/* webpackChunkName: "import" */ "src/views/DataImportView.vue"),
  // },
  // {
  //   path: "/reports",
  //   name: "reports",
  //   component: () =>
  //     import(/* webpackChunkName: "reports" */ "../views/ReportsView.vue"),
  // },
  // {
  //   path: "/flight-hours",
  //   name: "flightHours",
  //   component: () =>
  //     import(
  //       /* webpackChunkName: "flightHours" */ "src/views/FlightHoursView.vue"
  //     ),
  // },
  {
    path: "/help",
    name: "help",
    component: HelpView,
  },
  // Remove or comment out the old '/about' route if not used
  // {
  //   path: '/about',
  //   name: 'about',
  //   component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  // }
];

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL), // process.env.BASE_URL is good practice
  routes,
});

export default router;
