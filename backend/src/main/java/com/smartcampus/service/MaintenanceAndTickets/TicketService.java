package com.smartcampus.service.MaintenanceAndTickets;

import com.smartcampus.config.MaintenanceAndTickets.MaintenanceTicketsSecuritySupport;
import com.smartcampus.dto.MaintenanceAndTickets.TicketActivityResponseDTO;
import com.smartcampus.dto.MaintenanceAndTickets.TicketAttachmentResponseDTO;
import com.smartcampus.dto.MaintenanceAndTickets.TicketCommentResponseDTO;
import com.smartcampus.dto.MaintenanceAndTickets.TicketDetailResponseDTO;
import com.smartcampus.dto.MaintenanceAndTickets.TicketListFilterRequest;
import com.smartcampus.dto.MaintenanceAndTickets.TicketRequestDTO;
import com.smartcampus.dto.MaintenanceAndTickets.TicketResponseDTO;
import com.smartcampus.dto.MaintenanceAndTickets.TicketSlaSummaryDTO;
import com.smartcampus.dto.MaintenanceAndTickets.TicketStatusUpdateRequest;
import com.smartcampus.model.MaintenanceAndTickets.TicketActivity;
import com.smartcampus.model.MaintenanceAndTickets.TicketActivityType;
import com.smartcampus.model.Auth.User;
import com.smartcampus.model.NotificationType;
import com.smartcampus.model.MaintenanceAndTickets.Ticket;
import com.smartcampus.model.MaintenanceAndTickets.TicketAttachment;
import com.smartcampus.model.MaintenanceAndTickets.TicketComment;
import com.smartcampus.model.MaintenanceAndTickets.TicketStatus;
import com.smartcampus.repository.MaintenanceAndTickets.TicketActivityRepository;
import com.smartcampus.repository.Auth.UserRepository;
import com.smartcampus.repository.MaintenanceAndTickets.TicketCommentRepository;
import com.smartcampus.repository.MaintenanceAndTickets.TicketRepository;
import com.smartcampus.service.FileStorageService;
import com.smartcampus.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class TicketService {
    private static final int MIN_DESCRIPTION_LENGTH = 10;
    private static final int MAX_DESCRIPTION_LENGTH = 2000;
    private static final int MAX_CONTACT_LENGTH = 255;
    private static final int DUPLICATE_WINDOW_MINUTES = 30;
    private static final long DUE_SOON_THRESHOLD_MINUTES = 60;
    private static final Set<String> ALLOWED_PRIORITIES = Set.of("LOW", "MEDIUM", "HIGH", "CRITICAL");

    private final TicketRepository ticketRepository;
    private final TicketCommentRepository commentRepository;
    private final TicketActivityRepository ticketActivityRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final MaintenanceTicketsSecuritySupport securitySupport;

    @Transactional
    public Ticket createTicket(User reporter, TicketRequestDTO request) {
        if (!securitySupport.canCreateTicket(reporter)) {
            throw new IllegalArgumentException("Forbidden");
        }
        Long reporterId = Objects.requireNonNull(reporter.getId(), "Reporter id is required");
        String locationText = normalizeOptionalText(request.getLocationText());
        Long resourceId = request.getResourceId();
        if (resourceId == null && locationText == null) {
            throw new IllegalArgumentException("Either a resource or a location is required");
        }

        String category = requireBoundedText(request.getCategory(), "Category is required", "Category must be at most 80 characters", 80);
        String description = validateDescription(request.getDescription());
        String preferredContact = requireBoundedText(
                request.getPreferredContact(),
                "Preferred contact details are required",
                "Preferred contact must be at most " + MAX_CONTACT_LENGTH + " characters",
                MAX_CONTACT_LENGTH
        );
        String priority = validatePriority(request.getPriority());

        blockDuplicateOpenTicket(reporterId, resourceId, locationText, category);

        Ticket ticket = new Ticket();
        ticket.setReportedBy(reporter);
        ticket.setResourceId(resourceId);
        ticket.setLocationText(locationText != null ? locationText : "Resource #" + resourceId);
        ticket.setCategory(category);
        ticket.setDescription(description);
        ticket.setPriority(priority);
        ticket.setPreferredContact(preferredContact);
        ticket.setStatus(TicketStatus.OPEN);
        Ticket saved = ticketRepository.save(ticket);
        saved.setTicketCode(generateTicketCode(saved));

        addActivity(saved, reporter.getId(), TicketActivityType.TICKET_CREATED, null, saved.getStatus().name(),
                "Ticket " + saved.getTicketCode() + " was created.");
        appendAttachments(saved, reporter.getId(), request.getAttachments());
        saved = ticketRepository.save(saved);
        Ticket persistedTicket = saved;
        userRepository.findAll().stream()
                .filter(candidate -> "ADMIN".equalsIgnoreCase(candidate.getRole()))
                .filter(admin -> !Objects.equals(admin.getId(), reporter.getId()))
                .forEach(admin -> notificationService.create(
                        admin,
                        NotificationType.TICKET_CREATED,
                        "New support ticket submitted",
                        (reporter.getName() == null || reporter.getName().isBlank() ? "A user" : reporter.getName().trim())
                                + " created " + persistedTicket.getTicketCode() + ".",
                        "TICKET",
                        persistedTicket.getId()));
        return persistedTicket;
    }

    @Transactional
    public TicketDetailResponseDTO addAttachments(Long ticketId, MultipartFile[] files, User actor) {
        if (!securitySupport.canUploadAttachments(actor)) {
            throw new IllegalArgumentException("Forbidden");
        }
        Ticket ticket = ticketRepository.findFullDetailById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
        if (!canAccessTicket(ticket, actor)) {
            throw new IllegalArgumentException("Forbidden");
        }
        if (ticket.getStatus() == TicketStatus.REJECTED) {
            throw new IllegalArgumentException("Rejected tickets cannot accept new attachments");
        }
        appendAttachments(ticket, actor.getId(), files);
        Ticket saved = ticketRepository.save(ticket);
        return getTicketDetail(saved.getId(), actor);
    }

    public List<Ticket> listForUser(User user) {
        return listForUser(user, null);
    }

    public List<Ticket> listForUser(User user, TicketListFilterRequest filterRequest) {
        String role = user.getRole() == null ? "" : user.getRole().toUpperCase(Locale.ROOT);
        List<Ticket> tickets;
        if (securitySupport.canViewAllTickets(user)) {
            tickets = ticketRepository.findAll();
        } else if ("TECHNICIAN".equals(role)) {
            tickets = ticketRepository.findByAssignedTechnicianId(user.getId());
        } else {
            tickets = ticketRepository.findByReportedById(user.getId());
        }
        return tickets.stream()
                .filter(ticket -> matchesFilters(ticket, filterRequest))
                .sorted(ticketQueueComparator())
                .toList();
    }

    @Transactional(readOnly = true)
    public TicketDetailResponseDTO getTicketDetail(Long ticketId, User actor) {
        Ticket ticket = ticketRepository.findFullDetailById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
        if (!canAccessTicket(ticket, actor)) {
            throw new IllegalArgumentException("Forbidden");
        }
        List<TicketCommentResponseDTO> comments = commentRepository.findByTicketIdWithAuthorsAsc(ticketId)
                .stream()
                .map(this::toCommentResponseDTO)
                .toList();
        TicketResponseDTO core = toTicketResponseDTO(ticket);
        TicketDetailResponseDTO detail = new TicketDetailResponseDTO();
        detail.setTicket(core);
        detail.setReporter(simpleUser(ticket.getReportedBy()));
        detail.setAssignedTechnician(ticket.getAssignedTechnician() == null ? null : simpleUser(ticket.getAssignedTechnician()));
        detail.setAttachments(core.getAttachmentDetails());
        detail.setComments(comments);
        List<TicketActivity> activities = ticketActivityRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
        Map<Long, User> activityActors = userRepository.findAllById(
                        activities.stream()
                                .map(TicketActivity::getActorUserId)
                                .filter(Objects::nonNull)
                                .distinct()
                                .toList())
                .stream()
                .collect(java.util.stream.Collectors.toMap(User::getId, user -> user));
        detail.setTimeline(activities.stream()
                .map(activity -> toActivityResponseDTO(activity, activityActors.get(activity.getActorUserId())))
                .toList());
        detail.setSlaSummary(toSlaSummaryDTO(ticket));
        return detail;
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
        List<TicketComment> comments = commentRepository.findByTicketIdWithAuthorsAsc(ticketId);
        try {
            return TicketPdfBuilder.build(ticket, comments);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate PDF: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Ticket assignTechnician(Long ticketId, Long technicianId, User actor) {
        if (!securitySupport.canAssignTechnician(actor)) {
            throw new IllegalArgumentException("Forbidden");
        }
        Ticket ticket = getTicket(ticketId);
        if (ticket.getStatus() == TicketStatus.REJECTED) {
            throw new IllegalArgumentException("Rejected tickets cannot be assigned to a technician");
        }
        if (ticket.getStatus() == TicketStatus.CLOSED) {
            throw new IllegalArgumentException("Closed tickets cannot be assigned to a technician");
        }
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new IllegalArgumentException("Technician not found"));
        String technicianRole = normalizeRole(technician.getRole());
        if (!"TECHNICIAN".equalsIgnoreCase(technicianRole) && !"STAFF".equalsIgnoreCase(technicianRole)) {
            throw new IllegalArgumentException("Assigned user must have TECHNICIAN or STAFF role");
        }
        if (!technician.isActive()) {
            throw new IllegalArgumentException("Cannot assign ticket to an inactive technician");
        }
        User previousTechnician = ticket.getAssignedTechnician();
        String oldTechnician = previousTechnician == null ? null : previousTechnician.getEmail();
        ticket.setAssignedTechnician(technician);
        addActivity(ticket, actor.getId(), TicketActivityType.TECHNICIAN_ASSIGNED, oldTechnician, technician.getEmail(),
                buildAssignmentActivityDescription(previousTechnician, technician));
        Ticket saved = ticketRepository.save(ticket);
        notificationService.create(
                technician,
                NotificationType.TICKET_STATUS_CHANGED,
                "Ticket assigned to you",
                "You have been assigned to " + displayTicketCode(saved) + ".",
                "TICKET",
                saved.getId());
        if (saved.getReportedBy() != null && !Objects.equals(saved.getReportedBy().getId(), actor.getId())) {
            notificationService.create(
                    saved.getReportedBy(),
                    NotificationType.TICKET_STATUS_CHANGED,
                    "Technician assigned to your ticket",
                    displayTicketCode(saved) + " was assigned to "
                            + (technician.getName() == null || technician.getName().isBlank() ? technician.getEmail() : technician.getName().trim())
                            + ".",
                    "TICKET",
                    saved.getId());
        }
        return saved;
    }

    @Transactional
    public Ticket updateResolutionNotes(Long ticketId, String resolutionNotes, User actor) {
        Ticket ticket = getTicket(ticketId);
        String role = actor.getRole() == null ? "" : actor.getRole().toUpperCase(Locale.ROOT);
        if (!securitySupport.canAddResolutionNotes(actor)) {
            throw new IllegalArgumentException("Forbidden");
        }
        if ("TECHNICIAN".equals(role)) {
            ensureAssignedTechnician(ticket, actor);
        }
        if (ticket.getStatus() != TicketStatus.IN_PROGRESS && ticket.getStatus() != TicketStatus.RESOLVED) {
            throw new IllegalArgumentException("Resolution notes can only be updated when the ticket is IN_PROGRESS or RESOLVED");
        }

        String normalizedNotes = requireText(resolutionNotes, "Resolution notes are required");
        String previousNotes = ticket.getResolutionNotes();
        markFirstResponseIfNeeded(ticket, actor);
        ticket.setResolutionNotes(normalizedNotes);
        addActivity(
                ticket,
                actor.getId(),
                TicketActivityType.RESOLUTION_ADDED,
                previousNotes,
                normalizedNotes,
                previousNotes == null || previousNotes.isBlank()
                        ? "Resolution notes were added."
                        : "Resolution notes were updated."
        );
        return ticketRepository.save(ticket);
    }

    @Transactional
    public Ticket updateStatus(Long ticketId, TicketStatusUpdateRequest request, User actor) {
        if (!securitySupport.canUpdateTicketStatus(actor)) {
            throw new IllegalArgumentException("You do not have permission to perform this status update");
        }
        Ticket ticket = getTicket(ticketId);
        TicketStatus nextStatus = parseStatus(request.getStatus());
        TicketStatus previousStatus = ticket.getStatus();
        String role = actor.getRole() == null ? "" : actor.getRole().toUpperCase(Locale.ROOT);

        if ("TECHNICIAN".equals(role)) {
            ensureAssignedTechnician(ticket, actor);
            validateTechnicianTransition(previousStatus, nextStatus);
            applyStatusTransition(ticket, previousStatus, nextStatus, request, actor, false);
        } else if ("ADMIN".equals(role)) {
            validateAdminTransition(previousStatus, nextStatus);
            applyStatusTransition(ticket, previousStatus, nextStatus, request, actor, true);
        } else {
            throw new IllegalArgumentException("You do not have permission to perform this status update");
        }

        Ticket saved = ticketRepository.save(ticket);
        notifyStatusChange(saved, actor, nextStatus, saved.getStatus() == TicketStatus.REJECTED ? saved.getRejectionReason() : null);
        return saved;
    }

    @Transactional
    public TicketComment addComment(Long ticketId, String content, User actor) {
        if (!securitySupport.canComment(actor)) {
            throw new IllegalArgumentException("Forbidden");
        }
        Ticket ticket = getTicket(ticketId);
        if (!canAccessTicket(ticket, actor)) {
            throw new IllegalArgumentException("Forbidden");
        }
        ensureCommentsAllowed(ticket, actor, "add");
        markFirstResponseIfNeeded(ticket, actor);
        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setUser(actor);
        comment.setCommentText(requireText(content, "Comment content is required"));
        TicketComment saved = commentRepository.save(Objects.requireNonNull(comment, "Comment is required"));
        addActivity(ticket, actor.getId(), TicketActivityType.COMMENT_ADDED, null, saved.getCommentText(),
                "Comment added to the ticket.");
        Long actorId = Objects.requireNonNull(actor.getId(), "Actor id is required");
        Long ownerId = ticket.getReportedBy() != null ? ticket.getReportedBy().getId() : null;
        Long technicianId = ticket.getAssignedTechnician() != null ? ticket.getAssignedTechnician().getId() : null;

        String preview = saved.getCommentText().length() > 120
                ? saved.getCommentText().substring(0, 120) + "..."
                : saved.getCommentText();
        String actorName = actor.getName() == null || actor.getName().isBlank()
                ? "A user"
                : actor.getName().trim();

        if (ownerId != null && !ownerId.equals(actorId)) {
            notificationService.create(
                    ticket.getReportedBy(),
                    NotificationType.TICKET_COMMENT_ADDED,
                    "New comment on your ticket",
                    actorName + " commented on " + displayTicketCode(ticket) + ": \"" + preview + "\"",
                    "TICKET",
                    ticket.getId());
        }

        if (technicianId != null && !technicianId.equals(actorId) && !technicianId.equals(ownerId)) {
            notificationService.create(
                    ticket.getAssignedTechnician(),
                    NotificationType.TICKET_COMMENT_ADDED,
                    "New comment on assigned ticket",
                    actorName + " commented on " + displayTicketCode(ticket) + ": \"" + preview + "\"",
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
                        actorName + " commented on " + displayTicketCode(ticket) + ": \"" + preview + "\"",
                        "TICKET",
                        ticket.getId()));
        return saved;
    }

    public List<TicketComment> listComments(Long ticketId, User actor) {
        if (!securitySupport.canComment(actor)) {
            throw new IllegalArgumentException("Forbidden");
        }
        Ticket ticket = getTicket(ticketId);
        if (!canAccessTicket(ticket, actor)) {
            throw new IllegalArgumentException("Forbidden");
        }
        return commentRepository.findByTicketIdWithAuthorsAsc(ticketId);
    }

    @Transactional
    public TicketComment updateComment(Long commentId, String content, User actor) {
        if (!securitySupport.canComment(actor)) {
            throw new IllegalArgumentException("Forbidden");
        }
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        if (!canAccessTicket(comment.getTicket(), actor)) {
            throw new IllegalArgumentException("Forbidden");
        }
        ensureCommentsAllowed(comment.getTicket(), actor, "edit");
        if (!canEditComment(comment, actor)) {
            throw new IllegalArgumentException("You cannot edit this comment");
        }
        String updatedContent = requireText(content, "Comment content is required");
        addActivity(comment.getTicket(), actor.getId(), TicketActivityType.COMMENT_EDITED,
                comment.getCommentText(), updatedContent, "Comment edited.");
        comment.setCommentText(updatedContent);
        comment.setEdited(true);
        return commentRepository.save(comment);
    }

    @Transactional
    public void deleteComment(Long commentId, User actor) {
        if (!securitySupport.canComment(actor)) {
            throw new IllegalArgumentException("Forbidden");
        }
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        if (!canAccessTicket(comment.getTicket(), actor)) {
            throw new IllegalArgumentException("Forbidden");
        }
        ensureCommentsAllowed(comment.getTicket(), actor, "delete");
        if (!canDeleteComment(comment, actor)) {
            throw new IllegalArgumentException("You cannot delete this comment");
        }
        addActivity(comment.getTicket(), actor.getId(), TicketActivityType.COMMENT_DELETED,
                comment.getCommentText(), null, "Comment deleted.");
        commentRepository.delete(comment);
    }

    public Ticket getTicket(Long id) {
        return ticketRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
    }

    public Map<String, Object> toTicketResponse(Ticket ticket) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", ticket.getId());
        payload.put("ticketCode", ticket.getTicketCode());
        payload.put("resourceId", ticket.getResourceId());
        payload.put("resourceLocation", ticket.getLocationText());
        payload.put("locationText", ticket.getLocationText());
        payload.put("category", ticket.getCategory());
        payload.put("description", ticket.getDescription());
        payload.put("priority", ticket.getPriority());
        payload.put("preferredContact", ticket.getPreferredContact());
        payload.put("status", ticket.getStatus().name());
        payload.put("resolutionNotes", ticket.getResolutionNotes());
        payload.put("rejectionReason", ticket.getRejectionReason());
        payload.put("firstResponseAt", ticket.getFirstResponseAt());
        payload.put("resolvedAt", ticket.getResolvedAt());
        payload.put("closedAt", ticket.getClosedAt());
        payload.put("createdAt", ticket.getCreatedAt());
        payload.put("updatedAt", ticket.getUpdatedAt());
        payload.put("createdBy", simpleUser(ticket.getReportedBy()));
        payload.put("assignedTechnician", ticket.getAssignedTechnician() == null ? null : simpleUser(ticket.getAssignedTechnician()));
        payload.put("attachments", ticket.getAttachments().stream().map(TicketAttachment::getFilePath).toList());
        return payload;
    }

    public Map<String, Object> toCommentResponse(TicketComment comment) {
        return toCommentResponse(comment, null);
    }

    public Map<String, Object> toCommentResponse(TicketComment comment, User actor) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", comment.getId());
        payload.put("ticketId", comment.getTicket().getId());
        payload.put("content", comment.getCommentText());
        payload.put("isEdited", comment.isEdited());
        payload.put("createdAt", comment.getCreatedAt());
        payload.put("updatedAt", comment.getUpdatedAt());
        payload.put("author", simpleUser(comment.getUser()));
        payload.put("canEdit", actor != null && canEditComment(comment, actor) && areCommentsAllowed(comment.getTicket(), actor));
        payload.put("canDelete", actor != null && canDeleteComment(comment, actor) && areCommentsAllowed(comment.getTicket(), actor));
        return payload;
    }

    public TicketCommentResponseDTO toCommentResponseDTO(TicketComment comment) {
        TicketCommentResponseDTO dto = new TicketCommentResponseDTO();
        dto.setId(comment.getId());
        dto.setTicketId(comment.getTicket().getId());
        dto.setContent(comment.getCommentText());
        dto.setEdited(comment.isEdited());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setUpdatedAt(comment.getUpdatedAt());
        dto.setAuthor(simpleUser(comment.getUser()));
        return dto;
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
        dto.setTicketCode(ticket.getTicketCode());
        dto.setResourceId(ticket.getResourceId());
        dto.setLocationText(ticket.getLocationText());
        dto.setCategory(ticket.getCategory());
        dto.setDescription(ticket.getDescription());
        dto.setPriority(ticket.getPriority());
        dto.setPreferredContact(ticket.getPreferredContact());
        dto.setStatus(ticket.getStatus().name());
        dto.setResolutionNotes(ticket.getResolutionNotes());
        dto.setRejectionReason(ticket.getRejectionReason());
        dto.setReporterId(ticket.getReportedBy().getId());
        dto.setReporterName(ticket.getReportedBy().getName());
        dto.setAssignedTechnicianId(ticket.getAssignedTechnician() == null ? null : ticket.getAssignedTechnician().getId());
        dto.setAssignedTechnicianName(ticket.getAssignedTechnician() == null ? null : ticket.getAssignedTechnician().getName());
        TicketSlaSummaryDTO slaSummary = toSlaSummaryDTO(ticket);
        dto.setSlaBreached(slaSummary.isBreached());
        dto.setFirstResponseBreached(slaSummary.isFirstResponseBreached());
        dto.setResolutionBreached(slaSummary.isResolutionBreached());
        dto.setSlaState(slaSummary.getSlaState());
        dto.setAttachments(ticket.getAttachments().stream().map(TicketAttachment::getFilePath).toList());
        dto.setAttachmentDetails(ticket.getAttachments().stream().map(this::toAttachmentResponseDTO).toList());
        dto.setActivityTimeline(ticketActivityRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId())
                .stream()
                .map(this::toActivityResponseDTO)
                .toList());
        dto.setFirstResponseAt(ticket.getFirstResponseAt());
        dto.setResolvedAt(ticket.getResolvedAt());
        dto.setClosedAt(ticket.getClosedAt());
        dto.setCreatedAt(ticket.getCreatedAt());
        dto.setUpdatedAt(ticket.getUpdatedAt());
        return dto;
    }

    private TicketAttachmentResponseDTO toAttachmentResponseDTO(TicketAttachment attachment) {
        TicketAttachmentResponseDTO dto = new TicketAttachmentResponseDTO();
        dto.setId(attachment.getId());
        dto.setOriginalFileName(attachment.getOriginalFileName());
        dto.setStoredFileName(attachment.getStoredFileName());
        dto.setFilePath(attachment.getFilePath());
        dto.setContentType(attachment.getContentType());
        dto.setFileSize(attachment.getFileSize());
        dto.setUploadedByUserId(attachment.getUploadedByUserId());
        dto.setUploadedAt(attachment.getUploadedAt());
        return dto;
    }

    private void appendAttachments(Ticket ticket, Long uploadedByUserId, MultipartFile[] files) {
        List<FileStorageService.StoredFile> storedFiles = fileStorageService.storeTicketFiles(
                ticket.getId(),
                files,
                ticket.getAttachments().size()
        );
        for (FileStorageService.StoredFile storedFile : storedFiles) {
            TicketAttachment attachment = new TicketAttachment();
            attachment.setTicket(ticket);
            attachment.setOriginalFileName(storedFile.originalFileName());
            attachment.setStoredFileName(storedFile.storedFileName());
            attachment.setFilePath(storedFile.filePath());
            attachment.setContentType(storedFile.contentType());
            attachment.setFileSize(storedFile.fileSize());
            attachment.setUploadedByUserId(uploadedByUserId);
            ticket.getAttachments().add(attachment);
            addActivity(ticket, uploadedByUserId, TicketActivityType.ATTACHMENT_UPLOADED, null,
                    attachment.getOriginalFileName(),
                    "Attachment uploaded: " + safe(attachment.getOriginalFileName()));
        }
    }

    private TicketActivityResponseDTO toActivityResponseDTO(TicketActivity activity) {
        return toActivityResponseDTO(activity, null);
    }

    private TicketActivityResponseDTO toActivityResponseDTO(TicketActivity activity, User actor) {
        TicketActivityResponseDTO dto = new TicketActivityResponseDTO();
        dto.setId(activity.getId());
        dto.setActorUserId(activity.getActorUserId());
        dto.setActorName(actor == null ? null : actor.getName());
        dto.setActorRole(actor == null ? null : actor.getRole());
        dto.setActivityType(activity.getActivityType().name());
        dto.setOldValue(activity.getOldValue());
        dto.setNewValue(activity.getNewValue());
        dto.setDescription(activity.getDescription());
        dto.setCreatedAt(activity.getCreatedAt());
        return dto;
    }

    private TicketSlaSummaryDTO toSlaSummaryDTO(Ticket ticket) {
        TicketSlaSummaryDTO dto = new TicketSlaSummaryDTO();
        LocalDateTime createdAt = ticket.getCreatedAt();
        long firstResponseTargetMinutes = firstResponseTargetMinutesFor(ticket);
        long resolutionTargetMinutes = resolutionTargetMinutesFor(ticket);
        LocalDateTime firstResponseDeadline = createdAt == null ? null : createdAt.plusMinutes(firstResponseTargetMinutes);
        LocalDateTime resolutionDeadline = createdAt == null ? null : createdAt.plusMinutes(resolutionTargetMinutes);
        boolean firstResponseBreached = isFirstResponseBreached(ticket);
        boolean resolutionBreached = isResolutionBreached(ticket);
        dto.setPriorityBand(safe(ticket.getPriority()).toUpperCase(Locale.ROOT));
        dto.setTargetHours(Math.max(1, resolutionTargetMinutes / 60));
        dto.setDeadlineAt(resolutionDeadline);
        dto.setElapsedHours(createdAt == null ? 0 : Math.max(0, ChronoUnit.HOURS.between(createdAt, LocalDateTime.now())));
        dto.setStatusLabel(ticket.getStatus() == null ? "" : ticket.getStatus().name());
        dto.setFirstResponseTargetMinutes(firstResponseTargetMinutes);
        dto.setResolutionTargetMinutes(resolutionTargetMinutes);
        dto.setFirstResponseDeadlineAt(firstResponseDeadline);
        dto.setResolutionDeadlineAt(resolutionDeadline);
        dto.setFirstResponseBreached(firstResponseBreached);
        dto.setResolutionBreached(resolutionBreached);
        dto.setFirstResponseRemainingMinutes(remainingMinutesUntil(firstResponseDeadline, ticket.getFirstResponseAt()));
        dto.setResolutionRemainingMinutes(remainingMinutesUntil(resolutionDeadline, ticket.getResolvedAt()));
        dto.setBreached(firstResponseBreached || resolutionBreached);
        dto.setSlaState(determineSlaState(ticket, firstResponseDeadline, resolutionDeadline, firstResponseBreached, resolutionBreached));
        return dto;
    }

    private boolean canEditComment(TicketComment comment, User actor) {
        if (comment == null || actor == null || actor.getId() == null) {
            return false;
        }
        if (isAdmin(actor)) {
            return true;
        }
        return comment.getUser() != null && actor.getId().equals(comment.getUser().getId());
    }

    private boolean canDeleteComment(TicketComment comment, User actor) {
        if (comment == null || actor == null || actor.getId() == null) {
            return false;
        }
        if (isAdmin(actor)) {
            return true;
        }
        return comment.getUser() != null && actor.getId().equals(comment.getUser().getId());
    }

    private boolean canAccessTicket(Ticket ticket, User actor) {
        if (ticket == null || actor == null || actor.getId() == null) return false;
        String role = actor.getRole() == null ? "" : actor.getRole().toUpperCase(Locale.ROOT);
        if ("ADMIN".equals(role) || "STAFF".equals(role)) return true;
        if (ticket.getReportedBy() != null && actor.getId().equals(ticket.getReportedBy().getId())) return true;
        return ticket.getAssignedTechnician() != null
                && actor.getId().equals(ticket.getAssignedTechnician().getId());
    }

    private void requireRole(User user, String role) {
        if (user == null || user.getRole() == null || !role.equalsIgnoreCase(user.getRole())) {
            throw new IllegalArgumentException("Forbidden");
        }
    }

    private void ensureCommentsAllowed(Ticket ticket, User actor, String action) {
        if (!areCommentsAllowed(ticket, actor)) {
            throw new IllegalArgumentException("You cannot " + action + " comments when the ticket is " + ticket.getStatus().name());
        }
    }

    private boolean areCommentsAllowed(Ticket ticket, User actor) {
        if (ticket == null || actor == null) {
            return false;
        }
        if (isAdmin(actor)) {
            return true;
        }
        return ticket.getStatus() == TicketStatus.OPEN
                || ticket.getStatus() == TicketStatus.IN_PROGRESS
                || ticket.getStatus() == TicketStatus.RESOLVED;
    }

    private boolean isAdmin(User actor) {
        return actor != null && actor.getRole() != null && "ADMIN".equalsIgnoreCase(actor.getRole());
    }

    private boolean isStaffActor(User actor) {
        if (actor == null || actor.getRole() == null) {
            return false;
        }
        String role = actor.getRole().toUpperCase(Locale.ROOT);
        return "ADMIN".equals(role) || "STAFF".equals(role) || "TECHNICIAN".equals(role);
    }

    private void markFirstResponseIfNeeded(Ticket ticket, User actor) {
        if (ticket.getFirstResponseAt() == null && isStaffActor(actor)) {
            ticket.setFirstResponseAt(LocalDateTime.now());
        }
    }

    private String requireText(String value, String message) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(message);
        return value.trim();
    }

    private String requireBoundedText(String value, String requiredMessage, String maxLengthMessage, int maxLength) {
        String normalized = requireText(value, requiredMessage);
        if (normalized.length() > maxLength) {
            throw new IllegalArgumentException(maxLengthMessage);
        }
        return normalized;
    }

    private String validateDescription(String description) {
        String normalized = requireText(description, "Description is required");
        if (normalized.length() < MIN_DESCRIPTION_LENGTH) {
            throw new IllegalArgumentException("Description must be at least " + MIN_DESCRIPTION_LENGTH + " characters");
        }
        if (normalized.length() > MAX_DESCRIPTION_LENGTH) {
            throw new IllegalArgumentException("Description must be at most " + MAX_DESCRIPTION_LENGTH + " characters");
        }
        long alphaNumericCount = normalized.chars().filter(Character::isLetterOrDigit).count();
        if (alphaNumericCount < MIN_DESCRIPTION_LENGTH) {
            throw new IllegalArgumentException("Description must meaningfully describe the issue");
        }
        return normalized;
    }

    private String validatePriority(String priority) {
        String normalized = requireText(priority, "Priority is required").toUpperCase(Locale.ROOT);
        if (!ALLOWED_PRIORITIES.contains(normalized)) {
            throw new IllegalArgumentException("Priority must be one of: " + String.join(", ", ALLOWED_PRIORITIES));
        }
        return normalized;
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private void blockDuplicateOpenTicket(Long reporterId, Long resourceId, String locationText, String category) {
        String normalizedLocation = locationText == null ? null : locationText.trim().toLowerCase(Locale.ROOT);
        LocalDateTime since = LocalDateTime.now().minusMinutes(DUPLICATE_WINDOW_MINUTES);
        List<Ticket> duplicates = ticketRepository.findRecentPossibleDuplicates(
                reporterId,
                category,
                resourceId,
                normalizedLocation,
                since,
                List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS)
        );
        if (!duplicates.isEmpty()) {
            Ticket existing = duplicates.getFirst();
            throw new IllegalArgumentException(
                    "A similar open ticket already exists for this resource/location. Please wait before submitting again. Existing ticket: "
                            + displayTicketCode(existing)
            );
        }
    }

    private void addActivity(Ticket ticket, Long actorUserId, TicketActivityType activityType, String oldValue,
                             String newValue, String description) {
        TicketActivity activity = new TicketActivity();
        activity.setTicket(ticket);
        activity.setActorUserId(actorUserId);
        activity.setActivityType(activityType);
        activity.setOldValue(oldValue);
        activity.setNewValue(newValue);
        activity.setDescription(description);
        ticket.getActivities().add(activity);
        ticketActivityRepository.save(activity);
    }

    private String generateTicketCode(Ticket ticket) {
        int year = ticket.getCreatedAt() == null ? LocalDateTime.now().getYear() : ticket.getCreatedAt().getYear();
        return "TCK-" + year + "-" + String.format("%04d", ticket.getId());
    }

    private String displayTicketCode(Ticket ticket) {
        return ticket.getTicketCode() == null || ticket.getTicketCode().isBlank()
                ? "#" + ticket.getId()
                : ticket.getTicketCode();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String buildAssignmentActivityDescription(User previousTechnician, User nextTechnician) {
        String nextName = technicianLabel(nextTechnician);
        if (previousTechnician == null) {
            return "Technician assigned: " + nextName;
        }
        return "Technician reassigned from " + technicianLabel(previousTechnician) + " to " + nextName;
    }

    private String technicianLabel(User technician) {
        if (technician == null) {
            return "";
        }
        if (technician.getName() != null && !technician.getName().isBlank()) {
            return technician.getName().trim();
        }
        return safe(technician.getEmail());
    }

    private TicketStatus parseStatus(String value) {
        String normalized = requireText(value, "Status is required").toUpperCase(Locale.ROOT);
        try {
            return TicketStatus.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid ticket status: " + normalized);
        }
    }

    private void ensureAssignedTechnician(Ticket ticket, User actor) {
        if (ticket.getAssignedTechnician() == null
                || !Objects.requireNonNull(ticket.getAssignedTechnician().getId(), "Assigned technician id is required")
                        .equals(Objects.requireNonNull(actor.getId(), "Actor id is required"))) {
            throw new IllegalArgumentException("You can only update tickets assigned to you");
        }
    }

    private void validateTechnicianTransition(TicketStatus currentStatus, TicketStatus nextStatus) {
        if (currentStatus == TicketStatus.OPEN && nextStatus == TicketStatus.IN_PROGRESS) {
            return;
        }
        if (currentStatus == TicketStatus.IN_PROGRESS && nextStatus == TicketStatus.RESOLVED) {
            return;
        }
        throw new IllegalArgumentException("Invalid technician transition");
    }

    private void validateAdminTransition(TicketStatus currentStatus, TicketStatus nextStatus) {
        if (nextStatus == TicketStatus.REJECTED && currentStatus == TicketStatus.CLOSED) {
            throw new IllegalArgumentException("Closed tickets cannot be rejected");
        }
        if (currentStatus == TicketStatus.OPEN
                && (nextStatus == TicketStatus.IN_PROGRESS || nextStatus == TicketStatus.REJECTED)) {
            return;
        }
        if (currentStatus == TicketStatus.IN_PROGRESS
                && (nextStatus == TicketStatus.RESOLVED || nextStatus == TicketStatus.REJECTED)) {
            return;
        }
        if (currentStatus == TicketStatus.RESOLVED
                && (nextStatus == TicketStatus.CLOSED || nextStatus == TicketStatus.IN_PROGRESS)) {
            return;
        }
        if (currentStatus == TicketStatus.CLOSED || currentStatus == TicketStatus.REJECTED) {
            throw new IllegalArgumentException("This ticket is already in a final state");
        }
        throw new IllegalArgumentException("Invalid admin transition");
    }

    private void applyStatusTransition(Ticket ticket,
                                       TicketStatus previousStatus,
                                       TicketStatus nextStatus,
                                       TicketStatusUpdateRequest request,
                                       User actor,
                                       boolean adminFlow) {
        if (nextStatus == previousStatus) {
            throw new IllegalArgumentException("Ticket is already in status " + nextStatus.name());
        }

        if (nextStatus == TicketStatus.REJECTED) {
            applyRejectedTransition(ticket, previousStatus, request, actor);
            return;
        }
        if (nextStatus == TicketStatus.RESOLVED) {
            applyResolvedTransition(ticket, previousStatus, request, actor);
            return;
        }
        if (nextStatus == TicketStatus.IN_PROGRESS) {
            applyInProgressTransition(ticket, previousStatus, actor, adminFlow);
            return;
        }
        if (nextStatus == TicketStatus.CLOSED) {
            applyClosedTransition(ticket, previousStatus, actor);
            return;
        }
        throw new IllegalArgumentException("Unsupported status transition");
    }

    private void applyRejectedTransition(Ticket ticket, TicketStatus previousStatus, TicketStatusUpdateRequest request, User actor) {
        String reason = requireText(request.getRejectionReason(), "Rejection reason is required");
        markFirstResponseIfNeeded(ticket, actor);
        ticket.setStatus(TicketStatus.REJECTED);
        ticket.setRejectionReason(reason);
        ticket.setClosedAt(null);
        addActivity(ticket, actor.getId(), TicketActivityType.TICKET_REJECTED, previousStatus.name(),
                TicketStatus.REJECTED.name(), "Ticket rejected. Reason: " + reason);
    }

    private void applyResolvedTransition(Ticket ticket, TicketStatus previousStatus, TicketStatusUpdateRequest request, User actor) {
        String resolutionNotes = requireText(request.getResolutionNotes(), "Resolution notes are required");
        markFirstResponseIfNeeded(ticket, actor);
        ticket.setResolutionNotes(resolutionNotes);
        ticket.setRejectionReason(null);
        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResolvedAt(LocalDateTime.now());
        ticket.setClosedAt(null);
        addActivity(ticket, actor.getId(), TicketActivityType.RESOLUTION_ADDED, null,
                ticket.getResolutionNotes(), "Resolution notes were added.");
        addActivity(ticket, actor.getId(), TicketActivityType.STATUS_CHANGED, previousStatus.name(),
                TicketStatus.RESOLVED.name(), "Ticket marked as resolved.");
    }

    private void applyInProgressTransition(Ticket ticket, TicketStatus previousStatus, User actor, boolean adminFlow) {
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticket.setRejectionReason(null);
        ticket.setClosedAt(null);
        markFirstResponseIfNeeded(ticket, actor);
        if (previousStatus == TicketStatus.RESOLVED) {
            ticket.setResolvedAt(null);
            addActivity(ticket, actor.getId(), TicketActivityType.STATUS_CHANGED, previousStatus.name(),
                    TicketStatus.IN_PROGRESS.name(), "Ticket reopened and moved back to in progress.");
            return;
        }
        addActivity(ticket, actor.getId(), TicketActivityType.STATUS_CHANGED, previousStatus.name(),
                TicketStatus.IN_PROGRESS.name(),
                adminFlow ? "Admin moved the ticket to in progress." : "Technician started working on the ticket.");
    }

    private void applyClosedTransition(Ticket ticket, TicketStatus previousStatus, User actor) {
        ticket.setStatus(TicketStatus.CLOSED);
        ticket.setClosedAt(LocalDateTime.now());
        addActivity(ticket, actor.getId(), TicketActivityType.TICKET_CLOSED, previousStatus.name(),
                TicketStatus.CLOSED.name(), "Ticket closed by admin.");
    }

    private void notifyStatusChange(Ticket ticket, User actor, TicketStatus nextStatus, String reason) {
        String message = "Your ticket " + displayTicketCode(ticket) + " status changed to " + ticket.getStatus().name() + ".";
        if (nextStatus == TicketStatus.REJECTED && reason != null && !reason.isBlank()) {
            message += " Reason: " + reason;
        }
        notificationService.create(
                ticket.getReportedBy(),
                NotificationType.TICKET_STATUS_CHANGED,
                "Ticket status updated",
                message,
                "TICKET",
                ticket.getId());
        if (ticket.getAssignedTechnician() != null && !Objects.equals(ticket.getAssignedTechnician().getId(), actor.getId())) {
            notificationService.create(
                    ticket.getAssignedTechnician(),
                    NotificationType.TICKET_STATUS_CHANGED,
                    "Assigned ticket status updated",
                    displayTicketCode(ticket) + " moved from workflow state to " + ticket.getStatus().name() + ".",
                    "TICKET",
                    ticket.getId());
        }
    }

    private boolean matchesFilters(Ticket ticket, TicketListFilterRequest filterRequest) {
        if (filterRequest == null) {
            return true;
        }
        if (!matchesStatus(ticket, filterRequest.getStatus())) {
            return false;
        }
        if (!matchesPriority(ticket, filterRequest.getPriority())) {
            return false;
        }
        if (!matchesText(ticket.getCategory(), filterRequest.getCategory())) {
            return false;
        }
        if (filterRequest.getAssignedTechnicianId() != null) {
            Long assignedId = ticket.getAssignedTechnician() == null ? null : ticket.getAssignedTechnician().getId();
            if (!filterRequest.getAssignedTechnicianId().equals(assignedId)) {
                return false;
            }
        }
        if (!matchesCreatedDateRange(ticket, filterRequest)) {
            return false;
        }
        if (!matchesResourceOrLocation(ticket, filterRequest.getResourceOrLocation())) {
            return false;
        }
        return matchesKeyword(ticket, filterRequest.getKeyword());
    }

    private boolean matchesStatus(Ticket ticket, String expectedStatus) {
        if (expectedStatus == null || expectedStatus.isBlank()) {
            return true;
        }
        return ticket.getStatus() != null
                && ticket.getStatus().name().equalsIgnoreCase(expectedStatus.trim());
    }

    private boolean matchesPriority(Ticket ticket, String expectedPriority) {
        if (expectedPriority == null || expectedPriority.isBlank()) {
            return true;
        }
        String actualPriority = safe(ticket.getPriority());
        String normalizedExpected = expectedPriority.trim();
        if ("URGENT".equalsIgnoreCase(normalizedExpected)) {
            return "URGENT".equalsIgnoreCase(actualPriority) || "CRITICAL".equalsIgnoreCase(actualPriority);
        }
        return actualPriority.equalsIgnoreCase(normalizedExpected);
    }

    private boolean matchesCreatedDateRange(Ticket ticket, TicketListFilterRequest filterRequest) {
        LocalDateTime createdAt = ticket.getCreatedAt();
        if (createdAt == null) {
            return false;
        }
        if (filterRequest.getCreatedFrom() != null && createdAt.isBefore(filterRequest.getCreatedFrom().atStartOfDay())) {
            return false;
        }
        if (filterRequest.getCreatedTo() != null && createdAt.isAfter(filterRequest.getCreatedTo().atTime(LocalTime.MAX))) {
            return false;
        }
        return true;
    }

    private boolean matchesResourceOrLocation(Ticket ticket, String resourceOrLocation) {
        if (resourceOrLocation == null || resourceOrLocation.isBlank()) {
            return true;
        }
        String needle = resourceOrLocation.trim().toLowerCase(Locale.ROOT);
        String resourceIdText = ticket.getResourceId() == null ? "" : String.valueOf(ticket.getResourceId());
        String haystack = (safe(ticket.getLocationText()) + " " + resourceIdText).toLowerCase(Locale.ROOT);
        return haystack.contains(needle);
    }

    private boolean matchesKeyword(Ticket ticket, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }
        String needle = keyword.trim().toLowerCase(Locale.ROOT);
        return containsIgnoreCase(ticket.getTicketCode(), needle)
                || containsIgnoreCase(ticket.getDescription(), needle)
                || containsIgnoreCase(ticket.getCategory(), needle)
                || containsIgnoreCase(ticket.getLocationText(), needle)
                || containsIgnoreCase(ticket.getPreferredContact(), needle)
                || containsIgnoreCase(ticket.getReportedBy() == null ? null : ticket.getReportedBy().getName(), needle)
                || containsIgnoreCase(ticket.getAssignedTechnician() == null ? null : ticket.getAssignedTechnician().getName(), needle);
    }

    private boolean matchesText(String actualValue, String expectedValue) {
        if (expectedValue == null || expectedValue.isBlank()) {
            return true;
        }
        return actualValue != null && actualValue.toLowerCase(Locale.ROOT).contains(expectedValue.trim().toLowerCase(Locale.ROOT));
    }

    private boolean containsIgnoreCase(String source, String needle) {
        return source != null && source.toLowerCase(Locale.ROOT).contains(needle);
    }

    private Comparator<Ticket> ticketQueueComparator() {
        Comparator<Ticket> unresolvedComparator = Comparator
                .comparing(this::hasAnySlaBreach).reversed()
                .thenComparing(this::priorityWeight, Comparator.reverseOrder())
                .thenComparing(Ticket::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()));

        Comparator<Ticket> resolvedComparator = Comparator
                .comparing(Ticket::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                .reversed();

        return (left, right) -> {
            boolean leftUnresolved = isUnresolved(left);
            boolean rightUnresolved = isUnresolved(right);
            if (leftUnresolved && !rightUnresolved) {
                return -1;
            }
            if (!leftUnresolved && rightUnresolved) {
                return 1;
            }
            return leftUnresolved
                    ? unresolvedComparator.compare(left, right)
                    : resolvedComparator.compare(left, right);
        };
    }

    private boolean isUnresolved(Ticket ticket) {
        return ticket.getStatus() != TicketStatus.CLOSED && ticket.getStatus() != TicketStatus.REJECTED;
    }

    private Integer priorityWeight(Ticket ticket) {
        String priority = safe(ticket.getPriority()).toUpperCase(Locale.ROOT);
        return switch (priority) {
            case "URGENT", "CRITICAL" -> 4;
            case "HIGH" -> 3;
            case "MEDIUM" -> 2;
            case "LOW" -> 1;
            default -> 0;
        };
    }

    private boolean hasAnySlaBreach(Ticket ticket) {
        return isFirstResponseBreached(ticket) || isResolutionBreached(ticket);
    }

    private boolean isFirstResponseBreached(Ticket ticket) {
        if (ticket.getCreatedAt() == null) {
            return false;
        }
        LocalDateTime deadline = ticket.getCreatedAt().plusMinutes(firstResponseTargetMinutesFor(ticket));
        LocalDateTime reference = ticket.getFirstResponseAt() != null ? ticket.getFirstResponseAt() : LocalDateTime.now();
        return reference.isAfter(deadline);
    }

    private boolean isResolutionBreached(Ticket ticket) {
        if (ticket.getCreatedAt() == null) {
            return false;
        }
        LocalDateTime deadline = ticket.getCreatedAt().plusMinutes(resolutionTargetMinutesFor(ticket));
        LocalDateTime reference = ticket.getResolvedAt() != null ? ticket.getResolvedAt() : LocalDateTime.now();
        if (ticket.getResolvedAt() == null && !isUnresolved(ticket)) {
            return false;
        }
        return reference.isAfter(deadline);
    }

    private long firstResponseTargetMinutesFor(Ticket ticket) {
        String priority = safe(ticket.getPriority()).toUpperCase(Locale.ROOT);
        return switch (priority) {
            case "URGENT", "CRITICAL" -> 30;
            case "HIGH" -> 120;
            case "MEDIUM" -> 480;
            case "LOW" -> 1440;
            default -> 480;
        };
    }

    private long resolutionTargetMinutesFor(Ticket ticket) {
        String priority = safe(ticket.getPriority()).toUpperCase(Locale.ROOT);
        return switch (priority) {
            case "URGENT", "CRITICAL" -> 240;
            case "HIGH" -> 480;
            case "MEDIUM" -> 2880;
            case "LOW" -> 7200;
            default -> 2880;
        };
    }

    private Long remainingMinutesUntil(LocalDateTime deadline, LocalDateTime completedAt) {
        if (deadline == null) {
            return null;
        }
        LocalDateTime reference = completedAt != null ? completedAt : LocalDateTime.now();
        return ChronoUnit.MINUTES.between(reference, deadline);
    }

    private String determineSlaState(Ticket ticket,
                                     LocalDateTime firstResponseDeadline,
                                     LocalDateTime resolutionDeadline,
                                     boolean firstResponseBreached,
                                     boolean resolutionBreached) {
        if (firstResponseBreached || resolutionBreached) {
            return "SLA BREACHED";
        }
        Long firstResponseRemaining = remainingMinutesUntil(firstResponseDeadline, ticket.getFirstResponseAt());
        Long resolutionRemaining = remainingMinutesUntil(resolutionDeadline, ticket.getResolvedAt());
        boolean dueSoon = (firstResponseRemaining != null && ticket.getFirstResponseAt() == null && firstResponseRemaining >= 0 && firstResponseRemaining <= DUE_SOON_THRESHOLD_MINUTES)
                || (resolutionRemaining != null && ticket.getResolvedAt() == null && isUnresolved(ticket)
                && resolutionRemaining >= 0 && resolutionRemaining <= DUE_SOON_THRESHOLD_MINUTES);
        return dueSoon ? "DUE SOON" : "ON TRACK";
    }

    private String normalizeRole(String role) {
        if (role == null) {
            return "";
        }
        String normalized = role.trim().toUpperCase(Locale.ROOT);
        if (normalized.startsWith("ROLE_")) {
            normalized = normalized.substring("ROLE_".length());
        }
        return normalized;
    }
}
