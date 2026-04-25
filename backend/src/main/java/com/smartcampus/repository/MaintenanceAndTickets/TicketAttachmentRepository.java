package com.smartcampus.repository.MaintenanceAndTickets;

import com.smartcampus.model.MaintenanceAndTickets.TicketAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {

    @Modifying
    @Query("DELETE FROM TicketAttachment a WHERE a.ticket.reportedBy.id = :userId")
    int deleteAllByTicketCreatedByUserId(@Param("userId") Long userId);
}
