// Jest setup for GitLab module tests
import '@testing-library/jest-dom'

// Mock global fetch for API tests
global.fetch = jest.fn() as jest.Mock

// Mock console methods to reduce noise during tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return // Suppress specific warnings
    }
    originalConsoleError(...args)
  }
  
  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return // Suppress specific warnings
    }
    originalConsoleWarn(...args)
  }
})

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
  jest.restoreAllMocks()
})