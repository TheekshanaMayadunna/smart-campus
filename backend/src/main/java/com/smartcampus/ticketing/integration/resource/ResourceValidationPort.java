package com.smartcampus.ticketing.integration.resource;

public interface ResourceValidationPort {
  boolean resourceExists(Long resourceId);
}
