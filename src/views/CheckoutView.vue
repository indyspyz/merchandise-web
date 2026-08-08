<script setup lang="ts">
import { ref } from 'vue'
import { useShop } from '@/composables/useShop'

const { state, isAuthenticated, checkout, payOrder } = useShop()

const address = ref('')
const paymentMethod = ref('bank_transfer')

async function submitCheckout() {
  await checkout(address.value)
}

async function submitPayment() {
  await payOrder(paymentMethod.value)
}
</script>

<template>
  <section class="panel checkout-grid">
    <article class="card">
      <h2>Checkout</h2>
      <p>ยืนยันที่อยู่เพื่อสร้างคำสั่งซื้อ</p>
      <div class="field">
        <label>ที่อยู่จัดส่ง</label>
        <textarea v-model="address" rows="4" placeholder="บ้านเลขที่ ถนน แขวง เขต จังหวัด รหัสไปรษณีย์" />
      </div>
      <button :disabled="!isAuthenticated || state.cart.items.length === 0" @click="submitCheckout">
        สร้างคำสั่งซื้อ
      </button>
    </article>

    <article class="card">
      <h2>Payment</h2>
      <p v-if="!state.latestOrder">ยังไม่มีคำสั่งซื้อ กรุณา Checkout ก่อน</p>
      <template v-else>
        <p>Order #{{ state.latestOrder.id }}</p>
        <p>ยอดชำระ ฿ {{ state.latestOrder.total.toFixed(2) }}</p>
        <p>สถานะการชำระ: <strong>{{ state.latestOrder.payment_status }}</strong></p>
        <div class="field">
          <label>ช่องทางชำระเงิน</label>
          <select v-model="paymentMethod">
            <option value="bank_transfer">Bank Transfer</option>
            <option value="credit_card">Credit Card</option>
            <option value="promptpay">PromptPay</option>
          </select>
        </div>
        <button :disabled="state.latestOrder.payment_status === 'paid'" @click="submitPayment">
          ชำระเงิน
        </button>
      </template>
    </article>
  </section>
</template>
