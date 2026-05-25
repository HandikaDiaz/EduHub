/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as categories from "../categories.js";
import type * as dashboard from "../dashboard.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_scoring from "../lib/scoring.js";
import type * as materi from "../materi.js";
import type * as quiz from "../quiz.js";
import type * as results from "../results.js";
import type * as seed from "../seed.js";
import type * as seed_categories from "../seed/categories.js";
import type * as seed_modules from "../seed/modules.js";
import type * as seed_questions_tiu_figural from "../seed/questions/tiu_figural.js";
import type * as seed_questions_tiu_logika from "../seed/questions/tiu_logika.js";
import type * as seed_questions_tiu_numerik from "../seed/questions/tiu_numerik.js";
import type * as seed_questions_tiu_verbal from "../seed/questions/tiu_verbal.js";
import type * as seed_questions_tkp_jejaring_kerja from "../seed/questions/tkp_jejaring_kerja.js";
import type * as seed_questions_tkp_pelayanan_publik from "../seed/questions/tkp_pelayanan_publik.js";
import type * as seed_questions_tkp_sosial_budaya from "../seed/questions/tkp_sosial_budaya.js";
import type * as seed_questions_twk_bhinneka from "../seed/questions/twk_bhinneka.js";
import type * as seed_questions_twk_nkri from "../seed/questions/twk_nkri.js";
import type * as seed_questions_twk_pancasila from "../seed/questions/twk_pancasila.js";
import type * as seed_questions_twk_uud_1945 from "../seed/questions/twk_uud_1945.js";
import type * as seed_types from "../seed/types.js";
import type * as settings from "../settings.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";
import type * as videoProgress from "../videoProgress.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  categories: typeof categories;
  dashboard: typeof dashboard;
  "lib/auth": typeof lib_auth;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/scoring": typeof lib_scoring;
  materi: typeof materi;
  quiz: typeof quiz;
  results: typeof results;
  seed: typeof seed;
  "seed/categories": typeof seed_categories;
  "seed/modules": typeof seed_modules;
  "seed/questions/tiu_figural": typeof seed_questions_tiu_figural;
  "seed/questions/tiu_logika": typeof seed_questions_tiu_logika;
  "seed/questions/tiu_numerik": typeof seed_questions_tiu_numerik;
  "seed/questions/tiu_verbal": typeof seed_questions_tiu_verbal;
  "seed/questions/tkp_jejaring_kerja": typeof seed_questions_tkp_jejaring_kerja;
  "seed/questions/tkp_pelayanan_publik": typeof seed_questions_tkp_pelayanan_publik;
  "seed/questions/tkp_sosial_budaya": typeof seed_questions_tkp_sosial_budaya;
  "seed/questions/twk_bhinneka": typeof seed_questions_twk_bhinneka;
  "seed/questions/twk_nkri": typeof seed_questions_twk_nkri;
  "seed/questions/twk_pancasila": typeof seed_questions_twk_pancasila;
  "seed/questions/twk_uud_1945": typeof seed_questions_twk_uud_1945;
  "seed/types": typeof seed_types;
  settings: typeof settings;
  transactions: typeof transactions;
  users: typeof users;
  videoProgress: typeof videoProgress;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
