import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ResultsBar from './ResultsBar'

describe('ResultsBar', () => {
  it('renders nothing when results array is empty', () => {
    const { container } = render(<ResultsBar results={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders each result card label', () => {
    const results = [
      { card: '5', count: 2, percentage: 67 },
      { card: '8', count: 1, percentage: 33 },
    ]
    render(<ResultsBar results={results} />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('uses singular "vote" for count of 1', () => {
    const results = [{ card: '3', count: 1, percentage: 100 }]
    render(<ResultsBar results={results} />)
    expect(screen.getByText('1 vote (100%)')).toBeInTheDocument()
  })

  it('has role=status and aria-live for screen readers', () => {
    const results = [
      { card: '5', count: 2, percentage: 67 },
      { card: '8', count: 1, percentage: 33 },
    ]
    render(<ResultsBar results={results} />)
    const bar = screen.getByRole('status')
    expect(bar).toBeInTheDocument()
    expect(bar).toHaveAttribute('aria-live', 'polite')
  })
})
