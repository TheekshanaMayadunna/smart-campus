package com.smartcampus.controller.resources;

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
import java.util.Map;

@RestController
@RequestMapping("/api/resources")
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