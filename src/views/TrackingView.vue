<script setup lang="ts">
import { useShop } from '@/composables/useShop'

const { state, refreshDeliveryStatus, advanceDeliveryStatus } = useShop()
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <h2>ติดตามสถานะจัดส่ง</h2>
      <p>แสดงสถานะล่าสุดของคำสั่งซื้อที่เพิ่งสร้าง</p>
    </div>

    <div v-if="!state.delivery" class="empty">
      ยังไม่มีสถานะจัดส่ง กรุณาสั่งซื้อและชำระเงินก่อน
    </div>
    <article v-else class="card tracking">
      <p>Order #{{ state.delivery.order_id }}</p>
      <div class="status-row">
        <span>Payment:</span>
        <strong>{{ state.delivery.payment_status }}</strong>
      </div>
      <div class="status-row">
        <span>Delivery:</span>
        <strong>{{ state.delivery.delivery_status }}</strong>
      </div>
      <div class="actions">
        <button @click="refreshDeliveryStatus">Refresh</button>
        <button @click="advanceDeliveryStatus">Advance (Demo)</button>
      </div>
    </article>
  </section>
</template>
