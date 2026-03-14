// Shared types for the LMS frontend
// Will be extended as APIs and stores are implemented

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Subject {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  thumbnail: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubjectTreeSection {
  id: number;
  subject_id: number;
  title: string;
  order_index: number;
  videos: Array<{
    id: number;
    section_id: number;
    title: string;
    description: string | null;
    youtube_url: string;
    order_index: number;
    duration_seconds: number;
  }>;
}

export interface SubjectTree {
  subject_id: number;
  sections: SubjectTreeSection[];
}
