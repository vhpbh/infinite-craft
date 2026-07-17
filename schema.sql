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

create table if not exists public.api_key_rotation (
  id int primary key default 1,
  current_index int not null default 0,
  constraint single_row check (id = 1)
);
insert into public.api_key_rotation (id, current_index) values (1, 0) on conflict (id) do nothing;
alter table public.api_key_rotation enable row level security;
-- אין policy לקריאה/כתיבה עבור anon/authenticated - נגיש רק דרך ה-Edge Function עם service_role.

create table if not exists public.gemini_keys (
  id bigint generated always as identity primary key,
  api_key text not null unique,
  contributed_by text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.gemini_keys enable row level security;
-- אין policy לקריאה/כתיבה עבור anon/authenticated - נגיש רק דרך Edge Functions עם service_role.
-- הוספת מפתח מתבצעת אך ורק דרך ה-Edge Function contribute-key, שמאמת את המפתח לפני השמירה.

