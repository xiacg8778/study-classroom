import{test,expect}from'@playwright/test';

import {enterClassroom} from './helpers';
/** 视口稳定的课堂就绪锚点：classroom-header（sticky，桌面与移动均可见） */
const expectClassroomReady=(page:import('@playwright/test').Page,timeout=15000)=>expect(page.locator('.classroom-header')).toBeVisible({timeout});

test.describe('session auto-restore after reload',()=>{
  test('auto-restores lesson and shows notice after reload',async({page})=>{
    test.setTimeout(120000);
    await enterClassroom(page);
    await expectClassroomReady(page,5000);
    // 刷新（模拟中断）→ 自动恢复：仍留在课堂、顶部出现"已自动恢复"通知
    await page.reload();
    await expectClassroomReady(page);
    await expect(page.getByText(/已恢复上次会话/)).toBeVisible();
    // 未开过 PDF → 不出现文件提示
    await expect(page.getByText(/需重新选择文件/)).toHaveCount(0);
    // 再次刷新：仍然自动恢复（会话持续）
    await page.reload();
    await expectClassroomReady(page);
  });

  test('PDF is not resurrected after reload but can be re-picked immediately',async({page})=>{
    test.setTimeout(120000);
    await enterClassroom(page);
    const input=page.locator('input[type=file][accept*="pdf"]');
    await input.setInputFiles('tests/fixtures/local-selection-sample.pdf');
    await expect(page.getByRole('heading',{name:'local-selection-sample.pdf'})).toBeVisible();
    await page.reload();
    // 自动回课堂 + 通知点名 PDF 文件、说明需重选
    await expectClassroomReady(page);
    await expect(page.getByText(/曾打开的 PDF「local-selection-sample.pdf」需重新选择文件/)).toBeVisible();
    // PDF 阅读器不得复活（字节未持久化）
    await expect(page.getByRole('heading',{name:'local-selection-sample.pdf'})).toHaveCount(0);
    // 可立即重新选择同一文件
    const input2=page.locator('input[type=file][accept*="pdf"]');
    await input2.setInputFiles('tests/fixtures/local-selection-sample.pdf');
    await expect(page.getByRole('heading',{name:'local-selection-sample.pdf'})).toBeVisible();
  });

  test('exit session clears restore pointer',async({page})=>{
    test.setTimeout(120000);
    await enterClassroom(page);
    await expectClassroomReady(page,5000);
    await page.reload();
    await expect(page.getByText(/已恢复上次会话/)).toBeVisible();
    // 退出会话 → 清指针回同意页，再刷新不再恢复
    await page.getByRole('button',{name:'退出会话'}).click();
    await expect(page.getByText(/把边界讲清楚/)).toBeVisible({timeout:15000});
    await page.reload();
    await expect(page.getByText(/已恢复上次会话/)).toHaveCount(0);
    await expect(page.getByText(/把边界讲清楚/)).toBeVisible();
  });
});

test('chunk load failure degrades to actionable reload UI',async({page})=>{
  test.setTimeout(120000);
  // 模拟弱网/发版后模块加载失败：拦截错误候选页的懒加载模块
  // dev 模式 URL 形如 /src/features/wrong-questions/WrongQuestionPage.tsx；build 模式形如 /assets/WrongQuestionPage-*.js
  await page.route(
    (url) => /wrong-questions\/WrongQuestionPage/.test(url.pathname),
    (route) => route.abort(),
  );
  await enterClassroom(page);
  /* 清会话恢复指针：应用启动时会按指针自动回到课堂，会打断对 /wrong-questions 的深链接访问
     （WebKit/iPhone 下表现为 goto 被另一次导航打断）——本用例只验证 chunk 失败降级，不需要恢复会话 */
  await page.evaluate(()=>sessionStorage.removeItem('paper-desk.last-session'));
  await page.goto('/wrong-questions');
  // 一次自动重试 + 仍失败 → ErrorBoundary 降级 UI（非白屏）
  await expect(page.getByText('页面加载失败')).toBeVisible({timeout:30000});
  await expect(page.getByRole('button',{name:'重新加载页面'})).toBeVisible();
  await expect(page.getByText(/网络中断或应用已更新/)).toBeVisible();
});
