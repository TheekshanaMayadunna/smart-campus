package com.smartcampus.ticketing.controller;

import com.smartcampus.ticketing.dto.request.CreateTicketRequest;
import com.smartcampus.ticketing.dto.request.TicketFilterRequest;
import com.smartcampus.ticketing.dto.request.UpdateTicketRequest;
import com.smartcampus.ticketing.dto.response.TicketResponse;
import com.smartcampus.ticketing.entity.TicketAttachmentEntity;
import com.smartcampus.ticketing.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

  private final TicketService service;

  @PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<TicketResponse> create(
      @RequestParam("resourceId") String resourceId,
      @RequestParam("location") String location,
      @RequestParam("category") String category,
      @RequestParam("description") String description,
      @RequestParam("priority") String priority,
      @RequestParam("preferredContact") String preferredContact,
      @RequestParam(value = "attachments", required = false) MultipartFile[] attachments) {
    // For development, use a dummy user ID
    Long userId = 1L; // TODO: Replace with proper authentication

    CreateTicketRequest req = new CreateTicketRequest();
    req.setResourceId(resourceId != null && !resourceId.trim().isEmpty() ? Long.parseLong(resourceId) : null);
    req.setLocation(location);
    req.setCategory(category);
    req.setDescription(description);
    req.setPriority(priority);
    req.setPreferredContact(preferredContact);

    return ResponseEntity.status(201).body(service.createTicket(req, attachments, userId));
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

  @GetMapping("/attachments/{attachmentId}")
  public ResponseEntity<Resource> getAttachment(@PathVariable Long attachmentId) {
    // For development, use a dummy user ID
    Long userId = 1L; // TODO: Replace with proper authentication

    TicketAttachmentEntity attachment = service.getAttachment(attachmentId, userId);
    try {
      Path filePath = Paths.get(attachment.getFilePath());
      Resource resource = new UrlResource(filePath.toUri());

      if (resource.exists() && resource.isReadable()) {
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(attachment.getContentType()))
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + attachment.getFileName() + "\"")
            .body(resource);
      } else {
        return ResponseEntity.notFound().build();
      }
    } catch (Exception e) {
      return ResponseEntity.notFound().build();
    }
  }
}