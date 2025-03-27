export interface Message {
  id: string
  dialogId: string
  senderId: string
  createdAt: bigint
  delivered: boolean
  type: 'text' | 'image' | 'video'
  content?: string
  caption?: string
  imageUrl?: string
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  updatedAt?: Date
}
