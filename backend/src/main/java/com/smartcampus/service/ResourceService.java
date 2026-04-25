package com.smartcampus.service;

import com.smartcampus.dto.*;
import com.smartcampus.model.*;
import com.smartcampus.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository repo;

    public ResourceResponseDTO create(ResourceRequestDTO dto) {
        Resource saved = repo.save(toEntity(null, dto));
        return toResponse(saved);
    }

    public List<ResourceResponseDTO> search(ResourceType type, Integer minCap, String location, String status, String q) {
        return repo.search(type, minCap, location, status, q)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ResourceResponseDTO getById(Long id) {
        Resource r = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found: " + id));
        return toResponse(r);
    }

    public ResourceResponseDTO update(Long id, ResourceRequestDTO dto) {
        Resource existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found: " + id));

        Resource updated = toEntity(existing.getId(), dto);
        updated.setId(existing.getId());

        return toResponse(repo.save(updated));
    }

    // ✅ SOFT DELETE
    public void delete(Long id) {
        Resource existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found: " + id));

        existing.setStatus("INACTIVE");
        repo.save(existing);
    }

    private Resource toEntity(Long id, ResourceRequestDTO dto) {
        Resource r = new Resource();
        r.setId(id);
        r.setName(dto.getName());
        r.setType(dto.getType());
        r.setCapacity(dto.getCapacity());
        r.setLocation(dto.getLocation());
        r.setStatus(dto.getStatus());
        r.setAvailabilityWindows(dto.getAvailabilityWindows());
        return r;
    }

    private ResourceResponseDTO toResponse(Resource r) {
        return ResourceResponseDTO.builder()
                .id(r.getId())
                .name(r.getName())
                .type(r.getType())
                .capacity(r.getCapacity())
                .location(r.getLocation())
                .status(r.getStatus())
                .availabilityWindows(r.getAvailabilityWindows())
                .build();
    }
}