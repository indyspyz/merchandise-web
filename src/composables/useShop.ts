import { computed, reactive } from 'vue'

export type Product = {
  id: number
  name: string
  price: number
}

export type CartItem = {
  product_id: number
  name: string
  price: number
  quantity: number
  sub_total: number
}

export type CartResponse = {
  items: CartItem[]
  total: number
}

export type Order = {
  id: number
  total: number
  payment_status: string
  delivery_status: string
}

export type DeliveryStatus = {
  order_id: number
  payment_status: string
  delivery_status: string
}

type ShopState = {
  products: Product[]
  cart: CartResponse
  latestOrder: Order | null
  delivery: DeliveryStatus | null
  token: string
  loadingProducts: boolean
  loadingCart: boolean
  message: string
  error: string
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

const state = reactive<ShopState>({
  products: [],
  cart: { items: [], total: 0 },
  latestOrder: null,
  delivery: null,
  token: localStorage.getItem('token') ?? '',
  loadingProducts: false,
  loadingCart: false,
  message: '',
  error: ''
})

function authHeaders(): HeadersInit {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {}
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string }
    return body.error ?? `Request failed (${response.status})`
  } catch {
    return `Request failed (${response.status})`
  }
}

function clearFeedback() {
  state.message = ''
  state.error = ''
}

async function init() {
  await loadProducts()
  if (state.token) {
    await loadCart()
  }
}

async function registerMember(name: string, email: string, password: string) {
  clearFeedback()
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  })

  if (!response.ok) {
    state.error = await readError(response)
    return false
  }

  state.message = 'สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ'
  return true
}

async function loginMember(email: string, password: string) {
  clearFeedback()
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })

  if (!response.ok) {
    state.error = await readError(response)
    return false
  }

  const data = (await response.json()) as { token: string }
  state.token = data.token
  localStorage.setItem('token', data.token)
  state.message = 'เข้าสู่ระบบสำเร็จ'
  await loadCart()
  return true
}

function logoutMember() {
  state.token = ''
  localStorage.removeItem('token')
  state.cart = { items: [], total: 0 }
  state.latestOrder = null
  state.delivery = null
  state.message = 'ออกจากระบบแล้ว'
  state.error = ''
}

async function loadProducts() {
  state.loadingProducts = true
  try {
    const response = await fetch(`${API_BASE}/api/products`)
    if (!response.ok) {
      state.error = await readError(response)
      return
    }
    state.products = (await response.json()) as Product[]
  } finally {
    state.loadingProducts = false
  }
}

async function loadCart() {
  if (!state.token) {
    state.cart = { items: [], total: 0 }
    return
  }

  state.loadingCart = true
  try {
    const response = await fetch(`${API_BASE}/api/cart`, { headers: authHeaders() })
    if (!response.ok) {
      state.error = await readError(response)
      return
    }
    state.cart = (await response.json()) as CartResponse
  } finally {
    state.loadingCart = false
  }
}

async function addToCart(productId: number, quantity = 1) {
  clearFeedback()
  if (!state.token) {
    state.error = 'กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้า'
    return false
  }

  const response = await fetch(`${API_BASE}/api/cart/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ product_id: productId, quantity })
  })

  if (!response.ok) {
    state.error = await readError(response)
    return false
  }

  state.cart = (await response.json()) as CartResponse
  state.message = 'เพิ่มสินค้าลงตะกร้าแล้ว'
  return true
}

async function removeFromCart(productId: number) {
  clearFeedback()
  const response = await fetch(`${API_BASE}/api/cart/items/${productId}`, {
    method: 'DELETE',
    headers: authHeaders()
  })

  if (!response.ok) {
    state.error = await readError(response)
    return false
  }

  state.cart = (await response.json()) as CartResponse
  state.message = 'ลบสินค้าออกจากตะกร้าแล้ว'
  return true
}

async function checkout(address: string) {
  clearFeedback()
  const response = await fetch(`${API_BASE}/api/orders/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ address })
  })

  if (!response.ok) {
    state.error = await readError(response)
    return false
  }

  state.latestOrder = (await response.json()) as Order
  state.delivery = {
    order_id: state.latestOrder.id,
    payment_status: state.latestOrder.payment_status,
    delivery_status: state.latestOrder.delivery_status
  }
  await loadCart()
  state.message = 'สร้างคำสั่งซื้อแล้ว ไปหน้าชำระเงินได้เลย'
  return true
}

async function payOrder(paymentMethod: string) {
  if (!state.latestOrder) {
    state.error = 'ยังไม่มีคำสั่งซื้อให้ชำระเงิน'
    return false
  }

  clearFeedback()
  const response = await fetch(`${API_BASE}/api/orders/${state.latestOrder.id}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ payment_method: paymentMethod })
  })

  if (!response.ok) {
    state.error = await readError(response)
    return false
  }

  state.latestOrder = (await response.json()) as Order
  await refreshDeliveryStatus()
  state.message = 'ชำระเงินสำเร็จ'
  return true
}

async function refreshDeliveryStatus() {
  if (!state.latestOrder) {
    state.error = 'ยังไม่มีคำสั่งซื้อสำหรับติดตาม'
    return false
  }

  const response = await fetch(`${API_BASE}/api/orders/${state.latestOrder.id}/delivery-status`, {
    headers: authHeaders()
  })
  if (!response.ok) {
    state.error = await readError(response)
    return false
  }

  state.delivery = (await response.json()) as DeliveryStatus
  return true
}

async function advanceDeliveryStatus() {
  if (!state.latestOrder) {
    state.error = 'ยังไม่มีคำสั่งซื้อสำหรับอัปเดตสถานะ'
    return false
  }

  clearFeedback()
  const response = await fetch(`${API_BASE}/api/orders/${state.latestOrder.id}/delivery-status/advance`, {
    method: 'POST',
    headers: authHeaders()
  })
  if (!response.ok) {
    state.error = await readError(response)
    return false
  }

  state.delivery = (await response.json()) as DeliveryStatus
  state.message = 'อัปเดตสถานะการจัดส่งแล้ว'
  return true
}

export function useShop() {
  const isAuthenticated = computed(() => Boolean(state.token))
  const cartCount = computed(() => state.cart.items.reduce((sum, item) => sum + item.quantity, 0))

  return {
    state,
    isAuthenticated,
    cartCount,
    init,
    clearFeedback,
    registerMember,
    loginMember,
    logoutMember,
    loadProducts,
    loadCart,
    addToCart,
    removeFromCart,
    checkout,
    payOrder,
    refreshDeliveryStatus,
    advanceDeliveryStatus
  }
}
