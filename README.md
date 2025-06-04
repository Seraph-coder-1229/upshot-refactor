# UPSHOT Refactored

## Overview

UPSHOT Refactored is a web application designed for tracking and managing training progression for personnel. It facilitates loading personnel data, processing training completion records (e.g., from SHARP Excel exports), defining and editing syllabi with prerequisites and difficulty, and generating various progress reports and visualizations.

A key feature is its ability to operate completely offline by opening the main `index.html` file directly in a browser. User-specific configurations and syllabi can be persisted by downloading generated `.js` files and placing them in designated local subdirectories.

## Technology Stack

* **Framework:** Vue 3 (Composition API with `<script setup lang="ts">`)
* **State Management:** Pinia
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Build Tool:** Vue CLI
* **Excel Processing:** SheetJS (`xlsx`)
* **Charting:** Chart.js
* **File Saving:** `file-saver`

## Project Directory Structure
upshot-vue-refactor/
├── public/                      # Static assets (favicon, example user files)
│   ├── index.html
│   └── example_app_config.js  # Example structure for app config persistence
│   └── example_syllabi_data.js # Example structure for syllabi persistence
├── src/
│   ├── assets/                  # Static assets processed by build tool (CSS)
│   │   └── css/
│   │       └── tailwind.css
│   ├── components/              # Reusable Vue components
│   │   ├── ui/                  # Generic UI elements (BaseButton, BaseModal, etc.)
│   │   ├── specific/            # Application-specific components
│   │   └── layout/              # Layout components (AppLayout)
│   ├── config/                  # Static, built-in configurations and defaults
│   │   ├── appConfigDefaults.ts
│   │   └── syllabiDefaults.ts
│   ├── core/                    # Core business logic, services (non-Vue specific)
│   │   ├── excelProcessorService.ts
│   │   ├── syllabusLogicService.ts
│   │   ├── trainingLogicService.ts
│   │   ├── reportGeneratorService.ts # Logic to prepare structured data for reports
│   │   └── fileHandlerService.ts
│   ├── stores/                  # Pinia state management stores
│   │   ├── (various .ts files for each data domain: appConfig, syllabi, personnel, progress, ui, flightHours)
│   ├── types/                   # TypeScript interfaces and type definitions
│   │   ├── (various .ts files for each data domain)
│   ├── utils/                   # Generic, reusable utility functions
│   │   ├── dateUtils.ts
│   │   ├── loggingService.ts
│   │   └── (others like arrayUtils, nameMatcher)
│   ├── App.vue                  # Root Vue component
│   └── main.ts                  # App initialization
├── tailwind.config.js           # Or tailwind.config.cjs / .mjs
├── postcss.config.js            # Or postcss.config.cjs / .mjs
├── vue.config.js                # Vue CLI configuration (e.g., publicPath: './')
├── tsconfig.json
└── package.json

## Setup & Running the Project 

**Prerequisites:**
* Node.js (LTS version recommended, e.g., v18, v20, v22)
* npm (v8+) or yarn
* Vue CLI (`@vue/cli`) installed globally (optional, but useful for some commands: `npm install -g @vue/cli`)

**Initial Setup:**
1.  **Clone the repository:**
    ```bash
    git clone <repository-url> upshot-vue-refactor
    cd upshot-vue-refactor
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
    *(The `setup_custom_structure.py` script is a utility for initial scaffolding if starting from a bare Vue CLI project or to recreate the custom directory structure. It's generally not needed after cloning unless specified by the project maintainer for a reset.)*

**Development Server:**
```bash
npm run serve

## Key Features

* **Syllabus Management:** User-defined and editable syllabi (PQS & Events) with prerequisites, difficulty, and waiver options. Supports loading from/downloading to local `user_syllabi.js`.
* **Personnel Management:** Manage lists of upgraders, their start dates, and assigned syllabi. Supports import from/export to user-managed Excel files.
* **Training Record Processing:** Upload and process SHARP Excel reports to track PQS/Event completions. Handles dynamic event columns and infers active ACTC levels.
* **Multi-Position Analysis:** Load and analyze data for multiple positions (Pilot, NFO, EWO, AAW) simultaneously.
* **Progress Tracking & Projections:** Advanced calculations factoring in event difficulty, waivers, and PQS progression rules (e.g., L(X) PQS completion enables L(X+100) PQS start).
* **Reporting & Visualizations:** Generates various reports (squadron summaries, individual feedback, priority lists) and charts (progress curves). Aims to produce structured data for potential LLM-based report generation.
* **User-Editable Application Configuration:** Global settings (e.g., curve deadlines) managed by the user, persistent via a local `user_config.js` file.
* **Flight Hours Module:** Dedicated functionality for tracking pilot flight hours (details TBD based on data source research).
* **Robust Logging & Error Handling:** Comprehensive logging, user-friendly error notifications, and a downloadable debug report for troubleshooting.
* **Offline First:** Designed to be fully functional when `index.html` is opened directly from the filesystem.

