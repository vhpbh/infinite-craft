// Supabase Edge Function: contribute-key
// מקבל מפתח Gemini מהמשתמש, מוודא שהוא באמת תקין (בלי לבזבז קריאת יצירה),
// ואם כן - מוסיף אותו לרשימת המפתחות שברוטציה של combine.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { apiKey, nickname } = await req.json();
    const key = (apiKey || "").trim();

    if (!key) {
      return new Response(JSON.stringify({ error: "לא סופק מפתח" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // אימות המפתח: קריאה זולה ל-list models, לא יצירת תוכן - לא צורכת מכסה משמעותית
    const testRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
      headers: { "x-goog-api-key": key },
    });

    if (!testRes.ok) {
      return new Response(JSON.stringify({ error: "המפתח לא תקין או לא פעיל. ודאו שהעתקתם אותו נכון." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { error: insertError } = await supabase
      .from("gemini_keys")
      .insert({ api_key: key, contributed_by: nickname || null });

    if (insertError) {
      if (insertError.code === "23505") {
        // unique violation - המפתח כבר קיים במאגר
        return new Response(JSON.stringify({ error: "המפתח הזה כבר קיים במאגר, תודה בכל זאת! 🙏" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw insertError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
