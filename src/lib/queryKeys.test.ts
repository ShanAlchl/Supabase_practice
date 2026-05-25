import { describe, it, expect } from 'vitest'
import { queryKeys } from './queryKeys'

describe('queryKeys', () => {
  it('circles', () => {
    expect(queryKeys.circles('user-1')).toEqual(['circles', 'user-1'])
  })

  it('defaultCircle', () => {
    expect(queryKeys.defaultCircle('user-1')).toEqual(['default-circle', 'user-1'])
  })

  it('members', () => {
    expect(queryKeys.members('circle-1')).toEqual(['members', 'circle-1'])
  })

  it('posts without search', () => {
    expect(queryKeys.posts('circle-1')).toEqual(['posts', 'circle-1', ''])
  })

  it('posts with search', () => {
    expect(queryKeys.posts('circle-1', 'keyword')).toEqual(['posts', 'circle-1', 'keyword'])
  })

  it('postsRoot', () => {
    expect(queryKeys.postsRoot('circle-1')).toEqual(['posts', 'circle-1'])
  })

  it('album', () => {
    expect(queryKeys.album('circle-1')).toEqual(['album', 'circle-1'])
  })

  it('notifications', () => {
    expect(queryKeys.notifications('user-1')).toEqual(['notifications', 'user-1'])
  })

  it('profile', () => {
    expect(queryKeys.profile('user-1')).toEqual(['profile', 'user-1'])
  })
})
