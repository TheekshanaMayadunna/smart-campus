package com.smartcampus.service;

import com.smartcampus.dto.ResolutionRequest;
import com.smartcampus.dto.TicketRequestDTO;
import com.smartcampus.dto.TicketResponseDTO;
import com.smartcampus.model.Comment;
import com.smartcampus.model.Auth.User;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.TicketAttachment;
import com.smartcampus.model.NotificationType;
import com.smartcampus.model.TicketStatus;
import com.smartcampus.repository.Auth.UserRepository;
import com.smartcampus.repository.CommentRepository;
import com.smartcampus.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class TicketService {
    private final TicketRepository ticketRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    @Transactional
    public Ticket createTicket(User creator, TicketRequestDTO request) {
        Ticket ticket = new Ticket();
        ticket.setCreatedBy(creator);
        ticket.setResourceLocation(requireText(request.getResourceLocation(), "Resource/location is required"));
        ticket.setCategory(requireText(request.getCategory(), "Category is required"));
        ticket.setDescription(requireText(request.getDescription(), "Description is required"));
        ticket.setPriority(requireText(request.getPriority(), "Priority is required"));
        ticket.setPreferredContact(requireText(request.getPreferredContact(), "Preferred contact details are required"));
        ticket.setStatus(TicketStatus.OPEN);

        List<String> attachmentUrls = fileStorageService.storeTicketImages(request.getImages());

        List<TicketAttachment> attachments = new ArrayList<>();
        for (String url : attachmentUrls) {
            if (url == null || url.isBlank()) continue;
            TicketAttachment attachment = new TicketAttachment();
            attachment.setTicket(ticket);
            attachment.setImageUrl(url.trim());
            attachments.add(attachment);
        }
        ticket.setAttachments(attachments);
        Ticket saved = ticketRepository.save(ticket);
        userRepository.findAll().stream()
                .filter(candidate -> "ADMIN".equalsIgnoreCase(candidate.getRole()))
                .filter(admin -> !Objects.equals(admin.getId(), creator.getId()))
                .forEach(admin -> notificationService.create(
                        admin,
                        NotificationType.TICKET_CREATED,
                        "New support ticket submitted",
                        (creator.getName() == null || creator.getName().isBlank() ? "A user" : creator.getName().trim())
                                + " created ticket #" + saved.getId() + ".",
                        "TICKET",
                        saved.getId()));
        return saved;
    }

    public List<Ticket> listForUser(User user) {
        String role = user.getRole() == null ? "" : user.getRole().toUpperCase(Locale.ROOT);
        if ("ADMIN".equals(role) || "STAFF".equals(role)) {
            return sortNewestFirst(ticketRepository.findAll());
        }
        if ("TECHNICIAN".equals(role)) {
            return sortNewestFirst(ticketRepository.findByAssignedTechnicianId(user.getId()));
        }
        return sortNewestFirst(ticketRepository.findByCreatedById(user.getId()));
    }

    private List<Ticket> sortNewestFirst(List<Ticket> tickets) {
        return tickets.stream()
                .sorted(Comparator.comparing(Ticket::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .toList();
    }

    @Transactional
    public void deleteResolvedTicket(Long ticketId, User actor) {
        Ticket ticket = getTicket(ticketId);
        TicketStatus st = ticket.getStatus();
        if (st != TicketStatus.RESOLVED && st != TicketStatus.CLOSED) {
            throw new IllegalArgumentException("Only resolved or closed tickets can be deleted");
        }
        String role = actor.getRole() == null ? "" : actor.getRole().toUpperCase(Locale.ROOT);
        if ("ADMIN".equals(role)) {
            ticketRepository.delete(ticket);
            return;
        }
        if ("TECHNICIAN".equals(role)) {
            if (ticket.getAssignedTechnician() == null
                    || !Objects.requireNonNull(actor.getId(), "Actor id is required")
                            .equals(ticket.getAssignedTechnician().getId())) {
                throw new IllegalArgumentException("Forbidden");
            }
            ticketRepository.delete(ticket);
            return;
        }
        throw new IllegalArgumentException("Forbidden");
    }

    @Transactional(readOnly = true)
    public byte[] exportResolvedTicketPdf(Long ticketId, User actor) {
        requireRole(actor, "ADMIN");
        Ticket ticket = ticketRepository.findDetailById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
        TicketStatus st = ticket.getStatus();
        if (st != TicketStatus.RESOLVED && st != TicketStatus.CLOSED) {
            throw new IllegalArgumentException("PDF export is only available for resolved or closed tickets");
        }
        List<Comment> comments = commentRepository.findByTicketIdWithAuthorsAsc(ticketId);
        try {
            return TicketPdfBuilder.build(ticket, comments);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate PDF: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Ticket assignTechnician(Long ticketId, Long technicianId, User actor) {
        requireRole(actor, "ADMIN");
        Ticket ticket = getTicket(ticketId);
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new IllegalArgumentException("Technician not found"));
        if (!"TECHNICIAN".equalsIgnoreCase(technician.getRole())) {
            throw new IllegalArgumentException("Assigned user must have TECHNICIAN role");
        }
        ticket.setAssignedTechnician(technician);
        return ticketRepository.save(ticket);
    }

    @Transactional
    public Ticket updateStatus(Long ticketId, ResolutionRequest request, User actor) {
        Ticket ticket = getTicket(ticketId);
        TicketStatus nextStatus = TicketStatus.valueOf(requireText(request.getStatus(), "Status is required").toUpperCase(Locale.ROOT));

        if ("ADMIN".equalsIgnoreCase(actor.getRole()) && nextStatus == TicketStatus.REJECTED) {
            String reason = requireText(request.getRejectionReason(), "Rejection reason is required");
            ticket.setStatus(TicketStatus.REJECTED);
            ticket.setRejectionReason(reason);
            Ticket saved = ticketRepository.save(ticket);
            notificationService.create(
                    saved.getCreatedBy(),
                    NotificationType.TICKET_STATUS_CHANGED,
                    "Ticket status updated",
                    "Your ticket #" + saved.getId() + " status changed to " + saved.getStatus().name()
                            + ". Reason: " + reason,
                    "TICKET",
                    saved.getId());
            return saved;
        }

        if ("TECHNICIAN".equalsIgnoreCase(actor.getRole())) {
            if (ticket.getAssignedTechnician() == null
                    || !Objects.requireNonNull(ticket.getAssignedTechnician().getId(), "Assigned technician id is required")
                            .equals(Objects.requireNonNull(actor.getId(), "Actor id is required"))) {
                throw new IllegalArgumentException("You can only update tickets assigned to you");
            }
            if (nextStatus == TicketStatus.IN_PROGRESS && ticket.getStatus() == TicketStatus.OPEN) {
                ticket.setStatus(TicketStatus.IN_PROGRESS);
            } else if (nextStatus == TicketStatus.RESOLVED && ticket.getStatus() == TicketStatus.IN_PROGRESS) {
                ticket.setResolutionNotes(requireText(request.getResolutionNotes(), "Resolution notes are required"));
                ticket.setStatus(TicketStatus.RESOLVED);
            } else {
                throw new IllegalArgumentException("Invalid technician transition");
            }
            Ticket saved = ticketRepository.save(ticket);
            notificationService.create(
                    saved.getCreatedBy(),
                    NotificationType.TICKET_STATUS_CHANGED,
                    "Ticket status updated",
                    "Your ticket #" + saved.getId() + " status changed to " + saved.getStatus().name() + ".",
                    "TICKET",
                    saved.getId());
            return saved;
        }

        if ("ADMIN".equalsIgnoreCase(actor.getRole()) && nextStatus == TicketStatus.CLOSED && ticket.getStatus() == TicketStatus.RESOLVED) {
            ticket.setStatus(TicketStatus.CLOSED);
            Ticket saved = ticketRepository.save(ticket);
            notificationService.create(
                    saved.getCreatedBy(),
                    NotificationType.TICKET_STATUS_CHANGED,
                    "Ticket status updated",
                    "Your ticket #" + saved.getId() + " status changed to " + saved.getStatus().name() + ".",
                    "TICKET",
                    saved.getId());
            return saved;
        }

        throw new IllegalArgumentException("You do not have permission to perform this status update");
    }

    @Transactional
    public Comment addComment(Long ticketId, String content, User actor) {
        Ticket ticket = getTicket(ticketId);
        if (!canAccessTicket(ticket, actor)) {
            throw new IllegalArgumentException("Forbidden");
        }
        Comment comment = new Comment();
        comment.setTicket(ticket);
        comment.setAuthor(actor);
        comment.setContent(requireText(content, "Comment content is required"));
        Comment saved = commentRepository.save(Objects.requireNonNull(comment, "Comment is required"));
        Long actorId = Objects.requireNonNull(actor.getId(), "Actor id is required");
        Long ownerId = ticket.getCreatedBy() != null ? ticket.getCreatedBy().getId() : null;
        Long technicianId = ticket.getAssignedTechnician() != null ? ticket.getAssignedTechnician().getId() : null;

        String preview = saved.getContent().length() > 120
                ? saved.getContent().substring(0, 120) + "..."
                : saved.getContent();
        String actorName = actor.getName() == null || actor.getName().isBlank()
                ? "A user"
                : actor.getName().trim();

        if (ownerId != null && !ownerId.equals(actorId)) {
            notificationService.create(
                    ticket.getCreatedBy(),
                    NotificationType.TICKET_COMMENT_ADDED,
                    "New comment on your ticket",
                    actorName + " commented on ticket #" + ticket.getId() + ": \"" + preview + "\"",
                    "TICKET",
                    ticket.getId());
        }

        if (technicianId != null && !technicianId.equals(actorId) && !technicianId.equals(ownerId)) {
            notificationService.create(
                    ticket.getAssignedTechnician(),
                    NotificationType.TICKET_COMMENT_ADDED,
                    "New comment on assigned ticket",
                    actorName + " commented on ticket #" + ticket.getId() + ": \"" + preview + "\"",
                    "TICKET",
                    ticket.getId());
        }

        Set<Long> notifiedUserIds = new HashSet<>();
        if (ownerId != null) {
            notifiedUserIds.add(ownerId);
        }
        if (technicianId != null) {
            notifiedUserIds.add(technicianId);
        }
        notifiedUserIds.add(actorId);
        userRepository.findAll().stream()
                .filter(candidate -> "ADMIN".equalsIgnoreCase(candidate.getRole()))
                .filter(admin -> admin.getId() != null && !notifiedUserIds.contains(admin.getId()))
                .forEach(admin -> notificationService.create(
                        admin,
                        NotificationType.TICKET_COMMENT_ADDED,
                        "New comment on campus ticket",
                        actorName + " commented on ticket #" + ticket.getId() + ": \"" + preview + "\"",
                        "TICKET",
                        ticket.getId()));
        return saved;
    }

    public List<Comment> listComments(Long ticketId, User actor) {
        Ticket ticket = getTicket(ticketId);
        if (!canAccessTicket(ticket, actor)) {
            throw new IllegalArgumentException("Forbidden");
        }
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }

    @Transactional
    public Comment updateComment(Long commentId, String content, User actor) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        if (!canAccessTicket(comment.getTicket(), actor)) {
            throw new IllegalArgumentException("Forbidden");
        }
        if (!canModifyComment(comment, actor)) {
            throw new IllegalArgumentException("You cannot edit this comment");
        }
        comment.setContent(requireText(content, "Comment content is required"));
        return commentRepository.save(comment);
    }

    @Transactional
    public void deleteComment(Long commentId, User actor) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        if (!canAccessTicket(comment.getTicket(), actor)) {
            throw new IllegalArgumentException("Forbidden");
        }
        if (!canModifyComment(comment, actor)) {
            throw new IllegalArgumentException("You cannot delete this comment");
        }
        commentRepository.delete(comment);
    }

    public Ticket getTicket(Long id) {
        return ticketRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
    }

    public Map<String, Object> toTicketResponse(Ticket ticket) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", ticket.getId());
        payload.put("resourceLocation", ticket.getResourceLocation());
        payload.put("category", ticket.getCategory());
        payload.put("description", ticket.getDescription());
        payload.put("priority", ticket.getPriority());
        payload.put("preferredContact", ticket.getPreferredContact());
        payload.put("status", ticket.getStatus().name());
        payload.put("resolutionNotes", ticket.getResolutionNotes());
        payload.put("rejectionReason", ticket.getRejectionReason());
        payload.put("createdAt", ticket.getCreatedAt());
        payload.put("updatedAt", ticket.getUpdatedAt());
        payload.put("createdBy", simpleUser(ticket.getCreatedBy()));
        payload.put("assignedTechnician", ticket.getAssignedTechnician() == null ? null : simpleUser(ticket.getAssignedTechnician()));
        payload.put("attachments", ticket.getAttachments().stream().map(TicketAttachment::getImageUrl).toList());
        return payload;
    }

    public Map<String, Object> toCommentResponse(Comment comment) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", comment.getId());
        payload.put("ticketId", comment.getTicket().getId());
        payload.put("content", comment.getContent());
        payload.put("createdAt", comment.getCreatedAt());
        payload.put("updatedAt", comment.getUpdatedAt());
        payload.put("author", simpleUser(comment.getAuthor()));
        return payload;
    }

    private Map<String, Object> simpleUser(User user) {
        Map<String, Object> value = new HashMap<>();
        value.put("id", user.getId());
        value.put("name", user.getName());
        value.put("email", user.getEmail());
        value.put("role", user.getRole());
        return value;
    }

    public TicketResponseDTO toTicketResponseDTO(Ticket ticket) {
        TicketResponseDTO dto = new TicketResponseDTO();
        dto.setId(ticket.getId());
        dto.setResourceLocation(ticket.getResourceLocation());
        dto.setCategory(ticket.getCategory());
        dto.setDescription(ticket.getDescription());
        dto.setPriority(ticket.getPriority());
        dto.setPreferredContact(ticket.getPreferredContact());
        dto.setStatus(ticket.getStatus().name());
        dto.setResolutionNotes(ticket.getResolutionNotes());
        dto.setRejectionReason(ticket.getRejectionReason());
        dto.setReporterId(ticket.getCreatedBy().getId());
        dto.setAssignedTechnicianId(ticket.getAssignedTechnician() == null ? null : ticket.getAssignedTechnician().getId());
        dto.setAssignedTechnicianName(ticket.getAssignedTechnician() == null ? null : ticket.getAssignedTechnician().getName());
        dto.setAttachments(ticket.getAttachments().stream().map(TicketAttachment::getImageUrl).toList());
        dto.setCreatedAt(ticket.getCreatedAt());
        dto.setUpdatedAt(ticket.getUpdatedAt());
        return dto;
    }

    private boolean canModifyComment(Comment comment, User actor) {
        return comment.getAuthor().getId().equals(actor.getId());
    }

    private boolean canAccessTicket(Ticket ticket, User actor) {
        if (ticket == null || actor == null || actor.getId() == null) return false;
        String role = actor.getRole() == null ? "" : actor.getRole().toUpperCase(Locale.ROOT);
        if ("ADMIN".equals(role) || "STAFF".equals(role)) return true;
        if (ticket.getCreatedBy() != null && actor.getId().equals(ticket.getCreatedBy().getId())) return true;
        return ticket.getAssignedTechnician() != null
                && actor.getId().equals(ticket.getAssignedTechnician().getId());
    }

    private void requireRole(User user, String role) {
        if (user == null || user.getRole() == null || !role.equalsIgnoreCase(user.getRole())) {
            throw new IllegalArgumentException("Forbidden");
        }
    }

    private String requireText(String value, String message) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(message);
        return value.trim();
    }
}
