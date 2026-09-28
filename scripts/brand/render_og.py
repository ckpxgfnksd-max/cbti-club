#!/usr/bin/env python3
"""Dev-time renderer for cbti.club's social card (assets/cbti/og.png).

Not part of the build or CI. Needs Playwright with system Chrome, e.g.
  ~/.agent-context/tools/playwright-test-skill/.venv/bin/python scripts/brand/render_og.py
It serves the repository root on 127.0.0.1:8819 so the card uses the self-hosted fonts and the
same type-map renderer as the site (data.js + app.js).
"""
import functools
import http.server
import pathlib
import threading

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "cbti" / "og.png"
PORT = 8819


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    handler = functools.partial(Quiet, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(channel="chrome")
            page = browser.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=1)
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto(f"http://127.0.0.1:{PORT}/scripts/brand/og.html", wait_until="networkidle")
            page.evaluate("document.fonts.ready")
            page.wait_for_timeout(300)
            OUT.parent.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(OUT), clip={"x": 0, "y": 0, "width": 1200, "height": 630})
            browser.close()
            if errors:
                raise SystemExit(f"page errors: {errors}")
    finally:
        server.shutdown()
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
