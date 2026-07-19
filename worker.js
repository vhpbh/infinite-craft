// Cloudflare Worker: יצירה יהודית - כל ה-backend במקום אחד.
// מחליף 3 Supabase Edge Functions (combine, claim-nickname, contribute-key)
// + 4 קריאות שה-index.html עשה ישירות ל-DB עם supabase-js (אין דבר כזה עם D1 -
//   D1 נגיש רק מתוך Worker עם binding, אז כל אלה הפכו לנתיבי GET כאן).
//
// דרוש: D1 binding בשם DB (ר' wrangler.toml), ו-secrets: GEMINI_API_KEYS, GROQ_API_KEYS (אופציונלי).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function nowIso() {
  return new Date().toISOString();
}

function sortKey(a, b) {
  return [a, b].sort().join(",");
}

function extractErrorMessage(err) {
  if (err instanceof Error) return err.message;
  try { return JSON.stringify(err); } catch { return String(err); }
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    const url = new URL(request.url);
    try {
      switch (url.pathname) {
        case "/combine":
          if (request.method !== "POST") return json({ error: "method not allowed" }, 405);
          return await handleCombine(request, env);
        case "/claim-nickname":
          if (request.method !== "POST") return json({ error: "method not allowed" }, 405);
          return await handleClaimNickname(request, env);
        case "/contribute-key":
          if (request.method !== "POST") return json({ error: "method not allowed" }, 405);
          return await handleContributeKey(request, env);
        case "/my-elements":
          return await handleMyElements(url, env);
        case "/quota-gauge":
          return await handleQuotaGauge(url, env);
        case "/broadcast-ad":
          return await handleBroadcastAd(env);
        case "/site-status":
          return await handleSiteStatus(env);
        default:
          return json({ error: "not found" }, 404);
      }
    } catch (err) {
      return json({ error: extractErrorMessage(err) }, 500);
    }
  },

  // Cron Trigger (מוגדר ב-wrangler.toml [triggers] crons) - מחליף את pg_cron:
  // מוחק שורות activity_log ישנות מ-30 יום כדי שהטבלה לא תתפח.
  async scheduled(event, env, ctx) {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await env.DB.prepare("DELETE FROM activity_log WHERE created_at < ?1").bind(cutoff).run();
  },
};

/* ================= GET /my-elements?nickname=... ================= */
// מחליף: sb.from('elements').select('name, emoji, created_at').eq('discovered_by', nickname)...
async function handleMyElements(url, env) {
  const nickname = url.searchParams.get("nickname") || "";
  if (!nickname) return json({ data: [] });
  const { results } = await env.DB.prepare(
    "SELECT name, emoji, created_at FROM elements WHERE discovered_by = ?1 ORDER BY created_at DESC"
  ).bind(nickname).all();
  return json({ data: results ?? [] });
}

/* ================= GET /quota-gauge?since=ISO ================= */
// מחליף: sb.from('activity_log').select('*',{count:'exact',head:true}).eq('event_type','quota_fail').gte('created_at', since)
async function handleQuotaGauge(url, env) {
  const since = url.searchParams.get("since") || nowIso();
  const row = await env.DB.prepare(
    "SELECT COUNT(*) as c FROM activity_log WHERE event_type = 'quota_fail' AND created_at >= ?1"
  ).bind(since).first();
  return json({ count: row?.c ?? 0 });
}

/* ================= GET /broadcast-ad ================= */
async function handleBroadcastAd(env) {
  const row = await env.DB.prepare("SELECT * FROM broadcast_ad WHERE id = 1").first();
  return json({ data: row ?? null });
}

/* ================= GET /site-status ================= */
async function handleSiteStatus(env) {
  const row = await env.DB.prepare("SELECT maintenance, message FROM site_status WHERE id = 1").first();
  return json({ data: row ?? null });
}

