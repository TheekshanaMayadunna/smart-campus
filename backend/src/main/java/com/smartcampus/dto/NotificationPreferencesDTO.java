package com.smartcampus.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NotificationPreferencesDTO {
    private boolean bookingUpdates;
    private boolean ticketStatusChanges;
    private boolean ticketComments;
}
