import { describe, expect, it } from 'vitest'
import initSql from '../../scripts/init.sql?raw'

const searchFunctionSql = initSql.slice(
  initSql.indexOf('create or replace function public.search_circle_posts'),
  initSql.indexOf('grant execute on function public.search_circle_posts'),
)

describe('search_circle_posts SQL', () => {
  it('matches posts when the keyword appears in comments', () => {
    expect(searchFunctionSql).toMatch(/exists\s*\(\s*select\s+1\s+from public\.comments c/i)
    expect(searchFunctionSql).toMatch(/c\.body ilike '%' \|\| trim\(keyword\) \|\| '%'/i)
  })

  it('keeps pinned posts before regular posts in search results', () => {
    expect(searchFunctionSql).toMatch(/case when p\.pinned_at is not null then 0 else 1 end/i)
    expect(searchFunctionSql).toMatch(/p\.pinned_at asc nulls last/i)
  })
})