/* ================= POST /claim-nickname ================= */
async function handleClaimNickname(request, env) {
  const { clientId, desiredNickname } = await request.json();
  const cid = (clientId || "").trim();
  const desired = (desiredNickname || "").trim();
  if (!cid || !desired) return json({ error: "חסרים פרמטרים (clientId / desiredNickname)" }, 400);

  const existingPlayer = await env.DB.prepare(
    "SELECT nickname FROM players WHERE client_id = ?1"
  ).bind(cid).first();
  if (existingPlayer) return json({ nickname: existingPlayer.nickname, wasTaken: false });

  let candidate = desired;
  let suffix = 1;
  let wasTaken = false;

  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      await env.DB.prepare(
        "INSERT INTO players (client_id, nickname) VALUES (?1, ?2)"
      ).bind(cid, candidate).run();
      return json({ nickname: candidate, wasTaken });
    } catch (err) {
      const msg = extractErrorMessage(err);
      if (!/UNIQUE constraint failed/i.test(msg)) throw err;

      // אם client_id הוא זה שהתנגש (race condition - הרישום כבר קיים), שלוף וחזור עם הכינוי הקיים.
      if (/players\.client_id/i.test(msg)) {
        const raceCheck = await env.DB.prepare(
          "SELECT nickname FROM players WHERE client_id = ?1"
        ).bind(cid).first();
        if (raceCheck) return json({ nickname: raceCheck.nickname, wasTaken: false });
      }
      // אחרת - הכינוי עצמו (nickname_key) תפוס ע"י מישהו אחר, נסה עם סיומת מספרית.
      wasTaken = true;
      suffix += 1;
      candidate = `${desired}${suffix}`;
    }
  }
  return json({ error: "לא נמצא כינוי פנוי, נסו שם אחר" }, 409);
}

/* ================= POST /contribute-key ================= */
function detectProvider(key) {
  return key.startsWith("gsk_") ? "groq" : "gemini";
}

async function handleContributeKey(request, env) {
  const { apiKey, nickname } = await request.json();
  const key = (apiKey || "").trim();
  if (!key) return json({ error: "לא סופק מפתח" }, 400);

  const provider = detectProvider(key);

  // אימות המפתח: קריאה זולה ל-list models, לא יצירת תוכן - לא צורכת מכסה משמעותית
  const testRes = provider === "groq"
    ? await fetch("https://api.groq.com/openai/v1/models", { headers: { "Authorization": `Bearer ${key}` } })
    : await fetch("https://generativelanguage.googleapis.com/v1beta/models", { headers: { "x-goog-api-key": key } });

  if (!testRes.ok) return json({ error: "המפתח לא תקין או לא פעיל. ודאו שהעתקתם אותו נכון." }, 400);

  try {
    await env.DB.prepare(
      "INSERT INTO gemini_keys (api_key, provider, contributed_by) VALUES (?1, ?2, ?3)"
    ).bind(key, provider, nickname || null).run();
  } catch (err) {
    const msg = extractErrorMessage(err);
    if (/UNIQUE constraint failed/i.test(msg)) {
      return json({ error: "המפתח הזה כבר קיים במאגר, תודה בכל זאת! 🙏" }, 409);
    }
    throw err;
  }
  return json({ success: true, provider });
}

/* ================= POST /combine ================= */
const PROVIDER_TIMEOUT_MS = 15000;
const DEFAULT_COOLDOWN_MS = 60_000;
const EARLY_GAME_THRESHOLD = 40;

