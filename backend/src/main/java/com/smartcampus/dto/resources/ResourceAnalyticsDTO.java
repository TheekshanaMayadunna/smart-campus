package com.smartcampus.dto.resources;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ResourceAnalyticsDTO {
    private String key;
    private long count;
}
