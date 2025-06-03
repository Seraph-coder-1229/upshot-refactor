import os

# Directories to create within src (relative to src/)
# Adjusted to avoid creating 'src' itself or 'public'
src_sub_directories = [
    "assets/css", # Vue CLI might create assets, css might be new
    "components/ui",
    "components/specific/ConfigEditor",
    "components/specific/SyllabusManager",
    "components/specific/PersonnelManager",
    "components/specific/UpgraderProgress",
    "components/specific/reports",
    "components/specific/charts",
    "components/specific/flightHours",
    "components/layout",
    "config",
    "core",
    "stores",
    "types",
    "utils"
]

# Placeholder files to create (path relative to project root)
# For files Vue CLI might create (like tailwind/postcss/vue.config.js),
# we only create them if they DON'T exist.
placeholder_files = {
    # Public examples (user will place these manually if they use them)
    "public/example_app_config.js": "// Example: window.UPSHOT_USER_APP_CONFIG = { version: 1, ... };",
    "public/example_syllabi_data.js": "// Example: window.UPSHOT_USER_SYLLABI = [ { ... } ];",

    # Src structure
    "src/assets/css/tailwind.css": "@import \"tailwindcss\";\n\n/* Your custom base styles or components here */",
    "src/components/ui/.gitkeep": "", # Ensures the directory is created
    "src/components/specific/ConfigEditor/ConfigEditor.vue": "<template>\n  <div>Config Editor</div>\n</template>\n<script setup lang=\"ts\"></script>",
    "src/components/layout/AppLayout.vue": "<template>\n  <div class=\"app-layout\">\n    <header class=\"p-4 bg-gray-700 text-white\">\n      \n      <h1>UPSHOT Application</h1>\n    </header>\n    <main class=\"p-4\">\n      \n      <slot></slot>\n    </main>\n    <footer class=\"p-4 bg-gray-200 text-center\">\n      \n      <p>&copy; UPSHOT Refactored</p>\n    </footer>\n  </div>\n</template>\n<script setup lang=\"ts\"></script>",
    "src/config/appConfigDefaults.ts": "import { type AppConfig } from '../types/appConfigTypes';\n\nexport const defaultConfig: AppConfig = {\n  version: 1,\n  curveDeadlines: { defaultPqs: { targetMonths: 12, deadlineMonths: 18 }, defaultEvents: { targetMonths: 6, deadlineMonths: 9 } },\n  isRoundStartDateFixed: false,\n  fixedRoundStartDate: null,\n};",
    "src/config/syllabiDefaults.ts": "import { type Syllabus } from '../types/syllabiTypes';\n\nexport const defaultSyllabi: Syllabus[] = [\n  // ... your default syllabi structure if any\n];",
    "src/core/excelProcessorService.ts": "// Excel parsing logic for SHARP, Personnel files",
    "src/core/syllabusLogicService.ts": "// Syllabus specific logic, e.g., prerequisite resolution, waiver checks",
    "src/core/trainingLogicService.ts": "// Core calculations for progress, projections, difficulty factoring",
    "src/core/reportGeneratorService.ts": "// Logic to prepare structured data for reports and LLMs",
    "src/core/fileHandlerService.ts": "// File download/upload helpers (wrappers for FileSaver.js, etc.)",
    "src/stores/appConfigStore.ts": "import { defineStore } from 'pinia';\nimport { type AppConfig } from '../types/appConfigTypes';\nimport { defaultConfig } from '../config/appConfigDefaults';\nimport { loggingService } from '../utils/loggingService';\n\ndeclare global {\n  interface Window {\n    UPSHOT_USER_APP_CONFIG?: AppConfig;\n  }\n}\n\nfunction getInitialConfig(): AppConfig { /* ... load from window or defaults ... */ return defaultConfig; }\n\nexport const useAppConfigStore = defineStore('appConfig', {\n  state: () => ({ currentConfig: getInitialConfig(), isDirty: false, lastLoadedConfigSnapshot: '' }),\n  actions: { /* ... */ }\n});",
    "src/stores/syllabiStore.ts": "import { defineStore } from 'pinia';\nimport { type Syllabus } from '../types/syllabiTypes';\n\ndeclare global {\n  interface Window {\n    UPSHOT_USER_SYLLABI?: Syllabus[];\n  }\n}\n\nexport const useSyllabiStore = defineStore('syllabi', {\n  state: () => ({ syllabi: [] as Syllabus[], isLoading: false }),\n  actions: { /* ... */ }\n});",
    "src/stores/personnelStore.ts": "import { defineStore } from 'pinia';\nimport { type Upgrader } from '../types/personnelTypes';\n\nexport const usePersonnelStore = defineStore('personnel', {\n  state: () => ({ allPersonnel: [] as Upgrader[] }),\n  actions: { /* ... */ }\n});",
    "src/stores/progressStore.ts": "import { defineStore } from 'pinia';\n\nexport const useProgressStore = defineStore('progress', {\n  state: () => ({ /* ... */ }),\n  actions: { /* ... */ }\n});",
    "src/stores/flightHoursStore.ts": "import { defineStore } from 'pinia';\n\nexport const useFlightHoursStore = defineStore('flightHours', {\n  state: () => ({ /* ... */ }),\n  actions: { /* ... */ }\n});",
    "src/stores/uiStore.ts": "import { defineStore } from 'pinia';\nimport { type AppNotification } from '../types/commonTypes';\n\nexport const useUiStore = defineStore('ui', {\n  state: () => ({ notifications: [] as AppNotification[], isLoading: false, criticalError: null as Error | null, criticalErrorMessage: '' }),\n  actions: { /* ... */ }\n});",
    "src/types/commonTypes.ts": "export interface AppNotification { id: number; message: string; type: 'info' | 'success' | 'warning' | 'error'; duration?: number; }\n// Other common types",
    "src/types/appConfigTypes.ts": "export interface CurveDeadlineSetting { targetMonths: number; deadlineMonths: number; }\nexport interface AppConfig { version: number; curveDeadlines: { [key: string]: CurveDeadlineSetting }; isRoundStartDateFixed: boolean; fixedRoundStartDate: string | null; /* ... */ }",
    "src/types/syllabiTypes.ts": "export interface Requirement { id: string; name: string; displayName: string; prerequisites: string[]; difficulty?: number; isDefaultWaived?: boolean; }\nexport interface Syllabus { id: string; title: string; position: string; level: number; year: string; type: 'pqs' | 'events'; requirements: Requirement[]; wingGoalMonths: number; squadronGoalMonths: number; /* ... */ }",
    "src/types/personnelTypes.ts": "export interface CompletedItemRecord { requirementName: string; completionDate: Date; instructor?: string; }\nexport interface Upgrader { id: string; sharpName: string; displayName: string; startDate: Date; assignedSyllabus: { position: string; level: number; year: string; }; pqsCompleted: CompletedItemRecord[]; eventsCompleted: CompletedItemRecord[]; derivedPqsWorkingLevel?: number; derivedEventsWorkingLevel?: number; /* ... */ }",
    "src/types/reportTypes.ts": "// Types for structured report data (LLM output, etc.)",
    "src/types/flightHoursTypes.ts": "// Types specific to flight hours module",
    "src/utils/dateUtils.ts": "// Date utility functions (Excel to JS, diffs, formatting)",
    "src/utils/arrayUtils.ts": "export function unique<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }",
    "src/utils/loggingService.ts": "// Logging service implementation (based on previous discussions)",
    "src/utils/nameMatcher.ts": "// Logic for matching inconsistent names (e.g., fuzzy matching)",

    # Config files - create only if they don't exist
    "tailwind.config.js": ("/** @type {import('tailwindcss').Config} */\nexport default {\n  content: [\n    \"./index.html\",\n    \"./src/**/*.{vue,js,ts,jsx,tsx}\",\n  ],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n}", True), # True means check existence
    "postcss.config.js": ("export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}", True),
    "vue.config.js": ("module.exports = {\n  publicPath: './',\n  transpileDependencies: []\n};", True),
}

