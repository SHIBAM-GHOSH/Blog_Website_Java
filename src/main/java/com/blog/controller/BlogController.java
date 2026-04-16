package com.blog.controller;

import com.blog.model.Blog;
import com.blog.service.BlogService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/blogs")
@CrossOrigin(origins = "*")
public class BlogController {

    private final BlogService blogService;

    public BlogController(BlogService blogService) {
        this.blogService = blogService;
    }

    @GetMapping
    public List<Blog> getBlogs() {
        return blogService.getBlogs();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBlogById(@PathVariable Long id) {
        Blog blog = blogService.getBlogById(id);
        if (blog == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(messageBody("Blog post not found."));
        }

        return ResponseEntity.ok(blog);
    }

    @PostMapping
    public ResponseEntity<?> createBlog(@RequestBody BlogRequest request) {
        String error = validate(request);
        if (error != null) {
            return ResponseEntity.badRequest().body(messageBody(error));
        }

        return ResponseEntity.ok(blogService.createBlog(request.title(), request.content()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBlog(@PathVariable Long id, @RequestBody BlogRequest request) {
        String error = validate(request);
        if (error != null) {
            return ResponseEntity.badRequest().body(messageBody(error));
        }

        Blog updatedBlog = blogService.updateBlog(id, request.title(), request.content());
        if (updatedBlog == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(messageBody("Blog post not found."));
        }

        return ResponseEntity.ok(updatedBlog);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBlog(@PathVariable Long id) {
        if (!blogService.deleteBlog(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(messageBody("Blog post not found."));
        }

        return ResponseEntity.ok(messageBody("Post deleted successfully."));
    }

    // Keep request validation close to the API input.
    private String validate(BlogRequest request) {
        if (request == null) {
            return "Request body is missing.";
        }
        if (!StringUtils.hasText(request.title()) || !StringUtils.hasText(request.content())) {
            return "Title and content are required.";
        }
        return null;
    }

    private Map<String, String> messageBody(String message) {
        Map<String, String> body = new LinkedHashMap<>();
        body.put("message", message);
        return body;
    }

    // This record stores the JSON body from the frontend.
    private record BlogRequest(String title, String content) {
    }
}
