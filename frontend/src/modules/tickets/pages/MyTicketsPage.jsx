import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import CreateTicketModal from '../components/CreateTicketModal'
import TicketDetailModal from '../components/TicketDetailModal'
import { useMyTickets } from '../hooks/useMyTickets'
import { useTicket } from '../hooks/useTicket'
import { deleteTicket, updateTicket } from '../api/ticketApi'
import { useAuthUser } from '../hooks/useAuthUser'
import authApi from '../api/authApi'

const categoryOptions = [
  'ELECTRICAL',
  'PLUMBING',
  'IT_EQUIPMENT',
  'FURNITURE',
  'SAFETY',
  'HVAC',
  'SECURITY',
  'OTHER',
]

const priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const statusColors = {
  OPEN: '#2563eb',
  IN_PROGRESS: '#f59e0b',
  RESOLVED: '#16a34a',
  CLOSED: '#4b5563',
  REJECTED: '#dc2626',
}

const priorityColors = {
  LOW: '#15803d',
  MEDIUM: '#b45309',
  HIGH: '#b91c1c',
  CRITICAL: '#7f1d1d',
}

const humanize = (value) => {
  if (!value) {
    return '-'
  }

  return value
    .toString()
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const getTickets = (data) => {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.content)) {
    return data.content
  }

  return []
}

