package com.blog.service;

import com.blog.model.Blog;
import com.blog.repository.BlogRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BlogService {

    private final BlogRepository blogRepository;

    public BlogService(BlogRepository blogRepository) {
        this.blogRepository = blogRepository;
    }

    public List<Blog> getBlogs() {
        return blogRepository.findAllByOrderByCreatedAtDesc();
    }

    public Blog getBlogById(Long id) {
        return blogRepository.findById(id).orElse(null);
    }

    public Blog createBlog(String title, String content) {
        return saveBlog(new Blog(), title, content);
    }

    public Blog updateBlog(Long id, String title, String content) {
        Blog blog = getBlogById(id);
        if (blog == null) {
            return null;
        }

        return saveBlog(blog, title, content);
    }

    public boolean deleteBlog(Long id) {
        Blog blog = getBlogById(id);
        if (blog == null) {
            return false;
        }

        blogRepository.delete(blog);
        return true;
    }

    // Copy request values into the entity before saving.
    private Blog saveBlog(Blog blog, String title, String content) {
        blog.setTitle(title.trim());
        blog.setContent(content.trim());
        return blogRepository.save(blog);
    }
}
