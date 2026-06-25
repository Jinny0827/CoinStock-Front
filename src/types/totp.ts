export interface TotpStatus {
  code: string
  enabled: boolean
}

export interface TotpSetup {
  secret: string
  otpauthUri: string
}
