import tls from 'tls'
import { URL } from 'url'

export interface SslInfo {
  valid: boolean
  error?: string
  expires_at?: string
  days_until_expiry?: number
  issuer?: string
  subject?: string
}

const SSL_CHECK_TIMEOUT_MS = 10000

/**
 * SSL error patterns that indicate certificate issues
 */
export const SSL_ERROR_PATTERNS = [
  'self-signed certificate',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'certificate has expired',
  'CERT_HAS_EXPIRED',
  'unable to get local issuer certificate',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'hostname/IP does not match',
]

/**
 * Check if an error message indicates an SSL certificate issue
 */
export function isSslError(errorMessage: string): boolean {
  const lowerMessage = errorMessage.toLowerCase()
  return SSL_ERROR_PATTERNS.some(pattern =>
    lowerMessage.includes(pattern.toLowerCase())
  )
}

/**
 * Check SSL certificate information for a given URL
 * Only works for HTTPS URLs
 */
export function checkSslCertificate(url: string): Promise<SslInfo> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url)

      if (parsed.protocol !== 'https:') {
        resolve({
          valid: true,
          error: 'Not an HTTPS URL - no SSL certificate to check',
        })
        return
      }

      const port = parsed.port ? parseInt(parsed.port) : 443

      const socket = tls.connect(
        {
          host: parsed.hostname,
          port,
          servername: parsed.hostname,
          rejectUnauthorized: true,
          timeout: SSL_CHECK_TIMEOUT_MS,
        },
        () => {
          const cert = socket.getPeerCertificate()

          if (!cert || Object.keys(cert).length === 0) {
            socket.destroy()
            resolve({
              valid: false,
              error: 'No certificate provided',
            })
            return
          }

          const expiresAt = new Date(cert.valid_to)
          const now = new Date()
          const daysUntilExpiry = Math.floor(
            (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )

          socket.destroy()
          resolve({
            valid: true,
            expires_at: expiresAt.toISOString(),
            days_until_expiry: daysUntilExpiry,
            issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown',
            subject: cert.subject?.CN || parsed.hostname,
          })
        }
      )

      socket.on('error', (error) => {
        socket.destroy()
        resolve({
          valid: false,
          error: error.message,
        })
      })

      socket.on('timeout', () => {
        socket.destroy()
        resolve({
          valid: false,
          error: `SSL check timeout after ${SSL_CHECK_TIMEOUT_MS}ms`,
        })
      })
    } catch (error) {
      resolve({
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })
}

/**
 * Format SSL expiry warning message
 */
export function getSslExpiryWarning(daysUntilExpiry: number): string | null {
  if (daysUntilExpiry < 0) {
    return 'SSL certificate has expired'
  }
  if (daysUntilExpiry <= 7) {
    return `SSL certificate expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`
  }
  if (daysUntilExpiry <= 30) {
    return `SSL certificate expires in ${daysUntilExpiry} days`
  }
  return null
}
