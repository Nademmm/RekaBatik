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
  style_type?: string;
  svg_url?: string;
  created_at?: string;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postal_code: string;
}

export interface Order {
  id: string;
  user_id?: string;
  item: string;
  description: string;
  date: string;
  delivered_date?: string;
  estimated_date?: string;
  status: "delivered" | "shipping" | "processing" | "negotiating" | "cancelled";
  total: number;
  type: string;
  primary_color: string;
  secondary_color: string;
  bg_color: string;
  artisan: string;
  can_review: boolean;
  reviewed: boolean;
  // New fields
  payment_method?: "transfer_bca" | "transfer_mandiri" | "gopay" | "ovo" | "cod";
  payment_status?: "pending" | "awaiting_verification" | "paid" | "failed";
  shipping_address?: ShippingAddress;
  quantity?: number;
  notes?: string;
  tracking_number?: string;
  courier?: string;
  review_rating?: number;
  review_comment?: string;
  custom_design_id?: number;
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
  status?: "pending" | "approved" | "rejected";
  owner_id?: string;
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
  user_id?: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  batik_id?: number;
  custom_design_id?: number;
  quantity: number;
  created_at: string;
  notes?: string | null;
  batik_items?: BatikItem;
  custom_designs?: CustomDesign;
}

export interface FavoriteBatik {
  id: number;
  user_id: string;
  batik_id: number;
  created_at: string;
  batik_items?: BatikItem;
}

export interface FavoriteStore {
  id: number;
  user_id: string;
  store_id: number;
  created_at: string;
  stores?: Store;
}
