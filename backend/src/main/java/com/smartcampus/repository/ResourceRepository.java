package com.smartcampus.repository;

import com.smartcampus.model.Resource;
import com.smartcampus.model.ResourceType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ResourceRepository extends JpaRepository<Resource, Long> {

    @Query("""
      SELECT r FROM Resource r
      WHERE r.status <> 'INACTIVE'
        AND (:type IS NULL OR r.type = :type)
        AND (:minCap IS NULL OR r.capacity >= :minCap)
        AND (:location IS NULL OR LOWER(r.location) LIKE LOWER(CONCAT('%', :location, '%')))
        AND (:status IS NULL OR r.status = :status)
        AND (
          :q IS NULL OR
          LOWER(r.name) LIKE LOWER(CONCAT('%', :q, '%')) OR
          LOWER(r.location) LIKE LOWER(CONCAT('%', :q, '%')) OR
          LOWER(r.status) LIKE LOWER(CONCAT('%', :q, '%')) OR
          LOWER(r.availabilityWindows) LIKE LOWER(CONCAT('%', :q, '%')) OR
          LOWER(CONCAT(r.type, '')) LIKE LOWER(CONCAT('%', :q, '%'))
        )
      ORDER BY r.id DESC
    """)
    List<Resource> search(
            @Param("type") ResourceType type,
            @Param("minCap") Integer minCap,
            @Param("location") String location,
            @Param("status") String status,
            @Param("q") String q
    );
}