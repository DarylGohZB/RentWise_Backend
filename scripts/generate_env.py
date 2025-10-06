#!/usr/bin/env python3
"""Generate a .env file template with password fields left empty.

Usage:
  python3 scripts/generate_env.py           # prints warning if .env exists
  python3 scripts/generate_env.py --show    # print template to stdout
  python3 scripts/generate_env.py --force   # overwrite .env with template
  python3 scripts/generate_env.py -o .env.example

The script intentionally leaves password and secret fields empty so you can fill them
securely and avoid committing secrets to source control.
"""

from pathlib import Path
import argparse
import textwrap

TEMPLATE = textwrap.dedent("""
# Generated .env (passwords and secrets left empty — fill them before use)

# MySQL defaults
MYSQL_ROOT_PASSWORD=
MYSQL_DATABASE=rentwisesg
MYSQL_USER=rentuser
MYSQL_PASSWORD=

# Node service defaults
NODE_ENV=development
DB_HOST=mysqldb
DB_USER=${MYSQL_USER}
DB_PASSWORD=
DB_NAME=${MYSQL_DATABASE}

# Node app port (exposed in compose)
NODEJS_PORT=3000

# JWT configuration
# Strong secret required in production
JWT_SECRET=
# Token TTL (e.g. 1h, 24h)
JWT_TTL=1h
""")


def main():
    parser = argparse.ArgumentParser(description='Generate .env template (passwords/secrets left empty)')
    parser.add_argument('-o', '--output', default='.env', help='Output file path (default: .env)')
    parser.add_argument('-f', '--force', action='store_true', help='Overwrite existing file')
    parser.add_argument('-s', '--show', action='store_true', help='Print template to stdout instead of writing')
    args = parser.parse_args()

    out_path = Path(args.output)

    if args.show:
        print(TEMPLATE)
        return

    if out_path.exists() and not args.force:
        print(f"{out_path} already exists. Use --force to overwrite or --show to preview.")
        return

    out_path.write_text(TEMPLATE)
    print(f"Wrote {out_path.resolve()} (passwords and secrets left empty).")


if __name__ == '__main__':
    main()
