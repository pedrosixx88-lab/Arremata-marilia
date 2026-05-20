export type UserRole = 'user' | 'admin'
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'
export type ListingStatus = 'draft' | 'em_moderacao' | 'ativo' | 'encerrado' | 'cancelado' | 'arremate_confirmado'
export type DisputeStatus = 'aberta' | 'em_analise' | 'resolvida' | 'encerrada'
export type DeliveryType = 'retirada' | 'entrega' | 'ambos'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  cpf: string | null
  role: UserRole
  verification_status: VerificationStatus
  is_premium: boolean
  reputation_score: number
  total_sales: number
  total_purchases: number
  neighborhood: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
}

export interface Listing {
  id: string
  seller_id: string
  title: string
  description: string
  category_id: string
  neighborhood: string
  status: ListingStatus
  starting_bid: number
  current_bid: number | null
  reserve_price: number | null
  min_increment: number
  delivery_type: DeliveryType
  ends_at: string
  photo_urls: string[]
  bid_count: number
  winner_id: string | null
  is_featured: boolean
  created_at: string
  seller?: Profile
  category?: Category
}

export interface Bid {
  id: string
  listing_id: string
  bidder_id: string
  amount: number
  is_auto: boolean
  created_at: string
  bidder?: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'verification_status'>
}

export interface AutoBid {
  id: string
  listing_id: string
  bidder_id: string
  max_amount: number
  is_active: boolean
  created_at: string
}

export interface Review {
  id: string
  listing_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}

export interface Message {
  id: string
  listing_id: string
  sender_id: string
  receiver_id: string
  content: string
  read_at: string | null
  created_at: string
  sender?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}

export interface Dispute {
  id: string
  listing_id: string
  opener_id: string
  respondent_id: string
  category: string
  description: string
  evidence_urls: string[]
  status: DisputeStatus
  resolution: string | null
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  reporter_id: string
  listing_id: string | null
  reported_user_id: string | null
  category: string
  description: string | null
  resolved: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

export interface IdentityVerification {
  id: string
  user_id: string
  document_url: string
  selfie_url: string
  status: VerificationStatus
  rejection_reason: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
}
