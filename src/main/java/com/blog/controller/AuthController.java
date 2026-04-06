package com.blog.controller;

import com.blog.model.AppUser;
import com.blog.service.AuthService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Pattern SIMPLE_EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/session")
    public Map<String, Object> getSession(HttpSession session) {
        return authService.getAuthenticatedUser(session)
                .<Map<String, Object>>map(user -> sessionBody(true, user.getEmail(), authService.normalizeRole(user.getRole())))
                .orElseGet(() -> sessionBody(false, null, authService.normalizeRole(null)));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest request, HttpSession session) {
        String validationError = validateRequest(request);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(errorBody(validationError));
        }

        try {
            AppUser appUser = authService.register(request.email(), request.password(), session);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(sessionBody(true, appUser.getEmail(), authService.normalizeRole(appUser.getRole())));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorBody(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorBody("Could not create your account right now. Please try again."));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request, HttpSession session) {
        String validationError = validateRequest(request);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(errorBody(validationError));
        }

        try {
            AppUser appUser = authService.login(request.email(), request.password(), session);
            return ResponseEntity.ok(sessionBody(true, appUser.getEmail(), authService.normalizeRole(appUser.getRole())));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorBody(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorBody("Could not sign you in right now. Please try again."));
        }
    }

    @PostMapping("/logout")
    public Map<String, Object> logout(HttpSession session) {
        authService.logout(session);
        return sessionBody(false, null, authService.normalizeRole(null));
    }

    private String validateRequest(AuthRequest request) {
        if (request == null) {
            return "Request body is missing.";
        }
        if (!StringUtils.hasText(request.email()) || !SIMPLE_EMAIL_PATTERN.matcher(request.email().trim()).matches()) {
            return "Please enter a valid email address.";
        }
        if (!StringUtils.hasText(request.password()) || request.password().trim().length() < 6) {
            return "Password must be at least 6 characters long.";
        }
        return null;
    }

    private Map<String, Object> errorBody(String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", message);
        body.put("authenticated", false);
        return body;
    }

    private Map<String, Object> sessionBody(boolean authenticated, String email, String role) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("authenticated", authenticated);
        body.put("email", email);
        body.put("role", role);
        body.put("isAdmin", authenticated && AuthService.ROLE_ADMIN.equalsIgnoreCase(role));
        return body;
    }

    public record AuthRequest(String email, String password) {
    }
}
