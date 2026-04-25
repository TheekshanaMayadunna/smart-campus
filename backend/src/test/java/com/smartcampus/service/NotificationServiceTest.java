package com.smartcampus.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.smartcampus.model.Auth.User;
import com.smartcampus.model.Notification;
import com.smartcampus.model.NotificationType;
import com.smartcampus.repository.Auth.UserRepository;
import com.smartcampus.repository.NotificationRepository;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void createStoresNotification() {
        User recipient = buildUser(5L);
        Notification saved = new Notification();
        saved.setTitle("Booking approved");
        when(notificationRepository.save(any(Notification.class))).thenReturn(saved);

        Notification result = notificationService.create(
                recipient,
                NotificationType.BOOKING_APPROVED,
                "Booking approved",
                "Your booking has been approved.",
                "BOOKING",
                12L);

        assertEquals("Booking approved", result.getTitle());
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void unreadCountUsesRepository() {
        when(notificationRepository.countByRecipientIdAndIsReadFalse(8L)).thenReturn(3L);
        assertEquals(3L, notificationService.unreadCount(8L));
    }

    @Test
    void getForUserUsesRepository() {
        when(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(9L))
                .thenReturn(Collections.emptyList());
        assertEquals(0, notificationService.getForUser(9L).size());
    }

    @Test
    void markReadFailsWhenNotificationMissing() {
        when(notificationRepository.findByIdAndRecipientId(100L, 7L)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> notificationService.markRead(100L, 7L));
    }

    @Test
    void markAllReadReturnsUpdatedCount() {
        when(notificationRepository.markAllAsRead(3L)).thenReturn(4);
        assertEquals(4, notificationService.markAllRead(3L));
    }

    @Test
    void createSkipsWhenPreferenceDisabled() {
        User recipient = buildUser(7L);
        recipient.setNotifyBookingUpdates(false);
        recipient.setNotificationPreferencesCustomized(true);

        Notification result = notificationService.create(
                recipient,
                NotificationType.BOOKING_APPROVED,
                "Booking approved",
                "Your booking has been approved.",
                "BOOKING",
                55L);

        assertEquals(null, result);
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    private User buildUser(Long id) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setEmail("test@uni.lk");
        user.setRole("USER");
        user.setNotifyBookingUpdates(true);
        user.setNotifyTicketStatusChanges(true);
        user.setNotifyTicketComments(true);
        user.setNotificationPreferencesCustomized(true);
        return user;
    }
}
