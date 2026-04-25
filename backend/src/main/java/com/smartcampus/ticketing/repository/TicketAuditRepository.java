package com.smartcampus.ticketing.repository;

import com.smartcampus.ticketing.entity.TicketAuditEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketAuditRepository extends JpaRepository<TicketAuditEntity, Long> {
}
