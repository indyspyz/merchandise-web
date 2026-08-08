<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useShop } from '@/composables/useShop'

const { state, isAuthenticated } = useShop()
</script>

<template>
  <section class="hero">
    <div>
      <p class="eyebrow">Modern Merchandise Experience</p>
      <h2>ซื้อสินค้าได้ครบจบในที่เดียว</h2>
      <p>
        ระบบนี้รองรับทั้งสมัครสมาชิก เลือกสินค้า ชำระเงิน และติดตามสถานะจัดส่งแบบครบลูป
      </p>
      <div class="actions">
        <RouterLink to="/shop" class="btn primary">เริ่มช้อปเลย</RouterLink>
        <RouterLink to="/account" class="btn">เข้าสู่ระบบ</RouterLink>
      </div>
    </div>
    <aside class="stats">
      <article>
        <h3>{{ state.products.length }}</h3>
        <p>สินค้าพร้อมขาย</p>
      </article>
      <article>
        <h3>{{ state.cart.items.length }}</h3>
        <p>รายการในตะกร้า</p>
      </article>
      <article>
        <h3>{{ isAuthenticated ? 'Yes' : 'No' }}</h3>
        <p>สถานะสมาชิก</p>
      </article>
    </aside>
  </section>
</template>
