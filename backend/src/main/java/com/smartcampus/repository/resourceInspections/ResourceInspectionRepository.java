package com.smartcampus.repository.resourceInspections;

import com.smartcampus.model.resourceInspections.ResourceInspection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResourceInspectionRepository extends JpaRepository<ResourceInspection, Long> {
    List<ResourceInspection> findByResourceIdOrderByInspectionDateDesc(Long resourceId);
}

