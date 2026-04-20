package com.smartcampus.ticketing.repository;

import com.smartcampus.ticketing.entity.IncidentTicketEntity;
import com.smartcampus.ticketing.entity.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketRepository extends
    JpaRepository<IncidentTicketEntity, Long>,
    JpaSpecificationExecutor<IncidentTicketEntity> {

  Page<IncidentTicketEntity> findByReportedBy_UserIdAndIsDeletedFalse(
      Long userId, Pageable pageable);

  long countByStatusAndIsDeletedFalse(TicketStatus status);
}