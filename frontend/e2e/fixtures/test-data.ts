/**
 * Test data shared between fixtures and specs. Mirrors the constants in
 * `backend/account/management/commands/seed_e2e.py` — keep both files in
 * sync if you change them.
 */

export const E2E_USER = {
  username: 'e2e_user',
  email: 'e2e_user@pokebin.test',
  password: 'P0kebin!E2E_test',
} as const

export const E2E_INACTIVE_USER = {
  username: 'e2e_inactive',
  email: 'e2e_inactive@pokebin.test',
  password: 'P0kebin!E2E_test',
} as const

export const E2E_SHIPPING = {
  full_name: 'E2E Tester',
  email: E2E_USER.email,
  address1: '100 Test Lane',
  address2: 'Suite 42',
  city: 'Testville',
  state: 'CA',
  zipcode: '90001',
} as const

export const E2E_GUEST_ORDER_EMAIL = 'guest_order@pokebin.test'

export const BACKEND_URL = process.env.PW_BACKEND_URL ?? 'http://127.0.0.1:8000'
