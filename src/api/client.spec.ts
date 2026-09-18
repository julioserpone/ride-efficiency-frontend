import { beforeEach, describe, expect, it } from 'vitest'

import { clearStoredToken, getStoredToken, storeToken } from './client'

describe('token storage', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('stores and reads back the bearer token', () => {
        storeToken('1|abc123')

        expect(getStoredToken()).toBe('1|abc123')
    })

    it('returns null when no token is stored', () => {
        expect(getStoredToken()).toBeNull()
    })

    it('removes the token on clear', () => {
        storeToken('1|abc123')
        clearStoredToken()

        expect(getStoredToken()).toBeNull()
    })
})
