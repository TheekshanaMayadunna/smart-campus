import { useState } from 'react'

const TicketDetailModal = ({ ticket, isOpen, onClose }) => {
  const [selectedImage, setSelectedImage] = useState(null)

  if (!isOpen || !ticket) return null

  const handleImageClick = (attachment) => {
    setSelectedImage(attachment)
  }

  const closeImageModal = () => {
    setSelectedImage(null)
  }

  return (
    <>
      <div style={styles.backdrop} onClick={onClose}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={styles.header}>
            <h2 style={styles.title}>Ticket #{ticket.ticketId}</h2>
            <button type="button" onClick={onClose} style={styles.closeButton}>
              ×
            </button>
          </div>

          <div style={styles.content}>
            <div style={styles.section}>
              <h3>Details</h3>
              <p><strong>Location:</strong> {ticket.location || `Resource #${ticket.resourceId}` || 'N/A'}</p>
              <p><strong>Category:</strong> {ticket.category}</p>
              <p><strong>Priority:</strong> {ticket.priority}</p>
              <p><strong>Status:</strong> {ticket.status}</p>
              <p><strong>Description:</strong> {ticket.description}</p>
              <p><strong>Preferred Contact:</strong> {ticket.preferredContact}</p>
              <p><strong>Created:</strong> {new Date(ticket.createdAt).toLocaleString()}</p>
            </div>

            {ticket.attachments && ticket.attachments.length > 0 && (
              <div style={styles.section}>
                <h3>Attachments ({ticket.attachments.length})</h3>
                <div style={styles.attachmentsGrid}>
                  {ticket.attachments.map((attachment) => (
                    <div key={attachment.attachmentId} style={styles.attachmentItem}>
                      <img
                        src={`/api/v1/tickets/attachments/${attachment.attachmentId}`}
                        alt={attachment.fileName}
                        style={styles.thumbnail}
                        onClick={() => handleImageClick(attachment)}
                      />
                      <p style={styles.fileName}>{attachment.fileName}</p>
                      <p style={styles.fileSize}>{(attachment.fileSize / 1024).toFixed(1)} KB</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedImage && (
        <div style={styles.imageModalBackdrop} onClick={closeImageModal}>
          <div style={styles.imageModal} onClick={(e) => e.stopPropagation()}>
            <img
              src={`/api/v1/tickets/attachments/${selectedImage.attachmentId}`}
              alt={selectedImage.fileName}
              style={styles.fullImage}
            />
            <button type="button" onClick={closeImageModal} style={styles.closeImageButton}>
              ×
            </button>
          </div>
        </div>
      )}
    </>
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
    zIndex: 1000,
  },
  modal: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '80vh',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: '1rem',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '0.5rem',
  },
  title: {
    margin: 0,
  },
  closeButton: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '1.5rem',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  section: {
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: '1rem',
  },
  attachmentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '1rem',
    marginTop: '0.5rem',
  },
  attachmentItem: {
    textAlign: 'center',
  },
  thumbnail: {
    width: '100%',
    height: 80,
    objectFit: 'cover',
    borderRadius: 4,
    cursor: 'pointer',
    border: '1px solid #e5e7eb',
  },
  fileName: {
    fontSize: '0.8rem',
    margin: '0.25rem 0',
    wordBreak: 'break-word',
  },
  fileSize: {
    fontSize: '0.7rem',
    color: '#6b7280',
    margin: 0,
  },
  imageModalBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  imageModal: {
    position: 'relative',
    maxWidth: '90vw',
    maxHeight: '90vh',
  },
  fullImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  closeImageButton: {
    position: 'absolute',
    top: '-10px',
    right: '-10px',
    border: 'none',
    background: '#fff',
    borderRadius: '50%',
    width: 30,
    height: 30,
    cursor: 'pointer',
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
}

export default TicketDetailModal