// Supabase Edge Function: combine
// מקבל שני שמות אלמנטים + כינוי שחקן, בודק אם השילוב קיים כבר,
// ואם לא — קורא ל-Gemini ליצור תוצאה חדשה, שומר ומחזיר אותה.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// מפתחות "זרע" קבועים, מופרדים בפסיק, בסודות בשם GEMINI_API_KEYS ו-GROQ_API_KEYS (אופציונלי).
// לדוגמה: supabase secrets set GEMINI_API_KEYS="key1,key2"
//          supabase secrets set GROQ_API_KEYS="gsk_key1,gsk_key2"
const SEED_GEMINI_API_KEYS = (Deno.env.get("GEMINI_API_KEYS") ?? Deno.env.get("GEMINI_API_KEY") ?? "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);
const SEED_GROQ_API_KEYS = (Deno.env.get("GROQ_API_KEYS") ?? Deno.env.get("GROQ_API_KEY") ?? "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

const GROQ_MODEL = Deno.env.get("GROQ_MODEL") ?? "llama-3.3-70b-versatile";

type Provider = "gemini" | "groq";
type KeyEntry = { key: string; provider: Provider };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function sortKey(a: string, b: string) {
  return [a, b].sort().join(",");
}

// קורא ל-AI אצל הספק המתאים (Gemini או Groq) ומחזיר את טקסט ה-JSON הגולמי שהוא ייצר.
async function callProvider(entry: KeyEntry, prompt: string): Promise<{ ok: true; text: string } | { ok: false; errText: string }> {
  try {
    if (entry.provider === "groq") {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${entry.key}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) return { ok: false, errText: await res.text() };
      const json = await res.json();
      return { ok: true, text: json.choices?.[0]?.message?.content ?? "{}" };
    } else {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": entry.key,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );
      if (!res.ok) return { ok: false, errText: await res.text() };
      const json = await res.json();
      return { ok: true, text: json.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}" };
    }
  } catch (e) {
    return { ok: false, errText: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { itemA, itemB, nickname } = await req.json();
    if (!itemA || !itemB || !nickname) {
      return new Response(JSON.stringify({ error: "חסרים פרמטרים" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const comboKey = sortKey(itemA, itemB);

    // רישום פעילות: מי ומתי ניסה שילוב (למסך הפעילות בדף הניהול). לא חוסם את הבקשה.
    supabase.from("activity_log").insert({ nickname, event_type: "combine_attempt" }).then(() => {});

    // 1. אם השילוב כבר נוסה בעבר (הצליח או נכשל) - החזר את התוצאה השמורה מיד, בלי לפנות ל-Gemini
    const { data: existing } = await supabase
      .from("recipes")
      .select("result_name, discovered_by, failed, elements(emoji)")
      .eq("combo_key", comboKey)
      .maybeSingle();

    if (existing) {
      if (existing.failed) {
        return new Response(
          JSON.stringify({ failed: true, isNew: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({
          name: existing.result_name,
          emoji: existing.elements?.emoji ?? "❓",
          discoveredBy: existing.discovered_by,
          isNew: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. אחרת - שלוף רשימת אלמנטים קיימים, ובקש מ-Gemini תוצאה חדשה
    const { data: existingElements } = await supabase
      .from("elements")
      .select("name")
      .order("created_at", { ascending: true })
      .limit(300);

    const existingNames = (existingElements ?? []).map((e) => e.name);
    const existingListText = existingNames.length
      ? existingNames.join(", ")
      : "(אין עדיין אלמנטים אחרים)";

    const prompt = `אתה מנוע התוכן של משחק שילובים בעברית בסגנון "Infinite Craft".
שני האלמנטים "${itemA}" ו-"${itemB}" מנסים להשתלב יחד.

חשוב מאוד - לא כל שילוב חייב להצליח:
אם אין שום תוצאה הגיונית, טבעית או משעשעת-אך-הגיונית לשילוב הזה (השילוב מאולץ, אבסורדי, או שני האלמנטים פשוט לא קשורים בשום צורה סבירה), אתה יכול ומומלץ להחליט שהשילוב הזה **נכשל** ולא מייצר כלום - בדיוק כמו במשחק המקורי, שלא כל שילוב שם מצליח.
היה סלחני כלפי שילובים יצירתיים-אך-הגיוניים (מותר קצת דמיון), אבל דחה שילובים שבאמת אין להם שום היגיון.

כללי תוכן מחייבים (כשיש כן תוצאה):
- אין לכתוב תוכן שאינו צנוע (מיניות, גוף חושפני, רומנטיקה בוטה וכדומה).
- אין לכתוב תוכן שמבטא כפירה, ליגלוג על אמונה, או פגיעה בקדשי הדת.
- מותר ואף רצוי שרוב התוצאות יהיו מושגים כלליים, ניטרליים וחילוניים לגמרי (טבע, מדע, היסטוריה כללית, טכנולוגיה, בעלי חיים, אוכל, רגשות, מקומות, אמנות וכו') - בלי שום זיקה דתית.
- אין להימנע לגמרי ממושגים דתיים-יהודיים; כשהם עולים בטבעיות מהצירוף (לדוגמה שילוב שקשור ממש לחג, למקום קדוש, למושג תורני) אפשר ורצוי להשתמש בהם, אבל זה לא צריך להיות ברירת המחדל של כל שילוב.
- הימנע ממושגים שתוכנם מנוגד לעקרונות יהדות אורתודוקסית מרכזיים (כגון תיאורי עבודה זרה בהקשר חיובי), אך אין צורך "לגייר" כל תוצאה - מושג ניטרלי-חילוני-כללי הוא תמיד תקין.

חשוב - שימוש חוזר באלמנטים קיימים:
אלה האלמנטים שכבר קיימים במשחק: ${existingListText}
אם התוצאה ההגיונית לשילוב הזה היא בעצם אחד מהאלמנטים הקיימים ברשימה (למשל אותו רעיון בניסוח שונה במקצת), החזר בדיוק את אותו שם קיים מהרשימה - אל תמציא שם כמעט-זהה חדש. רק אם באמת אין אלמנט קיים שמתאים, צור שם חדש.

החזר בפורמט JSON בלבד ללא טקסט נוסף, באחת משתי הצורות הבאות:
אם יש תוצאה הגיונית: {"success": true, "name": "שם התוצאה בעברית (מילה או צירוף קצר)", "emoji": "אימוג'י בודד המתאים ביותר"}
אם אין שום שילוב הגיוני: {"success": false}`;

    // 2.5 קרא ל-Gemini עם רוטציה בין כל המפתחות הזמינים: מפתחות "זרע" קבועים
    //     ועוד כל מפתח שתרמו שחקנים ונשמר פעיל ב-DB. מתחילים מהמפתח שנשמר
    //     כ"נוכחי", ואם הוא נכשל (מכסה/שגיאה) עוברים לבא בתור עד שמישהו מצליח.
    const { data: contributedKeysData } = await supabase
      .from("gemini_keys")
      .select("api_key, provider")
      .eq("active", true)
      .order("created_at", { ascending: true });

    const contributedKeys: KeyEntry[] = (contributedKeysData ?? []).map((r) => ({
      key: r.api_key,
      provider: (r.provider === "groq" ? "groq" : "gemini") as Provider,
    }));
    const seedKeys: KeyEntry[] = [
      ...SEED_GEMINI_API_KEYS.map((k) => ({ key: k, provider: "gemini" as Provider })),
      ...SEED_GROQ_API_KEYS.map((k) => ({ key: k, provider: "groq" as Provider })),
    ];
    const seenKeys = new Set<string>();
    const API_KEYS: KeyEntry[] = [...seedKeys, ...contributedKeys].filter((entry) => {
      if (seenKeys.has(entry.key)) return false;
      seenKeys.add(entry.key);
      return true;
    });

    if (API_KEYS.length === 0) {
      await supabase.from("activity_log").insert({ nickname, event_type: "quota_fail" });
      return new Response(JSON.stringify({ error: "לא הוגדר אף מפתח AI (GEMINI_API_KEYS / GROQ_API_KEYS)", quotaExceeded: true }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: rotation } = await supabase
      .from("api_key_rotation")
      .select("current_index")
      .eq("id", 1)
      .maybeSingle();

    let startIndex = (rotation?.current_index ?? 0) % API_KEYS.length;
    let responseText: string | null = null;
    let lastErrText = "";
    let successIndex = -1;

    for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
      const tryIndex = (startIndex + attempt) % API_KEYS.length;
      const entry = API_KEYS[tryIndex];
      const result = await callProvider(entry, prompt);
      if (result.ok) {
        responseText = result.text;
        successIndex = tryIndex;
        break;
      } else {
        lastErrText = result.errText;
      }
    }

    if (responseText === null) {
      await supabase.from("activity_log").insert({ nickname, event_type: "quota_fail" });
      return new Response(JSON.stringify({ error: "כל מפתחות ה-AI נכשלו", detail: lastErrText, quotaExceeded: true }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // שמור את המפתח הבא בתור לפעם הבאה (רוטציה, כולל חזרה למפתח הראשון בסוף)
    const nextIndex = (successIndex + 1) % API_KEYS.length;
    await supabase.from("api_key_rotation").update({ current_index: nextIndex }).eq("id", 1);
    let parsed: { success?: boolean; name?: string; emoji?: string };
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { success: false };
    }

    // אם ה-AI קבע שאין שילוב הגיוני - שמור את זה (כדי לא לשאול שוב) ותחזיר כישלון
    if (parsed.success === false) {
      await supabase
        .from("recipes")
        .upsert(
          { combo_key: comboKey, item_a: itemA, item_b: itemB, result_name: null, failed: true, discovered_by: null },
          { onConflict: "combo_key", ignoreDuplicates: true }
        );
      return new Response(
        JSON.stringify({ failed: true, isNew: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resultName = (parsed.name || "").trim();
    const geminiEmoji = (parsed.emoji || "❔").trim();

    if (!resultName) {
      // בטיחות: אם חזר "success: true" אבל בלי שם תקין, נתייחס לזה ככישלון ולא נשמור פלוסר ריק
      await supabase
        .from("recipes")
        .upsert(
          { combo_key: comboKey, item_a: itemA, item_b: itemB, result_name: null, failed: true, discovered_by: null },
          { onConflict: "combo_key", ignoreDuplicates: true }
        );
      return new Response(
        JSON.stringify({ failed: true, isNew: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. בדוק אם זה בעצם אלמנט קיים (גם אם ה-AI כתב אימוג'י שונה במקצת)
    const { data: existingElement } = await supabase
      .from("elements")
      .select("name, emoji")
      .eq("name", resultName)
      .maybeSingle();

    const resultEmoji = existingElement?.emoji ?? geminiEmoji;
    const isBrandNewElement = !existingElement;

    // 4. שמור: אלמנט חדש רק אם לא קיים כבר, ותמיד שמור מתכון חדש לצירוף הזה.
    //    זיכוי "מי גילה" נשמר רק אחרי שלב מוקדם מסוים במשחק (לא על העשרות הראשונות),
    //    כדי שלא ייראה מצחיק ששחקן אחד "לוקח" את כל האלמנטים הראשונים.
    const EARLY_GAME_THRESHOLD = 40;
    const { count: totalElementsCount } = await supabase
      .from("elements")
      .select("*", { count: "exact", head: true });
    const pastEarlyGame = (totalElementsCount ?? 0) >= EARLY_GAME_THRESHOLD;
    const creditedNickname = pastEarlyGame ? nickname : null;

    if (isBrandNewElement) {
      await supabase
        .from("elements")
        .upsert({ name: resultName, emoji: resultEmoji, discovered_by: creditedNickname }, { onConflict: "name", ignoreDuplicates: true });
    }

    await supabase
      .from("recipes")
      .upsert(
        {
          combo_key: comboKey,
          item_a: itemA,
          item_b: itemB,
          result_name: resultName,
          discovered_by: creditedNickname,
        },
        { onConflict: "combo_key", ignoreDuplicates: true }
      );

    // isNew מתייחס לאלמנט עצמו: אם הוא כבר קיים (אפילו דרך מתכון אחר),
    // זה "מתכון חדש לאלמנט ידוע" ולא גילוי חדש - כפי שקורה במשחק האמיתי.
    return new Response(
      JSON.stringify({ name: resultName, emoji: resultEmoji, discoveredBy: existingElement?.discovered_by ?? creditedNickname, isNew: isBrandNewElement }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
