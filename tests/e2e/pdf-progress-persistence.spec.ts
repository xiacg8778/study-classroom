import{test,expect}from'@playwright/test';

import {enterClassroom} from './helpers';
/**
 * PDF 批注元数据持久化（localStorage，仅本地）：
 * 刷新后重选同一 PDF → 页码/书签/划线/朗读进度自动恢复；PDF 字节仍不持久化。
 */
test('pdf metadata survives reload after re-picking the same file',async({page})=>{
  test.setTimeout(180000);
  await enterClassroom(page);
  const input=page.locator('input[type=file][accept*="pdf"]');
  await input.setInputFiles('tests/fixtures/local-selection-sample.pdf');
  await expect(page.getByRole('heading',{name:'local-selection-sample.pdf'})).toBeVisible();

  // 制造批注：跳到第 1 页、标记书签、记为已读
  await page.getByRole('button',{name:'标记本页'}).click();
  await expect(page.getByRole('navigation',{name:'当前 PDF 书签'})).toContainText('第 1 页');
  await page.getByRole('button',{name:'记为已读'}).click();
  await expect(page.getByText('本页已读完')).toBeVisible();

  // 刷新 → PDF 字节丢失
  await page.reload();
  await expect(page.getByRole('heading',{name:'local-selection-sample.pdf'})).toHaveCount(0);
  // 重选同一文件 → 元数据自动恢复
  const input2=page.locator('input[type=file][accept*="pdf"]');
  await input2.setInputFiles('tests/fixtures/local-selection-sample.pdf');
  await expect(page.getByRole('heading',{name:'local-selection-sample.pdf'})).toBeVisible();
  await expect(page.getByRole('navigation',{name:'当前 PDF 书签'})).toContainText('第 1 页');
  await expect(page.getByText('本页已读完')).toBeVisible();
});

test('pdf metadata is isolated per learner and cleared on exit',async({page})=>{
  test.setTimeout(180000);
  await enterClassroom(page);
  const input=page.locator('input[type=file][accept*="pdf"]');
  await input.setInputFiles('tests/fixtures/local-selection-sample.pdf');
  await expect(page.getByRole('heading',{name:'local-selection-sample.pdf'})).toBeVisible();
  await page.getByRole('button',{name:'标记本页'}).click();

  // 通过库页的学习者切换器走真实切换路径（会整页刷新并清空批注存储）
  // 移动端导航只显示图标（文字被 CSS 隐藏），按 href 定位对两种视口都成立
  await page.locator('nav[aria-label="主要导航"] a[href="/library"]').click();
  await page.getByLabel('当前学习者').click();
  await page.getByRole('option',{name:'学习者 B'}).click();
  // 切换后需回到首页重新完成同意（真实用户路径：同意表单在首页）
  await page.getByRole('link',{name:'纸上课桌'}).click();
  await page.getByLabel(/我已了解/).check();
  await page.getByRole('button',{name:/为学习者 B/}).click();
  await page.getByRole('button',{name:/本册目录/}).first().click();
  await page.getByRole('button',{name:'打开这一课'}).first().click();
  const input2=page.locator('input[type=file][accept*="pdf"]');
  await input2.setInputFiles('tests/fixtures/local-selection-sample.pdf');
  await expect(page.getByRole('heading',{name:'local-selection-sample.pdf'})).toBeVisible();
  // 学习者 B 看不到 A 的书签
  await expect(page.getByRole('navigation',{name:'当前 PDF 书签'})).toHaveCount(0);
});
