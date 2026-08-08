<script setup lang="ts">
import { onMounted } from 'vue'
import { useShop } from '@/composables/useShop'

const { state, isAuthenticated, loadCart, removeFromCart } = useShop()

onMounted(async () => {
  if (isAuthenticated.value) {
    await loadCart()
  }
})
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <h2>ตะกร้าสินค้า</h2>
      <p>ตรวจสอบสินค้าและยอดรวมก่อนสั่งซื้อ</p>
    </div>

    <p v-if="!isAuthenticated">กรุณาเข้าสู่ระบบเพื่อดูตะกร้า</p>
    <p v-else-if="state.loadingCart">กำลังโหลดตะกร้า...</p>
    <div v-else>
      <div v-if="state.cart.items.length === 0" class="empty">ยังไม่มีสินค้าในตะกร้า</div>
      <ul v-else class="list">
        <li v-for="item in state.cart.items" :key="item.product_id" class="list-item">
          <div>
            <h3>{{ item.name }}</h3>
            <p>จำนวน {{ item.quantity }} x ฿ {{ item.price.toFixed(2) }}</p>
          </div>
          <div class="inline">
            <strong>฿ {{ item.sub_total.toFixed(2) }}</strong>
            <button class="danger" @click="removeFromCart(item.product_id)">ลบ</button>
          </div>
        </li>
      </ul>
      <div class="summary">
        <span>ยอดรวม</span>
        <strong>฿ {{ state.cart.total.toFixed(2) }}</strong>
      </div>
    </div>
  </section>
</template>
