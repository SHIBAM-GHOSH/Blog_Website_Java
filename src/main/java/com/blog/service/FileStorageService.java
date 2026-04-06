package com.blog.service;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Path UPLOAD_DIR = Paths.get("uploads").toAbsolutePath().normalize();

    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        try {
            Files.createDirectories(UPLOAD_DIR);

            String originalFilename = StringUtils.cleanPath(
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : ""
            );
            String extension = StringUtils.getFilenameExtension(originalFilename);
            String fileExtension = StringUtils.hasText(extension) ? "." + extension : "";
            String fileName = UUID.randomUUID() + fileExtension;
            Path filePath = UPLOAD_DIR.resolve(fileName).normalize();

            if (!filePath.startsWith(UPLOAD_DIR)) {
                throw new RuntimeException("Invalid file path.");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
            }

            // Return relative path for frontend access
            return "/uploads/" + fileName;

        } catch (IOException e) {
            throw new RuntimeException("Could not store the uploaded file. Please try another file.", e);
        }
    }

    public void deleteFile(String publicPath) {
        if (!StringUtils.hasText(publicPath)) {
            return;
        }

        String normalizedPath = publicPath.trim().replace('\\', '/');
        if (!normalizedPath.startsWith("/uploads/")) {
            return;
        }

        String fileName = normalizedPath.substring("/uploads/".length());
        if (!StringUtils.hasText(fileName)) {
            return;
        }

        Path filePath = UPLOAD_DIR.resolve(fileName).normalize();
        if (!filePath.startsWith(UPLOAD_DIR)) {
            return;
        }

        try {
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {
            // Ignore cleanup failures so admin actions still complete.
        }
    }
}
