import asyncio
import json
import os
import time
from pathlib import Path

from playwright.async_api import async_playwright

SCREENSHOTS = Path(__file__).parent / "screenshots"
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

BASE = "http://localhost:8080"

# Nairobi start, then steady ~150 km/h simulated moves north-east (well under
# the app's 220 km/h plausibility filter): ~0.25 km every 6 seconds.
START = (-1.2921, 36.8219)
MOVES = [
    (-1.2906, 36.8236),
    (-1.2891, 36.8253),
    (-1.2876, 36.8270),
    (-1.2861, 36.8287),
    (-1.2846, 36.8304),
    (-1.2831, 36.8321),
]


async def main():
    with open(os.path.expanduser("~/.cache/lovable-auth/session.json")) as f:
        minted = json.load(f)
    storage_key = minted["storage_key"]
    session_json = json.dumps(minted["session"])
    cookies = minted.get("cookies") or []

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 390, "height": 844},
            geolocation={"latitude": START[0], "longitude": START[1], "accuracy": 8},
            permissions=["geolocation"],
        )
        if cookies:
            await context.add_cookies([{**c, "url": BASE} for c in cookies])
        page = await context.new_page()
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

        await page.goto(BASE, wait_until="domcontentloaded")
        await page.evaluate("([k, v]) => window.localStorage.setItem(k, v)", [storage_key, session_json])
        await page.goto(f"{BASE}/routes", wait_until="networkidle")
        await page.screenshot(path=str(SCREENSHOTS / "01_routes.png"))

        # Open the first route card
        card = page.locator('a[href^="/routes/"]').filter(has_not=page.locator('a[href$="/routes/"]')).first
        href = await card.get_attribute("href")
        print("route href:", href)
        await card.click()
        await page.wait_for_load_state("networkidle")
        await page.screenshot(path=str(SCREENSHOTS / "02_route_detail.png"))

        # Plan this trip
        await page.get_by_role("link", name="Plan this trip").first.click()
        await page.wait_for_load_state("networkidle")
        await page.wait_for_selector("text=Plan your trip")
        await page.screenshot(path=str(SCREENSHOTS / "03_planner.png"))

        # Fill budget fields
        await page.get_by_label("Accommodation").fill("12000")
        await page.get_by_label("Food").fill("6000")
        await page.get_by_label("Activities & park fees").fill("3000")

        # Start trip (saves the plan)
        await page.get_by_role("button", name="Start trip").click()
        await page.wait_for_url("**/trips/active/**", timeout=15000)
        await page.wait_for_selector("text=Distance driven")
        print("active trip url:", page.url)
        await page.screenshot(path=str(SCREENSHOTS / "04_active_before_start.png"))

        # Start recording (this also marks the trip active)
        await page.get_by_role("button", name="Start trip").click()
        await page.wait_for_selector("text=Recording your location", timeout=30000)
        await page.screenshot(path=str(SCREENSHOTS / "05_recording.png"))

        # Simulate GPS moves (~0.25 km each, 6 s apart => ~150 km/h, plausible)
        for i, (lat, lon) in enumerate(MOVES, 1):
            await context.set_geolocation({"latitude": lat, "longitude": lon, "accuracy": 8})
            await page.wait_for_timeout(6000)
        # wait until live distance exceeds 0
        txt = ""
        for _ in range(30):
            txt = await page.locator("text=Distance driven").locator("xpath=..").inner_text()
            if "km" in txt and not txt.startswith("0.0 km"):
                break
            await page.wait_for_timeout(1000)
        print("distance metric:", txt.replace("\n", " | "))
        await page.screenshot(path=str(SCREENSHOTS / "06_distance.png"))

        # Add stop
        await page.get_by_role("button", name="Add stop").click()
        await page.get_by_label("Stop name").fill("Test viewpoint")
        await page.get_by_role("button", name="Save stop").click()
        await page.wait_for_selector("text=Record a stop", state="detached", timeout=15000)
        print("stop saved (panel closed)")

        # Add note
        await page.get_by_role("button", name="Add note").click()
        await page.get_by_label("Note", exact=True).fill("Road was smooth all the way.")
        await page.get_by_role("button", name="Save note").click()
        await page.wait_for_selector("text=Write a note", state="detached", timeout=15000)
        print("note saved")

        # Add fuel
        await page.get_by_role("button", name="Add fuel").click()
        await page.get_by_label("Litres").fill("30")
        await page.get_by_label("Amount paid, KES (optional)").fill("5400")
        await page.get_by_role("button", name="Save fuel").click()
        await page.wait_for_selector("text=Record fuel bought", state="detached", timeout=15000)
        print("fuel saved")

        # Add photo (tiny valid png)
        png = bytes.fromhex(
            "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
            "0000000a49444154789c6360000002000154a24f5d0000000049454e44ae426082"
        )
        tmp = Path("/tmp/test-photo.png")
        tmp.write_bytes(png)
        await page.get_by_role("button", name="Add photo").click()
        await page.locator("#photo-file").set_input_files(str(tmp))
        await page.get_by_label("Caption (optional)").fill("Test snapshot")
        await page.get_by_role("button", name="Upload photo").click()
        await page.wait_for_selector("text=Add a photo", state="detached", timeout=20000)
        print("photo saved")

        # Recorded-so-far tallies
        await page.wait_for_timeout(1500)
        tally = await page.locator("section:has-text('Recorded so far')").inner_text()
        print("TALLY:", " | ".join(tally.split("\n")))
        await page.screenshot(path=str(SCREENSHOTS / "07_records.png"))

        # Finish trip
        await page.get_by_role("button", name="Finish trip").first.click()
        await page.get_by_role("button", name=re_escape("Finish trip")).last.click()
        await page.wait_for_url("**/trips/**", timeout=20000)
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=str(SCREENSHOTS / "08_trip_record.png"))
        record_text = await page.locator("body").inner_text()
        for needle in ["Plan vs. reality", "Test viewpoint", "Road was smooth", "30", "Photo"]:
            print(f"record page has '{needle}':", needle in record_text)

        # My trips list
        await page.goto(f"{BASE}/trips", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=str(SCREENSHOTS / "09_my_trips.png"))
        trips_text = await page.locator("body").inner_text()
        print("my trips shows completed trip:", "Completed" in trips_text)

        print("console errors:", errors[:5] if errors else "none")
        await browser.close()


def re_escape(s: str) -> str:
    return "".join("\\" + c if c in ".*+?^$()[]{}|" else c for c in s)


if __name__ == "__main__":
    t0 = time.time()
    asyncio.run(main())
    print(f"done in {time.time() - t0:.0f}s")
