import type { Page } from '@playwright/test';

/**
 * E2E 公共导航辅助。
 *
 * 背景：教材库 UI 于 2026-09-09 引入「本册目录（N 课）」折叠——
 * 未展开目录时页面上**不存在**「打开这一课」按钮，因此直接点它会一直等不到元素而超时。
 * 此前 8 个 spec 各自内联导航四步（goto → 同意 → 选教材 → 打开这一课）且都缺「展开目录」，
 * 导致全部 E2E 超时失败且长期未被发现（测试没人跑）。
 *
 * 统一收敛到本文件：未来教材库 UI 再演进，只需改这一处。
 */

/** 展开第一本教材的目录（展开后才会出现「打开这一课」） */
export async function expandFirstTextbook(page: Page, hasTouch = false): Promise<void> {
  const book = page.getByRole('button', { name: /本册目录/ }).first();
  if (hasTouch) await book.tap();
  else await book.click();
}

/** 完整进入课堂：同意 → 选教材 → 展开目录 → 打开第一课 */
export async function enterClassroom(page: Page, hasTouch = false): Promise<void> {
  await page.goto('/');
  const consent = page.getByLabel(/我已了解/);
  const choose = page.getByRole('button', { name: /为学习者 A/ });
  if (hasTouch) {
    await consent.tap();
    await choose.tap();
  } else {
    await consent.check();
    await choose.click();
  }
  await expandFirstTextbook(page, hasTouch);
  const lesson = page.getByRole('button', { name: '打开这一课' }).first();
  if (hasTouch) await lesson.tap();
  else await lesson.click();
  /* 等 SPA 导航**真正渲染完成**再交还控制权：URL 变化早于 chunk 加载与渲染，
     只等 URL 不够——紧随其后的整页导航在 WebKit/iPhone 上仍会被这次未完成的导航打断
     （报「Navigation is interrupted by another navigation to /classroom」）。 */
  await page.waitForURL(/\/classroom/, { timeout: 15000 });
  await page.locator('.classroom-header').waitFor({ state: 'visible', timeout: 15000 });
}
