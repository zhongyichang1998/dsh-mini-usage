// Shared browser checks: usable with Codex CUA tab or a Playwright Page adapter.
import assert from 'node:assert/strict';
export async function runUIChecks(tab) {
    const checks = [];
    const trigger = tab.playwright.getByRole('button', { name: /用量统计，今日/ });
    if (await trigger.getAttribute('aria-expanded') === 'true')
        await trigger.press('Escape');
    await trigger.press('Enter');
    const dialog = tab.playwright.getByRole('dialog', { name: '用量统计', exact: true });
    assert.equal(await dialog.isVisible(), true);
    checks.push('Keyboard Enter opens');
    assert.equal(await tab.playwright.locator('.dmu-cell').count(), 84);
    checks.push('7 x 12 heatmap');
    const panelText = await dialog.innerText();
    assert.ok(panelText.includes('今日用量') && panelText.includes('本月累计') && panelText.includes('使用模型'));
    assert.ok(!/Today|Input|Output|Last 12 weeks|Synced/.test(panelText));
    checks.push('Chinese interface and model section');
    const originalToday = await tab.playwright.locator('.dmu-big').innerText();
    await dialog.getByRole('button', { name: '本月', exact: true }).click();
    assert.equal(await dialog.getByRole('button', { name: '本月', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.equal(await tab.playwright.locator('.dmu-big').innerText(), originalToday);
    await dialog.getByRole('button', { name: '今天', exact: true }).click();
    assert.equal(await dialog.getByRole('button', { name: '今天', exact: true }).getAttribute('aria-pressed'), 'true');
    checks.push('Model scope switches without changing daily total');
    const material = await tab.playwright.evaluate(() => {
        const style = getComputedStyle(document.querySelector('.dmu-card'));
        return { blur: style.backdropFilter, background: style.backgroundColor };
    });
    assert.ok(material.blur.includes('blur('));
    assert.ok(material.background.startsWith('rgba('));
    checks.push('Translucent frosted material rendered');
    const bounds = await tab.playwright.evaluate(() => { const r = document.querySelector('.dmu-card').getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: innerWidth, height: innerHeight }; });
    assert.ok(bounds.left >= 0 && bounds.top >= 0 && bounds.right <= bounds.width && bounds.bottom <= bounds.height);
    checks.push('Viewport containment');
    const value = await tab.playwright.locator('.dmu-big').innerText();
    await tab.playwright.getByRole('button', { name: '刷新用量', exact: true }).click();
    assert.equal(await dialog.isVisible(), true);
    assert.equal(await tab.playwright.locator('.dmu-big').innerText(), value);
    checks.push('Refresh retains card and values');
    await tab.playwright.getByRole('button', { name: '刷新用量', exact: true }).press('Escape');
    assert.equal(await dialog.isVisible(), false);
    checks.push('Escape closes');
    assert.equal(await tab.playwright.evaluate(() => document.activeElement?.classList.contains('dmu-trigger')), true);
    checks.push('Focus returns to trigger');
    await trigger.click();
    await tab.playwright.getByRole('button', { name: '设置', exact: true }).click();
    assert.equal(await dialog.isVisible(), false);
    checks.push('Outside click closes');
    return { checks, passed: checks.length, viewport: bounds };
}
