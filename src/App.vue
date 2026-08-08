<script setup lang="ts">
import { onMounted, ref } from 'vue'

type Product = {
  id: number
  name: string
  price: number
}

type CartItem = {
  product_id: number
  name: string
  price: number
  quantity: number
  sub_total: number
}

type CartResponse = {
  items: CartItem[]
  total: number
}

type Order = {
  id: number
  total: number
  payment_status: string
  delivery_status: string
}

type DeliveryStatus = {
  order_id: number
  payment_status: string
  delivery_status: string
}

const products = ref<Product[]>([])
const cart = ref<CartResponse>({ items: [], total: 0 })
const latestOrder = ref<Order | null>(null)
const delivery = ref<DeliveryStatus | null>(null)

const memberName = ref('')
const memberEmail = ref('')
const memberPassword = ref('')
const checkoutAddress = ref('')
const paymentMethod = ref('bank_transfer')
const token = ref(localStorage.getItem('token') ?? '')

const loadingProducts = ref(true)
const loadingCart = ref(false)
const message = ref('')
const error = ref('')

function authHeaders(): HeadersInit {
  return token.value ? { Authorization: `Bearer ${token.value}` } : {}
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: string }
    return body.error ?? `request failed (${response.status})`
  } catch {
    return `request failed (${response.status})`
  }
}

async function registerMember() {
  clearFeedback()
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: memberName.value,
      email: memberEmail.value,
      password: memberPassword.value
    })
  })

  if (!response.ok) {
    error.value = await readError(response)
    return
  }

  message.value = 'Register success. Please login.'
}

async function loginMember() {
  clearFeedback()
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: memberEmail.value,
      password: memberPassword.value
    })
  })

  if (!response.ok) {
    error.value = await readError(response)
    return
  }

  const data = await response.json() as { token: string }
  token.value = data.token
  localStorage.setItem('token', data.token)
  message.value = 'Login success.'
  await loadCart()
}

function logout() {
  token.value = ''
  localStorage.removeItem('token')
  cart.value = { items: [], total: 0 }
  latestOrder.value = null
  delivery.value = null
  message.value = 'Logged out.'
  error.value = ''
}

async function loadProducts() {
  loadingProducts.value = true
  try {
    const response = await fetch('/api/products')
    if (!response.ok) {
      error.value = await readError(response)
      return
    }
    products.value = await response.json() as Product[]
  } finally {
    loadingProducts.value = false
  }
}

async function loadCart() {
  if (!token.value) return
  loadingCart.value = true
  try {
    const response = await fetch('/api/cart', { headers: authHeaders() })
    if (!response.ok) {
      error.value = await readError(response)
      return
    }
    cart.value = await response.json() as CartResponse
  } finally {
    loadingCart.value = false
  }
}

async function addToCart(productId: number) {
  clearFeedback()
  if (!token.value) {
    error.value = 'Please login first.'
    return
  }

  const response = await fetch('/api/cart/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify({ product_id: productId, quantity: 1 })
  })

  if (!response.ok) {
    error.value = await readError(response)
    return
  }

  cart.value = await response.json() as CartResponse
  message.value = 'Item added to cart.'
}

async function removeFromCart(productId: number) {
  clearFeedback()
  const response = await fetch(`/api/cart/items/${productId}`, {
    method: 'DELETE',
    headers: authHeaders()
  })

  if (!response.ok) {
    error.value = await readError(response)
    return
  }

  cart.value = await response.json() as CartResponse
  message.value = 'Item removed.'
}

async function checkout() {
  clearFeedback()
  const response = await fetch('/api/orders/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify({ address: checkoutAddress.value })
  })

  if (!response.ok) {
    error.value = await readError(response)
    return
  }

  latestOrder.value = await response.json() as Order
  delivery.value = {
    order_id: latestOrder.value.id,
    payment_status: latestOrder.value.payment_status,
    delivery_status: latestOrder.value.delivery_status
  }
  await loadCart()
  message.value = 'Checkout created. Continue to payment.'
}

