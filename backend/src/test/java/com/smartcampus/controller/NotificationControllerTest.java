package com.smartcampus.controller;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import com.smartcampus.model.Auth.User;
import com.smartcampus.model.Notification;
import com.smartcampus.model.NotificationType;
import com.smartcampus.repository.Auth.UserRepository;
import com.smartcampus.service.NotificationService;
import com.smartcampus.dto.NotificationPreferencesDTO;

@WebMvcTest(controllers = NotificationController.class)
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private UserRepository userRepository;

    @Test
    @WithMockUser(username = "admin@uni.lk", roles = "ADMIN")
    void unreadCountReturnsValue() throws Exception {
        when(userRepository.findByEmail("admin@uni.lk")).thenReturn(Optional.of(buildUser(1L, "ADMIN", "admin@uni.lk")));
        when(notificationService.unreadCount(1L)).thenReturn(5L);

        mockMvc.perform(get("/api/notifications/unread-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(5));
    }

    @Test
    @WithMockUser(username = "user@uni.lk", roles = "USER")
    void listReturnsNotifications() throws Exception {
        when(userRepository.findByEmail("user@uni.lk")).thenReturn(Optional.of(buildUser(2L, "USER", "user@uni.lk")));
        Notification notification = new Notification();
        notification.setType(NotificationType.BOOKING_APPROVED);
        notification.setTitle("Booking approved");
        notification.setMessage("Approved");
        notification.setReferenceType("BOOKING");
        notification.setReferenceId(6L);
        ReflectionTestUtils.setField(notification, "id", 10L);
        ReflectionTestUtils.setField(notification, "createdAt", LocalDateTime.now());
        when(notificationService.getForUser(2L)).thenReturn(Collections.singletonList(notification));
        when(notificationService.toPayload(notification)).thenReturn(
                new NotificationService.NotificationPayload(10L, "BOOKING_APPROVED", "Booking approved", "Approved",
                        "BOOKING", 6L, false, LocalDateTime.now()));

        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].type").value("BOOKING_APPROVED"));
    }

    @Test
    @WithMockUser(username = "user2@uni.lk", roles = "USER")
    void markReadAndReadAllWork() throws Exception {
        when(userRepository.findByEmail("user2@uni.lk")).thenReturn(Optional.of(buildUser(3L, "USER", "user2@uni.lk")));
        Notification notification = new Notification();
        notification.setType(NotificationType.TICKET_COMMENT_ADDED);
        notification.setTitle("Comment");
        notification.setMessage("New comment");
        notification.setReferenceType("TICKET");
        notification.setReferenceId(8L);
        ReflectionTestUtils.setField(notification, "id", 99L);
        ReflectionTestUtils.setField(notification, "createdAt", LocalDateTime.now());

        when(notificationService.markRead(99L, 3L)).thenReturn(notification);
        when(notificationService.toPayload(notification)).thenReturn(
                new NotificationService.NotificationPayload(99L, "TICKET_COMMENT_ADDED", "Comment", "New comment",
                        "TICKET", 8L, true, LocalDateTime.now()));
        when(notificationService.markAllRead(3L)).thenReturn(2);

        mockMvc.perform(put("/api/notifications/99/read").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(99));

        mockMvc.perform(put("/api/notifications/read-all").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updated").value(2));

        verify(notificationService).markRead(eq(99L), eq(3L));
        verify(notificationService).markAllRead(eq(3L));
    }

    @Test
    @WithMockUser(username = "prefs@uni.lk", roles = "USER")
    void preferencesEndpointsWork() throws Exception {
        when(userRepository.findByEmail("prefs@uni.lk")).thenReturn(Optional.of(buildUser(4L, "USER", "prefs@uni.lk")));
        NotificationPreferencesDTO dto = new NotificationPreferencesDTO();
        dto.setBookingUpdates(true);
        dto.setTicketStatusChanges(false);
        dto.setTicketComments(true);

        when(notificationService.getPreferences(4L)).thenReturn(dto);
        when(notificationService.updatePreferences(eq(4L), any(NotificationPreferencesDTO.class))).thenReturn(dto);

        mockMvc.perform(get("/api/notifications/preferences"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingUpdates").value(true))
                .andExpect(jsonPath("$.ticketStatusChanges").value(false))
                .andExpect(jsonPath("$.ticketComments").value(true));

        mockMvc.perform(put("/api/notifications/preferences")
                .with(csrf())
                .contentType("application/json")
                .content("{\"bookingUpdates\":true,\"ticketStatusChanges\":false,\"ticketComments\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingUpdates").value(true))
                .andExpect(jsonPath("$.ticketStatusChanges").value(false))
                .andExpect(jsonPath("$.ticketComments").value(true));
    }

    private User buildUser(Long id, String role, String email) {
        User user = new User();
        user.setRole(role);
        user.setEmail(email);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
}
