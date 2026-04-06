package com.blog.service;

import com.blog.model.AppUser;
import com.blog.repository.AppUserRepository;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.Optional;

@Service
public class AuthService {

    public static final String SESSION_USER_EMAIL = "authenticatedUserEmail";
    public static final String SESSION_USER_ROLE = "authenticatedUserRole";
    public static final String ROLE_USER = "USER";
    public static final String ROLE_ADMIN = "ADMIN";

    private final AppUserRepository appUserRepository;
    private final PasswordService passwordService;
    private final String adminEmail;
    private final String adminPassword;

    public AuthService(
            AppUserRepository appUserRepository,
            PasswordService passwordService,
            @Value("${app.admin.email:admin@stellarblogs.local}") String adminEmail,
            @Value("${app.admin.password:Admin@12345}") String adminPassword) {
        this.appUserRepository = appUserRepository;
        this.passwordService = passwordService;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @PostConstruct
    public void ensureAdminAccountExists() {
        String normalizedAdminEmail = normalizeEmail(adminEmail);
        if (!StringUtils.hasText(normalizedAdminEmail) || !StringUtils.hasText(adminPassword)) {
            return;
        }

        Optional<AppUser> existingAdmin = appUserRepository.findByEmailIgnoreCase(normalizedAdminEmail);
        if (existingAdmin.isPresent()) {
            AppUser adminUser = existingAdmin.get();
            if (!ROLE_ADMIN.equalsIgnoreCase(normalizeRole(adminUser.getRole()))) {
                adminUser.setRole(ROLE_ADMIN);
                appUserRepository.save(adminUser);
            }
            return;
        }

        AppUser adminUser = new AppUser();
        adminUser.setEmail(normalizedAdminEmail);
        adminUser.setPasswordHash(passwordService.hashPassword(adminPassword));
        adminUser.setRole(ROLE_ADMIN);
        appUserRepository.save(adminUser);
    }

    public AppUser register(String email, String password, HttpSession session) {
        String normalizedEmail = normalizeEmail(email);

        if (appUserRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        AppUser appUser = new AppUser();
        appUser.setEmail(normalizedEmail);
        appUser.setPasswordHash(passwordService.hashPassword(password));
        appUser.setRole(ROLE_USER);

        AppUser savedUser = appUserRepository.save(appUser);
        setSessionUser(session, savedUser);
        return savedUser;
    }

    public AppUser login(String email, String password, HttpSession session) {
        String normalizedEmail = normalizeEmail(email);
        AppUser appUser = appUserRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

        if (!passwordService.matches(password, appUser.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        setSessionUser(session, appUser);
        return appUser;
    }

    public void logout(HttpSession session) {
        session.removeAttribute(SESSION_USER_EMAIL);
        session.removeAttribute(SESSION_USER_ROLE);
    }

    public Optional<String> getAuthenticatedEmail(HttpSession session) {
        return getAuthenticatedUser(session).map(AppUser::getEmail);
    }

    public Optional<AppUser> getAuthenticatedUser(HttpSession session) {
        Object email = session.getAttribute(SESSION_USER_EMAIL);
        if (!(email instanceof String emailValue) || emailValue.isBlank()) {
            return Optional.empty();
        }
        return appUserRepository.findByEmailIgnoreCase(emailValue);
    }

    public String getAuthenticatedRole(HttpSession session) {
        Object role = session.getAttribute(SESSION_USER_ROLE);
        if (role instanceof String roleValue && StringUtils.hasText(roleValue)) {
            return normalizeRole(roleValue);
        }
        return getAuthenticatedUser(session)
                .map(user -> normalizeRole(user.getRole()))
                .orElse(ROLE_USER);
    }

    public boolean isAdmin(HttpSession session) {
        return ROLE_ADMIN.equalsIgnoreCase(getAuthenticatedRole(session));
    }

    public String normalizeRole(String role) {
        return ROLE_ADMIN.equalsIgnoreCase(role) ? ROLE_ADMIN : ROLE_USER;
    }

    public String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private void setSessionUser(HttpSession session, AppUser appUser) {
        session.setAttribute(SESSION_USER_EMAIL, appUser.getEmail());
        session.setAttribute(SESSION_USER_ROLE, normalizeRole(appUser.getRole()));
    }
}
