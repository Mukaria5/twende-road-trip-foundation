import asyncio
import json
from playwright.async_api import async_playwright

BASE = "http://localhost:8080"


async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 390, "height": 844},
            geolocation={"latitude": -1.2921, "longitude": 36.8219, "accuracy": 8},
            permissions=["geolocation"],
        )
        page = await context.new_page()
        await page.goto(f"{BASE}/map", wait_until="domcontentloaded")
        await page.evaluate(
            """() => {
              window.__fixes = [];
              navigator.geolocation.watchPosition(
                (p) => window.__fixes.push([p.coords.latitude, p.coords.longitude, p.coords.accuracy, p.timestamp]),
                (e) => window.__fixes.push(['error', e.code]),
                { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 },
              );
            }"""
        )
        await page.wait_for_timeout(3000)
        fixes = await page.evaluate("window.__fixes")
        print("after start:", fixes)

        for i, (lat, lon) in enumerate(
            [(-1.2896, 36.8247), (-1.2871, 36.8275), (-1.2846, 36.8303)], 1
        ):
            await context.set_geolocation({"latitude": lat, "longitude": lon, "accuracy": 8})
            await page.wait_for_timeout(3000)
            fixes = await page.evaluate("window.__fixes")
            print(f"after move {i}:", fixes)

        await browser.close()


asyncio.run(main())
