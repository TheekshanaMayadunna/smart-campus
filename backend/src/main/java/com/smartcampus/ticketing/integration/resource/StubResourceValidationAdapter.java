package com.smartcampus.ticketing.integration.resource;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
@Slf4j
public class StubResourceValidationAdapter implements ResourceValidationPort {

  @Value("${app.ticket.resource-validation.stub-enabled:true}")
  private boolean stubEnabled;

  @Override
  public boolean resourceExists(Long resourceId) {
    if (resourceId == null) {
      return false;
    }

    if (stubEnabled) {
      log.debug("Resource validation is running in stub mode for resourceId={}", resourceId);
      return true;
    }

    // In strict mode, reject until Module A adapter is plugged in.
    return false;
  }
}
