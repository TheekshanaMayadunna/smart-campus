package com.smartcampus.service;

import com.smartcampus.config.MaintenanceAndTickets.MaintenanceTicketsProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {
    private final MaintenanceTicketsProperties maintenanceTicketsProperties;
    private static final Map<String, String> MIME_TO_EXTENSION = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    public List<StoredFile> storeTicketFiles(Long ticketId, MultipartFile[] files, int existingAttachmentCount) {
        if (files == null || files.length == 0) {
            return List.of();
        }
        if (files.length > maintenanceTicketsProperties.getMaxAttachments()) {
            throw new IllegalArgumentException("Maximum " + maintenanceTicketsProperties.getMaxAttachments() + " image attachments are allowed");
        }
        if (existingAttachmentCount + files.length > maintenanceTicketsProperties.getMaxAttachments()) {
            int remaining = Math.max(0, maintenanceTicketsProperties.getMaxAttachments() - existingAttachmentCount);
            throw new IllegalArgumentException("This ticket can accept only " + remaining + " more attachment(s)");
        }

        try {
            Path baseUploadDir = Path.of(maintenanceTicketsProperties.getUploadDir()).toAbsolutePath().normalize();
            Path uploadDir = baseUploadDir.resolve(String.valueOf(ticketId)).normalize();
            if (!uploadDir.startsWith(baseUploadDir)) {
                throw new IllegalArgumentException("Invalid upload path");
            }
            Files.createDirectories(uploadDir);
            List<StoredFile> saved = new ArrayList<>();
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) {
                    continue;
                }
                ValidatedTicketImage validated = validateTicketImage(file);
                String safeName = UUID.randomUUID() + validated.extension();
                Path target = uploadDir.resolve(safeName);
                if (!target.normalize().startsWith(baseUploadDir)) {
                    throw new IllegalArgumentException("Invalid upload target");
                }
                Files.copy(new ByteArrayInputStream(validated.bytes()), target, StandardCopyOption.REPLACE_EXISTING);
                saved.add(new StoredFile(
                        validated.originalFileName(),
                        safeName,
                        maintenanceTicketsProperties.getUploadDir().replace("\\", "/") + "/" + ticketId + "/" + safeName,
                        validated.mimeType(),
                        validated.bytes().length
                ));
            }
            return saved;
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to store ticket attachments");
        }
    }

    public String storeResourceImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Resource image is required");
        }
        try {
            Path uploadDir = Path.of("uploads", "resources");
            Files.createDirectories(uploadDir);
            String original = file.getOriginalFilename() == null ? "image" : file.getOriginalFilename();
            String safeName = UUID.randomUUID() + "-" + original.replaceAll("[^a-zA-Z0-9._-]", "_");
            Path target = uploadDir.resolve(safeName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return target.toString().replace("\\", "/");
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to store resource image");
        }
    }

    public record StoredFile(
            String originalFileName,
            String storedFileName,
            String filePath,
            String contentType,
            long fileSize
    ) {
    }

    private ValidatedTicketImage validateTicketImage(MultipartFile file) throws IOException {
        String originalFileName = sanitizeOriginalFilename(file.getOriginalFilename());
        String extension = extractExtension(originalFileName);
        if (file.getSize() > maintenanceTicketsProperties.getMaxAttachmentSizeBytes()) {
            throw new IllegalArgumentException("Each attachment must be 5 MB or smaller");
        }
        byte[] bytes = file.getBytes();
        if (bytes.length == 0) {
            throw new IllegalArgumentException("Attachment file is empty");
        }
        String detectedMimeType = detectMimeType(bytes);
        if (!MIME_TO_EXTENSION.containsKey(detectedMimeType)) {
            throw new IllegalArgumentException("Only JPEG, PNG, and WEBP images are allowed");
        }
        String declaredMimeType = file.getContentType();
        if (declaredMimeType == null || !declaredMimeType.equalsIgnoreCase(detectedMimeType)) {
            throw new IllegalArgumentException("Attachment content type does not match the uploaded file");
        }
        if (!isAllowedExtensionForMime(extension, detectedMimeType)) {
            throw new IllegalArgumentException("Attachment file extension does not match the uploaded file");
        }
        return new ValidatedTicketImage(
                originalFileName,
                detectedMimeType,
                MIME_TO_EXTENSION.get(detectedMimeType),
                bytes
        );
    }

    private String detectMimeType(byte[] bytes) {
        if (isJpeg(bytes)) {
            return "image/jpeg";
        }
        if (isPng(bytes)) {
            return "image/png";
        }
        if (isWebp(bytes)) {
            return "image/webp";
        }
        return "application/octet-stream";
    }

    private boolean isAllowedExtensionForMime(String extension, String mimeType) {
        if (extension == null || extension.isBlank()) {
            return false;
        }
        String normalized = extension.toLowerCase(Locale.ROOT);
        return switch (mimeType) {
            case "image/jpeg" -> normalized.equals(".jpg") || normalized.equals(".jpeg");
            case "image/png" -> normalized.equals(".png");
            case "image/webp" -> normalized.equals(".webp");
            default -> false;
        };
    }

    private String sanitizeOriginalFilename(String value) {
        String original = value == null || value.isBlank() ? "image" : value;
        String normalized = Path.of(original).getFileName().toString().replace("\\", "/");
        if (normalized.contains("..")) {
            throw new IllegalArgumentException("Invalid attachment filename");
        }
        return normalized.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private String extractExtension(String fileName) {
        int index = fileName.lastIndexOf('.');
        if (index < 0 || index == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(index).toLowerCase(Locale.ROOT);
    }

    private boolean isJpeg(byte[] bytes) {
        return bytes.length >= 3
                && (bytes[0] & 0xFF) == 0xFF
                && (bytes[1] & 0xFF) == 0xD8
                && (bytes[2] & 0xFF) == 0xFF;
    }

    private boolean isPng(byte[] bytes) {
        byte[] signature = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        return bytes.length >= signature.length && Arrays.equals(Arrays.copyOf(bytes, signature.length), signature);
    }

    private boolean isWebp(byte[] bytes) {
        if (bytes.length < 12) {
            return false;
        }
        return bytes[0] == 'R'
                && bytes[1] == 'I'
                && bytes[2] == 'F'
                && bytes[3] == 'F'
                && bytes[8] == 'W'
                && bytes[9] == 'E'
                && bytes[10] == 'B'
                && bytes[11] == 'P';
    }

    private record ValidatedTicketImage(
            String originalFileName,
            String mimeType,
            String extension,
            byte[] bytes
    ) {
    }
}
