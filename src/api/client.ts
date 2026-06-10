import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',  // vite proxy 사용 시 빈 문자열
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

export default client
