// 백엔드 bizError는 HTTP 200 + body.code로 에러를 표현 (실제 4xx 응답이 아님)
interface ApiBody { code: string; message?: string }

export function unwrap<T extends ApiBody>(body: T): T {
  if (body.code !== '0000') throw new Error(body.message ?? '요청에 실패했습니다')
  return body
}
