package com.smartcampus.controller;

import com.smartcampus.config.booking.BookingSecurityContext;
import com.smartcampus.controller.booking.BookingController;
import com.smartcampus.model.Auth.User;
import com.smartcampus.model.booking.BookingStatus;
import com.smartcampus.service.booking.BookingService;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.util.Collections;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = BookingController.class)
@Import(BookingControllerSecurityTest.TestSecurityConfig.class)
class BookingControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BookingService bookingService;

    @MockBean
    private BookingSecurityContext bookingSecurityContext;

    @Test
    @WithMockUser(roles = "USER")
    void getAllBookingsRejectsNonAdminUsers() throws Exception {
        User currentUser = buildUser(1L, "USER");
        when(bookingSecurityContext.getCurrentUser()).thenReturn(currentUser);
        doThrow(new IllegalStateException("Forbidden: Admins only")).when(bookingSecurityContext).requireAdmin(currentUser);

        mockMvc.perform(get("/api/bookings"))
                .andExpect(status().isBadRequest())
                .andExpect(result -> assertTrue(result.getResponse().getContentAsString().contains("Forbidden: Admins only")));

        verifyNoInteractions(bookingService);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllBookingsAllowsAdminsWithFilters() throws Exception {
        User currentUser = buildUser(2L, "ADMIN");
        when(bookingSecurityContext.getCurrentUser()).thenReturn(currentUser);
        when(bookingService.getAllBookings(BookingStatus.APPROVED, LocalDate.parse("2026-04-08"), LocalDate.parse("2026-04-08"), 3L, 9L))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/bookings")
                .param("status", "APPROVED")
                .param("startDate", "2026-04-08")
                .param("endDate", "2026-04-08")
                .param("resourceId", "3")
                .param("userId", "9"))
                .andExpect(status().isOk());

        verify(bookingService).getAllBookings(eq(BookingStatus.APPROVED), eq(LocalDate.parse("2026-04-08")),
                eq(LocalDate.parse("2026-04-08")), eq(3L), eq(9L));
    }

    private User buildUser(Long id, String role) {
        User user = new User();
        user.setRole(role);
        user.setEmail("user");
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    @TestConfiguration
    @EnableMethodSecurity
    static class TestSecurityConfig {
        @Bean
        SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
            http.csrf(csrf -> csrf.disable())
                    .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                    .httpBasic(Customizer.withDefaults());
            return http.build();
        }
    }
}
