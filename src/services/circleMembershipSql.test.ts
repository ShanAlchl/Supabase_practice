import { describe, expect, it } from 'vitest'
import initSql from '../../scripts/init.sql?raw'
import circleService from './circleService.ts?raw'

describe('circle membership leave flow', () => {
  it('uses a dedicated leave_circle RPC from the service layer', () => {
    expect(circleService).toMatch(/rpc\('leave_circle'/)
    expect(circleService).not.toMatch(/from\('circle_members'\)\s*\.\s*delete\(\)/)
  })

  it('prevents the final owner from leaving in SQL', () => {
    expect(initSql).toMatch(/create or replace function public\.leave_circle/i)
    expect(initSql).toMatch(/Cannot leave as the last circle owner/i)
    expect(initSql).toMatch(/grant execute on function public\.leave_circle\(uuid\) to authenticated/i)
  })
})
