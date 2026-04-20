import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTicket } from '../api/ticketApi'

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

const CreateTicketModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient()

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

  const createTicketMutation = useMutation({
    mutationFn: (payload) => createTicket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTickets'] })
      reset()
      onClose()
    },
  })
  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  if (!isOpen) {
    return null
  }

  const onSubmit = (values) => {
    const normalizedResourceId = values.resourceId ? Number(values.resourceId) : null
    const normalizedLocation = values.location.trim()
    if (!normalizedResourceId && !normalizedLocation) {
      return
    }

    const payload = {
      ...values,
      resourceId: normalizedResourceId,
      description: values.description.trim(),
      location: normalizedLocation || null,
      category: values.category.trim().toUpperCase(),
      priority: values.priority.trim().toUpperCase(),
      preferredContact: values.preferredContact.trim(),
    }

    createTicketMutation.mutate(payload)
  }

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Create Ticket</h2>
          <button type="button" onClick={onClose} style={styles.closeButton}>
            x
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
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
            <select
              {...register('category', { required: 'Category is required' })}
              defaultValue=""
            >
              <option value="" disabled>
                Select category
              </option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replace('_', ' ')}
                </option>
              ))}
            </select>
            {errors.category && <span style={styles.error}>{errors.category.message}</span>}
          </label>

          <label style={styles.field}>
            Priority *
            <select
              {...register('priority', { required: 'Priority is required' })}
              defaultValue=""
            >
              <option value="" disabled>
                Select priority
              </option>
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
                validate: (value) =>
                  value.trim().length > 0 || 'Preferred contact is required',
              })}
              placeholder="Email or phone"
            />
            {errors.preferredContact && (
              <span style={styles.error}>{errors.preferredContact.message}</span>
            )}
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
              placeholder="Optional"
            />
            {errors.resourceId && <span style={styles.error}>{errors.resourceId.message}</span>}
          </label>

          <label style={styles.field}>
            Description *
            <textarea
              rows="4"
              {...register('description', {
                required: 'Description is required',
                validate: (value) =>
                  value.trim().length > 0 || 'Description is required',
                maxLength: {
                  value: 2000,
                  message: 'Description cannot exceed 2000 characters',
                },
              })}
              placeholder="Describe the issue"
            />
            {errors.description && (
              <span style={styles.error}>{errors.description.message}</span>
            )}
          </label>

          {createTicketMutation.isError && (
            <p style={styles.error}>
              {createTicketMutation.error?.response?.data?.message ??
                'Failed to create ticket. Please try again.'}
            </p>
          )}

          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.secondaryButton}>
              Cancel
            </button>
            <button type="submit" disabled={createTicketMutation.isPending} style={styles.primaryButton}>
              {createTicketMutation.isPending ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  title: {
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
  error: {
    color: '#b42318',
    fontSize: '0.8rem',
    margin: 0,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    marginTop: '0.5rem',
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
    padding: '0.6rem 0.9rem',
    cursor: 'pointer',
  },
}

export default CreateTicketModal
