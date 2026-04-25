package com.smartcampus.ticketing.exception;

public class TicketNotFoundException extends RuntimeException {
  public TicketNotFoundException(String message) {
    super(message);
  }

  public TicketNotFoundException(Long ticketId) {
    super("Ticket not found with id: " + ticketId);
  }
}