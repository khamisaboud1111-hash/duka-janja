import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/payments/aggregator', () => ({
  isValidWebhookSignature: vi.fn(),
  verifyTransaction: vi.fn(),
}))

import { POST } from './route'
import { isValidWebhookSignature, verifyTransaction } from '@/lib/payments/aggregator'
import { createAdminClient } from '@/lib/supabase/admin'

const mockedIsValidSignature = isValidWebhookSignature as ReturnType<typeof vi.fn>
const mockedVerifyTransaction = verifyTransaction as ReturnType<typeof vi.fn>
const mockedCreateAdminClient = createAdminClient as ReturnType<typeof vi.fn>

function makeRequest(body: any, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/payments/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

describe('POST /api/payments/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects request without valid signature', async () => {
    mockedIsValidSignature.mockReturnValue(false)
    const req = makeRequest({ data: { id: '123' } }, { 'verif-hash': 'invalid' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('rejects request with missing signature', async () => {
    mockedIsValidSignature.mockReturnValue(false)
    const req = makeRequest({ data: { id: '123' } })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('rejects invalid JSON', async () => {
    mockedIsValidSignature.mockReturnValue(true)
    const req = new Request('http://localhost/api/payments/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'verif-hash': 'valid' },
      body: 'not json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('rejects when transaction verification fails', async () => {
    mockedIsValidSignature.mockReturnValue(true)
    mockedVerifyTransaction.mockResolvedValue({ verified: false })
    const req = makeRequest({ data: { id: 'tx-123' } }, { 'verif-hash': 'valid' })
    const res = await POST(req)
    expect(res.status).toBe(502)
  })

  it('rejects when amount is less than order total', async () => {
    mockedIsValidSignature.mockReturnValue(true)
    mockedVerifyTransaction.mockResolvedValue({
      verified: true,
      status: 'successful',
      amount: 500,
      orderId: null,
      txRef: 'tx-ref-1',
    })
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'order-1' } }),
      single: vi.fn().mockResolvedValue({ data: { id: 'order-1', total_amount: 10000, payment_confirmed: false, status: 'pending' } }),
      update: vi.fn().mockReturnThis(),
    }
    mockedCreateAdminClient.mockReturnValue(mockSupabase)
    const req = makeRequest({ data: { id: 'tx-123' } }, { 'verif-hash': 'valid' })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it('accepts already-processed orders idempotently', async () => {
    mockedIsValidSignature.mockReturnValue(true)
    mockedVerifyTransaction.mockResolvedValue({
      verified: true,
      status: 'successful',
      amount: 10000,
      orderId: 'order-1',
      txRef: null,
    })
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'order-1', total_amount: 10000, payment_confirmed: true, status: 'confirmed' } }),
    }
    mockedCreateAdminClient.mockReturnValue(mockSupabase)
    const req = makeRequest({ data: { id: 'tx-123' } }, { 'verif-hash': 'valid' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.already_processed).toBe(true)
  })
})
