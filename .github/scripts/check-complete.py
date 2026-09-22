#!/usr/bin/env python3
"""Exit 0 when every configured restaurant has a priced item for the given date.

Exit 1 when some are missing (their ids go to stdout), exit 2 on a broken
config read. The 2 matters: an empty id list would otherwise look like
"nothing missing" and silence the scraper for the whole day.
"""
import json
import re
import sys
from pathlib import Path

date = sys.argv[1]
root = Path(__file__).resolve().parents[2]

ids = re.findall(r"id:\s*'([^']+)'", (root / 'lib/config/restaurants.ts').read_text(encoding='utf-8'))
if not ids:
    print('no restaurant ids parsed from lib/config/restaurants.ts', file=sys.stderr)
    sys.exit(2)

menu_file = root / f'public/data/menus/{date}.json'
if not menu_file.exists():
    print(' '.join(ids))
    sys.exit(1)

try:
    menus = json.loads(menu_file.read_text(encoding='utf-8'))
except json.JSONDecodeError as exc:
    print(f'{menu_file} is not valid JSON: {exc}', file=sys.stderr)
    sys.exit(2)

by_id = {m.get('restaurantId'): m for m in menus}


def has_priced_item(menu):
    return any((item.get('price') or 0) > 0 for item in (menu or {}).get('items') or [])


missing = [rid for rid in ids if not has_priced_item(by_id.get(rid))]
print(' '.join(missing))
sys.exit(1 if missing else 0)
