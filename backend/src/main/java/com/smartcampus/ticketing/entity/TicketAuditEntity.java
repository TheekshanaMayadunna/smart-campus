package com.smartcampus.ticketing.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_audit")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketAuditEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "ticket_id", nullable = false)
  private IncidentTicketEntity ticket;

  @Column(nullable = false, length = 60)
  private String action;

  @Column(name = "old_value", length = 1000)
  private String oldValue;

  @Column(name = "new_value", length = 1000)
  private String newValue;

  @Column(name = "changed_by", nullable = false)
  private Long changedBy;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;
}