## Report Generation

Reports are a core output of UPSHOT. The general workflow is:

1.  **Data Aggregation:** Relevant data is pulled from Pinia stores (`personnelStore`, `progressStore`, `syllabiStore`, `appConfigStore`).
2.  **Structured Data Preparation:** The `src/core/reportGeneratorService.ts` contains functions that take the aggregated data and transform it into well-structured JavaScript objects or arrays. This prepared data is designed to be easily consumable by UI components and, for specific reports like the "Multi-Track Monthly Report," formatted for potential input to an LLM.
3.  **UI Display:** Vue components located in `src/components/specific/reports/` subscribe to the prepared report data (often via a store getter or by triggering an action that uses the `reportGeneratorService`). These components are responsible for rendering the data into user-friendly tables, summaries, or lists using Vue templates and Tailwind CSS.
4.  **Triggering Generation:** Users can trigger report generation through UI elements (e.g., buttons, dropdowns to select report type, personnel, or date ranges). These interactions typically call actions in Pinia stores that orchestrate the data preparation and update the state that report components are watching.

## Offline Usage & Data Persistence

This application is designed to run without an internet connection.

* **Application Files:** Run by opening `dist/index.html`.
* **User-Managed Persistent Data** (`config` and `syllabi` folders next to `index.html`):
    * `./config/user_config.js`: For custom app settings. Create by downloading from app, renaming to `user_config.js`, and placing here.
    * `./syllabi/user_syllabi.js`: For custom syllabi. Create by downloading from app, renaming to `user_syllabi.js`, and placing here.
    * The app loads these on startup if present, otherwise uses internal defaults.
* **Session Data (Uploads):** SHARP training reports and Personnel lists are uploaded per session.

## Help & Contact

A help section/modal within the application will provide:

* Usage instructions and data formatting guidelines for SHARP and Personnel files.
* Troubleshooting tips for common issues.
* Instructions on how to use the configuration and syllabi download/load features.
* Information on how to download the debug log for reporting issues.
* Contact information for the development team.


# UPSHOT Refactored - Development Checklist

## Phase 0: Project Setup & Foundation
* [ ] Create Vue 3 + TypeScript project using Vue CLI (`vue create upshot-vue-refactor`). (Primary Developer)
    * [ ] Select Vue 3, TypeScript, Pinia, Router (optional), Linter.
* [ ] For developers cloning: `git clone ...`, `cd ...`, `npm install`.
* [ ] Add Tailwind CSS (`vue add tailwind` or manual setup).
* [ ] Run Python script `setup_custom_structure.py` *if needed* to ensure custom directory structure. (Primary Developer / Verify on Clone)
* [ ] Install/verify core dependencies: `pinia`, `xlsx`, `file-saver`, `chart.js`, `@types/file-saver`.
* [ ] Manually update/verify `src/main.ts` (Pinia, global CSS, logging, global error handlers).
* [ ] Manually update/verify `src/App.vue` (use `AppLayout`, global UI: notifications, error display, `beforeunload`).
* [ ] Verify/create `vue.config.js` for `publicPath: './'`.
* [ ] Confirm basic app runs (`npm run serve`) and builds for offline (`npm run build`).

## Phase 1: Core Types, Logging & UI Store
* [ ] Finalize and implement TypeScript interfaces in `src/types/`.
    * [ ] `appConfigTypes.ts`
    * [ ] `syllabiTypes.ts` (Syllabus, Requirement - with difficulty, isDefaultWaived)
    * [ ] `personnelTypes.ts` (Upgrader, CompletedItemRecord)
    * [ ] `reportTypes.ts` (Structures for UI display and LLM-compatible output)
    * [ ] `flightHoursTypes.ts` (initial stubs)
    * [ ] `commonTypes.ts` (AppNotification, etc.)
* [ ] Implement `src/utils/loggingService.ts` (including enhanced debug report content).
* [ ] Implement `src/stores/uiStore.ts` (notifications, global loading, critical error display).
* [ ] Implement and integrate `AppNotifications.vue` and `CriticalErrorDisplay.vue`.

