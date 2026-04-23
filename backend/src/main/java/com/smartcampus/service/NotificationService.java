package com.smartcampus.service;

import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartcampus.dto.NotificationPreferencesDTO;
import com.smartcampus.model.Auth.User;
import com.smartcampus.model.Notification;
import com.smartcampus.model.NotificationType;
import com.smartcampus.repository.Auth.UserRepository;
import com.smartcampus.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public Notification create(User recipient, NotificationType type, String title, String message, String referenceType,
            Long referenceId) {
        if (recipient == null || recipient.getId() == null) {
            throw new IllegalArgumentException("Notification recipient is required");
        }
        if (!isCategoryEnabled(recipient, type)) {
            return null;
        }
        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setType(type);
        notification.setTitle(requireText(title, "Notification title is required"));
        notification.setMessage(requireText(message, "Notification message is required"));
        notification.setReferenceType(requireText(referenceType, "Notification reference type is required"));
        notification.setReferenceId(referenceId);
        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<Notification> getForUser(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    @Transactional
    public Notification markRead(Long id, Long userId) {
        Notification notification = notificationRepository.findByIdAndRecipientId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!notification.isRead()) {
            notification.setRead(true);
            notification = notificationRepository.save(notification);
        }
        return notification;
    }

    @Transactional
    public int markAllRead(Long userId) {
        return notificationRepository.markAllAsRead(userId);
    }

    @Transactional(readOnly = true)
    public NotificationPreferencesDTO getPreferences(Long userId) {
        Long resolvedUserId = Objects.requireNonNull(userId, "User id is required");
        User user = userRepository.findById(resolvedUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return toPreferences(user);
    }

    @Transactional
    public NotificationPreferencesDTO updatePreferences(Long userId, NotificationPreferencesDTO request) {
        Long resolvedUserId = Objects.requireNonNull(userId, "User id is required");
        User user = userRepository.findById(resolvedUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setNotifyBookingUpdates(request.isBookingUpdates());
        user.setNotifyTicketStatusChanges(request.isTicketStatusChanges());
        user.setNotifyTicketComments(request.isTicketComments());
        user.setNotificationPreferencesCustomized(true);
        userRepository.save(user);
        return toPreferences(user);
    }

    public NotificationPayload toPayload(Notification notification) {
        return new NotificationPayload(
                notification.getId(),
                notification.getType().name(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getReferenceType(),
                notification.getReferenceId(),
                notification.isRead(),
                notification.getCreatedAt());
    }

    private String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private NotificationPreferencesDTO toPreferences(User user) {
        NotificationPreferencesDTO dto = new NotificationPreferencesDTO();
        if (!user.isNotificationPreferencesCustomized()) {
            dto.setBookingUpdates(true);
            dto.setTicketStatusChanges(true);
            dto.setTicketComments(true);
            return dto;
        }
        dto.setBookingUpdates(user.isNotifyBookingUpdates());
        dto.setTicketStatusChanges(user.isNotifyTicketStatusChanges());
        dto.setTicketComments(user.isNotifyTicketComments());
        return dto;
    }

    private boolean isCategoryEnabled(User recipient, NotificationType type) {
        if ("ADMIN".equalsIgnoreCase(recipient.getRole())
                && (type == NotificationType.BOOKING_REQUESTED
                        || type == NotificationType.TICKET_CREATED
                        || type == NotificationType.TICKET_COMMENT_ADDED)) {
            return true;
        }
        if (!recipient.isNotificationPreferencesCustomized()) {
            return true;
        }
        return switch (type) {
            case BOOKING_APPROVED, BOOKING_REJECTED, BOOKING_REQUESTED -> recipient.isNotifyBookingUpdates();
            case TICKET_STATUS_CHANGED, TICKET_CREATED -> recipient.isNotifyTicketStatusChanges();
            case TICKET_COMMENT_ADDED -> recipient.isNotifyTicketComments();
        };
    }

    public record NotificationPayload(
            Long id,
            String type,
            String title,
            String message,
            String referenceType,
            Long referenceId,
            boolean isRead,
            java.time.LocalDateTime createdAt) {
    }
}
