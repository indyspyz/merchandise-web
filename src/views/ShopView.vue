<script setup lang="ts">
import { onMounted } from 'vue'
import { useShop } from '@/composables/useShop'

const { state, isAuthenticated, loadProducts, addToCart } = useShop()

onMounted(async () => {
  if (state.products.length === 0) {
    await loadProducts()
  }
})
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <h2>สินค้าแนะนำ</h2>
      <p>เลือกสินค้าแล้วเพิ่มลงตะกร้าได้ทันที</p>
    </div>

    <p v-if="state.loadingProducts">กำลังโหลดสินค้า...</p>
    <div v-else class="grid">
      <article v-for="product in state.products" :key="product.id" class="card">
        <h3>{{ product.name }}</h3>
        <p class="price">฿ {{ product.price.toFixed(2) }}</p>
        <button :disabled="!isAuthenticated" @click="addToCart(product.id)">เพิ่มลงตะกร้า</button>
      </article>
    </div>
  </section>
</template>
