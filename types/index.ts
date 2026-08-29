export type Artwork = {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  category: string;
};

// artwork category type
export type Category = {
  id: string;
  name: string;
};

export type Blog = {
  id: string
  title: string
  content: string
  thumbnail_url?: string | null
  category_id?: number | null
  created_at: string
  updated_at?: string | null
  blog_categories?: {
    id: number
    name: string
  } | null
}

export type BlogCategory = {
  id: number
  name: string
  slug: string
}

export type Subscriber = {
  id: number
  email: string
  note: string | null
  created_at: string
  unsubscribed_at?: string | null
  unsubscribe_token?: string | null
  tags?: string[] | null
}

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'

export type Campaign = {
  id: string
  subject: string
  html_content: string
  status: CampaignStatus
  segment_tags: string[]
  scheduled_at?: string | null
  sent_count: number
  open_count: number
  click_count: number
  created_at: string
  sent_at?: string | null
}