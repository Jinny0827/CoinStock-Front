import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',  // vite proxy 사용 시 빈 문자열
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 백엔드 bizError는 HTTP 200 + body.code로 에러를 표현 (실제 401 응답이 아님)
client.interceptors.response.use(
  (res) => {
    if (res.data?.code === '401') {
      useAuthStore.getState().clearAuth()
      if (location.pathname !== '/login') location.href = '/login'
    }
    return res
  },
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().clearAuth()
      if (location.pathname !== '/login') location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export default client