## Phase 2: Application Configuration System
* [ ] Implement `src/config/appConfigDefaults.ts`.
* [ ] Implement `src/stores/appConfigStore.ts` (load from `window.UPSHOT_USER_APP_CONFIG` or defaults, download action, dirty flag).
* [ ] Create `src/components/specific/ConfigEditor.vue`.
* [ ] Add UI for "Download App Config" & user instructions for persistence.

## Phase 3: Syllabus Management
* [ ] Implement `src/config/syllabiDefaults.ts`.
* [ ] Implement `src/stores/syllabiStore.ts` (load from `window.UPSHOT_USER_SYLLABI` or defaults, CRUD, download, dirty flag).
* [ ] Develop `src/components/specific/SyllabusManager/` components.
* [ ] Add UI for "Download Syllabi" & user instructions for persistence.
* [ ] (Stretch) Logic for creating new syllabi from SHARP Excel format.

## Phase 4: Personnel Management
* [ ] Implement `src/stores/personnelStore.ts`.
* [ ] Enhance `src/core/excelProcessorService.ts` for Personnel Excel files.
* [ ] Action in `personnelStore.ts` to `loadPersonnelFromFile(file: File)`.
* [ ] Develop `src/components/specific/PersonnelManager/` components.
* [ ] Implement "Download Personnel Data as Excel".
* [ ] Implement `src/utils/nameMatcher.ts`.

## Phase 5: Training Record Processing (SHARP Data)
* [ ] Enhance `excelProcessorService.ts` for SHARP "Date Completed" sheets (dynamic events, ACTC level columns).
* [ ] Implement/Refine `src/stores/progressStore.ts`:
    * [ ] Action `loadAndProcessSharpFile(positionKey: string, file: File)`.
        * [ ] Use `excelProcessorService`, `personnelStore`, `nameMatcher.ts`, `syllabiStore`.
        * [ ] Implement logic for `derivedPqsWorkingLevel` & `derivedEventsWorkingLevel` (including "L(X) PQS complete -> L(X+100) PQS eligible" rule).
        * [ ] Store completion data.
* [ ] UI for uploading SHARP files, specifying `positionKey`.

## Phase 6: Core Calculations & Utilities
* [ ] Fully implement `src/utils/dateUtils.ts`.
* [ ] Implement `src/core/trainingLogicService.ts` (progress metrics, projections, difficulty factoring, priority, readiness).
* [ ] Implement `src/core/syllabusLogicService.ts` (prerequisite resolution, waiver logic).
* [ ] Integrate calls within `progressStore` actions.

## Phase 7: Reports & Visualizations
* [ ] **Define Data Structures for Reports:** Finalize structures in `src/types/reportTypes.ts` for both UI display and LLM-compatible JSON output.
* [ ] **Implement `src/core/reportGeneratorService.ts`:**
    * [ ] Function to generate `LLMMultiTrackMonthlyReport` data.
    * [ ] Functions for other specific reports (priority, individual summary, training plans), returning structured data.
* [ ] **Develop Vue Report Components** in `src/components/specific/reports/`:
    * [ ] Components to consume structured data from `reportGeneratorService` (via stores) and render it.
    * [ ] Examples: `SummaryReportView.vue`, `IndividualReportView.vue`, `MultiTrackMonthlyDisplay.vue`.
* [ ] **Implement UI for Report Generation:**
    * [ ] Controls for users to select report types, relevant personnel/positions/levels, date ranges.
    * [ ] Buttons to trigger report generation and display.
    * [ ] Option to "Download Report Data for LLM" (downloads the JSON from `reportGeneratorService`).
* [ ] Develop Vue chart components in `src/components/specific/charts/` (e.g., `ProgressChart.vue`) using Chart.js.

## Phase 8: Flight Hours Module
* [ ] (Pending details on data source from user)
* [ ] Define types in `src/types/flightHoursTypes.ts`.
* [ ] Implement `src/stores/flightHoursStore.ts`.
* [ ] Add Excel parsing for flight hours to `excelProcessorService.ts`.
* [ ] Implement calculation logic.
* [ ] Create UI components in `src/components/specific/flightHours/`.

## Phase 9: UI Finalization & Support Features
* [ ] Implement `src/components/ui/BaseTooltip.vue` (or chosen solution) and apply widely.
* [ ] Create `HelpModal.vue` or `HelpView.vue` with content and contact info.
* [ ] Add "Help" button/link to `AppLayout.vue`.
* [ ] Thorough UI/UX review.

## Phase 10: Testing & Deployment Preparation
* [ ] Comprehensive testing.
* [ ] Rigorous offline functionality testing.
* [ ] Test user-managed file loading (`user_config.js`, `user_syllabi.js`).
* [ ] Test error handling and log export.
* [ ] Prepare final user instructions.