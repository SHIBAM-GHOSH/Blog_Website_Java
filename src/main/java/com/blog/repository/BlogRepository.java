package com.blog.repository;

import com.blog.model.Blog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlogRepository extends JpaRepository<Blog, Long> {
    List<Blog> findByCategoryOrderByCreatedAtDesc(String category);
    List<Blog> findAllByOrderByCreatedAtDesc();
    List<Blog> findByAuthorEmailIgnoreCaseOrderByCreatedAtDesc(String authorEmail);
}
