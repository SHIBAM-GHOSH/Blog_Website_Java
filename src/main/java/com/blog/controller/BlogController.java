package com.blog.controller;

import com.blog.model.Blog;
import com.blog.repository.BlogRepository;
import com.blog.service.AuthService;
import com.blog.service.FileStorageService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/blogs")
@CrossOrigin(origins = "*")
public class BlogController {

    private final BlogRepository blogRepository;
    private final FileStorageService fileStorageService;
    private final AuthService authService;
    private final ObjectMapper objectMapper;

    public BlogController(
            BlogRepository blogRepository,
            FileStorageService fileStorageService,
            AuthService authService,
            ObjectMapper objectMapper) {
        this.blogRepository = blogRepository;
        this.fileStorageService = fileStorageService;
        this.authService = authService;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public List<Blog> getBlogs(@RequestParam(required = false) String category) {
        if (StringUtils.hasText(category) && !category.equalsIgnoreCase("all")) {
            return blogRepository.findByCategoryOrderByCreatedAtDesc(category);
        }
        return blogRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBlogById(@PathVariable Long id) {
        return blogRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorBody("Blog post not found.")));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createBlog(
            @RequestParam("title") String title,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam("category") String category,
            @RequestParam(value = "blocks", required = false) String blocksJson,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestPart(value = "video", required = false) MultipartFile video,
            @RequestPart(value = "inlineImages", required = false) List<MultipartFile> inlineImages,
            HttpSession session) {

        String authenticatedEmail = authService.getAuthenticatedEmail(session).orElse(null);
        if (authenticatedEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(errorBody("Please sign in with an account to create a post."));
        }

        try {
            Blog blog = new Blog();
            blog.setAuthorEmail(authenticatedEmail);
            return saveBlog(blog, title, content, category, blocksJson, image, video, inlineImages);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorBody("Could not save this post right now."));
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateBlog(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam("category") String category,
            @RequestParam(value = "blocks", required = false) String blocksJson,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestPart(value = "video", required = false) MultipartFile video,
            @RequestPart(value = "inlineImages", required = false) List<MultipartFile> inlineImages,
            HttpSession session) {

        String authenticatedEmail = authService.getAuthenticatedEmail(session).orElse(null);
        if (authenticatedEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(errorBody("Please sign in with an account to edit a post."));
        }

        Optional<Blog> blogOptional = blogRepository.findById(id);
        if (blogOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(errorBody("Blog post not found."));
        }

        Blog blog = blogOptional.get();
        if (!canManageBlog(blog, authenticatedEmail, session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(errorBody("You can only edit your own posts."));
        }

        try {
            return saveBlog(blog, title, content, category, blocksJson, image, video, inlineImages);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorBody("Could not update this post right now."));
        }
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleMaxUploadSizeExceeded() {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(errorBody("The selected file is too large. Please choose a smaller image or video."));
    }

    private ResponseEntity<?> saveBlog(
            Blog blog,
            String title,
            String content,
            String category,
            String blocksJson,
            MultipartFile image,
            MultipartFile video,
            List<MultipartFile> inlineImages) {

        if (!StringUtils.hasText(title) || !StringUtils.hasText(category)) {
            throw new IllegalArgumentException("Title and category are required.");
        }

        List<ContentBlockInput> inputBlocks = parseInputBlocks(blocksJson, content);
        List<Map<String, String>> normalizedBlocks = normalizeBlocks(inputBlocks, inlineImages);
        String plainText = buildPlainText(normalizedBlocks);
        if (!StringUtils.hasText(plainText)) {
            throw new IllegalArgumentException("Please add at least one paragraph to the post.");
        }

        Set<String> oldInlinePaths = extractImagePaths(blog.getContentBlocksJson());
        Set<String> newInlinePaths = extractImagePaths(normalizedBlocks);

        String oldImagePath = blog.getImagePath();
        String oldVideoPath = blog.getVideoPath();

        String coverImagePath = resolveCoverImagePath(oldImagePath, image);
        String updatedVideoPath = resolveVideoPath(oldVideoPath, video);
        String previewImagePath = StringUtils.hasText(coverImagePath)
                ? coverImagePath
                : newInlinePaths.stream().findFirst().orElse(null);

        blog.setTitle(title.trim());
        blog.setCategory(category.trim());
        blog.setContent(plainText);
        blog.setContentBlocksJson(writeBlocksJson(normalizedBlocks));
        blog.setImagePath(previewImagePath);
        blog.setVideoPath(updatedVideoPath);

        Blog savedBlog = blogRepository.save(blog);
        cleanupRemovedMedia(oldImagePath, oldVideoPath, oldInlinePaths, coverImagePath, updatedVideoPath, newInlinePaths);
        return ResponseEntity.ok(savedBlog);
    }

    private boolean canManageBlog(Blog blog, String authenticatedEmail, HttpSession session) {
        if (authService.isAdmin(session)) {
            return true;
        }
        return StringUtils.hasText(blog.getAuthorEmail())
                && authService.normalizeEmail(blog.getAuthorEmail()).equals(authService.normalizeEmail(authenticatedEmail));
    }

    private List<ContentBlockInput> parseInputBlocks(String blocksJson, String content) {
        if (StringUtils.hasText(blocksJson)) {
            try {
                List<ContentBlockInput> parsedBlocks = objectMapper.readValue(
                        blocksJson,
                        new TypeReference<List<ContentBlockInput>>() { }
                );
                return parsedBlocks == null ? List.of() : parsedBlocks;
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("The post layout could not be understood.");
            }
        }

        List<ContentBlockInput> derivedBlocks = new ArrayList<>();
        if (StringUtils.hasText(content)) {
            String[] paragraphs = content.split("\\n\\s*\\n");
            for (String paragraph : paragraphs) {
                if (StringUtils.hasText(paragraph)) {
                    derivedBlocks.add(new ContentBlockInput("paragraph", paragraph.trim(), null, null));
                }
            }
        }
        return derivedBlocks;
    }

    private List<Map<String, String>> normalizeBlocks(List<ContentBlockInput> inputBlocks, List<MultipartFile> inlineImages) {
        List<Map<String, String>> normalizedBlocks = new ArrayList<>();
        List<MultipartFile> uploadFiles = inlineImages == null ? List.of() : inlineImages;

        for (ContentBlockInput block : inputBlocks) {
            if (block == null || !StringUtils.hasText(block.type())) {
                continue;
            }

            String blockType = block.type().trim().toLowerCase();
            if ("paragraph".equals(blockType)) {
                if (!StringUtils.hasText(block.text())) {
                    continue;
                }
                Map<String, String> paragraphBlock = new LinkedHashMap<>();
                paragraphBlock.put("type", "paragraph");
                paragraphBlock.put("text", block.text().trim());
                normalizedBlocks.add(paragraphBlock);
                continue;
            }

            if ("image".equals(blockType)) {
                String imagePath = null;

                if (block.fileIndex() != null) {
                    int fileIndex = block.fileIndex();
                    if (fileIndex < 0 || fileIndex >= uploadFiles.size()) {
                        throw new IllegalArgumentException("One of the inline images could not be processed.");
                    }
                    MultipartFile imageFile = uploadFiles.get(fileIndex);
                    if (imageFile == null || imageFile.isEmpty()) {
                        continue;
                    }
                    imagePath = fileStorageService.storeFile(imageFile);
                } else if (StringUtils.hasText(block.path())) {
                    imagePath = block.path().trim();
                }

                if (!StringUtils.hasText(imagePath)) {
                    continue;
                }

                Map<String, String> imageBlock = new LinkedHashMap<>();
                imageBlock.put("type", "image");
                imageBlock.put("path", imagePath);
                normalizedBlocks.add(imageBlock);
            }
        }

        return normalizedBlocks;
    }

    private String buildPlainText(List<Map<String, String>> blocks) {
        List<String> paragraphs = new ArrayList<>();
        for (Map<String, String> block : blocks) {
            if ("paragraph".equals(block.get("type")) && StringUtils.hasText(block.get("text"))) {
                paragraphs.add(block.get("text").trim());
            }
        }
        return String.join("\n\n", paragraphs).trim();
    }

    private String resolveCoverImagePath(String existingImagePath, MultipartFile image) {
        if (image != null && !image.isEmpty()) {
            return fileStorageService.storeFile(image);
        }
        return existingImagePath;
    }

    private String resolveVideoPath(String existingVideoPath, MultipartFile video) {
        if (video != null && !video.isEmpty()) {
            return fileStorageService.storeFile(video);
        }
        return existingVideoPath;
    }

    private String writeBlocksJson(List<Map<String, String>> blocks) {
        try {
            return objectMapper.writeValueAsString(blocks);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("The post layout could not be saved.");
        }
    }

    private Set<String> extractImagePaths(String blocksJson) {
        if (!StringUtils.hasText(blocksJson)) {
            return Set.of();
        }

        try {
            List<Map<String, String>> parsedBlocks = objectMapper.readValue(
                    blocksJson,
                    new TypeReference<List<Map<String, String>>>() { }
            );
            return extractImagePaths(parsedBlocks);
        } catch (JsonProcessingException e) {
            return Set.of();
        }
    }

    private Set<String> extractImagePaths(List<Map<String, String>> blocks) {
        Set<String> imagePaths = new LinkedHashSet<>();
        for (Map<String, String> block : blocks) {
            if ("image".equals(block.get("type")) && StringUtils.hasText(block.get("path"))) {
                imagePaths.add(block.get("path").trim());
            }
        }
        return imagePaths;
    }

    private void cleanupRemovedMedia(
            String oldImagePath,
            String oldVideoPath,
            Set<String> oldInlinePaths,
            String newCoverImagePath,
            String newVideoPath,
            Set<String> newInlinePaths) {

        if (StringUtils.hasText(oldVideoPath) && !oldVideoPath.equals(newVideoPath)) {
            fileStorageService.deleteFile(oldVideoPath);
        }

        if (StringUtils.hasText(oldImagePath)
                && !oldImagePath.equals(newCoverImagePath)
                && !newInlinePaths.contains(oldImagePath)) {
            fileStorageService.deleteFile(oldImagePath);
        }

        for (String oldInlinePath : oldInlinePaths) {
            if (!newInlinePaths.contains(oldInlinePath) && !oldInlinePath.equals(newCoverImagePath)) {
                fileStorageService.deleteFile(oldInlinePath);
            }
        }
    }

    private Map<String, String> errorBody(String message) {
        Map<String, String> body = new LinkedHashMap<>();
        body.put("message", message);
        return body;
    }

    private record ContentBlockInput(String type, String text, String path, Integer fileIndex) {
    }
}
