package com.smartcampus.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {
    public List<String> storeTicketImages(MultipartFile[] files) {
        if (files == null || files.length == 0) {
            return List.of();
        }
        if (files.length > 3) {
            throw new IllegalArgumentException("Maximum 3 image attachments are allowed");
        }

        try {
            Path uploadDir = Path.of("uploads", "tickets");
            Files.createDirectories(uploadDir);
            List<String> saved = new ArrayList<>();
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) {
                    continue;
                }
                String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
                String safeName = UUID.randomUUID() + "-" + original.replaceAll("[^a-zA-Z0-9._-]", "_");
                Path target = uploadDir.resolve(safeName);
                Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
                saved.add(target.toString().replace("\\", "/"));
            }
            return saved;
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to store ticket attachments");
        }
    }
}
