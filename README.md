# hardcover-cli

A command-line interface for the [Hardcover](https://hardcover.app) book tracking API. Designed for scripting and AI agent use — outputs JSON by default, with `--pretty` for human-readable summaries.

## Requirements

- Node.js 18+
- [Bun](https://bun.sh) (package manager + runtime)

## Installation

```bash
git clone <repo>
cd hardcover-cli
bun install
```

## Authentication

Get your API token from [hardcover.app/account/api](https://hardcover.app/account/api).

**Recommended:** store it in the system keychain:
```bash
bun src/index.ts auth set
```

**Alternative:** set the environment variable:
```bash
export HARDCOVER_API_TOKEN=<your_token>
```

**Or:** add it to a `.env` file in the working directory:
```
HARDCOVER_API_TOKEN=<your_token>
```

> **Note:** The API requires a `Bearer` prefix on the token. The CLI handles this automatically — just provide the raw token value.

Verify authentication:
```bash
bun src/index.ts auth status
# {"username":"yourname","maskedToken":"****abcd"}
```

## Usage

```
Usage: hardcover [options] [command]

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  auth            Manage API token
  books           Book search and lookup
  library         Manage your reading library
  goals           Manage reading goals
  user            User profile operations
```

Every command accepts two shared flags:
- `--example` — print the expected JSON structure and exit (no API call)
- `--pretty` — print a human-readable summary instead of JSON

### Auth

```bash
hardcover auth set             # Prompt for token and store in keychain
hardcover auth remove          # Delete stored token
hardcover auth status          # Verify token is valid
```

### User

```bash
hardcover user me              # Get your profile
hardcover user me --pretty
```

### Books

```bash
# Search (--type: Book | Author | Series, default: Book)
hardcover books search --query "Dune"
hardcover books search --query "Frank Herbert" --type Author --limit 5

# Get a book by ID
hardcover books get --id 1553
hardcover books get --id 1553 --pretty
```

### Library

```bash
# List books (--status: want | reading | read | paused | dnf | ignored)
hardcover library list
hardcover library list --status reading --pretty

# Add a book (--status: want | reading | read, default: want)
hardcover library add --book-id 1553
hardcover library add --book-id 1553 --status reading

# Update an entry (library entry ID, not book ID)
hardcover library update --id 101 --status read
hardcover library update --id 101 --rating 4.5
hardcover library update --id 101 --rating 4.5 --review "A masterpiece."

# Remove an entry
hardcover library remove --id 101
```

### Goals

```bash
# List goals
hardcover goals list
hardcover goals list --pretty

# Create a goal
hardcover goals create --metric books --target 52 --start 2026-01-01 --end 2026-12-31

# Update a goal
hardcover goals update --id 1 --target 24

# Delete a goal
hardcover goals delete --id 1
```

## Output format

Default output is newline-delimited JSON to stdout, suitable for piping:

```bash
hardcover books search --query "Dune" | jq '.results[].title'
hardcover library list | jq '[.[] | select(.status == "reading")]'
```

Errors are written to stderr. Exit codes:
- `0` — success
- `1` — bad input or missing token
- `2` — API error (auth failure, rate limit, server error)
- `3` — network failure

## Development

```bash
bun run test          # Run test suite
bun run test:watch    # Watch mode
bun run typecheck     # TypeScript type check
```

To run the smoke test against the real API:
```bash
HARDCOVER_API_TOKEN=<token> bun run test tests/smoke/
```
