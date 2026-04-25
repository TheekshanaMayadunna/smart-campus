package com.smartcampus.controller.resources;

<<<<<<< Updated upstream
import com.smartcampus.dto.resources.ApiResponseDto;
import com.smartcampus.dto.resources.ResourceRequestDto;
import com.smartcampus.dto.resources.ResourceResponseDto;
import com.smartcampus.service.resources.ResourceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
=======
import com.smartcampus.dto.resources.ResourceRequestDTO;
import com.smartcampus.dto.resources.ResourceResponseDTO;
import com.smartcampus.model.resources.ResourceStatus;
import com.smartcampus.model.resources.ResourceType;
import com.smartcampus.service.resources.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

>>>>>>> Stashed changes
import java.util.Map;

@RestController
@RequestMapping("/api/resources")
<<<<<<< Updated upstream
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @PostMapping
    public ResponseEntity<ResourceResponseDto> createResource(@Valid @RequestBody ResourceRequestDto requestDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resourceService.createResource(requestDto));
    }

    @GetMapping
    public ResponseEntity<List<ResourceResponseDto>> getAllResources(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(resourceService.getAllResources(name, location, type, capacity, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponseDto> getResourceById(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.getResourceById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResourceResponseDto> updateResource(
            @PathVariable Long id,
            @Valid @RequestBody ResourceRequestDto requestDto
    ) {
        return ResponseEntity.ok(resourceService.updateResource(id, requestDto));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ResourceResponseDto> updateResourceStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request
    ) {
        return ResponseEntity.ok(resourceService.updateResourceStatus(id, request.get("status")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponseDto> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
        return ResponseEntity.ok(new ApiResponseDto("Resource deleted successfully"));
    }

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResourceResponseDto> uploadImage(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file
    ) {
        return ResponseEntity.ok(resourceService.uploadImage(id, file));
    }

    @DeleteMapping("/{resourceId}/images/{imageId}")
    public ResponseEntity<ApiResponseDto> deleteImage(
            @PathVariable Long resourceId,
            @PathVariable Long imageId
    ) {
        resourceService.deleteImage(resourceId, imageId);
        return ResponseEntity.ok(new ApiResponseDto("Image deleted successfully"));
    }
}
=======
@RequiredArgsConstructor
public class ResourceController {
    private final ResourceService resourceService;

    @GetMapping
    public Page<ResourceResponseDTO> list(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        return resourceService.search(type, minCapacity, location, status, q, page, size, sortBy, sortDir);
    }

    @GetMapping("/{id}")
    public ResourceResponseDTO get(@PathVariable Long id) {
        return resourceService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceResponseDTO create(@Valid @RequestBody ResourceRequestDTO dto) {
        return resourceService.create(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceResponseDTO update(@PathVariable Long id, @Valid @RequestBody ResourceRequestDTO dto) {
        return resourceService.update(id, dto);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceResponseDTO updateStatus(@PathVariable Long id, @RequestParam ResourceStatus status) {
        return resourceService.setStatus(id, status);
    }

    @PostMapping("/{id}/image")
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceResponseDTO uploadImage(@PathVariable Long id, @RequestPart("image") MultipartFile image) {
        return resourceService.uploadImage(id, image);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void softDelete(@PathVariable Long id) {
        resourceService.softDelete(id);
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> analytics() {
        return resourceService.analytics();
    }
}
>>>>>>> Stashed changes
