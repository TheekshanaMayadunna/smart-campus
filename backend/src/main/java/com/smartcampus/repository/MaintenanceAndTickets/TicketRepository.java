package com.smartcampus.repository.MaintenanceAndTickets;

import com.smartcampus.model.MaintenanceAndTickets.Ticket;
import com.smartcampus.model.MaintenanceAndTickets.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByAssignedTechnicianId(Long techId);

    List<Ticket> findByReportedById(Long userId);

    @Query("select t from Ticket t where t.reportedBy.id = :reporterId")
    List<Ticket> findByReporterId(@Param("reporterId") Long reporterId);

    @Query("""
            SELECT t
            FROM Ticket t
            WHERE t.reportedBy.id = :reporterId
              AND t.category = :category
              AND t.createdAt >= :since
              AND t.status IN :statuses
              AND (
                    (:resourceId IS NOT NULL AND t.resourceId = :resourceId)
                    OR
                    (:normalizedLocation IS NOT NULL AND LOWER(TRIM(t.locationText)) = :normalizedLocation)
                  )
            ORDER BY t.createdAt DESC
            """)
    List<Ticket> findRecentPossibleDuplicates(@Param("reporterId") Long reporterId,
                                              @Param("category") String category,
                                              @Param("resourceId") Long resourceId,
                                              @Param("normalizedLocation") String normalizedLocation,
                                              @Param("since") LocalDateTime since,
                                              @Param("statuses") List<TicketStatus> statuses);

    @Query("""
            SELECT DISTINCT t
            FROM Ticket t
            LEFT JOIN FETCH t.reportedBy
            LEFT JOIN FETCH t.assignedTechnician
            LEFT JOIN FETCH t.attachments
            WHERE t.id = :id
            """)
    Optional<Ticket> findDetailById(@Param("id") Long id);

    @Query("""
            SELECT DISTINCT t
            FROM Ticket t
            LEFT JOIN FETCH t.reportedBy
            LEFT JOIN FETCH t.assignedTechnician
            LEFT JOIN FETCH t.attachments
            WHERE t.id = :id
            """)
    Optional<Ticket> findFullDetailById(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Ticket t SET t.assignedTechnician = null WHERE t.assignedTechnician.id = :userId")
    int clearAssignedTechnician(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Ticket t WHERE t.reportedBy.id = :userId")
    int deleteAllCreatedBy(@Param("userId") Long userId);
}
