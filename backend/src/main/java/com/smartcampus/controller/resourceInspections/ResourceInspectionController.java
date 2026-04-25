package com.smartcampus.controller.resourceInspections;

import com.smartcampus.config.resourceInspections.ResourceInspectionsSecurityContext;
import com.smartcampus.dto.resourceInspections.OverdueInspectionResponseDTO;
import com.smartcampus.dto.resourceInspections.ResourceInspectionCreateRequestDTO;
import com.smartcampus.dto.resourceInspections.ResourceInspectionResponseDTO;
import com.smartcampus.model.Auth.User;
import com.smartcampus.service.resourceInspections.ResourceInspectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/resource-inspections")
@RequiredArgsConstructor
public class ResourceInspectionController {
    private final ResourceInspectionService inspectionService;
    private final ResourceInspectionsSecurityContext securityContext;

    @PostMapping("/{resourceId}")
    public ResponseEntity<ResourceInspectionResponseDTO> create(@PathVariable Long resourceId,
                                                                @Valid @RequestBody ResourceInspectionCreateRequestDTO dto) {
        User currentUser = securityContext.getCurrentUser();
        securityContext.requireAdmin(currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(inspectionService.addInspection(resourceId, dto, currentUser.getName()));
    }

    @GetMapping("/{resourceId}")
    public List<ResourceInspectionResponseDTO> listByResource(@PathVariable Long resourceId) {
        User currentUser = securityContext.getCurrentUser();
        securityContext.requireAdminOrUser(currentUser);
        return inspectionService.listByResourceId(resourceId);
    }

    @GetMapping("/overdue")
    public List<OverdueInspectionResponseDTO> listOverdue() {
        User currentUser = securityContext.getCurrentUser();
        securityContext.requireAdmin(currentUser);
        return inspectionService.listOverdue();
    }

    @DeleteMapping("/{inspectionId}")
    public void delete(@PathVariable Long inspectionId) {
        User currentUser = securityContext.getCurrentUser();
        securityContext.requireAdmin(currentUser);
        inspectionService.deleteInspection(inspectionId);
    }
}