async function payOrder() {
  if (!latestOrder.value) return
  clearFeedback()

  const response = await fetch(`/api/orders/${latestOrder.value.id}/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify({ payment_method: paymentMethod.value })
  })

  if (!response.ok) {
    error.value = await readError(response)
    return
  }

  latestOrder.value = await response.json() as Order
  await refreshDeliveryStatus()
  message.value = 'Payment success.'
}

async function refreshDeliveryStatus() {
  if (!latestOrder.value) return

  const response = await fetch(`/api/orders/${latestOrder.value.id}/delivery-status`, {
    headers: authHeaders()
  })
  if (!response.ok) {
    error.value = await readError(response)
    return
  }

  delivery.value = await response.json() as DeliveryStatus
}

async function advanceDeliveryStatus() {
  if (!latestOrder.value) return
  clearFeedback()

  const response = await fetch(`/api/orders/${latestOrder.value.id}/delivery-status/advance`, {
    method: 'POST',
    headers: authHeaders()
  })
  if (!response.ok) {
    error.value = await readError(response)
    return
  }

  delivery.value = await response.json() as DeliveryStatus
  message.value = 'Delivery status updated.'
}

function clearFeedback() {
  message.value = ''
  error.value = ''
}

onMounted(async () => {
  await loadProducts()
  if (token.value) {
    await loadCart()
  }
})
</script>

<template>
  <main class="shop">
    <h1>Merchandise Shop (Full Loop)</h1>
    <p v-if="message" class="message">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <section class="card">
      <h2>1) Member Register / Login</h2>
      <div class="form-grid">
        <input v-model="memberName" placeholder="Full name" />
        <input v-model="memberEmail" placeholder="Email" type="email" />
        <input v-model="memberPassword" placeholder="Password" type="password" />
      </div>
      <div class="actions">
        <button @click="registerMember">Register</button>
        <button @click="loginMember">Login</button>
        <button v-if="token" @click="logout">Logout</button>
      </div>
    </section>

    <section class="card">
      <h2>2) Select Product</h2>
      <p v-if="loadingProducts">Loading products...</p>
      <ul v-else class="product-list">
        <li v-for="product in products" :key="product.id" class="product-card">
          <h3>{{ product.name }}</h3>
          <p>${{ product.price.toFixed(2) }}</p>
          <button :disabled="!token" @click="addToCart(product.id)">Add to Cart</button>
        </li>
      </ul>
    </section>

    <section class="card">
      <h2>3) Cart + Checkout</h2>
      <p v-if="loadingCart">Loading cart...</p>
      <template v-else>
        <ul class="cart-list">
          <li v-for="item in cart.items" :key="item.product_id" class="cart-item">
            <span>{{ item.name }} (x{{ item.quantity }})</span>
            <span>${{ item.sub_total.toFixed(2) }}</span>
            <button @click="removeFromCart(item.product_id)">Remove</button>
          </li>
        </ul>
        <p><strong>Total:</strong> ${{ cart.total.toFixed(2) }}</p>
        <input v-model="checkoutAddress" placeholder="Delivery address" />
        <button :disabled="!token || cart.items.length === 0" @click="checkout">Checkout</button>
      </template>
    </section>

    <section class="card">
      <h2>4) Payment</h2>
      <p v-if="!latestOrder">No order yet.</p>
      <template v-else>
        <p>Order ID: {{ latestOrder.id }} | Payment: {{ latestOrder.payment_status }}</p>
        <input v-model="paymentMethod" placeholder="Payment method" />
        <button :disabled="latestOrder.payment_status === 'paid'" @click="payOrder">Pay Now</button>
      </template>
    </section>

    <section class="card">
      <h2>5) Delivery Status</h2>
      <p v-if="!delivery">No delivery to track yet.</p>
      <template v-else>
        <p>Order ID: {{ delivery.order_id }}</p>
        <p>Payment: {{ delivery.payment_status }}</p>
        <p>Delivery: {{ delivery.delivery_status }}</p>
        <div class="actions">
          <button @click="refreshDeliveryStatus">Refresh Status</button>
          <button @click="advanceDeliveryStatus">Advance Status (Demo)</button>
        </div>
      </template>
    </section>
  </main>
</template>

<style scoped>
.shop {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.card {
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.error {
  color: #cc0000;
}

.message {
  color: #0a7b34;
}

.form-grid {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.product-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.75rem;
}

.product-card {
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cart-list {
  list-style: none;
  padding: 0;
}

.cart-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  margin-bottom: 0.5rem;
}

button {
  padding: 0.5rem 0.75rem;
  border: 1px solid #bbb;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

h3, p {
  margin: 0;
}
</style>
