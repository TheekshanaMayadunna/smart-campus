package com.smartcampus.ticketing.controller;

import com.smartcampus.ticketing.dto.request.CreateTicketRequest;
import com.smartcampus.ticketing.dto.request.TicketFilterRequest;
import com.smartcampus.ticketing.dto.request.UpdateTicketRequest;
import com.smartcampus.ticketing.dto.response.TicketResponse;
import com.smartcampus.ticketing.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

  private final TicketService service;

  @PostMapping
  public ResponseEntity<TicketResponse> create(@Valid @RequestBody CreateTicketRequest req) {
    // For development, use a dummy user ID
    Long userId = 1L; // TODO: Replace with proper authentication
    return ResponseEntity.status(201).body(service.createTicket(req, userId));
  }

  @GetMapping
  public Page<TicketResponse> getAllTickets(
      TicketFilterRequest filterRequest,
      @PageableDefault(size = 10, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
    return service.getAllTickets(filterRequest, pageable);
  }

  @GetMapping("/my")
  public Page<TicketResponse> getMyTickets(
      TicketFilterRequest filterRequest,
      @PageableDefault(size = 10, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
    // For development, use a dummy user ID
    Long userId = 1L; // TODO: Replace with proper authentication
    return service.getMyTickets(userId, filterRequest, pageable);
  }

  @GetMapping("/{id}")
  public ResponseEntity<TicketResponse> getTicketById(@PathVariable Long id) {
    // For development, use a dummy user ID
    Long userId = 1L; // TODO: Replace with proper authentication
    TicketResponse response = service.getTicketById(id, userId);
    return ResponseEntity.ok(response);
  }

  @PutMapping("/{id}")
  public ResponseEntity<TicketResponse> updateTicket(
      @PathVariable Long id,
      @Valid @RequestBody UpdateTicketRequest req) {
    // For development, use a dummy user ID
    Long userId = 1L; // TODO: Replace with proper authentication
    return ResponseEntity.ok(service.updateTicket(id, req, userId));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteTicket(@PathVariable Long id) {
    // For development, use a dummy user ID
    Long userId = 1L; // TODO: Replace with proper authentication
    service.deleteTicket(id, userId);
    return ResponseEntity.noContent().build();
  }
}