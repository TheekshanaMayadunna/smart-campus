package com.smartcampus.repository.resources;

import com.smartcampus.model.resources.Resource;
<<<<<<< Updated upstream
import com.smartcampus.model.resources.ResourceStatus;
import com.smartcampus.model.resources.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface ResourceRepository extends JpaRepository<Resource, Long>, JpaSpecificationExecutor<Resource> {

    List<Resource> findByDeletedFalse();

    List<Resource> findByDeletedFalseAndType(ResourceType type);

    List<Resource> findByDeletedFalseAndStatus(ResourceStatus status);
}
=======
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ResourceRepository extends JpaRepository<Resource, Long>, JpaSpecificationExecutor<Resource> {
}
>>>>>>> Stashed changes
