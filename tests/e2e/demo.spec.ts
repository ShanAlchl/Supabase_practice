import { test, expect } from '@playwright/test'

test.describe('Demo mode', () => {
  test('page renders without env vars', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('演示模式', { exact: true }).first()).toBeVisible()
  })

  test('demo notice appears', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=当前没有检测到 Supabase 环境变量')).toBeVisible()
  })

  test('user can write a post', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByLabel('发布动态内容')).toHaveCount(0)
    await page.getByRole('button', { name: '发布新动态' }).click()
    const composer = page.getByLabel('发布动态内容')
    await composer.fill('Hello from E2E test')
    await page.getByRole('button', { name: /^发布$/ }).click()
    await expect(page.locator('text=Hello from E2E test')).toBeVisible()
    await expect(page.getByLabel('发布动态内容')).toHaveCount(0)
  })

  test('mobile compose opens as a child page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await expect(page.getByLabel('发布动态内容')).toHaveCount(0)
    await page.getByRole('button', { name: '发布动态' }).click()
    await expect(page.getByRole('dialog', { name: '发布动态' })).toBeVisible()
    await expect(page.getByLabel('发布动态内容')).toBeVisible()
  })

  test('mobile keeps notifications in the header only', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await expect(page.getByLabel('查看通知')).toBeVisible()
    await expect(page.locator('nav.fixed.inset-x-0.bottom-0').getByText('通知')).toHaveCount(0)
  })

  test('album entry renders', async ({ page }) => {
    await page.goto('/')
    await page.click('text=相册')
    await expect(page.getByRole('img', { name: /相册图片 1/ })).toBeVisible()
  })

  test('auth page is focused on login form when Supabase env is present', async ({ page }) => {
    await page.goto('/login-preview')
    await expect(page.getByText('今天的小片段')).toHaveCount(0)
    await expect(page.getByText('周末小聚')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: '登录', exact: true })).toBeVisible()
    await expect(page.getByLabel('邮箱')).toBeVisible()
    await expect(page.getByLabel('密码')).toBeVisible()
    await expect(page.getByRole('button', { name: '手机号验证码' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: '邮箱密码' })).toHaveCount(0)
    await expect(page.getByText('创建账号')).toBeVisible()
    await expect(page.getByText('忘记密码？')).toBeVisible()
  })
})
