package com.smartcampus.repository;

import com.smartcampus.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByTicketIdOrderByCreatedAtAsc(Long ticketId);

    @Query("SELECT c FROM Comment c LEFT JOIN FETCH c.author WHERE c.ticket.id = :ticketId ORDER BY c.createdAt ASC")
    List<Comment> findByTicketIdWithAuthorsAsc(@Param("ticketId") Long ticketId);

    @Modifying
    @Query("DELETE FROM Comment c WHERE c.author.id = :userId")
    int deleteAllByAuthorId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Comment c WHERE c.ticket.createdBy.id = :userId")
    int deleteAllOnTicketsCreatedByUserId(@Param("userId") Long userId);
}
