package com.smartcampus.ticketing.repository;

import com.smartcampus.ticketing.entity.IncidentTicketEntity;
import com.smartcampus.ticketing.entity.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TicketRepository extends
    JpaRepository<IncidentTicketEntity, Long>,
    JpaSpecificationExecutor<IncidentTicketEntity> {

  Page<IncidentTicketEntity> findByReportedBy_UserIdAndIsDeletedFalse(
      Long userId, Pageable pageable);

  long countByStatusAndIsDeletedFalse(TicketStatus status);

  @Query("""
      select t from IncidentTicketEntity t
      where t.isDeleted = false
        and t.reportedBy.userId = :reporterId
        and t.createdAt >= :cutoff
        and (
          (:resourceId is not null and t.resourceId = :resourceId)
          or
          (:resourceId is null and :location is not null and lower(t.location) = lower(:location))
        )
      order by t.createdAt desc
      """)
  List<IncidentTicketEntity> findRecentPotentialDuplicates(
      @Param("reporterId") Long reporterId,
      @Param("resourceId") Long resourceId,
      @Param("location") String location,
      @Param("cutoff") LocalDateTime cutoff
  );
}