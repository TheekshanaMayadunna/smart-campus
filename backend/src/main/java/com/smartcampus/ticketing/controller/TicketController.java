package com.smartcampus.ticketing.controller;

import com.smartcampus.ticketing.dto.request.CreateTicketRequest;
import com.smartcampus.ticketing.dto.request.TicketFilterRequest;
import com.smartcampus.ticketing.dto.response.TicketResponse;
import com.smartcampus.ticketing.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

  private final TicketService service;

  @PostMapping
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<TicketResponse> create(
      @Valid @RequestBody CreateTicketRequest req,
      @AuthenticationPrincipal UserDetails user) {
    // Assuming user.getUsername() is the userId as String, need to parse
    Long userId = Long.parseLong(user.getUsername()); // Adjust based on your UserDetails
    return ResponseEntity.status(201)
        .body(service.createTicket(req, userId));
  }

  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  public Page<TicketResponse> getAllTickets(
      TicketFilterRequest filterRequest,
      @PageableDefault(size = 10, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
    return service.getAllTickets(filterRequest, pageable);
  }

  @GetMapping("/my")
  @PreAuthorize("isAuthenticated()")
  public Page<TicketResponse> getMyTickets(
      @AuthenticationPrincipal UserDetails user,
      TicketFilterRequest filterRequest,
      @PageableDefault(size = 10, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
    Long userId = Long.parseLong(user.getUsername());
    return service.getMyTickets(userId, filterRequest, pageable);
  }

  @GetMapping("/{id}")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<TicketResponse> getTicketById(
      @PathVariable Long id,
      @AuthenticationPrincipal UserDetails user) {
    Long userId = Long.parseLong(user.getUsername());
    TicketResponse response = service.getTicketById(id, userId);
    return ResponseEntity.ok(response);
  }
}