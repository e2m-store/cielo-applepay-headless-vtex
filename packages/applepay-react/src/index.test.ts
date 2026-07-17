import { describe, expect, it } from 'vitest'
import {
  ApplePayButton,
  ApplePayModal,
  useApplePay,
  useApplePaySdk,
} from './index'

describe('applepay-react exports', () => {
  it('exposes component and hook entry points', () => {
    expect(typeof ApplePayButton).toBe('function')
    expect(typeof ApplePayModal).toBe('function')
    expect(typeof useApplePay).toBe('function')
    expect(typeof useApplePaySdk).toBe('function')
  })
})
