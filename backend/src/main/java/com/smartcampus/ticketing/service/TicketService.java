package com.smartcampus.ticketing.service;

import com.smartcampus.ticketing.dto.request.CreateTicketRequest;
import com.smartcampus.ticketing.dto.request.TicketFilterRequest;
import com.smartcampus.ticketing.dto.request.UpdateTicketRequest;
import com.smartcampus.ticketing.dto.response.TicketResponse;
import com.smartcampus.ticketing.entity.IncidentTicketEntity;
import com.smartcampus.ticketing.entity.TicketAttachmentEntity;
import com.smartcampus.ticketing.entity.TicketAuditEntity;
import com.smartcampus.ticketing.entity.UserEntity;
import com.smartcampus.ticketing.entity.enums.TicketCategory;
import com.smartcampus.ticketing.entity.enums.TicketPriority;
import com.smartcampus.ticketing.entity.enums.TicketStatus;
import com.smartcampus.ticketing.event.TicketCreatedEvent;
import com.smartcampus.ticketing.exception.BadRequestException;
import com.smartcampus.ticketing.exception.ConflictException;
import com.smartcampus.ticketing.exception.TicketNotFoundException;
import com.smartcampus.ticketing.exception.UnauthorizedException;
import com.smartcampus.ticketing.integration.resource.ResourceValidationPort;
import com.smartcampus.ticketing.repository.TicketAttachmentRepository;
import com.smartcampus.ticketing.repository.TicketAuditRepository;
import com.smartcampus.ticketing.repository.TicketRepository;
import com.smartcampus.ticketing.repository.UserRepository;
import com.smartcampus.ticketing.specification.TicketSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

  private final TicketRepository ticketRepository;
  private final UserRepository userRepository;
  private final TicketAuditRepository ticketAuditRepository;
  private final TicketAttachmentRepository ticketAttachmentRepository;
  private final ResourceValidationPort resourceValidationPort;
  private final ApplicationEventPublisher eventPublisher;
  @Value("${app.ticket.duplicate-cooldown-minutes:15}")
  private int duplicateCooldownMinutes;
  @Value("${app.ticket.duplicate.mode:BLOCK}")
  private String duplicateMode;
  @Value("${app.ticket.duplicate.similarity-threshold:0.7}")
  private double duplicateSimilarityThreshold;

  private static final Pattern CONTACT_PATTERN = Pattern.compile(
      "^(?:[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}|\\+?[0-9\\-\\s]{7,20})$"
  );

  @Transactional
  public TicketResponse createTicket(CreateTicketRequest request, MultipartFile[] attachments, Long reporterId) {
    UserEntity reporter = userRepository.findById(reporterId)
        .orElseThrow(() -> new UnauthorizedException("Not authenticated"));

    String normalizedDescription = normalizeText(request.getDescription());
    String normalizedLocation = normalizeText(request.getLocation());
    String normalizedPreferredContact = normalizeText(request.getPreferredContact());
    TicketCategory category = parseCategory(request.getCategory());
    TicketPriority priority = parsePriority(request.getPriority());

    validateCreateRequest(request.getResourceId(), normalizedLocation, normalizedDescription, normalizedPreferredContact);
    String duplicateWarning = enforceDuplicateProtection(
        reporterId,
        request.getResourceId(),
        normalizedLocation,
        normalizedDescription
    );

    IncidentTicketEntity entity = IncidentTicketEntity.builder()
        .title(normalizedDescription.substring(0, Math.min(50, normalizedDescription.length())))
        .description(normalizedDescription)
        .category(category)
        .priority(priority)
        .status(TicketStatus.OPEN)
        .reportedBy(reporter)
        .resourceId(request.getResourceId())
        .location(normalizedLocation)
        .preferredContact(normalizedPreferredContact)
        .isDeleted(false)
        .build();

    IncidentTicketEntity saved = ticketRepository.save(entity);
    ticketAuditRepository.save(TicketAuditEntity.builder()
        .ticket(saved)
        .action("TICKET_CREATED")
        .oldValue(null)
        .newValue("status=OPEN")
        .changedBy(reporterId)
        .build());

    log.info("Ticket created: id={}, status=OPEN, reporterId={}", saved.getTicketId(), reporterId);

    // Process attachments
    if (attachments != null && attachments.length > 0) {
      processAttachments(saved, attachments);
    }

    eventPublisher.publishEvent(new TicketCreatedEvent(saved, reporterId));

    TicketResponse response = TicketResponse.fromEntity(saved);
    response.setWarningMessage(duplicateWarning);
    return response;
  }

  public TicketResponse getTicketById(Long id, Long requesterId) {
    IncidentTicketEntity entity = ticketRepository.findById(id)
        .filter(ticket -> !ticket.getIsDeleted())
        .orElseThrow(() -> new TicketNotFoundException(id));

    // If requester is not admin, check if they reported it
    // For now, assume requesterId is user, so check reportedBy
    if (!entity.getReportedBy().getUserId().equals(requesterId)) {
      throw new TicketNotFoundException("Access denied");
    }

    // Load attachments
    entity.setAttachments(ticketAttachmentRepository.findByTicket_TicketId(id));

    return TicketResponse.fromEntity(entity);
  }

  @Transactional
  public TicketResponse updateTicket(Long ticketId, UpdateTicketRequest request, Long requesterId) {
    IncidentTicketEntity entity = ticketRepository.findById(ticketId)
        .filter(ticket -> !ticket.getIsDeleted())
        .orElseThrow(() -> new TicketNotFoundException(ticketId));

    validateOwnership(entity, requesterId);
    ensureEditableStatus(entity);

    String normalizedDescription = normalizeText(request.getDescription());
    String normalizedLocation = normalizeText(request.getLocation());
    String normalizedPreferredContact = normalizeText(request.getPreferredContact());
    TicketCategory category = parseCategory(request.getCategory());
    TicketPriority priority = parsePriority(request.getPriority());

    validateCreateRequest(request.getResourceId(), normalizedLocation, normalizedDescription, normalizedPreferredContact);

    entity.setDescription(normalizedDescription);
    entity.setTitle(normalizedDescription.substring(0, Math.min(50, normalizedDescription.length())));
    entity.setCategory(category);
    entity.setPriority(priority);
    entity.setResourceId(request.getResourceId());
    entity.setLocation(normalizedLocation);
    entity.setPreferredContact(normalizedPreferredContact);

    IncidentTicketEntity saved = ticketRepository.save(entity);
    ticketAuditRepository.save(TicketAuditEntity.builder()
        .ticket(saved)
        .action("TICKET_UPDATED")
        .oldValue(null)
        .newValue("ticket_fields_updated")
        .changedBy(requesterId)
        .build());

    return TicketResponse.fromEntity(saved);
  }

  @Transactional
  public void deleteTicket(Long ticketId, Long requesterId) {
    IncidentTicketEntity entity = ticketRepository.findById(ticketId)
        .filter(ticket -> !ticket.getIsDeleted())
        .orElseThrow(() -> new TicketNotFoundException(ticketId));

    validateOwnership(entity, requesterId);
    ensureEditableStatus(entity);

    entity.setIsDeleted(true);
    ticketRepository.save(entity);
    ticketAuditRepository.save(TicketAuditEntity.builder()
        .ticket(entity)
        .action("TICKET_DELETED")
        .oldValue("isDeleted=false")
        .newValue("isDeleted=true")
        .changedBy(requesterId)
        .build());
  }

  public Page<TicketResponse> getMyTickets(Long userId, TicketFilterRequest filterRequest, Pageable pageable) {
    Specification<IncidentTicketEntity> spec = Specification.where(TicketSpecification.notDeleted())
        .and(TicketSpecification.reportedByUserId(userId))
        .and(TicketSpecification.hasStatus(filterRequest.getStatus()));
    // Add more filters as needed

    Page<IncidentTicketEntity> entities = ticketRepository.findAll(spec, pageable);
    return entities.map(TicketResponse::fromEntity);
  }

  public Page<TicketResponse> getAllTickets(TicketFilterRequest filterRequest, Pageable pageable) {
    Specification<IncidentTicketEntity> spec = Specification.where(TicketSpecification.notDeleted())
        .and(TicketSpecification.hasStatus(filterRequest.getStatus()));
    // Add more filters

    Page<IncidentTicketEntity> entities = ticketRepository.findAll(spec, pageable);
    return entities.map(TicketResponse::fromEntity);
  }

  private void validateCreateRequest(
      Long resourceId,
      String normalizedLocation,
      String normalizedDescription,
      String normalizedPreferredContact
  ) {
    if (resourceId == null && normalizedLocation == null) {
      throw new BadRequestException("Either resourceId or location must be provided");
    }
    if (resourceId != null && resourceId <= 0) {
      throw new BadRequestException("resourceId must be greater than 0");
    }
    if (resourceId != null && !resourceValidationPort.resourceExists(resourceId)) {
      throw new BadRequestException("resourceId does not exist");
    }
    if (normalizedDescription == null || normalizedDescription.length() < 10 || normalizedDescription.length() > 500) {
      throw new BadRequestException("Description is required and must be between 10 and 500 characters");
    }
    if (normalizedPreferredContact == null || !CONTACT_PATTERN.matcher(normalizedPreferredContact).matches()) {
      throw new BadRequestException("preferredContact must be a valid email or phone number");
    }
  }

  private String enforceDuplicateProtection(Long reporterId, Long resourceId, String location, String description) {
    LocalDateTime cutoff = LocalDateTime.now().minusMinutes(Math.max(1, duplicateCooldownMinutes));
    List<IncidentTicketEntity> recentCandidates = ticketRepository.findRecentPotentialDuplicates(
        reporterId,
        resourceId,
        location,
        cutoff
    );
    String normalizedIncomingDescription = normalizeForSimilarity(description);
    boolean isDuplicate = recentCandidates.stream()
        .map(IncidentTicketEntity::getDescription)
        .map(this::normalizeForSimilarity)
        .anyMatch(existing -> similarityScore(existing, normalizedIncomingDescription) >= duplicateSimilarityThreshold);

    if (isDuplicate) {
      if ("WARN".equalsIgnoreCase(duplicateMode)) {
        return "Possible duplicate detected: a similar ticket was recently submitted.";
      }
      throw new ConflictException("A similar ticket was recently submitted. Please wait and try again.");
    }
    return null;
  }

  private TicketCategory parseCategory(String category) {
    try {
      return TicketCategory.valueOf(normalizeEnum(category));
    } catch (IllegalArgumentException ex) {
      throw new BadRequestException("Invalid category value");
    }
  }

  private TicketPriority parsePriority(String priority) {
    try {
      return TicketPriority.valueOf(normalizeEnum(priority));
    } catch (IllegalArgumentException ex) {
      throw new BadRequestException("Invalid priority value");
    }
  }

  private String normalizeEnum(String value) {
    if (value == null || value.isBlank()) {
      throw new BadRequestException("Enum value cannot be empty");
    }
    return value.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
  }

  private String normalizeText(String value) {
    if (value == null) {
      return null;
    }
    String normalized = value.trim().replaceAll("\\s+", " ");
    return normalized.isEmpty() ? null : normalized;
  }

  private String normalizeForSimilarity(String value) {
    String normalized = normalizeText(value);
    if (normalized == null) {
      return null;
    }
    return normalized
        .toLowerCase(Locale.ROOT)
        .replaceAll("[^a-z0-9\\s]", " ")
        .replaceAll("\\s+", " ")
        .trim();
  }

  private double similarityScore(String first, String second) {
    if (first == null || second == null) {
      return 0.0;
    }
    Set<String> firstTokens = tokenize(first);
    Set<String> secondTokens = tokenize(second);
    if (firstTokens.isEmpty() || secondTokens.isEmpty()) {
      return 0.0;
    }
    Set<String> intersection = new HashSet<>(firstTokens);
    intersection.retainAll(secondTokens);
    Set<String> union = new HashSet<>(firstTokens);
    union.addAll(secondTokens);
    return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
  }

  private Set<String> tokenize(String text) {
    return Arrays.stream(text.split("\\s+"))
        .filter(token -> !token.isBlank())
        .collect(java.util.stream.Collectors.toSet());
  }

  private void validateOwnership(IncidentTicketEntity entity, Long requesterId) {
    if (!entity.getReportedBy().getUserId().equals(requesterId)) {
      throw new TicketNotFoundException("Access denied");
    }
  }

  private void ensureEditableStatus(IncidentTicketEntity entity) {
    if (entity.getStatus() != TicketStatus.OPEN) {
      throw new BadRequestException("Ticket can only be updated/deleted while status is OPEN");
    }
  }

  private void processAttachments(IncidentTicketEntity ticket, MultipartFile[] attachments) {
    Set<String> allowedTypes = Set.of("image/jpeg", "image/jpg", "image/png");
    long maxSizeBytes = 2 * 1024 * 1024; // 2MB

    if (attachments.length > 3) {
      throw new BadRequestException("Maximum 3 attachments allowed");
    }

    Path uploadDir = Paths.get("uploads", "attachments");
    try {
      Files.createDirectories(uploadDir);
    } catch (IOException e) {
      throw new RuntimeException("Failed to create upload directory", e);
    }

    for (MultipartFile file : attachments) {
      if (file.isEmpty()) continue;

      // Validate file type
      String contentType = file.getContentType();
      if (!allowedTypes.contains(contentType)) {
        throw new BadRequestException("Invalid file type. Only JPG, JPEG, PNG allowed");
      }

      // Validate file size
      if (file.getSize() > maxSizeBytes) {
        throw new BadRequestException("File size exceeds 2MB limit");
      }

      // Generate unique filename
      String originalFilename = file.getOriginalFilename();
      String extension = getFileExtension(originalFilename);
      String uniqueFilename = UUID.randomUUID().toString() + "." + extension;
      Path filePath = uploadDir.resolve(uniqueFilename);

      try {
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
      } catch (IOException e) {
        throw new RuntimeException("Failed to save file: " + originalFilename, e);
      }

      // Save attachment entity
      TicketAttachmentEntity attachment = TicketAttachmentEntity.builder()
          .ticket(ticket)
          .fileName(originalFilename)
          .filePath(filePath.toString())
          .fileSize(file.getSize())
          .contentType(contentType)
          .build();

      ticketAttachmentRepository.save(attachment);
    }
  }

  private String getFileExtension(String filename) {
    if (filename == null) return "";
    int lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex == -1 ? "" : filename.substring(lastDotIndex + 1).toLowerCase();
  }

  public TicketAttachmentEntity getAttachment(Long attachmentId, Long requesterId) {
    TicketAttachmentEntity attachment = ticketAttachmentRepository.findById(attachmentId)
        .orElseThrow(() -> new TicketNotFoundException("Attachment not found"));

    // Check if user has access to the ticket
    IncidentTicketEntity ticket = attachment.getTicket();
    if (!ticket.getReportedBy().getUserId().equals(requesterId)) {
      throw new TicketNotFoundException("Access denied");
    }

    return attachment;
  }
}