async function callProvider(env, entry, prompt) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    if (entry.provider === "groq") {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${entry.key}` },
        body: JSON.stringify({
          model: env.GROQ_MODEL || "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) return { ok: false, status: res.status, errText: await res.text(), retryAfterMs: parseRetryAfter(res) };
      const j = await res.json();
      return { ok: true, text: j.choices?.[0]?.message?.content ?? "{}" };
    } else {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
        {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json", "x-goog-api-key": entry.key },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );
      if (!res.ok) return { ok: false, status: res.status, errText: await res.text(), retryAfterMs: parseRetryAfter(res) };
      const j = await res.json();
      return { ok: true, text: j.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}" };
    }
  } catch (e) {
    return { ok: false, status: 0, errText: String(e), retryAfterMs: null };
  } finally {
    clearTimeout(timeout);
  }
}

function parseRetryAfter(res) {
  const header = res.headers.get("retry-after");
  if (!header) return null;
  const asSeconds = Number(header);
  if (!Number.isNaN(asSeconds)) return asSeconds * 1000;
  const asDate = Date.parse(header);
  if (!Number.isNaN(asDate)) return Math.max(0, asDate - Date.now());
  return null;
}

const isPermanentFailure = (status) => status === 401 || status === 403;
const isQuotaFailure = (status) => status === 429;

// תופס אטומית את המפתח הבא בתור ומקדם את האינדקס - הכל במשפט UPDATE...RETURNING יחיד,
// כך שהוא מתבצע כפעולה אחת מול D1 (בלי חלון בין קריאה לכתיבה כמו שהיה עם שתי קריאות נפרדות).
async function claimNextKeyIndex(env, keyCount) {
  if (keyCount <= 0) return 0;
  const row = await env.DB.prepare(
    "UPDATE api_key_rotation SET current_index = (current_index + 1) % ?1 WHERE id = 1 RETURNING current_index"
  ).bind(keyCount).first();
  const newIndex = row?.current_index ?? 0;
  return (newIndex - 1 + keyCount) % keyCount; // האינדקס שהיה "נוכחי" רגע לפני העדכון - זה מה שמשתמשים בו עכשיו
}

async function handleCombine(request, env) {
  const { itemA, itemB, nickname, personalKey, personalProvider } = await request.json();
  if (!itemA || !itemB || !nickname) return json({ error: "חסרים פרמטרים" }, 400);

  const comboKey = sortKey(itemA, itemB);

  await env.DB.prepare(
    "INSERT INTO activity_log (nickname, event_type) VALUES (?1, 'combine_attempt')"
  ).bind(nickname).run();

  // 1. אם השילוב כבר נוסה בעבר - החזר את התוצאה השמורה מיד, בלי לפנות ל-AI
  const existing = await env.DB.prepare(
    `SELECT r.result_name, r.discovered_by, r.failed, e.emoji
     FROM recipes r LEFT JOIN elements e ON e.name = r.result_name
     WHERE r.combo_key = ?1`
  ).bind(comboKey).first();

  if (existing) {
    if (existing.failed) return json({ failed: true, isNew: false });
    return json({
      name: existing.result_name,
      emoji: existing.emoji ?? "❓",
      discoveredBy: existing.discovered_by,
      isNew: false,
    });
  }

  // 2. אחרת - שלוף רשימת אלמנטים קיימים, ובקש מה-AI תוצאה חדשה
  const { results: existingElements } = await env.DB.prepare(
    "SELECT name FROM elements ORDER BY created_at ASC LIMIT 300"
  ).all();
  const existingNames = (existingElements ?? []).map((e) => e.name);
  const existingListText = existingNames.length ? existingNames.join(", ") : "(אין עדיין אלמנטים אחרים)";

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

  let responseText = null;
  let lastErrText = "";

  // 2.4 מפתח אישי (Alt+C+O): מנסים ראשון ובלעדית, לא נוגע במאגר/רוטציה המשותפים.
  const trimmedPersonalKey = typeof personalKey === "string" ? personalKey.trim() : "";
  if (trimmedPersonalKey) {
    const provider = personalProvider === "groq" ? "groq" : "gemini";
    const personalResult = await callProvider(env, { key: trimmedPersonalKey, provider }, prompt);
    if (personalResult.ok) responseText = personalResult.text;
    else lastErrText = personalResult.errText;
  }

  // 2.5 מאגר משותף: מפתחות "זרע" (secrets) + מפתחות שתרמו שחקנים ופעילים כרגע.
  if (responseText === null) {
    const seedGemini = (env.GEMINI_API_KEYS || "").split(",").map((k) => k.trim()).filter(Boolean);
    const seedGroq = (env.GROQ_API_KEYS || "").split(",").map((k) => k.trim()).filter(Boolean);

    const { results: contributedRows } = await env.DB.prepare(
      `SELECT id, api_key, provider, consecutive_failures FROM gemini_keys
       WHERE active = 1 AND (cooldown_until IS NULL OR cooldown_until < ?1)
       ORDER BY created_at ASC`
    ).bind(nowIso()).all();

    const seedKeys = [
      ...seedGemini.map((k) => ({ key: k, provider: "gemini" })),
      ...seedGroq.map((k) => ({ key: k, provider: "groq" })),
    ];
    const contributedKeys = (contributedRows ?? []).map((r) => ({
      id: r.id, key: r.api_key, provider: r.provider === "groq" ? "groq" : "gemini", consecutive_failures: r.consecutive_failures,
    }));
    const seen = new Set();
    const API_KEYS = [...seedKeys, ...contributedKeys].filter((e) => {
      if (seen.has(e.key)) return false;
      seen.add(e.key);
      return true;
    });

    if (API_KEYS.length === 0) {
      await env.DB.prepare("INSERT INTO activity_log (nickname, event_type) VALUES (?1, 'quota_fail')").bind(nickname).run();
      return json({ error: "לא הוגדר אף מפתח AI (GEMINI_API_KEYS / GROQ_API_KEYS)", quotaExceeded: true }, 500);
    }

    const startIndex = await claimNextKeyIndex(env, API_KEYS.length);

    for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
      const entry = API_KEYS[(startIndex + attempt) % API_KEYS.length];
      const result = await callProvider(env, entry, prompt);

      if (result.ok) {
        responseText = result.text;
        if (entry.id != null) {
          await env.DB.prepare(
            "UPDATE gemini_keys SET consecutive_failures = 0, cooldown_until = NULL WHERE id = ?1"
          ).bind(entry.id).run();
        }
        break;
      }

      lastErrText = result.errText;
      if (entry.id != null) {
        if (isPermanentFailure(result.status)) {
          await env.DB.prepare("UPDATE gemini_keys SET active = 0 WHERE id = ?1").bind(entry.id).run();
        } else if (isQuotaFailure(result.status)) {
          const cooldownMs = result.retryAfterMs ?? DEFAULT_COOLDOWN_MS;
          await env.DB.prepare("UPDATE gemini_keys SET cooldown_until = ?1 WHERE id = ?2")
            .bind(new Date(Date.now() + cooldownMs).toISOString(), entry.id).run();
        } else {
          const nextFailures = (entry.consecutive_failures ?? 0) + 1;
          await env.DB.prepare("UPDATE gemini_keys SET consecutive_failures = ?1 WHERE id = ?2")
            .bind(nextFailures, entry.id).run();
          if (nextFailures >= 5) {
            await env.DB.prepare("UPDATE gemini_keys SET active = 0 WHERE id = ?1").bind(entry.id).run();
          }
        }
      }
    }
  }

  if (responseText === null) {
    await env.DB.prepare("INSERT INTO activity_log (nickname, event_type) VALUES (?1, 'quota_fail')").bind(nickname).run();
    return json({ error: "כל מפתחות ה-AI נכשלו", detail: lastErrText, quotaExceeded: true }, 502);
  }

  let parsed;
  try { parsed = JSON.parse(responseText); } catch { parsed = { success: false }; }

  if (parsed.success === false) {
    await env.DB.prepare(
      "INSERT INTO recipes (combo_key, item_a, item_b, result_name, failed, discovered_by) VALUES (?1, ?2, ?3, NULL, 1, NULL) ON CONFLICT(combo_key) DO NOTHING"
    ).bind(comboKey, itemA, itemB).run();
    return json({ failed: true, isNew: false });
  }

  const resultName = (parsed.name || "").trim();
  const geminiEmoji = (parsed.emoji || "❔").trim();

  if (!resultName) {
    await env.DB.prepare(
      "INSERT INTO recipes (combo_key, item_a, item_b, result_name, failed, discovered_by) VALUES (?1, ?2, ?3, NULL, 1, NULL) ON CONFLICT(combo_key) DO NOTHING"
    ).bind(comboKey, itemA, itemB).run();
    return json({ failed: true, isNew: false });
  }

  // 3. בדוק אם זה בעצם אלמנט קיים
  const existingElement = await env.DB.prepare(
    "SELECT name, emoji, discovered_by FROM elements WHERE name = ?1"
  ).bind(resultName).first();

  const resultEmoji = existingElement?.emoji ?? geminiEmoji;
  const isBrandNewElement = !existingElement;

  // 4. שמור: אלמנט חדש רק אם לא קיים כבר, ותמיד שמור מתכון חדש. זיכוי "מי גילה" רק אחרי שלב מוקדם.
  const totalRow = await env.DB.prepare("SELECT COUNT(*) as c FROM elements").first();
  const pastEarlyGame = (totalRow?.c ?? 0) >= EARLY_GAME_THRESHOLD;
  const creditedNickname = pastEarlyGame ? nickname : null;

  if (isBrandNewElement) {
    await env.DB.prepare(
      "INSERT INTO elements (name, emoji, discovered_by) VALUES (?1, ?2, ?3) ON CONFLICT(name) DO NOTHING"
    ).bind(resultName, resultEmoji, creditedNickname).run();
  }

  await env.DB.prepare(
    "INSERT INTO recipes (combo_key, item_a, item_b, result_name, discovered_by) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(combo_key) DO NOTHING"
  ).bind(comboKey, itemA, itemB, resultName, creditedNickname).run();

  return json({
    name: resultName,
    emoji: resultEmoji,
    discoveredBy: existingElement?.discovered_by ?? creditedNickname,
    isNew: isBrandNewElement,
  });
}
