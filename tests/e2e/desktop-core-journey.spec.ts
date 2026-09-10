import {test,expect} from '@playwright/test';
import {enterClassroom} from './helpers';
test('desktop core journey reaches lesson',async({page})=>{await enterClassroom(page);await expect(page.getByText(/ORIGINAL DEMO/)).toBeVisible();await page.getByRole('button',{name:/生成分步微课堂/}).click();await expect(page.getByText(/微课堂步骤 1/)).toBeVisible();await expect(page.locator('body')).not.toContainText(/已保存|已归档|已掌握|已入队/)});