def create_project_enhancements():
    print("Starting to enhance project structure...")

    # Create src subdirectories
    base_src_path = "src" # Assumes script is run from project root where src exists
    if not os.path.exists(base_src_path):
        print(f"Error: 'src' directory not found. Make sure you run this script from the root of your Vue CLI project.")
        return

    for dir_path_suffix in src_sub_directories:
        full_path = os.path.join(base_src_path, dir_path_suffix.replace('/', os.sep))
        if not os.path.exists(full_path):
            os.makedirs(full_path)
            print(f"Created directory: {full_path}")
        # Add a .gitkeep to truly empty subdirectories if necessary
        if not any(f.startswith(full_path.replace(base_src_path + os.sep, 'src' + os.sep , 1)) for f in placeholder_files.keys()) and (not os.listdir(full_path) if os.path.exists(full_path) else True) :
             if os.path.exists(full_path): # Ensure directory exists before placing .gitkeep
                with open(os.path.join(full_path, ".gitkeep"), 'w') as f:
                    pass

    # Create placeholder files
    for file_path_str, file_info in placeholder_files.items():
        content = file_info
        check_exists = False
        if isinstance(file_info, tuple):
            content, check_exists = file_info

        full_file_path = file_path_str.replace('/', os.sep) # Path is already relative to project root

        # Ensure parent directory exists for the file
        parent_dir_for_file = os.path.dirname(full_file_path)
        if parent_dir_for_file and not os.path.exists(parent_dir_for_file):
            os.makedirs(parent_dir_for_file)
            # print(f"Created directory for file: {parent_dir_for_file}") # Can be verbose

        if check_exists and os.path.exists(full_file_path):
            print(f"File {full_file_path} already exists, skipping. Please review/merge manually.")
            continue
        
        if not os.path.exists(full_file_path):
            with open(full_file_path, 'w') as f:
                f.write(content.strip() + '\n') # Add a newline for cleaner files
            print(f"Created file: {full_file_path}")
        elif not check_exists: # If not checking and it exists, it implies an overwrite is intended for non-config files
            with open(full_file_path, 'w') as f:
                f.write(content.strip() + '\n')
            print(f"Overwrote file: {full_file_path} (as it's not a config file marked for skip-if-exists)")


    print("\nCustom project structure enhancements applied!")
    print("Please review and manually integrate changes into Vue CLI generated files like:")
    print("- src/main.ts (to initialize Pinia, logging, global error handlers, import global CSS)")
    print("- src/App.vue (to use AppLayout and potentially manage views or global components like notifications)")
    print("You may also need to install dependencies like pinia, xlsx, file-saver if not already added during `vue create`.")

if __name__ == "__main__":
    if not os.path.exists("package.json") or not os.path.exists("src"):
        print("ERROR: This script should be run from the root directory of a Vue CLI generated project.")
        print("       (A 'package.json' file and 'src' directory were not found here.)")
    else:
        create_project_enhancements()