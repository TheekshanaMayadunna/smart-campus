package com.smartcampus.controller.resourceInspections;

import com.smartcampus.config.resourceInspections.ResourceInspectionsSecurityContext;
import com.smartcampus.dto.resourceInspections.ResourceAssetProfileResponseDTO;
import com.smartcampus.dto.resourceInspections.ResourceAssetProfileUpsertRequestDTO;
import com.smartcampus.model.Auth.User;
import com.smartcampus.model.resourceInspections.InspectionStatus;
import com.smartcampus.service.resourceInspections.ResourceAssetProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequestMapping("/api/resource-assets")
@RequiredArgsConstructor
public class ResourceAssetProfileController {
    private final ResourceAssetProfileService assetProfileService;
    private final ResourceInspectionsSecurityContext securityContext;

    @PostMapping("/{resourceId}")
    public ResponseEntity<ResourceAssetProfileResponseDTO> create(@PathVariable Long resourceId,
                                                                  @Valid @RequestBody ResourceAssetProfileUpsertRequestDTO dto) {
        User currentUser = securityContext.getCurrentUser();
        securityContext.requireAdmin(currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(assetProfileService.create(resourceId, dto));
    }

    @GetMapping("/{resourceId}")
    public ResourceAssetProfileResponseDTO get(@PathVariable Long resourceId) {
        User currentUser = securityContext.getCurrentUser();
        securityContext.requireAdminOrUser(currentUser);
        return assetProfileService.getByResourceId(resourceId);
    }

    @PutMapping("/{resourceId}")
    public ResourceAssetProfileResponseDTO update(@PathVariable Long resourceId,
                                                  @Valid @RequestBody ResourceAssetProfileUpsertRequestDTO dto) {
        User currentUser = securityContext.getCurrentUser();
        securityContext.requireAdmin(currentUser);
        return assetProfileService.update(resourceId, dto);
    }

    @PatchMapping("/{resourceId}/inspection-status")
    public ResourceAssetProfileResponseDTO patchInspectionStatus(@PathVariable Long resourceId,
                                                                 @RequestParam InspectionStatus status) {
        User currentUser = securityContext.getCurrentUser();
        securityContext.requireAdmin(currentUser);
        return assetProfileService.setInspectionStatus(resourceId, status);
    }

    @GetMapping("/qr/{qrCodeValue}")
    public ResourceAssetProfileResponseDTO getByQr(@PathVariable String qrCodeValue) {
        User currentUser = securityContext.getCurrentUser();
        securityContext.requireAdminOrUser(currentUser);
        return assetProfileService.getByQrCodeValue(qrCodeValue);
    }

    @DeleteMapping("/{resourceId}")
    public void delete(@PathVariable Long resourceId) {
        User currentUser = securityContext.getCurrentUser();
        securityContext.requireAdmin(currentUser);
        assetProfileService.deleteByResourceId(resourceId);
    }
}
