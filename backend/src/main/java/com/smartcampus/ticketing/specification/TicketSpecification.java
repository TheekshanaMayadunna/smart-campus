package com.smartcampus.ticketing.specification;

import com.smartcampus.ticketing.entity.IncidentTicketEntity;
import com.smartcampus.ticketing.entity.enums.TicketStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

public class TicketSpecification {

  public static Specification<IncidentTicketEntity> hasStatus(TicketStatus status) {
    return (root, query, cb) ->
        status == null ? null : cb.equal(root.get("status"), status);
  }

  public static Specification<IncidentTicketEntity> notDeleted() {
    return (root, query, cb) -> cb.isFalse(root.get("isDeleted"));
  }

  public static Specification<IncidentTicketEntity> reportedByUserId(Long userId) {
    return (root, query, cb) ->
        userId == null ? null : cb.equal(root.get("reportedBy").get("userId"), userId);
  }

  // Add more specifications as needed
}