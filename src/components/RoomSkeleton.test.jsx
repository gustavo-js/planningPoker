import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import RoomSkeleton from './RoomSkeleton'

describe('RoomSkeleton', () => {
  it('renders skeleton cards', () => {
    render(<RoomSkeleton />)
    expect(screen.getByTestId('room-skeleton')).toBeInTheDocument()
  })

  it('has aria-label for screen readers', () => {
    render(<RoomSkeleton />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading room…')
  })
})
