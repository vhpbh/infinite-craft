-- ================= יצירה יהודית: סכמת Supabase =================

create table if not exists public.elements (
  id bigint generated always as identity primary key,
  name text not null unique,
  emoji text not null,
  is_starting boolean not null default false,
  discovered_by text,                    -- כינוי השחקן שגילה ראשון (null לאלמנטי פתיחה)
  created_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id bigint generated always as identity primary key,
  combo_key text not null unique,        -- "אש,מים" (שני השמות ממוינים א-ב, מופרדים בפסיק)
  item_a text not null,
  item_b text not null,
  result_name text references public.elements(name),  -- null אם השילוב נכשל (אין תוצאה הגיונית)
  failed boolean not null default false,               -- true = ה-AI קבע שאין שילוב הגיוני
  discovered_by text,                    -- כינוי השחקן שהריץ את השילוב הזה בפעם הראשונה
  created_at timestamptz not null default now()
);

create index if not exists idx_recipes_combo_key on public.recipes(combo_key);
create index if not exists idx_elements_name on public.elements(name);

-- אלמנטי פתיחה
insert into public.elements (name, emoji, is_starting) values
  ('אש', '🔥', true),
  ('מים', '💧', true),
  ('רוח', '🌬️', true),
  ('אדמה', '🌍', true)
on conflict (name) do nothing;

-- RLS: קריאה פתוחה לכולם, כתיבה רק דרך ה-Edge Function (service role, עוקף RLS)
alter table public.elements enable row level security;
alter table public.recipes enable row level security;

create policy "elements_public_read" on public.elements
  for select using (true);

create policy "recipes_public_read" on public.recipes
  for select using (true);

-- ================= שחקנים (מניעת החלפת כינוי / התחזות לכינוי קיים) =================
-- כל דפדפן מקבל client_id קבוע (נוצר פעם אחת ב-localStorage, לא ניתן לשינוי).
-- הכינוי נקשר ל-client_id ונשמר כאן כדי לאכוף ייחודיות אמיתית:
-- שני client_id שונים לעולם לא יקבלו את אותו כינוי (בהתעלם מרישיות/רווחים),
-- כך ש-discovered_by תמיד מזהה שחקן אחד ויחיד ולא "מתנגש" בין שני אנשים שהקלידו שם דומה.
create table if not exists public.players (
  id bigint generated always as identity primary key,
  client_id text not null unique,
  nickname text not null,
  nickname_key text generated always as (lower(trim(nickname))) stored,
  created_at timestamptz not null default now()
);
create unique index if not exists idx_players_nickname_key on public.players(nickname_key);
alter table public.players enable row level security;
-- אין policy לקריאה/כתיבה עבור anon/authenticated - גישה רק דרך ה-Edge Function claim-nickname עם service_role,
-- כדי שלקוח לא יוכל "לתפוס" כינוי בעצמו בלי מעבר דרך לוגיקת בדיקת הזמינות.

create table if not exists public.api_key_rotation (
  id int primary key default 1,
  current_index int not null default 0,
  constraint single_row check (id = 1)
);
insert into public.api_key_rotation (id, current_index) values (1, 0) on conflict (id) do nothing;
alter table public.api_key_rotation enable row level security;
-- אין policy לקריאה/כתיבה עבור anon/authenticated - נגיש רק דרך ה-Edge Function עם service_role.

