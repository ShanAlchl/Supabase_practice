import type { Circle, CircleMember, Post } from '../types/domain'

export const demoCircle: Circle = {
  id: 'demo-circle',
  name: '我们的私密朋友圈',
  description: '记录朋友之间的日常、照片和小小的开心事。',
  createdBy: 'demo-user',
}

export const demoMembers: CircleMember[] = [
  {
    circleId: demoCircle.id,
    userId: 'demo-user',
    role: 'owner',
    profile: {
      id: 'demo-user',
      displayName: '你',
      avatarUrl: null,
      bio: '圈子的创建者',
    },
  },
  {
    circleId: demoCircle.id,
    userId: 'lin',
    role: 'member',
    profile: {
      id: 'lin',
      displayName: '林夏',
      avatarUrl: null,
      bio: '负责把平凡日子拍好看',
    },
  },
  {
    circleId: demoCircle.id,
    userId: 'chen',
    role: 'member',
    profile: {
      id: 'chen',
      displayName: '陈野',
      avatarUrl: null,
      bio: '每次聚会都迟到五分钟',
    },
  },
]

export const demoPosts: Post[] = [
  {
    id: 'post-1',
    circleId: demoCircle.id,
    authorId: 'lin',
    body: '今天傍晚散步的时候，天边的颜色特别温柔。突然觉得这种小事也值得被认真保存下来。',
    createdAt: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    author: demoMembers[1].profile,
    images: [
      {
        id: 'image-1',
        postId: 'post-1',
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80',
        storagePath: 'demo/post-1/sky.jpg',
        sortOrder: 0,
      },
    ],
    comments: [
      {
        id: 'comment-1',
        postId: 'post-1',
        authorId: 'chen',
        body: '下次散步叫我，我负责买饮料。',
        createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        author: demoMembers[2].profile,
      },
    ],
    commentCount: 1,
    reactionCount: 4,
    viewerHasReacted: true,
  },
  {
    id: 'post-2',
    circleId: demoCircle.id,
    authorId: 'chen',
    body: '把上周的火锅照片补上。事实证明，真正的朋友会在你筷子伸向最后一块牛肉时假装没看见。',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    author: demoMembers[2].profile,
    images: [
      {
        id: 'image-2',
        postId: 'post-2',
        url: 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=900&q=80',
        storagePath: 'demo/post-2/table.jpg',
        sortOrder: 0,
      },
      {
        id: 'image-3',
        postId: 'post-2',
        url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
        storagePath: 'demo/post-2/food.jpg',
        sortOrder: 1,
      },
    ],
    comments: [],
    commentCount: 0,
    reactionCount: 7,
    viewerHasReacted: false,
  },
]
