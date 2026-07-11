export type Blog = {
  id: string;
  title: string;
  content: string;
  thumbnail_url?: string | null;
  created_at: string;
  updated_at?: string;
};