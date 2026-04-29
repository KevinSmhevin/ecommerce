export interface Category {
  id: number
  name: string
  slug: string
}

export interface Product {
  id: number
  title: string
  brand?: string | null
  description?: string | null
  slug: string
  price: string
  stock: number
  units_sold: number
  category?: Category | null
  image_url: string | null
  image2_url: string | null
  image3_url: string | null
  image4_url: string | null
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type ProductOrdering = 'price' | '-price' | 'title' | '-title'

export interface ProductsQueryParams {
  page?: number
  ordering?: ProductOrdering
  category?: string
  search?: string
}

export interface OrderItem {
  product_name: string
  quantity: number
  price: string
  total: string
}

export interface Order {
  id: number | string
  date_ordered: string
  shipped: boolean
  full_name: string
  email: string
  shipping_address: string
  amount_paid: string
  items: OrderItem[]
  date_shipped?: string | null
  tracking_number?: string | null
  courier?: string | null
}
