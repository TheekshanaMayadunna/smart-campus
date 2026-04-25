package com.smartcampus.repository.resources;

import com.smartcampus.model.resources.ResourceImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResourceImageRepository extends JpaRepository<ResourceImage, Long> {
    List<ResourceImage> findByResourceId(Long resourceId);
}