-- קריאה+עדכון אטומיים של אינדקס הרוטציה במשפט/עסקה יחידה בצד ה-DB (עם FOR UPDATE שנועל את השורה),
-- כדי ששני שחקנים ששולחים בקשת שילוב באותו רגע ממש לא "יקראו" את אותו אינדקס במקביל
-- ויתחילו שניהם מאותו מפתח (מה שהיה קורה עם read-then-write נפרד מתוך ה-Edge Function).
create or replace function public.claim_next_key_index(p_key_count int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_index int;
begin
  if p_key_count <= 0 then
    return 0;
  end if;

  select current_index into v_index
  from public.api_key_rotation
  where id = 1
  for update;

  update public.api_key_rotation
  set current_index = (v_index + 1) % p_key_count
  where id = 1;

  return v_index % p_key_count;
end;
$$;
-- הרשאת הרצה נשארת רק ל-service_role (ברירת המחדל) - לא נחשפת ל-anon/authenticated.
revoke all on function public.claim_next_key_index(int) from public, anon, authenticated;

create table if not exists public.gemini_keys (
  id bigint generated always as identity primary key,
  api_key text not null unique,
  provider text not null default 'gemini',   -- 'gemini' או 'groq' - איזה ספק ה-AI המפתח הזה שייך אליו
  contributed_by text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
-- תאימות לאחור: אם הטבלה כבר קיימת מהתקנה קודמת (לפני תמיכה ב-Groq), נוסיף את העמודה בלי לשבור כלום.
alter table public.gemini_keys add column if not exists provider text not null default 'gemini';

-- מעקב כשלים: מתי לדלג זמנית על מפתח שחרג ממכסה (429 - יתאפס), וכמה כשלים רצופים
-- ספג (בלי קשר לסוג) כדי לדעת מתי לחשוד שהמפתח מת ולכבות אותו אוטומטית.
alter table public.gemini_keys add column if not exists cooldown_until timestamptz;
alter table public.gemini_keys add column if not exists consecutive_failures int not null default 0;

alter table public.gemini_keys enable row level security;
-- אין policy לקריאה/כתיבה עבור anon/authenticated - נגיש רק דרך Edge Functions עם service_role.
-- הוספת מפתח מתבצעת אך ורק דרך ה-Edge Function contribute-key, שמאמת את המפתח לפני השמירה
-- (הספק מזוהה אוטומטית לפי צורת המפתח - מפתחות Groq מתחילים ב-"gsk_").

-- ================= לוג פעילות =================
-- כל בקשת שילוב נרשמת כאן: מי ומתי (למסך "מי היה פעיל" בניהול),
-- וכן בקשות שנכשלו כי כל מפתחות ה-Gemini נגמרו (למד ה"מהירות" בצד השחקנים).
create table if not exists public.activity_log (
  id bigint generated always as identity primary key,
  nickname text,
  event_type text not null check (event_type in ('combine_attempt','quota_fail')),
  created_at timestamptz not null default now()
);
create index if not exists idx_activity_log_created_at on public.activity_log(created_at);
create index if not exists idx_activity_log_event_type on public.activity_log(event_type, created_at);
alter table public.activity_log enable row level security;
create policy "activity_log_public_read" on public.activity_log
  for select using (true);
-- כתיבה מתבצעת רק דרך ה-Edge Function combine עם service_role (עוקף RLS).

-- ================= ניקוי אוטומטי של לוג הפעילות =================
-- activity_log גדל בלי הפסקה (שורה על כל ניסיון שילוב, מכל שחקן) ולא נזקק להיסטוריה ארוכה -
-- מסך "מי היה פעיל" בניהול מציג רק פעילות אחרונה ממילא. מוחקים אוטומטית כל יום שורות ישנות
-- מ-30 יום, כדי שהטבלה לא תמשיך לתפוח ותנפח את גודל מסד הנתונים.
create extension if not exists pg_cron with schema extensions;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'cleanup-activity-log') then
    perform cron.unschedule('cleanup-activity-log');
  end if;
end $$;

select cron.schedule(
  'cleanup-activity-log',
  '0 3 * * *',  -- כל יום ב-03:00 UTC
  $$ delete from public.activity_log where created_at < now() - interval '30 days'; $$
);

-- ================= מצב תחזוקה =================
-- שורה יחידה שהאדמין שולט בה מדף הניהול (עם מפתח service_role) כדי להעביר את האתר
-- למצב תחזוקה זמני עבור כל השחקנים, עם הודעה מותאמת אישית אופציונלית.
create table if not exists public.site_status (
  id int primary key default 1,
  maintenance boolean not null default false,
  message text,
  updated_at timestamptz not null default now(),
  constraint single_row_status check (id = 1)
);
insert into public.site_status (id, maintenance) values (1, false) on conflict (id) do nothing;
alter table public.site_status enable row level security;
create policy "site_status_public_read" on public.site_status
  for select using (true);
-- עדכון (הפעלה/כיבוי/שינוי הודעה) מתבצע רק מדף הניהול עם מפתח service_role.

-- ================= באנר/פרסומת גלובלית =================
-- שורה יחידה שהאדמין שולט בה מדף הניהול (עם מפתח service_role) כדי "להקפיץ" פופאפ PNG
-- לכל השחקנים, עם קישור יעד ואפשרות כיבוי/הפעלה.
create table if not exists public.broadcast_ad (
  id int primary key default 1,
  image_url text,
  link_url text,
  active boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint single_row_ad check (id = 1)
);
insert into public.broadcast_ad (id, active) values (1, false) on conflict (id) do nothing;
alter table public.broadcast_ad enable row level security;
create policy "broadcast_ad_public_read" on public.broadcast_ad
  for select using (true);
-- עדכון (הפעלה/שינוי תמונה/קישור) מתבצע רק מדף הניהול עם מפתח service_role.

