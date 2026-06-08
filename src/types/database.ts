export interface BatikItem {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  origin: string;
  primary_color: string;
  secondary_color: string;
  bg_color: string;
  rating: number;
  sold: number;
  created_at?: string;
}

export interface Order {
  id: string;
  item: string;
  description: string;
  date: string;
  delivered_date?: string;
  estimated_date?: string;
  status: "delivered" | "shipping" | "processing";
  total: number;
  type: string;
  primary_color: string;
  secondary_color: string;
  bg_color: string;
  artisan: string;
  can_review: boolean;
  reviewed: boolean;
}

export interface Store {
  id: number;
  name: string;
  owner: string;
  established: string;
  specialty: string;
  address: string;
  phone: string;
  hours: string;
  rating: number;
  review_count: number;
  price_range: string;
  tags: string[];
  image: string;
  featured: boolean;
  description: string;
  motifs: string[];
}

export interface Review {
  id: number;
  name: string;
  role: string;
  image: string;
  rating: number;
  comment: string;
  date: string;
  product: string;
}

export interface CustomDesign {
  id: number;
  pattern_id: number;
  colors: any;
  scale: number;
  rotation: number;
  drawing_data: string | null;
  created_at: string;
}
