# Study Hub

A single-page study hub for matric (Grade 12) — subjects, a record-exam countdown, an editable day-by-day study schedule with an hour-by-hour planner, and a weekly view. Built as one self-contained `index.html` and backed by Supabase.

## Hosting

This is a static site — the whole app is `index.html`. Deploy it by pointing any static host (e.g. Netlify) at this repo; there is no build step.

> Only the Supabase **anon** key is present in `index.html`, which is safe to expose — Row Level Security restricts every row to its owner.
