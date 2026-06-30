"use strict";
/**
 * Client Supabase pour l'application
 * Fait partie de l'infrastructure Supabase
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
require("dotenv/config");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be defined in environment variables');
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
var supabase_js_2 = require("@supabase/supabase-js");
Object.defineProperty(exports, "createClient", { enumerable: true, get: function () { return supabase_js_2.createClient; } });
