// Supabase Edge Function: claim-nickname
// קובע כינוי לשחקן על בסיס client_id קבוע:
// - אם ל-client_id הזה כבר יש כינוי שמור - מחזיר אותו (אין החלפת כינוי באמצע המשחק).
// - אחרת מנסה לקבוע את הכינוי המבוקש; אם הוא תפוס ע"י client_id אחר,
//   מוסיף סיומת מספרית (2, 3, ...) עד שמוצא כינוי פנוי, ומחזיר wasTaken=true.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalize(nick: string) {
  return nick.trim().toLowerCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { clientId, desiredNickname } = await req.json();
    const cid = (clientId || "").trim();
    const desired = (desiredNickname || "").trim();

    if (!cid || !desired) {
      return new Response(JSON.stringify({ error: "חסרים פרמטרים (clientId / desiredNickname)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1. אם ל-client_id הזה כבר יש כינוי - החזר אותו, לא ניתן להחליף.
    const { data: existingPlayer, error: existingErr } = await supabase
      .from("players")
      .select("nickname")
      .eq("client_id", cid)
      .maybeSingle();

    if (existingErr) throw existingErr;

    if (existingPlayer) {
      return new Response(
        JSON.stringify({ nickname: existingPlayer.nickname, wasTaken: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. נסה לקבוע את הכינוי המבוקש, ואם תפוס - הוסף סיומת מספרית עד שנמצא פנוי.
    let candidate = desired;
    let suffix = 1;
    let wasTaken = false;

    for (let attempt = 0; attempt < 50; attempt++) {
      const { data: inserted, error: insertError } = await supabase
        .from("players")
        .insert({ client_id: cid, nickname: candidate })
        .select("nickname")
        .single();

      if (!insertError) {
        return new Response(
          JSON.stringify({ nickname: inserted.nickname, wasTaken }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 23505 = unique violation - הכינוי הזה (nickname_key) כבר תפוס, או שה-client_id כבר קיים
      if (insertError.code === "23505") {
        // אם זה בעצם ה-client_id שהתנגש (race condition - הרישום כבר קיים), שלוף וחזור עם הכינוי הקיים.
        const { data: raceCheck } = await supabase
          .from("players")
          .select("nickname")
          .eq("client_id", cid)
          .maybeSingle();
        if (raceCheck) {
          return new Response(
            JSON.stringify({ nickname: raceCheck.nickname, wasTaken: false }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // אחרת - הכינוי עצמו תפוס ע"י מישהו אחר, נסה עם סיומת מספרית.
        wasTaken = true;
        suffix += 1;
        candidate = `${desired}${suffix}`;
        continue;
      }

      throw insertError;
    }

    return new Response(JSON.stringify({ error: "לא נמצא כינוי פנוי, נסו שם אחר" }), {
      status: 409,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("claim-nickname error:", extractErrorMessage(err));
    return new Response(JSON.stringify({ error: extractErrorMessage(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const anyErr = err as Record<string, unknown>;
    if (typeof anyErr.message === "string" && anyErr.message) return anyErr.message;
    try { return JSON.stringify(err); } catch { /* fall through */ }
  }
  return String(err);
}
