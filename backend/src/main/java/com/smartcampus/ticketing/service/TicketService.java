package com.smartcampus.ticketing.service;

import com.smartcampus.ticketing.dto.request.CreateTicketRequest;
import com.smartcampus.ticketing.dto.request.TicketFilterRequest;
import com.smartcampus.ticketing.dto.response.TicketResponse;
import com.smartcampus.ticketing.entity.IncidentTicketEntity;
import com.smartcampus.ticketing.entity.UserEntity;
import com.smartcampus.ticketing.entity.enums.TicketStatus;
import com.smartcampus.ticketing.event.TicketCreatedEvent;
import com.smartcampus.ticketing.exception.TicketNotFoundException;
import com.smartcampus.ticketing.repository.TicketRepository;
import com.smartcampus.ticketing.repository.UserRepository;
import com.smartcampus.ticketing.specification.TicketSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

  private final TicketRepository ticketRepository;
  private final UserRepository userRepository;
  private final ApplicationEventPublisher eventPublisher;

  @Transactional
  public TicketResponse createTicket(CreateTicketRequest request, Long reporterId) {
    UserEntity reporter = userRepository.findById(reporterId)
        .orElseThrow(() -> new RuntimeException("User not found"));

    IncidentTicketEntity entity = IncidentTicketEntity.builder()
        .title(request.getDescription().substring(0, Math.min(50, request.getDescription().length()))) // Generate title from description
        .description(request.getDescription())
        .category(request.getCategory())
        .priority(request.getPriority())
        .status(TicketStatus.OPEN)
        .reportedBy(reporter)
        .location(request.getLocation())
        .preferredContact(request.getPreferredContact())
        .isDeleted(false)
        .build();

    IncidentTicketEntity saved = ticketRepository.save(entity);

    // Write audit log
    log.info("Ticket created: id={}, status=OPEN, reporterId={}", saved.getTicketId(), reporterId);

    // Fire event
    eventPublisher.publishEvent(new TicketCreatedEvent(saved, reporterId));

    return TicketResponse.fromEntity(saved);
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

    return TicketResponse.fromEntity(entity);
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
}