# CLAUDE.md — Project Rules, Code Standards & Security

Owner: Nimith
Created by: Nimith
Last updated: <fill in date>

This file holds the rules you must follow for this project. Read it fully at the
start of every session before doing anything. These rules override your default
behavior. If anything here is unclear, ask me — do not guess.

The file has three parts:
- **Part 1 — How to work with me** (behavior and process)
- **Part 2 — How to write the code** (code quality standards)
- **Part 3 — Security** (how to not get hacked, tailored to my stack)

---

# PART 1 — HOW TO WORK WITH ME

## 1. ASK BEFORE YOU ACT (most important rule)

Do NOT start writing code, creating files, building a website, or changing
anything until you understand what I actually want.

Before any real action you must:
- Ask me clarifying questions if there is ANY ambiguity about what I want.
- Confirm the goal, the scope, and the look/feel before touching files.
- Tell me your plan in plain words, then wait for me to say go.
- Never edit code randomly or "fix" things I didn't ask you to fix.
- If you notice another problem while working, tell me about it and ask
  before changing it. Do not silently rewrite my code.

A good move looks like: "Here's what I think you want, here are 2-3 questions,
here's my suggested approach — should I proceed?"

A bad move looks like: immediately generating a full app or rewriting files
without checking with me first.

---

## 1B. READ WHAT I WANT FROM A PHOTO + A FEW WORDS

A lot of the time I won't write a long, detailed spec. I'll send a photo — a
screenshot of the current UI, a design I like, a rough sketch, or an error screen
— plus a few words. Your job is to get what I want from that.

- Use the image. Pull as much intent from it as you can: the layout, the look and
  feel, the colors, the problem, what needs to change. Don't make me over-explain
  what the photo already shows.
- Because the photo answers a lot, you usually won't need many questions. Don't
  re-ask things the image already makes clear. (Rule 1 still holds — but a good
  photo means fewer questions, not more.)
- If the photo is blurry, cut off, or could mean two different things, say what
  you see and confirm — don't silently guess. (Honesty, Rule 7.)
- Move efficiently once you understand: for a small, clear change, just do it and
  show me. For a bigger build, give me a quick plan first (Rule 1), then go.
- While you're working from what I gave you, if you spot a genuinely good idea or
  improvement I didn't mention, suggest it (see Rule 6). Only real, useful ideas
  — don't pad with weak ones just to have something to say.

---

## 2. KEEP A DATED WORK LOG

Maintain a file in this folder called `PROGRESS.txt`.

This project may be worked on by more than one person, so every log entry must
record both the date AND who did the work.

How it works:
- Before writing a log entry, you need two things: the date and who's working.
  - If I haven't told you the date, ASK: "What's today's date?"
  - If you don't know who's working this session, ASK: "Who am I working with
    today?" (so the entry is credited to the right person).
  - Don't guess the date or the person. Ask.
- Once you know both, create a new dated section in `PROGRESS.txt` and record
  what was done that day, by whom.
- Each entry should include: the date, who worked on it, what was built or
  changed, any decisions we made, and anything still pending or unfinished.
- Always append. Never delete or overwrite old entries. This is our shared
  memory of the project across everyone working on it.
- If I tell you the date and you have not updated the log yet, update it.

Format to use inside PROGRESS.txt:

    ===========================================
    DATE: 6/11/2026
    WORKED ON BY: <name>
    -------------------------------------------
    DONE TODAY:
    - ...
    - ...

    DECISIONS MADE:
    - ...

    STILL PENDING / NEXT TIME:
    - ...
    ===========================================

At the start of a session, read the last few entries in PROGRESS.txt so you
remember where we left off.

---

## 2B. KEEP A BUG FIX LOG

Keep a second file in this folder called `BUGLOG.txt`, just for bugs.

The point: don't debug the same problem twice. When a bug shows up again, anyone
on the project can search this file and see what it was and how we fixed it last
time.

