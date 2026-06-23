export interface User {
  userId: number
  email: string
  role: string
  nickname: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface SignupPayload {
  email: string
  password: string
  nickname?: string
}

export interface AuthResponse {
  code: string
  token: string
  userId: number
  role?: string
  nickname?: string
}
