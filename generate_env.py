#!/usr/bin/env python3
#Generate a .env file template with password fields left empty.

from pathlib import Path
import argparse
import textwrap

TEMPLATE = textwrap.dedent("""
# Generated .env fill in missing env variables here:
#Mysql database
MYSQL_PASSWORD=
MYSQL_ROOT_PASSWORD=
# JWT configuration
# Strong secret required in production
JWT_SECRET=
# Token TTL (e.g. 1h, 24h)
JWT_TTL=1h
# Mailgun (for sending OTPs)
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
# Redis connection (optional override). Default used in code: redis://redis:6379
REDIS_URL=redis://redis:6379
#_________________________
#Mysql database
MYSQL_DATABASE=rentwiseDB
MYSQL_USER=rentuser
DB_PORT=3307
                           
#NodeJS                 
NODE_ENV=development
DB_HOST=rentwiseDB
DB_USER=${MYSQL_USER}
DB_PASSWORD=${MYSQL_PASSWORD}
DB_NAME=${MYSQL_DATABASE}

# Application port
NODEJS_PORT=3000
""")


def main():
    parser = argparse.ArgumentParser(description='Generate .env template (passwords left empty)')
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
    print(f"Wrote {out_path.resolve()} (password fields left empty).")


if __name__ == '__main__':
    main()