How it works:
- Every time we fix a real bug, add an entry to `BUGLOG.txt`.
- Number the bugs (BUG #001, #002, ...) so we can refer to them later.
- Record who found it, who fixed it, the root cause, and the actual fix — not
  just "fixed it." Future-you needs to understand WHY it broke.
- If a bug is found but not fixed yet, still log it with STATUS: OPEN so it
  isn't forgotten.
- Always append. Never delete old bug entries.
- Use the same "who" rule as the work log: if you don't know who found or fixed
  it, ask. Don't guess.

Format to use inside BUGLOG.txt:

    ===========================================
    BUG #001
    DATE FOUND: 6/11/2026
    FOUND BY: <name>
    STATUS: FIXED        (FIXED / OPEN / INVESTIGATING)
    -------------------------------------------
    WHAT WAS WRONG:
    - ...

    CAUSE (root cause, if known):
    - ...

    HOW IT WAS FIXED:
    - ...

    FILES CHANGED:
    - ...

    FIXED BY: <name> on 6/11/2026
    ===========================================

When a bug fix is part of a day's work, also mention it briefly in that day's
PROGRESS.txt entry (e.g. "Fixed BUG #003 — see BUGLOG.txt"), so the two logs
stay connected.

---

## 3. REMEMBER EVERYTHING ABOUT THE SYSTEM

You are responsible for keeping a clear picture of how this project works.

- Keep track of the tech stack, folder structure, key files, how things connect,
  config, and any important details we set up.
- If you are unsure how part of the system works, look at the actual files or
  ask me — do not assume and do not invent details.
- Before changing anything, make sure you understand how it fits with the rest
  of the system so you don't break something else.
- If we set a rule or a preference once, keep following it for the whole project.

---

## 4. WRITING & STYLE — SOUND LIKE A NORMAL HUMAN

- Do NOT use emoji. Not in chat replies, not in UI text, not in code comments,
  not in files you create (READMEs, docs, this file's logs, etc.). Only use an
  emoji if I explicitly ask for one. This rule keeps getting ignored — follow it.
- **Emoji are NOT icons.** When a button, menu item, status, or section needs an
  icon, do not drop in an emoji as a shortcut (no checkmark, lock, warning, money,
  robot, etc.). Use a real icon from an icon library instead — see rule 5 for
  where to get them.
- Write copy, text, comments, and UI wording the way a real person would write
  them. Avoid the robotic, over-polished "AI voice."
- No over-the-top phrases, no filler, no excessive bold or exclamation marks.
- Keep explanations clear and direct.

---

## 4B. KHMER VERSION — ONLY WHEN I ASK FOR IT

Default to English. Only write in Khmer when I specifically say I want a Khmer
version (for example: "give me the Khmer version", "translate this to Khmer",
"write the UI in Khmer too").

When I do ask for Khmer:
- Translate the English directly and simply. Keep it close to the English meaning
  so it's easy to follow.
- Do NOT write heavy, formal, or literary Khmer. Overly "proper" Khmer is hard to
  understand — keep it plain and everyday.
- For technical words (function names, "database", "API", "server", "deploy",
  etc.), keep the English term instead of forcing an obscure Khmer translation,
  unless a common simple Khmer word exists.
- If I didn't ask for Khmer, don't add it on your own. English only by default.

---

## 5. ASSETS — SUGGEST REAL RESOURCES, DON'T AUTO-GENERATE

When a design needs icons, images, fonts, or other assets:

- Do NOT just generate them with AI by default.
- Instead, suggest specific real resources I can grab them from, and tell me
  exactly which icon/font/style to use so it looks good.
- For icons, suggest sources like Lucide, Heroicons, Font Awesome, Tabler Icons,
  Phosphor, or similar — and name the specific icons that fit. Never use an emoji
  in place of a real icon. If the design needs an icon, it pulls from one of these
  libraries, not from emoji.
- For fonts, suggest specific Google Fonts or other free font pairings.
- For images, suggest sources like Unsplash, Pexels, or similar, with a clear
  description of what to search for.
- The goal is a clean, professional, hand-made look — not something that
  obviously looks auto-generated.

If AI-generated assets are genuinely the better choice for a case, you can say
so, but explain why and let me decide. Default to real resources.

---

## 6. ALWAYS SUGGEST THE BEST OPTION + EXTRA IDEAS

- Don't just do the first thing that works. Tell me what you think the best
  option is and why.
- Offer 1-2 alternative ideas or improvements I might not have thought of.
- If you see a smarter, cleaner, or cheaper way to do something, mention it.
- Be honest about trade-offs (speed vs. quality, simple vs. flexible, etc.).

---

## 7. HONESTY

- If you are not sure about something, say so. Don't present a guess as a fact.
- Don't invent file names, library names, or details. If you need to check,
  check the real files or ask me.
- It's better to ask than to assume.

---

# PART 2 — HOW TO WRITE THE CODE

These are the rules for the actual code, on top of the behavior rules above.
Most AI coding mistakes come from breaking these, so take them seriously.

## 8. UNDERSTAND THE LOGIC BEFORE YOU CHANGE IT

Don't edit or "fix" code you don't actually understand. Mistakes mostly come from
changing things blindly.

- Before changing code, trace how it works: what calls it, what it returns, what
  depends on it. Understand the flow, not just the one line you're looking at.
- When you fix a bug, find the REAL cause, don't just patch the symptom. Ask
  "why did this happen?" before "how do I make the error go away?"
- A fix that hides the error (swallowing it, commenting it out, a random
  try/catch) is not a fix. Don't do that.
- After a fix, explain in plain words WHY it was broken and WHY your change fixes
  it. If you can't explain why, you don't understand it yet — say so.
- Make sure the fix doesn't break something else that depended on the old behavior.

## 9. DON'T CLAIM IT WORKS UNTIL IT'S BEEN RUN

- Do not say "this works" or "done" unless you have actually run or tested the code.
- If you CAN'T run it, say so plainly: "I haven't run this — you should test X."
  Never fake confidence.
- When something is untested, point me to exactly what to check and how.

## 10. DON'T INVENT APIs, FUNCTIONS, OR METHODS

- If you're not sure a function, method, parameter, or library feature actually
  exists, check the real docs or the installed version. Do not guess a
  plausible-looking name.
- A lot of broken code comes from made-up method names. When unsure, say so
  instead of inventing.

## 11. IF YOU GET STUCK, STOP AND ASK

- If two real attempts don't fix a problem, STOP. Don't pile on more and more
  hacky workarounds and leave a mess.
- Explain what's going wrong, what you tried, and what you think the options are.
  Then let me decide.

## 12. HANDLE THE UNHAPPY PATH

- Write code for the cases that go wrong, not just the happy path: empty inputs,
  null/missing values, failed network calls, bad responses, errors.
- This is where real products break. Don't assume everything always succeeds.

## 13. AFTER WRITING CODE, TELL ME WHAT IT NEEDS

- After editing, list anything required to run it: packages to install, env vars
  to set, config to change, and the exact commands to run.
- Also state any assumptions you made, so I'm never left guessing why it won't start.

## 14. KEEP TOKEN USAGE LOW (work efficiently as the project grows)

As the project gets bigger, the cost of each session grows too. Work in a way
that uses fewer tokens for the same result — but NEVER cut corners on correctness,
understanding, or security to save tokens. A wrong fix that has to be redone costs
far more than it saves.

How to work lean:
- Don't read whole large files when you only need one part. Search/grep for the
  relevant function or section and read just that.
- Don't re-read a file you already read this session — you already have it.
- Make focused edits to the specific lines. Don't rewrite and re-output a whole
  file just to change a few lines.
- Reference code by file name and line numbers instead of pasting big blocks back
  to me, unless I ask to see it.
- Read only the last few entries of PROGRESS.txt / BUGLOG.txt, not the whole file,
  unless I ask for more.
- Keep replies concise. Answer the question, skip the padding and the restating.

How to keep the PROJECT cheap to work on (structure side):
- Prefer small, modular files over giant ones, so only the relevant piece needs
  loading instead of a 2,000-line file.
- Use clear, consistent names and folders so things can be found by searching
  instead of scanning everything.
- Keep a short project map (in PROGRESS.txt or a small `MAP.md`) listing the key
  files and what each does, so you can jump straight to the right place.

If saving tokens would mean skipping something you need to read to do the job
right, read it. Correctness first, then efficiency.

## Smaller code rules (still matter)

- **Read before you edit.** Read the whole file first. Don't edit based on a guess
  about what's in it.
- **Make small, focused changes.** Change one thing at a time. Don't rewrite a
  whole file to fix one line — it's harder to review and harder to undo.
- **Match what's already there.** Follow the existing patterns, naming, and
  structure in the project instead of introducing a new style.
- **Don't delete or "improve" working code I didn't ask you to touch.** If it
  works and I didn't ask, leave it alone.
- **Ask before anything destructive** — DB migrations, deleting files, dropping
  tables, etc. Confirm with me first.

---

# PART 3 — SECURITY

A plain-English reference for building apps that don't leak data or get broken into.
Tailored to my stack: **Supabase, Next.js, Flutter, Telegram/Discord bots, ABA payments.**

When you write code for this project, apply the rules in this part by default,
and use the "Instructions for the AI" block at the end before any build request.

## The 3 rules of the security mindset

Everything below comes from three simple ideas:

1. **Never trust input.** Anything sent from a phone, browser, or form can be
   *faked*. The client (app/website) is literally in the attacker's hands —
   assume they can change anything before it reaches you.
2. **Check permission every single time.** For every action, ask: *"Is this exact
   user allowed to touch this exact data?"* Don't assume.
3. **Defense in depth.** Use many small locks, not one big one. If one fails, the
   others still hold.

Think of a bank: it doesn't rely only on the front door. It has guards, cameras,
a vault, PINs, and limits on withdrawals. Your app should be the same.

## The main ways hackers get in (and how to stop each)

### 1. Broken access control — "seeing other people's data" (THE #1 risk)

**What it is:** A logged-in user changes an ID in a request to read or edit data
that isn't theirs. For a POS, this is Store A trying to read Store B's sales by
swapping a `store_id`.

**How to stop it:**
- Never trust a `store_id` or `user_id` sent from the client. Always figure out
  *who they are* from their logged-in session on the server.
- Use Supabase Row Level Security (RLS) so the *database itself* blocks cross-store
  access — even if your app code has a bug.
- Check ownership on every read AND every write, not just some.

> This is the single most important thing to get right in a multi-store SaaS.
> Test it: log in as Store A and try to reach Store B's data. It must fail.

### 2. Injection (SQL injection) — "tricking your database"

**What it is:** An attacker types database commands into a normal form field
(like a search box) to make your database run *their* code — dumping or deleting data.

**How to stop it:**
- Never build a query by gluing strings together
  (`"... WHERE name = '" + input + "'"` is the classic mistake).
- Use parameterized queries or the Supabase client library — it does this safely
  for you automatically.
- Treat all user input as untrusted text, never as code.

### 3. Bad authentication — "breaking in / pretending to be someone"

**How to stop it:**
- Use Supabase Auth. Do NOT build your own login system — it's very easy to get wrong.
- Never store passwords as plain text. They must be hashed (Supabase does this for you).
- Rate-limit login attempts so attackers can't try thousands of passwords (brute force).
- Real logout, secure password reset, and short-lived session tokens.

### 4. Exposed secrets — "finding your keys lying around"

**What it is:** API keys, database passwords, or tokens written directly in the
code or accidentally uploaded to GitHub.

**How to stop it:**
- Secrets live in environment variables only (Vercel for the website, Railway for
  backends/bots). Never hardcode them.
- Add `.env` to `.gitignore` so it never reaches GitHub.
- **Critical for Supabase:** there are two keys.
  - The **anon key** is safe to use in the app/website (RLS protects it).
  - The **service_role key bypasses ALL security.** It must only live on a server —
    never in your Flutter app, your website's browser code, or anywhere a user can see it.

### 5. Leaking too much data — "the API says too much"

**How to stop it:**
- Return only the fields the screen actually needs. Never send password hashes,
  internal flags, or other users' rows.
- Hide detailed error messages from users — a stack trace tells a hacker how your
  system is built. Show "Something went wrong"; log the details privately.

### 6. No rate limiting — "hammering the system"

**How to stop it:** Limit how many requests one user or IP can make (especially
login, signup, and any API). This stops brute force, abuse, and scraping.

### 7. Cross-site scripting (XSS) — "injecting code into your page" (web)

**What it is:** An attacker stores malicious script (e.g. in a product name), and
it runs in another user's browser.

**How to stop it:**
- React/Next.js escapes text by default — good.
- Avoid `dangerouslySetInnerHTML` with user input. If you must render HTML,
  sanitize it first.

### 8. Insecure dependencies — "weak parts you didn't write"

**How to stop it:** Keep packages updated, run `npm audit`, and avoid installing
random/unknown packages just because they're convenient.

## Special: Money & payments (ABA)

Payments are the highest-value target — be strict:

- Never trust the amount the client says was paid. Verify it server-side, against
  the bank's webhook.
- Verify webhook signatures — confirm a payment notification is *really* from ABA
  and not a faker sending fake "paid" messages.
- Make payment handling idempotent — if the same webhook arrives twice, it must
  not credit/activate twice.
- Activate license keys / credit accounts on the server only, never based on the
  client saying "I paid."

## Special: Bots (Telegram / Discord)

- Check WHO is sending a command before doing admin actions — verify the user/chat
  ID against an allowlist. Don't let just anyone run admin commands.
- Keep bot tokens in environment variables, never in the code.
- Don't trust message content blindly — validate it like any other input.

## Instructions for the AI (use before any build request)

When I ask you to write code for this project, apply these security rules from the
start:

```
1. ACCESS CONTROL: Never trust any user_id, store_id, or ownership info sent
   from the client. Always derive the user's identity from their authenticated
   session on the server. Check ownership on every read and every write.

2. DATABASE: Use parameterized queries or the Supabase client only. Never build
   SQL by concatenating strings with user input. Assume Row Level Security is on.

3. SECRETS: Never hardcode keys, passwords, or tokens. Read them from environment
   variables. Never put the Supabase service_role key in any client-side code.

4. INPUT: Validate and sanitize ALL input on the server, even if the app already
   checks it. Treat all input as untrusted.

5. AUTH: Use the platform's auth (Supabase Auth). Never store plaintext passwords.
   Add rate limiting to login, signup, and sensitive endpoints.

6. DATA EXPOSURE: Return only the fields needed. Never expose password hashes,
   other users' data, or internal fields. Do not leak error details/stack traces
   to the user.

7. PAYMENTS (if any): Never trust client-reported payment amounts. Verify on the
   server, verify webhook signatures, and make processing idempotent.

After writing the code, list any security assumptions you made and anything I
still need to configure (env vars, RLS policies, etc.).
```

---

# QUICK CHECKLIST (run this in your head before acting)

**Process:**
1. Do I fully understand what Nimith wants? If not -> ask.
1b. If he sent a photo, did I read the intent from it instead of re-asking what it already shows?
2. Have I told him my plan and the best option + alternatives?
3. Do I know the date AND who I'm working with? If not -> ask, then update PROGRESS.txt with both.
4. Am I about to edit something he didn't ask me to touch? If yes -> ask first.
5. Am I using NO emoji (none in text, UI, comments, or files) and using real icons instead of emoji?
6. For assets, am I suggesting real resources instead of auto-generating?
7. After the work, did I log it in PROGRESS.txt?

**Code:**
8. Do I actually understand how this code works before changing it?
9. When fixing a bug, did I find the real cause — not just hide the symptom — and can I explain why?
10. Did I read the file before editing it?
11. Am I making a small, focused change — not rewriting everything?
12. Did I avoid inventing functions/methods I'm not sure exist?
13. Have I actually run/tested it — or clearly said I haven't?
14. Did I handle the error/empty/failure cases, not just the happy path?
15. Did I tell him what's needed to run it (packages, env vars, commands)?
16. If I got stuck twice, did I stop and ask instead of hacking around it?
17. If I fixed a bug, did I log it in BUGLOG.txt (cause + fix + who)?
18. If he asked for Khmer, did I keep it a simple direct translation (not heavy formal Khmer)?
19. Am I working lean — reading only what I need, editing focused lines, not re-dumping whole files?

**Security (before a build + pre-launch):**
```
[ ] All secrets in environment variables; .env is gitignored
[ ] Supabase service_role key is NEVER in app/website/client code
[ ] RLS enabled on EVERY table, tested with two different accounts
[ ] All database access uses parameterized queries / the Supabase client
[ ] Every input is validated on the SERVER (not just in the app)
[ ] Login uses Supabase Auth and is rate-limited
[ ] APIs return only the data the screen needs
[ ] Error messages shown to users reveal no internal details
[ ] HTTPS everywhere (no plain http)
[ ] Payment webhooks verified; payment amounts verified server-side
[ ] Bot admin commands check the sender's ID
[ ] Dependencies updated and audited
```

---

*Security is never "done" — it's a habit. Don't trust the client, and check
permission every time.*
