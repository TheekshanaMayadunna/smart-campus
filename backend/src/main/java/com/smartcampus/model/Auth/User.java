package com.smartcampus.model.Auth;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;

    private String role;

    private String password;

    @Column(length = 2000)
    private String pictureUrl;

    private String studentId;

    @Column(nullable = false)
    private boolean notifyBookingUpdates = true;

    @Column(nullable = false)
    private boolean notifyTicketStatusChanges = true;

    @Column(nullable = false)
    private boolean notifyTicketComments = true;

    @Column(nullable = false)
    private boolean notificationPreferencesCustomized = false;

    public User() {
    }

    public User(String name, String email, String password, String role) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getPictureUrl() {
        return pictureUrl;
    }

    public void setPictureUrl(String pictureUrl) {
        this.pictureUrl = pictureUrl;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public boolean isNotifyBookingUpdates() {
        return notifyBookingUpdates;
    }

    public void setNotifyBookingUpdates(boolean notifyBookingUpdates) {
        this.notifyBookingUpdates = notifyBookingUpdates;
    }

    public boolean isNotifyTicketStatusChanges() {
        return notifyTicketStatusChanges;
    }

    public void setNotifyTicketStatusChanges(boolean notifyTicketStatusChanges) {
        this.notifyTicketStatusChanges = notifyTicketStatusChanges;
    }

    public boolean isNotifyTicketComments() {
        return notifyTicketComments;
    }

    public void setNotifyTicketComments(boolean notifyTicketComments) {
        this.notifyTicketComments = notifyTicketComments;
    }

    public boolean isNotificationPreferencesCustomized() {
        return notificationPreferencesCustomized;
    }

    public void setNotificationPreferencesCustomized(boolean notificationPreferencesCustomized) {
        this.notificationPreferencesCustomized = notificationPreferencesCustomized;
    }
}