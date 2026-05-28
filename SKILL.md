# hardcover-cli — Agent Usage Guide

This CLI wraps the Hardcover book tracking API. All commands output JSON to stdout. Use `--example` to inspect the schema for any command without making an API call.

## Setup check

```bash
bun src/index.ts auth status
```

If this fails with "No token found", the token is not configured. Token resolution order: system keychain → `HARDCOVER_API_TOKEN` env var → `.env` file in cwd.

## Running commands

```bash
bun src/index.ts <command> [subcommand] [flags]
```

## Command reference

### auth

```bash
auth set               # Interactive: prompts for token, stores in keychain
auth remove            # Deletes stored token
auth status            # Returns: { username, maskedToken }
```

### user

```bash
user me                # Returns full user profile object
```

### books

```bash
books search --query <str>                         # Required
            [--type Book|Author|Series]            # Default: Book
            [--limit <n>]                          # Default: 10, max: 100
# Returns: { ids: number[], results: object[] }

books get --id <int>
# Returns: { id, title, subtitle, pages, rating, contributions: [{ author: { name } }] }
# Returns null if not found (exit code 1)
```

### library

Status values: `want` | `reading` | `read` | `paused` | `dnf` | `ignored`

Note: `library add` only accepts `want`, `reading`, or `read`. The other statuses (`paused`, `dnf`, `ignored`) are only available via `library update`.

```bash
library list [--status <status>] [--limit <n>]
# Returns: [{ id, status, rating, date_added, book: { id, title } }]
# id here is the library entry ID, not the book ID

library add --book-id <int> [--status want|reading|read]
# Returns: { success: true, id: <library_entry_id> }

library update --id <library_entry_id>
              [--status <status>]
              [--rating <0–5, multiples of 0.5>]
              [--review <str>]
# At least one of --status, --rating, --review is required
# Returns: { success: true, id }

library remove --id <library_entry_id>
# Returns: { success: true, id }
```

### goals

```bash
goals list
# Returns: [{ id, metric, goal, progress, state, start_date, end_date }]

goals create --metric books|pages
             --target <int>
             --start <YYYY-MM-DD>
             --end <YYYY-MM-DD>
# Returns: { success: true, id }

goals update --id <int> --target <int>
# Returns: { success: true, id }

goals delete --id <int>
# Returns: { success: true, id }
```

## Tips for agents

- Use `--example` on any command to see the exact JSON shape without auth or network.
- `library list` returns library entry IDs (not book IDs). Use these IDs for `library update` and `library remove`.
- `books search` returns book IDs. Use these with `library add --book-id`.
- **Page progress** is stored via a separate `user_book_reads` record, not directly on the user_book.
  To set or update page progress:
  1. Check if a read session already exists for the library entry
  2. If none exists, **insert** one:
  ```graphql
  mutation InsRead($userBookId: Int!, $progressPages: Int!) {
    insert_user_book_read(
      user_book_id: $userBookId
      user_book_read: { progress_pages: $progressPages, started_at: "<YYYY-MM-DD>" }
    ) { id user_book_read { id progress_pages } }
  }
  ```
  3. If one exists but needs replacing, delete it first via `delete_user_book_read(id: <session_id>)`
  Where `userBookId` is the **library entry ID** (not the book ID). Note: `upsert_user_book_reads` and `update_user_book_read` do NOT support `progress_pages` — only `insert_user_book_read` with `DatesReadInput` works.
- Pipe output through `jq` for filtering: `bun src/index.ts library list | jq '.[] | select(.status == "reading")'`
- All errors go to stderr. Check exit code: 0=success, 1=input/auth error, 2=API error, 3=network failure.
- Rate limit: 60 requests/minute.
