<template>
  <div class="bg-gray-50">
    <div class="mx-auto max-w-7xl py-12 px-4 sm:py-16 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-3xl">
        <div class="text-center">
          <h2
            class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            Help & Documentation
          </h2>
          <p class="mt-4 text-lg text-gray-500">
            Answers to common questions about using UPSHOT. If you can't find
            what you're looking for, check the project's README file.
          </p>
        </div>

        <dl class="mt-12 space-y-6">
          <AccordionItem question="What is the main workflow?">
            The application follows a simple 3-step process:
            <br />1. **Load Personnel:** Import your squadron roster. <br />2.
            **Load Training Data:** Import one or more SHARP training exports.
            <br />3. **Analyze & Report:** View individual and track-level
            reports.
          </AccordionItem>

          <AccordionItem
            question="What is the correct format for the Personnel file?"
          >
            The personnel file must be an Excel file (`.xlsx` or `.xls`) with a
            header row containing at least 'Full Name' and 'Position'. Other
            columns like 'Crew', 'Seat', and 'Notes' are optional but
            recommended.
            <div class="mt-4">
              <button
                @click="downloadPersonnelTemplate"
                type="button"
                class="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <ArrowDownTrayIcon class="-ml-0.5 h-5 w-5" />
                Download Personnel Template
              </button>
            </div>
          </AccordionItem>

          <AccordionItem question="Where do I get the training data file?">
            The training data must be a **Syllabus Export** from SHARP (Sierra
            Hotel Aviation Readiness Program). Navigate to the syllabus section
            in SHARP and look for an export option that generates an Excel file
            with multiple sheets, including "Syllabus Events" and "Default".
          </AccordionItem>

          <AccordionItem
            question="How do I save changes to a Syllabus or App Configuration?"
          >
            <p class="text-gray-700">
              This application runs entirely in your browser and does not have a
              backend server to store data. All changes are saved by downloading
              a file that you must then place in the application's directory.
            </p>
            <br />
            <p class="text-gray-700">
              When you modify settings in the
              <strong>Application Settings</strong> or
              <strong>Syllabus Manager</strong> pages and click a "Save" or
              "Download" button, your browser will download a file.
            </p>
            <ul class="list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li>
                For app settings, this will be <code>user_config.js</code>.
              </li>
              <li>
                For a syllabus, this will be a JSON file like
                <code>PILOT.json</code>.
              </li>
            </ul>
            <br />
            <p class="text-gray-700">
              For the application to load your changes automatically next time,
              you must move the downloaded <code>user_config.js</code> file into
              the <code>/config</code> folder located next to the main
              <code>index.html</code> file. For syllabi, you can upload the
              downloaded JSON file directly in the Syllabus Manager.
            </p>
          </AccordionItem>

          <AccordionItem
            question="How do I set up AI-powered features (Gemini API)?"
          >
            <p class="text-gray-700">
              To enable AI-powered reporting, you need to provide your own
              Google Gemini API key.
            </p>
            <br />
            <h4 class="font-semibold text-gray-800">
              Step 1: Create Your API Key
            </h4>
            <ol class="list-decimal list-inside mt-2 space-y-2 text-gray-600">
              <li>
                Navigate to the
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  class="text-indigo-600 hover:underline"
                  >Google AI Studio</a
                >.
              </li>
              <li>Sign in and click "Create API key" to generate your key.</li>
              <li>Copy the generated key to your clipboard.</li>
            </ol>
            <br />
            <h4 class="font-semibold text-gray-800">
              Step 2: Save the Key in UPSHOT
            </h4>
            <ol class="list-decimal list-inside mt-2 space-y-2 text-gray-600">
              <li>
                Go to the
                <router-link
                  to="/settings/app"
                  class="text-indigo-600 hover:underline"
                  >Application Settings</router-link
                >
                page.
              </li>
              <li>Paste your key into the "Gemini API Key" field.</li>
              <li>
                Click the "Save and Download" button. This downloads the
                <code>user_config.js</code> file with your key included.
              </li>
              <li>
                Place this file into the <code>/config</code> folder as
                described in the section above.
              </li>
            </ol>
          </AccordionItem>

          <AccordionItem
            question="Why are some requirements waived by default?"
          >
            Some training items, particularly `ICW` (Interactive Courseware)
            events from SHARP, are often used for computer-based training that
            is tracked separately. They are automatically marked as "waived"
            during the syllabus import to prevent them from showing up as
            overdue. You can change this for any requirement in the Syllabus
            Edit page.
          </AccordionItem>
        </dl>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AccordionItem from "@/components/ui/AccordionItem.vue";
import { downloadPersonnelTemplate } from "@/core/excelProcessorServices/personnelProcessorService";
import { ArrowDownTrayIcon } from "@heroicons/vue/20/solid";
</script>
