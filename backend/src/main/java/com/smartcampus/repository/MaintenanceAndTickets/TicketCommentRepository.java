package com.smartcampus.repository.MaintenanceAndTickets;

import com.smartcampus.model.MaintenanceAndTickets.TicketComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {
    List<TicketComment> findByTicketIdOrderByCreatedAtAsc(Long ticketId);

    @Query("SELECT c FROM TicketComment c LEFT JOIN FETCH c.user WHERE c.ticket.id = :ticketId ORDER BY c.createdAt ASC")
    List<TicketComment> findByTicketIdWithAuthorsAsc(@Param("ticketId") Long ticketId);

    @Modifying
    @Query("DELETE FROM TicketComment c WHERE c.user.id = :userId")
    int deleteAllByAuthorId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM TicketComment c WHERE c.ticket.reportedBy.id = :userId")
    int deleteAllOnTicketsCreatedByUserId(@Param("userId") Long userId);
}
