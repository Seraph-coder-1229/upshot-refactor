// src/types/dataSetTypes.ts

/**
 * This file defines the core data structures for managing multiple, distinct
 * sets of training data.
 */

import type { CompletionRecord } from './progressTypes';
import type { ImportReport } from './importReportTypes';
import type { PersonnelWithNoSyllabus } from './personnelTypes';

/**
 * @interface DataSet
 * Represents a complete, self-contained set of training data derived from a
 * single upload session. This is the foundational data structure for the
 * multi-source architecture.
 */
export interface DataSet {
  /**
   * A unique identifier for the DataSet, typically a timestamp-based UUID
   * generated at the time of creation.
   * @type {string}
   */
  id: string;

  /**
   * A user-editable name for easy identification of the data source.
   * Defaults to a name based on the upload timestamp.
   * @type {string}
   */
  name: string;

  /**
   * The ISO date string representing when the DataSet was created.
   * @type {string}
   */
  createdAt: string;

  /**
   * An array of all training completion records associated with this DataSet.
   * @type {CompletionRecord[]}
   */
  completionRecords: CompletionRecord[];

  /**
   * A summary report detailing the results of the file import process for this DataSet.
   * @type {ImportReport}
   */
  importSummary: ImportReport;

  /**
   * A list of personnel found in the imported files who could not be matched
   * to an active syllabus within this DataSet.
   * @type {PersonnelWithNoSyllabus[]}
   */
  personnelWithNoSyllabus: PersonnelWithNoSyllabus[];
}