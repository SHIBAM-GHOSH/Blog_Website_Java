package com.blog.controller;

import com.blog.model.AppUser;
import com.blog.model.Blog;
import com.blog.repository.AppUserRepository;
import com.blog.repository.BlogRepository;
import com.blog.service.AuthService;
import com.blog.service.FileStorageService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final AuthService authService;
    private final AppUserRepository appUserRepository;
    private final BlogRepository blogRepository;
    private final FileStorageService fileStorageService;

    public AdminController(
            AuthService authService,
            AppUserRepository appUserRepository,
            BlogRepository blogRepository,
            FileStorageService fileStorageService) {
        this.authService = authService;
        this.appUserRepository = appUserRepository;
        this.blogRepository = blogRepository;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers(HttpSession session) {
        ResponseEntity<Map<String, String>> forbidden = requireAdmin(session);
        if (forbidden != null) {
            return forbidden;
        }

        Map<String, Long> postCountsByEmail = blogRepository.findAll().stream()
                .filter(blog -> StringUtils.hasText(blog.getAuthorEmail()))
                .collect(Collectors.groupingBy(
                        blog -> authService.normalizeEmail(blog.getAuthorEmail()),
                        LinkedHashMap::new,
                        Collectors.counting()
                ));

        List<Map<String, Object>> users = appUserRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(user -> userBody(user, postCountsByEmail.getOrDefault(authService.normalizeEmail(user.getEmail()), 0L)))
                .toList();

        return ResponseEntity.ok(users);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, HttpSession session) {
        ResponseEntity<Map<String, String>> forbidden = requireAdmin(session);
        if (forbidden != null) {
            return forbidden;
        }

        Optional<AppUser> userOptional = appUserRepository.findById(id);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorBody("Account not found."));
        }

        AppUser targetUser = userOptional.get();
        if (AuthService.ROLE_ADMIN.equalsIgnoreCase(authService.normalizeRole(targetUser.getRole()))) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(errorBody("The admin account cannot be removed from the panel."));
        }

        String currentEmail = authService.getAuthenticatedEmail(session).orElse("");
        if (authService.normalizeEmail(currentEmail).equals(authService.normalizeEmail(targetUser.getEmail()))) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(errorBody("You cannot delete the account you are currently using."));
        }

        deleteBlogsByAuthor(targetUser.getEmail());
        appUserRepository.delete(targetUser);
        return ResponseEntity.ok(successBody("Account removed successfully."));
    }

    @DeleteMapping("/blogs/{id}")
    public ResponseEntity<?> deleteBlog(@PathVariable Long id, HttpSession session) {
        ResponseEntity<Map<String, String>> forbidden = requireAdmin(session);
        if (forbidden != null) {
            return forbidden;
        }

        Optional<Blog> blogOptional = blogRepository.findById(id);
        if (blogOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorBody("Post not found."));
        }

        deleteBlogAssets(blogOptional.get());
        blogRepository.delete(blogOptional.get());
        return ResponseEntity.ok(successBody("Post removed successfully."));
    }

    private void deleteBlogsByAuthor(String authorEmail) {
        if (!StringUtils.hasText(authorEmail)) {
            return;
        }

        List<Blog> blogs = blogRepository.findByAuthorEmailIgnoreCaseOrderByCreatedAtDesc(authorEmail);
        blogs.forEach(this::deleteBlogAssets);
        blogRepository.deleteAll(blogs);
    }

    private void deleteBlogAssets(Blog blog) {
        fileStorageService.deleteFile(blog.getImagePath());
        fileStorageService.deleteFile(blog.getVideoPath());
    }

    private ResponseEntity<Map<String, String>> requireAdmin(HttpSession session) {
        if (!authService.isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(errorBody("Admin access is required for this action."));
        }
        return null;
    }

    private Map<String, Object> userBody(AppUser user, long postCount) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", user.getId());
        body.put("email", user.getEmail());
        body.put("role", authService.normalizeRole(user.getRole()));
        body.put("postCount", postCount);
        body.put("createdAt", user.getCreatedAt());
        return body;
    }

    private Map<String, String> errorBody(String message) {
        Map<String, String> body = new LinkedHashMap<>();
        body.put("message", message);
        return body;
    }

    private Map<String, String> successBody(String message) {
        Map<String, String> body = new LinkedHashMap<>();
        body.put("message", message);
        return body;
    }
}
