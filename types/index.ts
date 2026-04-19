export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'pro';
  status: 'active' | 'cancelled' | 'past_due';
  razorpay_subscription_id: string | null;
  current_period_end: string | null;
  created_at: string;
}

export interface ProjectFile {
  [filename: string]: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  prompt: string;
  files: ProjectFile | null;
  status: 'pending' | 'generating' | 'done' | 'error';
  watermark: boolean;
  created_at: string;
  updated_at: string;
}

export interface FileTreeNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileTreeNode[];
  content?: string;
}
