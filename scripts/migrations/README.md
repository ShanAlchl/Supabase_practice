# Supabase Migrations

`scripts/init.sql` remains the complete bootstrap script for a fresh Supabase
project. Keep it runnable from the Supabase Dashboard SQL Editor.

For future backend changes, add an incremental migration file in this directory
using this naming pattern:

```text
YYYY-MM-DD-short-description.sql
```

Each migration should be idempotent when practical, use explicit function and
policy names, and be reflected back into `scripts/init.sql` so new projects can
still bootstrap from one script.
