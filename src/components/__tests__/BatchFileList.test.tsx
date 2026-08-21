import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import BatchFileList from '../BatchFileList'
import type { BatchFile } from '../../hooks/useBatch'

const makeFile = (overrides: Partial<BatchFile> = {}): BatchFile => ({
  original_name: 'photo.png',
  output_filename: null,
  download_url: null,
  status: 'queued',
  error: null,
  ...overrides,
})

describe('BatchFileList', () => {
  it('renders nothing when files array is empty', () => {
    const { container } = render(<BatchFileList files={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the correct number of file items', () => {
    const files = [makeFile({ original_name: 'a.png' }), makeFile({ original_name: 'b.png' })]
    render(<BatchFileList files={files} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('displays the original filename', () => {
    render(<BatchFileList files={[makeFile({ original_name: 'my-photo.jpg' })]} />)
    expect(screen.getByText('my-photo.jpg')).toBeInTheDocument()
  })

  it('shows "Queued" label for queued files', () => {
    render(<BatchFileList files={[makeFile({ status: 'queued' })]} />)
    expect(screen.getByText('Queued')).toBeInTheDocument()
  })

  it('shows "Processing…" label for processing files', () => {
    render(<BatchFileList files={[makeFile({ status: 'processing' })]} />)
    expect(screen.getByText('Processing\u2026')).toBeInTheDocument()
  })

  it('shows "Done" label for completed files', () => {
    render(<BatchFileList files={[makeFile({ status: 'done', output_filename: 'out.png', download_url: '/api/download/out.png' })]} />)
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('shows "Failed" label and error message for error files', () => {
    render(<BatchFileList files={[makeFile({ status: 'error', error: 'Model crashed' })]} />)
    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.getByText('Model crashed')).toBeInTheDocument()
  })

  it('shows a download link for completed files with download_url', () => {
    const file = makeFile({
      status: 'done',
      output_filename: 'result.png',
      download_url: '/api/download/result.png',
    })
    render(<BatchFileList files={[file]} />)
    const link = screen.getByRole('link', { name: /download/i })
    expect(link).toHaveAttribute('href', '/api/download/result.png')
  })

  it('does not show download link for queued files', () => {
    render(<BatchFileList files={[makeFile({ status: 'queued' })]} />)
    expect(screen.queryByRole('link', { name: /download/i })).toBeNull()
  })

  it('does not show download link for error files', () => {
    render(<BatchFileList files={[makeFile({ status: 'error', error: 'fail' })]} />)
    expect(screen.queryByRole('link', { name: /download/i })).toBeNull()
  })

  it('renders mixed statuses correctly', () => {
    const files = [
      makeFile({ original_name: 'a.png', status: 'done', output_filename: 'a_result.png', download_url: '/api/download/a_result.png' }),
      makeFile({ original_name: 'b.png', status: 'processing' }),
      makeFile({ original_name: 'c.png', status: 'error', error: 'Failed to process' }),
    ]
    render(<BatchFileList files={files} />)
    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(screen.getByText('Processing\u2026')).toBeInTheDocument()
    expect(screen.getByText('Failed')).toBeInTheDocument()
  })
})
