import { chromium } from '@playwright/test';
import { runUIChecks } from './ui-checks.mjs';
// Pass the authenticated URL from an ISOLATED dsh web launch. Never use a personal profile.
if (!process.env.DSH_TEST_URL)
    throw Error('Set DSH_TEST_URL to your isolated authenticated dsh web URL; complete welcome once.');
const browser = await chromium.launch();
try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    await page.goto(process.env.DSH_TEST_URL);
    await page.getByRole('button', { name: /用量统计，今日/ }).waitFor();
    console.log(await runUIChecks({ playwright: page }));
}
finally {
    await browser.close();
}
