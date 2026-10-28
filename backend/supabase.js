const { createClient } = require("@supabase/supabase-js");
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

const supabase = createClient(SUPABASE_URL || "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY || "missing-key", {
  auth: { autoRefreshToken: false, persistSession: false }
});
module.exports = { supabase };