const MyTicketsPage = () => {
  const queryClient = useQueryClient()
  const { data: authData } = useAuthUser()
  const currentUser = authData?.user
  const canModifyTickets = currentUser?.role === 'STUDENT'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState(null)
  const [viewingTicketId, setViewingTicketId] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const filters = useMemo(() => ({ page: currentPage, size: 10 }), [currentPage])

  const { data, isLoading, isError } = useMyTickets(filters)
  const { data: ticketDetail } = useTicket(viewingTicketId)
  const tickets = getTickets(data)
  const totalPages = data?.totalPages || 0

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      resourceId: '',
      location: '',
      category: '',
      description: '',
      priority: '',
      preferredContact: '',
    },
  })

  useEffect(() => {
    if (!editingTicket) {
      reset({
        resourceId: '',
        location: '',
        category: '',
        description: '',
        priority: '',
        preferredContact: '',
      })
      return
    }

    reset({
      resourceId: editingTicket.resourceId ?? '',
      location: editingTicket.location ?? '',
      category: editingTicket.category ?? '',
      description: editingTicket.description ?? '',
      priority: editingTicket.priority ?? '',
      preferredContact: editingTicket.preferredContact ?? '',
    })
  }, [editingTicket, reset])

  const updateTicketMutation = useMutation({
    mutationFn: ({ ticketId, payload }) => updateTicket(ticketId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTickets'] })
      setEditingTicket(null)
    },
  })

  const deleteTicketMutation = useMutation({
    mutationFn: (ticketId) => deleteTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTickets'] })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.clear()
      window.location.href = '/login'
    },
  })

  const onSubmitEdit = (values) => {
    if (!editingTicket) {
      return
    }

    const normalizedResourceId = values.resourceId ? Number(values.resourceId) : null
    const normalizedLocation = values.location.trim()
    if (!normalizedResourceId && !normalizedLocation) {
      return
    }

    updateTicketMutation.mutate({
      ticketId: editingTicket.ticketId,
      payload: {
        ...values,
        resourceId: normalizedResourceId,
        location: normalizedLocation || null,
        category: values.category.trim().toUpperCase(),
        description: values.description.trim(),
        priority: values.priority.trim().toUpperCase(),
        preferredContact: values.preferredContact.trim(),
      },
    })
  }

  const handleDelete = (ticket) => {
    if (!canModifyTickets) {
      return
    }

    if (ticket.status !== 'OPEN') {
      return
    }

    const confirmed = window.confirm(`Delete ticket #${ticket.ticketId}? This cannot be undone.`)
    if (!confirmed) {
      return
    }

    deleteTicketMutation.mutate(ticket.ticketId)
  }

  return (
    <main style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Tickets</h1>
        <div style={styles.headerRight}>
          <div style={styles.userChip}>
            <strong>{currentUser?.fullName ?? 'Guest'}</strong>
            <span style={styles.roleChip}>{currentUser?.role ?? '-'}</span>
          </div>
          {canModifyTickets && (
            <button type="button" onClick={() => setIsModalOpen(true)} style={styles.primaryButton}>
              Create Ticket
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              logoutMutation.mutate()
            }}
            style={styles.secondaryButton}
          >
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>

      {isLoading && <p>Loading tickets...</p>}
      {isError && <p style={styles.error}>Failed to load tickets.</p>}

      {!isLoading && !isError && tickets.length === 0 && (
        <p style={styles.empty}>No tickets yet. Create your first ticket.</p>
      )}

      <section style={styles.grid}>
        {tickets.map((ticket) => (
          <article key={ticket.ticketId} style={styles.card}>
            <div style={styles.cardHeader}>
              <strong>#{ticket.ticketId}</strong>
              <span style={{ ...styles.badge, backgroundColor: statusColors[ticket.status] ?? '#6b7280' }}>
                {humanize(ticket.status)}
              </span>
            </div>

            <h3 style={styles.cardTitle}>
              {ticket.location || `Resource #${ticket.resourceId}` || 'No location/resource'}
            </h3>
            <p style={styles.cardText}>
              {ticket.description.length > 100
                ? `${ticket.description.substring(0, 100)}...`
                : ticket.description}
            </p>

            <div style={styles.cardMeta}>
              <span style={{ ...styles.badge, backgroundColor: priorityColors[ticket.priority] ?? '#6b7280' }}>
                {humanize(ticket.priority)}
              </span>
              <small>Category: {humanize(ticket.category)}</small>
              {ticket.attachmentCount > 0 && (
                <small>📎 {ticket.attachmentCount} attachment{ticket.attachmentCount > 1 ? 's' : ''}</small>
              )}
            </div>

            <div style={styles.cardActions}>
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() => setViewingTicketId(ticket.ticketId)}
              >
                View Details
              </button>
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() => setEditingTicket(ticket)}
                disabled={!canModifyTickets || ticket.status !== 'OPEN'}
                title={
                  !canModifyTickets
                    ? 'Only STUDENT can edit in mock mode'
                    : ticket.status !== 'OPEN'
                      ? 'Only OPEN tickets can be edited'
                      : 'Edit ticket'
                }
              >
                Edit
              </button>
              <button
                type="button"
                style={styles.dangerButton}
                onClick={() => handleDelete(ticket)}
                disabled={!canModifyTickets || ticket.status !== 'OPEN' || deleteTicketMutation.isPending}
                title={
                  !canModifyTickets
                    ? 'Only STUDENT can delete in mock mode'
                    : ticket.status !== 'OPEN'
                      ? 'Only OPEN tickets can be deleted'
                      : 'Delete ticket'
                }
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            style={styles.paginationButton}
          >
            Previous
          </button>
          <span style={styles.pageInfo}>
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage >= totalPages - 1}
            style={styles.paginationButton}
          >
            Next
          </button>
        </div>
      )}

      <CreateTicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <TicketDetailModal
        ticket={ticketDetail}
        isOpen={!!viewingTicketId}
        onClose={() => setViewingTicketId(null)}
      />

      {editingTicket && (
        <div style={styles.backdrop}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Ticket #{editingTicket.ticketId}</h2>
              <button type="button" onClick={() => setEditingTicket(null)} style={styles.closeButton}>
                x
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitEdit)} style={styles.form}>
              <label style={styles.field}>
                Location
                <input
                  {...register('location', {
                    validate: (value) => {
                      const hasResource = Number(getValues('resourceId')) > 0
                      const hasLocation = value.trim().length > 0
                      return hasResource || hasLocation || 'Provide either a Resource ID or a Location'
                    },
                  })}
                  placeholder="Building / room"
                />
                {errors.location && <span style={styles.error}>{errors.location.message}</span>}
              </label>

              <label style={styles.field}>
                Category *
                <select {...register('category', { required: 'Category is required' })}>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {humanize(option)}
                    </option>
                  ))}
                </select>
                {errors.category && <span style={styles.error}>{errors.category.message}</span>}
              </label>

              <label style={styles.field}>
                Priority *
                <select {...register('priority', { required: 'Priority is required' })}>
                  {priorityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.priority && <span style={styles.error}>{errors.priority.message}</span>}
              </label>

              <label style={styles.field}>
                Preferred Contact *
                <input
                  {...register('preferredContact', {
                    required: 'Preferred contact is required',
                    validate: (value) => value.trim().length > 0 || 'Preferred contact is required',
                  })}
                />
                {errors.preferredContact && <span style={styles.error}>{errors.preferredContact.message}</span>}
              </label>

              <label style={styles.field}>
                Resource ID
                <input
                  type="number"
                  min="1"
                  {...register('resourceId', {
                    validate: (value) => {
                      if (value !== '' && Number(value) <= 0) {
                        return 'Resource ID must be greater than 0'
                      }
                      const hasLocation = getValues('location')?.trim().length > 0
                      const hasResource = value !== '' && Number(value) > 0
                      return hasLocation || hasResource || 'Provide either a Resource ID or a Location'
                    },
                  })}
                />
                {errors.resourceId && <span style={styles.error}>{errors.resourceId.message}</span>}
              </label>

              <label style={styles.field}>
                Description *
                <textarea
                  rows="4"
                  {...register('description', {
                    required: 'Description is required',
                    validate: (value) => value.trim().length > 0 || 'Description is required',
                    maxLength: {
                      value: 500,
                      message: 'Description cannot exceed 500 characters',
                    },
                  })}
                />
                {errors.description && <span style={styles.error}>{errors.description.message}</span>}
              </label>

              {updateTicketMutation.isError && (
                <p style={styles.error}>
                  {updateTicketMutation.error?.response?.data?.message ??
                    'Failed to update ticket. Please try again.'}
                </p>
              )}

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setEditingTicket(null)} style={styles.secondaryButton}>
                  Cancel
                </button>
                <button type="submit" disabled={updateTicketMutation.isPending} style={styles.primaryButton}>
                  {updateTicketMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

const styles = {
  container: {
    maxWidth: 980,
    margin: '0 auto',
    padding: '1.5rem 1rem 2rem',
    color: '#111827',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    border: '1px solid #dbeafe',
    backgroundColor: '#f0f9ff',
    borderRadius: 999,
    padding: '0.3rem 0.65rem',
    fontSize: '0.82rem',
  },
  roleChip: {
    backgroundColor: '#0ea5e9',
    color: '#fff',
    borderRadius: 999,
    padding: '0.15rem 0.45rem',
    fontSize: '0.72rem',
    fontWeight: 700,
  },
  title: {
    margin: 0,
  },
  grid: {
    display: 'grid',
    gap: '0.85rem',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  },
  card: {
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '0.85rem',
    backgroundColor: '#fff',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.35rem',
  },
  cardTitle: {
    margin: '0.35rem 0',
  },
  cardText: {
    margin: '0.2rem 0 0.7rem',
  },
  cardMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.5rem',
  },
  cardActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    marginTop: '0.7rem',
  },
  badge: {
    color: '#fff',
    borderRadius: 999,
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '0.2rem 0.6rem',
  },
  primaryButton: {
    border: 'none',
    borderRadius: 8,
    backgroundColor: '#2563eb',
    color: '#fff',
    padding: '0.6rem 0.9rem',
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid #d0d5dd',
    borderRadius: 8,
    backgroundColor: '#fff',
    color: '#111827',
    padding: '0.5rem 0.85rem',
    cursor: 'pointer',
  },
  dangerButton: {
    border: 'none',
    borderRadius: 8,
    backgroundColor: '#dc2626',
    color: '#fff',
    padding: '0.5rem 0.85rem',
    cursor: 'pointer',
  },
  empty: {
    border: '1px dashed #d1d5db',
    borderRadius: 8,
    padding: '0.75rem',
  },
  error: {
    color: '#b42318',
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  modal: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: '1rem',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  modalTitle: {
    margin: 0,
  },
  closeButton: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  form: {
    display: 'grid',
    gap: '0.75rem',
  },
  field: {
    display: 'grid',
    gap: '0.35rem',
    fontSize: '0.95rem',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '1rem',
  },
  paginationButton: {
    border: '1px solid #d0d5dd',
    borderRadius: 8,
    backgroundColor: '#fff',
    color: '#111827',
    padding: '0.5rem 0.85rem',
    cursor: 'pointer',
  },
  pageInfo: {
    fontSize: '0.9rem',
    color: '#6b7280',
  },
}

export default MyTicketsPage
