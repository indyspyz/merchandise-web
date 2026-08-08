<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useShop } from '@/composables/useShop'

const { state, cartCount, isAuthenticated, init, clearFeedback, logoutMember } = useShop()

onMounted(async () => {
  await init()
})
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <span class="badge">Merch</span>
        <div>
          <h1>Merchandise Shop</h1>
          <p>ช้อปง่าย จ่ายไว ติดตามสถานะได้ครบ</p>
        </div>
      </div>
      <nav class="nav">
        <RouterLink to="/">หน้าแรก</RouterLink>
        <RouterLink to="/shop">สินค้า</RouterLink>
        <RouterLink to="/account">สมาชิก</RouterLink>
        <RouterLink to="/cart">ตะกร้า ({{ cartCount }})</RouterLink>
        <RouterLink to="/checkout">ชำระเงิน</RouterLink>
        <RouterLink to="/tracking">ติดตาม</RouterLink>
      </nav>
      <button v-if="isAuthenticated" class="ghost" @click="logoutMember">Logout</button>
    </header>

    <section v-if="state.message" class="alert success">
      <span>{{ state.message }}</span>
      <button @click="clearFeedback">ปิด</button>
    </section>
    <section v-if="state.error" class="alert error">
      <span>{{ state.error }}</span>
      <button @click="clearFeedback">ปิด</button>
    </section>

    <main class="page-wrap">
      <RouterView />
    </main>
  </div>
</template>
