export interface User {
  id: number
  name: string
  email: string
  role: string
  departmentId?: number | null
  isOnline?: boolean
  lastSeen?: string | null
  createdAt?: string
}

export interface Department {
  id: number
  name: string
  color: string
}

export interface Tag {
  id: number
  name: string
  color: string
}

export interface Conversation {
  id: number
  waId: string
  contactName?: string | null
  contactNumber: string
  status: string
  assignedTo?: number | null
  assignedName?: string | null
  departmentId?: number | null
  departmentName?: string | null
  departmentColor?: string | null
  unreadCount: number
  lastMessage?: string | null
  lastMessageAt: string
  createdAt: string
  tags: Tag[]
}

export interface Message {
  id: number
  conversationId: number
  waMessageId?: string | null
  senderType: 'client' | 'agent'
  senderId?: number | null
  senderName?: string | null
  messageType: string
  content?: string | null
  fileUrl?: string | null
  fileName?: string | null
  fileSize?: number | null
  mimeType?: string | null
  isRead: boolean
  isDelivered: boolean
  isNote: boolean
  createdAt: string
}
