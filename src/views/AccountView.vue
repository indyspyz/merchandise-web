<script setup lang="ts">
import { ref } from 'vue'
import { useShop } from '@/composables/useShop'

const { isAuthenticated, registerMember, loginMember } = useShop()

const registerName = ref('')
const registerEmail = ref('')
const registerPassword = ref('')
const loginEmail = ref('')
const loginPassword = ref('')

async function submitRegister() {
  await registerMember(registerName.value, registerEmail.value, registerPassword.value)
}

async function submitLogin() {
  await loginMember(loginEmail.value, loginPassword.value)
}
</script>

<template>
  <section class="panel account-grid">
    <article class="card">
      <h2>สมัครสมาชิก</h2>
      <div class="field">
        <label>ชื่อ</label>
        <input v-model="registerName" placeholder="เช่น Weerawat" />
      </div>
      <div class="field">
        <label>Email</label>
        <input v-model="registerEmail" type="email" placeholder="you@example.com" />
      </div>
      <div class="field">
        <label>Password</label>
        <input v-model="registerPassword" type="password" placeholder="********" />
      </div>
      <button @click="submitRegister">สมัครสมาชิก</button>
    </article>

    <article class="card">
      <h2>เข้าสู่ระบบ</h2>
      <div class="field">
        <label>Email</label>
        <input v-model="loginEmail" type="email" placeholder="you@example.com" />
      </div>
      <div class="field">
        <label>Password</label>
        <input v-model="loginPassword" type="password" placeholder="********" />
      </div>
      <button @click="submitLogin">เข้าสู่ระบบ</button>
      <p class="hint">สถานะตอนนี้: <strong>{{ isAuthenticated ? 'Login แล้ว' : 'ยังไม่ได้ Login' }}</strong></p>
    </article>
  </section>
</template>
