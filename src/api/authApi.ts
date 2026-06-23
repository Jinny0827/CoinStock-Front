import client from './client'
import { unwrap } from './apiUtils'
import type { AuthResponse, LoginPayload, SignupPayload } from '../types/auth'

export const signup = (payload: SignupPayload) =>
  client.post<AuthResponse>('/api/auth/signup', payload).then(r => unwrap(r.data))

export const login = (payload: LoginPayload) =>
  client.post<AuthResponse>('/api/auth/login', payload).then(r => unwrap(r.data))

export const logout = () =>
  client.post<{ code: string; message: string }>('/api/auth/logout').then(r => unwrap(r.data))
