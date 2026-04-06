document.addEventListener("DOMContentLoaded", () => {
    const $ = (id) => document.getElementById(id);

    const body = document.body;
    const darkModeToggle = $("darkModeToggle");
    const moonIcon = document.querySelector(".moon-icon");
    const sunIcon = document.querySelector(".sun-icon");
    const themeText = document.querySelector(".theme-text");

    const authGate = $("authGate");
    const authForm = $("authForm");
    const authEmail = $("authEmail");
    const authPassword = $("authPassword");
    const authSubmitBtn = $("authSubmitBtn");
    const authMessage = $("authMessage");
    const loginModeBtn = $("loginModeBtn");
    const registerModeBtn = $("registerModeBtn");
    const continueGuestBtn = $("continueGuestBtn");
    const googleSignInBtn = $("googleSignInBtn");
    const userStateBadge = $("userStateBadge");
    const adminPanelBtn = $("adminPanelBtn");
    const logoutBtn = $("logoutBtn");

    const homeView = $("homeView");
    const detailView = $("blogDetailView");
    const navHome = $("navHome");
    const backToHomeBtn = $("backToHomeBtn");
    const viewAllPostsBtn = $("viewAllPostsBtn");

    const spotlightCard = $("spotlightCard");
    const categoryOverview = $("categoryOverview");
    const blogFeed = $("blogFeed");
    const mediaShowcase = $("mediaShowcase");
    const activeFilterLabel = $("activeFilterLabel");
    const totalPostsCount = $("totalPostsCount");
    const categoryCount = $("categoryCount");
    const mediaCount = $("mediaCount");
    const tabs = Array.from(document.querySelectorAll(".tab-item"));

    const detailHero = $("detailHero");
    const detailHeroCategory = $("detailHeroCategory");
    const detailHeroTitle = $("detailHeroTitle");
    const detailHeroMeta = $("detailHeroMeta");
    const detailIntroText = $("detailIntroText");
    const detailSections = $("detailSections");
    const detailLikeCount = $("detailLikeCount");
    const detailViewCount = $("detailViewCount");
    const detailShareCount = $("detailShareCount");
    const detailPublishDate = $("detailPublishDate");
    const detailCategory = $("detailCategory");
    const detailReadingTime = $("detailReadingTime");
    const detailAuthor = $("detailAuthor");
    const detailToc = $("detailToc");
    const relatedPosts = $("relatedPosts");
    const detailOwnerActions = $("detailOwnerActions");
    const detailEditBtn = $("detailEditBtn");

    const createPostModal = $("createPostModal");
    const navCreate = $("navCreate");
    const ctaCreateBtn = $("ctaCreateBtn");
    const detailCreateBtn = $("detailCreateBtn");
    const closeModalBtn = $("closeModalBtn");
    const createPostForm = $("createPostForm");
    const postModalEyebrow = $("postModalEyebrow");
    const postModalTitle = $("postModalTitle");
    const editingPostId = $("editingPostId");
    const postTitle = $("postTitle");
    const postCategory = $("postCategory");
    const postSummary = $("postSummary");
    const postImage = $("postImage");
    const postVideo = $("postVideo");
    const currentCoverImageNote = $("currentCoverImageNote");
    const currentVideoNote = $("currentVideoNote");
    const addParagraphBlockBtn = $("addParagraphBlockBtn");
    const addImageBlockBtn = $("addImageBlockBtn");
    const editorBlocks = $("editorBlocks");
    const fileNamesDiv = $("file-names");
    const submitBtn = $("submitBtn");
    const spinner = submitBtn.querySelector(".spinner");
    const submitLabel = submitBtn.querySelector(".submit-label");

    const adminPanelModal = $("adminPanelModal");
    const closeAdminModalBtn = $("closeAdminModalBtn");
    const adminPanelMessage = $("adminPanelMessage");
    const adminUsersList = $("adminUsersList");
    const adminPostsList = $("adminPostsList");

    const GUEST_MODE_KEY = "blogGuestMode";
    const BLOG_HASH_PREFIX = "#blog-";

    let allBlogs = [];
    let activeCategory = "all";
    let authMode = "login";
    let currentDetailBlogId = null;
    let authState = {
        authenticated: false,
        isGuest: false,
        email: null,
        role: "USER",
        isAdmin: false
    };

    const escapeHTML = (value) => {
        if (!value) return "";
        const element = document.createElement("div");
        element.innerText = value;
        return element.innerHTML;
    };

    const normalizeEmail = (value) => (value || "").trim().toLowerCase();

    const formatDate = (value) => new Date(value).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric"
    });

    const wordCount = (text) => (text || "").trim().split(/\s+/).filter(Boolean).length;
    const readingTime = (text) => `${Math.max(1, Math.ceil(wordCount(text) / 180))} Min`;

    const getExcerpt = (content, maxLength = 160) => {
        if (!content) return "";
        return content.length <= maxLength ? content : `${content.slice(0, maxLength).trim()}...`;
    };

    function parseContentBlocks(blog) {
        if (blog && typeof blog.contentBlocksJson === "string" && blog.contentBlocksJson.trim()) {
            try {
                const parsed = JSON.parse(blog.contentBlocksJson);
                if (Array.isArray(parsed)) {
                    return parsed.filter((block) => block && (block.type === "paragraph" || block.type === "image"));
                }
            } catch (error) {
                console.error(error);
            }
        }

        const fallbackBlocks = [];
        const paragraphs = (blog?.content || "")
            .split(/\n\s*\n/)
            .map((part) => part.trim())
            .filter(Boolean);

        paragraphs.forEach((paragraph) => {
            fallbackBlocks.push({ type: "paragraph", text: paragraph });
        });

        return fallbackBlocks;
    }

    function getPlainText(blog) {
        const blocks = parseContentBlocks(blog);
        const text = blocks
            .filter((block) => block.type === "paragraph" && block.text)
            .map((block) => block.text.trim())
            .filter(Boolean)
            .join("\n\n")
            .trim();

        return text || blog.content || "";
    }

    function getParagraphBlocks(blog) {
        return parseContentBlocks(blog).filter((block) => block.type === "paragraph" && block.text);
    }

    function getPreviewImage(blog) {
        if (blog.imagePath) return blog.imagePath;
        const imageBlock = parseContentBlocks(blog).find((block) => block.type === "image" && block.path);
        return imageBlock ? imageBlock.path : "";
    }

    function withMedia(blog) {
        return Boolean(getPreviewImage(blog) || blog.videoPath);
    }

    function getAuthorLabel(blog) {
        return blog.authorEmail || "Community post";
    }

    function canEditBlog(blog) {
        if (!authState.authenticated || !blog) return false;
        if (authState.isAdmin) return true;
        return normalizeEmail(blog.authorEmail) === normalizeEmail(authState.email);
    }

    function setTheme(theme) {
        const isDark = theme === "dark";
        body.classList.toggle("dark-mode", isDark);
        moonIcon.classList.toggle("hide", isDark);
        sunIcon.classList.toggle("hide", !isDark);
        themeText.textContent = isDark ? "Light Mode" : "Dark Mode";
        localStorage.setItem("theme", isDark ? "dark" : "light");
    }

    function setAuthMessage(message, tone = "") {
        authMessage.textContent = message;
        authMessage.classList.remove("error", "success");
        if (tone) authMessage.classList.add(tone);
    }

    function setAdminMessage(message, tone = "") {
        adminPanelMessage.textContent = message;
        adminPanelMessage.classList.remove("error", "success");
        if (tone) adminPanelMessage.classList.add(tone);
    }

    function setAuthMode(mode) {
        authMode = mode;
        const isLogin = mode === "login";
        loginModeBtn.classList.toggle("active", isLogin);
        registerModeBtn.classList.toggle("active", !isLogin);
        authSubmitBtn.textContent = isLogin ? "Login" : "Create Account";
        setAuthMessage(isLogin
            ? "Use your account to create posts, or continue as guest to browse."
            : "Create a new account to unlock posting.");
    }

    function openAuthGate(message = "") {
        authGate.classList.remove("hide");
        if (message) setAuthMessage(message, "error");
    }

    function closeAuthGate() {
        authGate.classList.add("hide");
    }

    function closeAdminPanel() {
        adminPanelModal.classList.add("hide");
    }

    function updateAuthUI() {
        const canPost = authState.authenticated;

        if (canPost) {
            closeAuthGate();
            userStateBadge.textContent = authState.isAdmin ? `${authState.email} (Admin)` : authState.email;
            logoutBtn.classList.remove("hide");
            adminPanelBtn.classList.toggle("hide", !authState.isAdmin);
            [navCreate, ctaCreateBtn, detailCreateBtn].forEach((button) => {
                button.classList.remove("is-locked");
                button.textContent = button === navCreate ? "Create Post" : "Create a Post";
            });
        } else {
            if (authState.isGuest) {
                closeAuthGate();
                userStateBadge.textContent = "Guest Viewer";
            } else {
                openAuthGate();
                userStateBadge.textContent = "Sign in required";
            }
            logoutBtn.classList.add("hide");
            adminPanelBtn.classList.add("hide");
            [navCreate, ctaCreateBtn, detailCreateBtn].forEach((button) => {
                button.classList.add("is-locked");
                button.textContent = button === navCreate ? "Sign In to Post" : "Sign In to Create";
            });
        }

        if (!authState.isAdmin) closeAdminPanel();
        updateDetailOwnerActions();
    }

    function showHomeView() {
        currentDetailBlogId = null;
        homeView.classList.remove("hide");
        detailView.classList.add("hide");
        detailOwnerActions.classList.add("hide");
    }

    function showDetailView() {
        homeView.classList.add("hide");
        detailView.classList.remove("hide");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function updateDetailOwnerActions() {
        const blog = allBlogs.find((item) => Number(item.id) === Number(currentDetailBlogId));
        if (!blog || !canEditBlog(blog)) {
            detailOwnerActions.classList.add("hide");
            return;
        }
        detailOwnerActions.classList.remove("hide");
    }

    function createEditorBlock(block = {}) {
        if (block.type === "image") {
            return {
                type: "image",
                path: block.path || "",
                note: block.path ? "Existing image" : "Choose an image to place between paragraphs."
            };
        }

        return {
            type: "paragraph",
            text: block.text || ""
        };
    }

    function renderEditorBlocks(blocks) {
        if (!blocks.length) {
            blocks = [createEditorBlock({ type: "paragraph", text: "" })];
        }

        editorBlocks.innerHTML = blocks.map((block, index) => {
            if (block.type === "image") {
                return `
                    <article class="editor-block editor-block-image" data-block-index="${index}" data-block-type="image" data-existing-path="${escapeHTML(block.path || "")}">
                        <div class="editor-block-header">
                            <span class="editor-block-label">Inline Image ${index + 1}</span>
                            <button class="ghost-button editor-remove-button" type="button" data-remove-block="${index}">Remove</button>
                        </div>
                        <div class="editor-image-preview">
                            ${block.path ? `<img src="${block.path}" alt="Inline preview ${index + 1}">` : `<span>Image will appear between your paragraphs.</span>`}
                        </div>
                        <div class="upload-btn-wrapper">
                            <button type="button" class="btn-outline">
                                <i class="fa-regular fa-image"></i>
                                <span>${block.path ? "Replace Inline Image" : "Choose Inline Image"}</span>
                            </button>
                            <input type="file" class="editor-image-input" accept="image/*">
                        </div>
                        <p class="editor-image-note">${escapeHTML(block.note || "")}</p>
                    </article>
                `;
            }

            return `
                <article class="editor-block" data-block-index="${index}" data-block-type="paragraph">
                    <div class="editor-block-header">
                        <span class="editor-block-label">Paragraph ${index + 1}</span>
                        <button class="ghost-button editor-remove-button" type="button" data-remove-block="${index}">Remove</button>
                    </div>
                    <textarea class="editor-paragraph-input" rows="5" placeholder="Write a paragraph for your post...">${escapeHTML(block.text || "")}</textarea>
                </article>
            `;
        }).join("");
    }

    function resetComposer() {
        createPostForm.reset();
        editingPostId.value = "";
        postModalEyebrow.textContent = "Compose post";
        postModalTitle.textContent = "Create new post";
        submitLabel.textContent = "Share Post";
        currentCoverImageNote.classList.add("hide");
        currentCoverImageNote.textContent = "";
        currentVideoNote.classList.add("hide");
        currentVideoNote.textContent = "";
        fileNamesDiv.textContent = "";
        renderEditorBlocks([createEditorBlock({ type: "paragraph", text: "" })]);
    }

    function openCreatePost() {
        if (!authState.authenticated) {
            openAuthGate("Please sign in to create a post.");
            return;
        }

        resetComposer();
        createPostModal.classList.remove("hide");
    }

    function closeCreatePost() {
        createPostModal.classList.add("hide");
    }

    function updateFileNotes() {
        const notes = [];
        if (postImage.files.length > 0) notes.push(`Cover image: ${postImage.files[0].name}`);
        if (postVideo.files.length > 0) notes.push(`Top video: ${postVideo.files[0].name}`);

        editorBlocks.querySelectorAll(".editor-block-image").forEach((block, index) => {
            const fileInput = block.querySelector(".editor-image-input");
            if (fileInput && fileInput.files.length > 0) {
                notes.push(`Inline image ${index + 1}: ${fileInput.files[0].name}`);
            }
        });

        fileNamesDiv.innerHTML = notes.join("<br>");
    }

    async function openEditPost(blogId) {
        try {
            const blog = await getBlogById(blogId);
            if (!canEditBlog(blog)) {
                alert("You can only edit your own posts.");
                return;
            }

            const paragraphBlocks = getParagraphBlocks(blog);
            const summaryText = paragraphBlocks.length > 0 ? paragraphBlocks[0].text : "";
            const bodyBlocks = parseContentBlocks(blog).slice(summaryText ? 1 : 0).map((block) => createEditorBlock(block));

            resetComposer();
            editingPostId.value = blog.id;
            postModalEyebrow.textContent = "Edit post";
            postModalTitle.textContent = "Update your post";
            submitLabel.textContent = "Save Changes";
            postTitle.value = blog.title || "";
            postCategory.value = blog.category || "";
            postSummary.value = summaryText;

            if (blog.imagePath) {
                currentCoverImageNote.textContent = `Current cover preview: ${blog.imagePath}`;
                currentCoverImageNote.classList.remove("hide");
            }
            if (blog.videoPath) {
                currentVideoNote.textContent = `Current top video: ${blog.videoPath}`;
                currentVideoNote.classList.remove("hide");
            }

            renderEditorBlocks(bodyBlocks.length ? bodyBlocks : [createEditorBlock({ type: "paragraph", text: "" })]);
            createPostModal.classList.remove("hide");
        } catch (error) {
            console.error(error);
            alert("Could not load this post for editing.");
        }
    }

    function openAdminPanel() {
        if (!authState.isAdmin) {
            alert("Only the admin account can access the admin panel.");
            return;
        }
        adminPanelModal.classList.remove("hide");
        setAdminMessage("Signed-in admins can remove user accounts and blog posts from here.");
        loadAdminPanel().catch((error) => {
            console.error(error);
            setAdminMessage("Could not load admin data right now.", "error");
        });
    }

    function buildSectionTitle(blog, paragraphText, index) {
        const words = paragraphText.split(/\s+/).filter(Boolean).slice(0, 5).join(" ");
        return words ? words.replace(/[.?!,:;]+$/g, "") : `${blog.category} Section ${index}`;
    }

    function getDetailRenderParts(blog) {
        const blocks = parseContentBlocks(blog);
        const paragraphBlocks = blocks.filter((block) => block.type === "paragraph" && block.text);
        const introText = paragraphBlocks.length ? paragraphBlocks[0].text : getExcerpt(getPlainText(blog), 220) || "No content available.";
        const bodyBlocks = [];
        let introTaken = false;

        blocks.forEach((block) => {
            if (block.type === "paragraph" && block.text && !introTaken) {
                introTaken = true;
                return;
            }
            bodyBlocks.push(block);
        });

        return { introText, bodyBlocks };
    }

    function renderDetailContent(blog) {
        const previewImage = getPreviewImage(blog);
        const plainText = getPlainText(blog);
        const metrics = {
            likes: `${Math.max(12, 20 + (blog.id || 1) * 7)}k`,
            views: `${Math.max(24, 35 + Math.ceil(wordCount(plainText) / 10) + (blog.id || 1) * 4)}k`,
            shares: `${Math.max(18, 40 + (blog.id || 1) * 9)}`
        };
        const { introText, bodyBlocks } = getDetailRenderParts(blog);
        let paragraphIndex = 0;

        currentDetailBlogId = Number(blog.id);

        detailHero.classList.toggle("has-media", Boolean(previewImage));
        detailHero.style.backgroundImage = previewImage
            ? `linear-gradient(180deg, rgba(9, 9, 9, 0.18), rgba(9, 9, 9, 0.84)), url('${previewImage}')`
            : "linear-gradient(180deg, rgba(7, 7, 7, 0.14), rgba(7, 7, 7, 0.78)), radial-gradient(circle at top left, rgba(243, 198, 35, 0.18), transparent 26%), linear-gradient(135deg, #2d445d, #101114 72%)";

        detailHeroCategory.textContent = blog.category;
        detailHeroTitle.textContent = blog.title;
        detailHeroMeta.innerHTML = `
            <span class="meta-pill">${escapeHTML(getAuthorLabel(blog))}</span>
            <span class="meta-pill">${formatDate(blog.createdAt)}</span>
            <span class="meta-pill">${readingTime(plainText)}</span>
            <span class="meta-pill">${withMedia(blog) ? "Rich media included" : "Article view"}</span>
        `;
        detailLikeCount.textContent = metrics.likes;
        detailViewCount.textContent = metrics.views;
        detailShareCount.textContent = metrics.shares;
        detailPublishDate.textContent = formatDate(blog.createdAt);
        detailCategory.textContent = blog.category;
        detailReadingTime.textContent = readingTime(plainText);
        detailAuthor.textContent = getAuthorLabel(blog);
        detailIntroText.textContent = introText;

        detailSections.innerHTML = bodyBlocks.length
            ? bodyBlocks.map((block) => {
                if (block.type === "image" && block.path) {
                    return `
                        <figure class="detail-media-card">
                            <img src="${block.path}" alt="${escapeHTML(blog.title)}">
                        </figure>
                    `;
                }

                if (block.type === "paragraph" && block.text) {
                    paragraphIndex += 1;
                    return `
                        <section class="detail-section-card" id="detail-section-${paragraphIndex}">
                            <span class="detail-heading-label">${escapeHTML(blog.category)}</span>
                            <h3>${escapeHTML(buildSectionTitle(blog, block.text, paragraphIndex))}</h3>
                            <p>${escapeHTML(block.text)}</p>
                        </section>
                    `;
                }

                return "";
            }).join("")
            : `<section class="detail-section-card"><span class="detail-heading-label">${escapeHTML(blog.category)}</span><h3>Main Story</h3><p>${escapeHTML(introText)}</p></section>`;

        const tableOfContents = [];
        let tocIndex = 0;
        getParagraphBlocks(blog).forEach((block, index) => {
            if (index === 0) {
                tableOfContents.push(`<li><a href="#detailIntroText">Introduction</a></li>`);
                return;
            }
            tocIndex += 1;
            tableOfContents.push(`<li><a href="#detail-section-${tocIndex}">${escapeHTML(buildSectionTitle(blog, block.text, tocIndex))}</a></li>`);
        });
        detailToc.innerHTML = tableOfContents.join("");

        renderRelatedPosts(blog);
        updateDetailOwnerActions();
    }

    function renderSpotlight(blogs) {
        const featured = blogs[0];
        if (!featured) {
            spotlightCard.innerHTML = `<span class="section-tag">Latest highlight</span><h2>No posts yet</h2><p>Your newest post will appear here.</p>`;
            return;
        }

        spotlightCard.innerHTML = `
            <span class="section-tag">Latest highlight</span>
            <h2>${escapeHTML(featured.title)}</h2>
            <p>${escapeHTML(getExcerpt(getPlainText(featured), 180))}</p>
            <div class="spotlight-meta">
                <span class="meta-pill">${escapeHTML(featured.category)}</span>
                <span class="meta-pill">${escapeHTML(getAuthorLabel(featured))}</span>
                <span class="meta-pill">${formatDate(featured.createdAt)}</span>
                <span class="meta-pill">${withMedia(featured) ? "Includes media" : "Text post"}</span>
            </div>
            <div class="feed-action-group">
                <button class="ghost-button" type="button" data-open-blog="${featured.id}">Read latest post</button>
                ${canEditBlog(featured) ? `<button class="ghost-button" type="button" data-edit-blog="${featured.id}">Edit</button>` : ""}
            </div>
        `;
        bindCardActions(spotlightCard);
    }

    function updateStats(blogs) {
        totalPostsCount.textContent = `${blogs.length}+`;
        categoryCount.textContent = `${new Set(blogs.map((blog) => blog.category)).size}`;
        mediaCount.textContent = `${blogs.filter(withMedia).length}+`;
    }

    function renderCategoryOverview(blogs) {
        const categories = ["Tech", "Lifestyle", "Travel"];
        const icons = { Tech: "fa-microchip", Lifestyle: "fa-leaf", Travel: "fa-earth-asia" };

        categoryOverview.innerHTML = categories.map((category) => `
            <button class="category-card" type="button" data-category="${category}">
                <div class="card-top">
                    <i class="fa-solid ${icons[category] || "fa-bolt"}"></i>
                    <span class="meta-pill">${blogs.filter((blog) => blog.category === category).length} posts</span>
                </div>
                <strong>${category}</strong>
                <p>Browse the latest ${category.toLowerCase()} stories already present in your project.</p>
            </button>
        `).join("");

        categoryOverview.querySelectorAll(".category-card").forEach((button) => {
            button.addEventListener("click", () => {
                setActiveCategory(button.dataset.category);
                showHomeView();
                $("postsSection").scrollIntoView({ behavior: "smooth", block: "start" });
            });
        });
    }

    function renderMediaShowcase(blogs) {
        const mediaBlogs = blogs.filter(withMedia).slice(0, 2);
        if (mediaBlogs.length === 0) {
            mediaShowcase.innerHTML = `<div class="empty-state"><p>Add images to your post body and they will appear in this highlight area.</p></div>`;
            return;
        }

        mediaShowcase.innerHTML = mediaBlogs.map((blog) => `
            <article class="resource-card" data-open-blog="${blog.id}">
                <div class="resource-media">
                    ${getPreviewImage(blog)
                        ? `<img src="${getPreviewImage(blog)}" alt="${escapeHTML(blog.title)}">`
                        : `<video src="${blog.videoPath}" controls preload="metadata"></video>`}
                </div>
                <div class="resource-content">
                    <span class="section-tag">${escapeHTML(blog.category)}</span>
                    <h3>${escapeHTML(blog.title)}</h3>
                    <p>${escapeHTML(getExcerpt(getPlainText(blog), 140))}</p>
                    <div class="feed-footer">
                        <span class="meta-pill">${escapeHTML(getAuthorLabel(blog))}</span>
                        <div class="feed-action-group">
                            <button class="ghost-button" type="button" data-open-blog="${blog.id}">Open Blog</button>
                            ${canEditBlog(blog) ? `<button class="ghost-button" type="button" data-edit-blog="${blog.id}">Edit</button>` : ""}
                        </div>
                    </div>
                </div>
            </article>
        `).join("");

        bindCardActions(mediaShowcase);
    }

    function renderFeed(blogs) {
        if (blogs.length === 0) {
            blogFeed.innerHTML = `<div class="empty-state"><p>No posts yet for this category. Create one to see it here.</p></div>`;
            return;
        }

        blogFeed.innerHTML = blogs.map((blog) => `
            <article class="feed-card" data-open-blog="${blog.id}">
                ${getPreviewImage(blog) ? `<div class="feed-media"><img src="${getPreviewImage(blog)}" alt="${escapeHTML(blog.title)}" loading="lazy"></div>` : ""}
                ${!getPreviewImage(blog) && blog.videoPath ? `<div class="feed-media"><video src="${blog.videoPath}" controls preload="metadata"></video></div>` : ""}
                <div class="feed-content">
                    <div class="feed-meta">
                        <span>${escapeHTML(blog.category)}</span>
                        <span>${formatDate(blog.createdAt)}</span>
                    </div>
                    <h3>${escapeHTML(blog.title)}</h3>
                    <p>${escapeHTML(getExcerpt(getPlainText(blog), 180))}</p>
                    <div class="feed-footer">
                        <span class="meta-pill">${escapeHTML(getAuthorLabel(blog))}</span>
                        <div class="feed-action-group">
                            <button class="ghost-button" type="button" data-open-blog="${blog.id}">Read More</button>
                            ${canEditBlog(blog) ? `<button class="ghost-button" type="button" data-edit-blog="${blog.id}">Edit</button>` : ""}
                        </div>
                    </div>
                </div>
            </article>
        `).join("");

        bindCardActions(blogFeed);
    }

    function renderRelatedPosts(activeBlog) {
        const related = allBlogs
            .filter((blog) => blog.id !== activeBlog.id)
            .sort((a, b) => {
                const aScore = (a.category === activeBlog.category ? 2 : 0) + (withMedia(a) ? 1 : 0);
                const bScore = (b.category === activeBlog.category ? 2 : 0) + (withMedia(b) ? 1 : 0);
                return bScore - aScore;
            })
            .slice(0, 3);

        if (related.length === 0) {
            relatedPosts.innerHTML = `<div class="empty-state"><p>Create more posts to unlock related stories here.</p></div>`;
            return;
        }

        relatedPosts.innerHTML = related.map((blog) => `
            <article class="related-card" data-open-blog="${blog.id}">
                <div class="related-card-media">
                    ${getPreviewImage(blog) ? `<img src="${getPreviewImage(blog)}" alt="${escapeHTML(blog.title)}">` : ""}
                    ${!getPreviewImage(blog) && blog.videoPath ? `<video src="${blog.videoPath}" preload="metadata"></video>` : ""}
                </div>
                <div class="related-card-content">
                    <span class="section-tag">${escapeHTML(blog.category)}</span>
                    <h3>${escapeHTML(blog.title)}</h3>
                    <p>${escapeHTML(getExcerpt(getPlainText(blog), 120))}</p>
                    <div class="feed-footer">
                        <span class="meta-pill">${escapeHTML(getAuthorLabel(blog))}</span>
                        <div class="feed-action-group">
                            <button class="ghost-button" type="button" data-open-blog="${blog.id}">Read More</button>
                            ${canEditBlog(blog) ? `<button class="ghost-button" type="button" data-edit-blog="${blog.id}">Edit</button>` : ""}
                        </div>
                    </div>
                </div>
            </article>
        `).join("");

        bindCardActions(relatedPosts);
    }

    function bindCardActions(root) {
        root.querySelectorAll("[data-open-blog]").forEach((element) => {
            element.addEventListener("click", (event) => {
                const target = event.target.closest("[data-open-blog]");
                if (!target) return;
                event.preventDefault();
                event.stopPropagation();
                openBlogDetail(Number(target.dataset.openBlog));
            });
        });

        root.querySelectorAll("[data-edit-blog]").forEach((element) => {
            element.addEventListener("click", (event) => {
                const target = event.target.closest("[data-edit-blog]");
                if (!target) return;
                event.preventDefault();
                event.stopPropagation();
                openEditPost(Number(target.dataset.editBlog));
            });
        });
    }

    function renderAdminUsers(users) {
        if (!users.length) {
            adminUsersList.innerHTML = `<div class="empty-state"><p>No accounts found.</p></div>`;
            return;
        }

        adminUsersList.innerHTML = users.map((user) => `
            <article class="admin-card">
                <div class="admin-card-copy">
                    <strong>${escapeHTML(user.email)}</strong>
                    <p>${escapeHTML(user.role)} account | ${user.postCount} post${user.postCount === 1 ? "" : "s"}</p>
                </div>
                <button
                    class="ghost-button admin-danger-button ${user.role === "ADMIN" ? "is-disabled" : ""}"
                    type="button"
                    data-delete-user="${user.id}"
                    ${user.role === "ADMIN" ? "disabled" : ""}>
                    Remove Account
                </button>
            </article>
        `).join("");
    }

    function renderAdminPosts(blogs) {
        if (!blogs.length) {
            adminPostsList.innerHTML = `<div class="empty-state"><p>No posts are available to moderate.</p></div>`;
            return;
        }

        adminPostsList.innerHTML = blogs.map((blog) => `
            <article class="admin-card">
                <div class="admin-card-copy">
                    <strong>${escapeHTML(blog.title)}</strong>
                    <p>${escapeHTML(blog.category)} | ${escapeHTML(getAuthorLabel(blog))}</p>
                </div>
                <button class="ghost-button admin-danger-button" type="button" data-delete-blog="${blog.id}">
                    Remove Post
                </button>
            </article>
        `).join("");
    }

    async function loadAdminPanel() {
        if (!authState.isAdmin) return;

        adminUsersList.innerHTML = `<div class="empty-state"><p>Loading accounts...</p></div>`;
        renderAdminPosts(allBlogs);

        const response = await fetch("/api/admin/users");
        const data = await response.json().catch(() => []);
        if (!response.ok) {
            throw new Error(data.message || "Failed to load admin users.");
        }

        renderAdminUsers(Array.isArray(data) ? data : []);
        renderAdminPosts(allBlogs);
    }

    async function deleteUserAccount(userId, email) {
        if (!confirm(`Remove the account for ${email}? This will also remove that user's posts.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
            const data = await response.json().catch(() => ({ message: "Failed to remove account." }));
            if (!response.ok) {
                setAdminMessage(data.message || "Failed to remove account.", "error");
                return;
            }

            setAdminMessage(data.message || "Account removed successfully.", "success");
            await loadBlogs();
            await loadAdminPanel();
        } catch (error) {
            console.error(error);
            setAdminMessage("Could not connect to the server.", "error");
        }
    }

    async function deleteBlogPost(blogId, title) {
        if (!confirm(`Remove the post "${title}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/blogs/${blogId}`, { method: "DELETE" });
            const data = await response.json().catch(() => ({ message: "Failed to remove post." }));
            if (!response.ok) {
                setAdminMessage(data.message || "Failed to remove post.", "error");
                return;
            }

            if (currentDetailBlogId === Number(blogId)) {
                returnToHome();
            }

            setAdminMessage(data.message || "Post removed successfully.", "success");
            await loadBlogs();
            renderAdminPosts(allBlogs);
        } catch (error) {
            console.error(error);
            setAdminMessage("Could not connect to the server.", "error");
        }
    }

    function updateFilterLabel(category) {
        activeFilterLabel.textContent = category === "all" ? "Showing all posts" : `Showing ${category} posts`;
    }

    function applyCategoryFilter() {
        const filtered = activeCategory === "all"
            ? allBlogs
            : allBlogs.filter((blog) => blog.category === activeCategory);

        updateFilterLabel(activeCategory);
        renderFeed(filtered);
    }

    function setActiveCategory(category) {
        activeCategory = category;
        tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.category === category));
        applyCategoryFilter();
    }

    function getBlogFromCache(id) {
        return allBlogs.find((blog) => Number(blog.id) === Number(id)) || null;
    }

    async function getBlogById(id) {
        const cached = getBlogFromCache(id);
        if (cached) return cached;

        const response = await fetch(`/api/blogs/${id}`);
        if (!response.ok) throw new Error("Failed to load this blog post.");
        return response.json();
    }

    async function openBlogDetail(id, shouldUpdateHash = true) {
        try {
            const blog = await getBlogById(id);
            renderDetailContent(blog);
            showDetailView();
            if (shouldUpdateHash) {
                history.pushState(null, "", `${BLOG_HASH_PREFIX}${blog.id}`);
            }
        } catch (error) {
            console.error(error);
            alert("Could not open this blog post.");
        }
    }

    function returnToHome() {
        history.pushState(null, "", "#homeSection");
        showHomeView();
        $("postsSection").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function handleRouteFromHash() {
        if (window.location.hash.startsWith(BLOG_HASH_PREFIX)) {
            const id = Number(window.location.hash.replace(BLOG_HASH_PREFIX, ""));
            if (!Number.isNaN(id)) {
                await openBlogDetail(id, false);
                return;
            }
        }
        showHomeView();
    }

    async function loadBlogs() {
        try {
            blogFeed.innerHTML = `<div class="empty-state"><p>Loading posts...</p></div>`;
            const response = await fetch("/api/blogs");
            if (!response.ok) throw new Error("Failed to load blog posts.");

            allBlogs = await response.json();
            renderSpotlight(allBlogs);
            updateStats(allBlogs);
            renderCategoryOverview(allBlogs);
            renderMediaShowcase(allBlogs);
            applyCategoryFilter();

            if (currentDetailBlogId) {
                const blog = getBlogFromCache(currentDetailBlogId);
                if (blog) {
                    renderDetailContent(blog);
                } else {
                    returnToHome();
                }
            }

            if (authState.isAdmin && !adminPanelModal.classList.contains("hide")) {
                renderAdminPosts(allBlogs);
            }
        } catch (error) {
            console.error(error);
            blogFeed.innerHTML = `<div class="empty-state"><p>Failed to load feed.</p></div>`;
        }
    }

    async function loadSession() {
        try {
            const response = await fetch("/api/auth/session");
            const sessionData = await response.json();

            authState = sessionData.authenticated
                ? {
                    authenticated: true,
                    isGuest: false,
                    email: sessionData.email,
                    role: sessionData.role || "USER",
                    isAdmin: Boolean(sessionData.isAdmin)
                }
                : {
                    authenticated: false,
                    isGuest: sessionStorage.getItem(GUEST_MODE_KEY) === "true",
                    email: null,
                    role: "USER",
                    isAdmin: false
                };

            if (sessionData.authenticated) {
                sessionStorage.removeItem(GUEST_MODE_KEY);
            }
        } catch (error) {
            console.error(error);
            authState = {
                authenticated: false,
                isGuest: sessionStorage.getItem(GUEST_MODE_KEY) === "true",
                email: null,
                role: "USER",
                isAdmin: false
            };
        }

        updateAuthUI();
    }

    async function submitAuth() {
        const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
        authSubmitBtn.disabled = true;
        setAuthMessage(authMode === "login" ? "Signing you in..." : "Creating your account...");

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: authEmail.value.trim(), password: authPassword.value })
            });

            const data = await response.json().catch(() => ({
                message: "Authentication failed. Please restart the backend and try again."
            }));

            if (!response.ok) {
                setAuthMessage(data.message || (authMode === "login" ? "Login failed." : "Registration failed."), "error");
                return;
            }

            sessionStorage.removeItem(GUEST_MODE_KEY);
            authState = {
                authenticated: true,
                isGuest: false,
                email: data.email,
                role: data.role || "USER",
                isAdmin: Boolean(data.isAdmin)
            };
            authForm.reset();
            setAuthMessage("Authentication successful.", "success");
            updateAuthUI();
            await loadBlogs();
        } catch (error) {
            console.error(error);
            setAuthMessage("Could not connect to the server.", "error");
        } finally {
            authSubmitBtn.disabled = false;
        }
    }

    function buildSubmissionBlocks() {
        const blocks = [];
        const inlineFiles = [];
        const openingParagraph = postSummary.value.trim();

        if (openingParagraph) {
            blocks.push({ type: "paragraph", text: openingParagraph });
        }

        editorBlocks.querySelectorAll(".editor-block").forEach((blockElement) => {
            const blockType = blockElement.dataset.blockType;

            if (blockType === "paragraph") {
                const textarea = blockElement.querySelector(".editor-paragraph-input");
                const text = textarea ? textarea.value.trim() : "";
                if (text) {
                    blocks.push({ type: "paragraph", text });
                }
                return;
            }

            const fileInput = blockElement.querySelector(".editor-image-input");
            const existingPath = blockElement.dataset.existingPath || "";

            if (fileInput && fileInput.files.length > 0) {
                blocks.push({ type: "image", fileIndex: inlineFiles.length });
                inlineFiles.push(fileInput.files[0]);
                return;
            }

            if (existingPath) {
                blocks.push({ type: "image", path: existingPath });
            }
        });

        const plainText = blocks
            .filter((block) => block.type === "paragraph")
            .map((block) => block.text)
            .join("\n\n")
            .trim();

        if (!plainText) {
            throw new Error("Please add at least one paragraph to your post.");
        }

        return { blocks, inlineFiles, plainText };
    }

    async function submitPostForm(event) {
        event.preventDefault();

        if (!authState.authenticated) {
            closeCreatePost();
            openAuthGate("Please sign in with an account to create a post.");
            return;
        }

        if (!postCategory.value) {
            alert("Please select a category.");
            return;
        }

        let payload;
        try {
            payload = buildSubmissionBlocks();
        } catch (error) {
            alert(error.message);
            return;
        }

        const formData = new FormData();
        formData.append("title", postTitle.value.trim());
        formData.append("category", postCategory.value);
        formData.append("content", payload.plainText);
        formData.append("blocks", JSON.stringify(payload.blocks));

        if (postImage.files[0]) formData.append("image", postImage.files[0]);
        if (postVideo.files[0]) formData.append("video", postVideo.files[0]);
        payload.inlineFiles.forEach((file) => formData.append("inlineImages", file));

        const currentId = editingPostId.value.trim();
        const endpoint = currentId ? `/api/blogs/${currentId}` : "/api/blogs";
        const method = currentId ? "PUT" : "POST";

        submitBtn.disabled = true;
        spinner.classList.remove("hide");
        submitLabel.textContent = currentId ? "Saving..." : "Sharing...";

        try {
            const response = await fetch(endpoint, { method, body: formData });
            const data = await response.json().catch(() => ({ message: "Failed to save post." }));

            if (!response.ok) {
                if (response.status === 401) {
                    authState = { authenticated: false, isGuest: false, email: null, role: "USER", isAdmin: false };
                    closeCreatePost();
                    updateAuthUI();
                    setAuthMessage(data.message || "Please sign in to continue.", "error");
                } else {
                    alert(data.message || "Failed to save post.");
                }
                return;
            }

            closeCreatePost();
            resetComposer();
            await loadBlogs();

            if (currentId) {
                await openBlogDetail(data.id);
            }
        } catch (error) {
            console.error(error);
            alert("Error connecting to server.");
        } finally {
            submitBtn.disabled = false;
            spinner.classList.add("hide");
            submitLabel.textContent = editingPostId.value ? "Save Changes" : "Share Post";
        }
    }

    setTheme(localStorage.getItem("theme") === "light" ? "light" : "dark");
    setAuthMode("login");
    resetComposer();

    darkModeToggle.addEventListener("click", () => {
        setTheme(body.classList.contains("dark-mode") ? "light" : "dark");
    });

    adminPanelBtn.addEventListener("click", openAdminPanel);
    [navCreate, ctaCreateBtn, detailCreateBtn].forEach((button) => button.addEventListener("click", openCreatePost));
    closeModalBtn.addEventListener("click", closeCreatePost);
    closeAdminModalBtn.addEventListener("click", closeAdminPanel);
    detailEditBtn.addEventListener("click", () => {
        if (currentDetailBlogId) openEditPost(currentDetailBlogId);
    });

    createPostModal.addEventListener("click", (event) => {
        if (event.target === createPostModal) closeCreatePost();
    });
    adminPanelModal.addEventListener("click", (event) => {
        if (event.target === adminPanelModal) closeAdminPanel();
    });

    loginModeBtn.addEventListener("click", () => setAuthMode("login"));
    registerModeBtn.addEventListener("click", () => setAuthMode("register"));
    continueGuestBtn.addEventListener("click", () => {
        sessionStorage.setItem(GUEST_MODE_KEY, "true");
        authState = { authenticated: false, isGuest: true, email: null, role: "USER", isAdmin: false };
        updateAuthUI();
    });
    googleSignInBtn.addEventListener("click", () => {
        setAuthMessage("Google sign-in UI is added, but it still needs a Google OAuth client ID and backend verification setup to work.", "error");
    });
    logoutBtn.addEventListener("click", async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch (error) {
            console.error(error);
        }
        sessionStorage.setItem(GUEST_MODE_KEY, "true");
        authState = { authenticated: false, isGuest: true, email: null, role: "USER", isAdmin: false };
        updateAuthUI();
    });

    authForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        await submitAuth();
    });
    createPostForm.addEventListener("submit", submitPostForm);

    addParagraphBlockBtn.addEventListener("click", () => {
        const blocks = Array.from(editorBlocks.querySelectorAll(".editor-block")).map((blockElement) => {
            if (blockElement.dataset.blockType === "image") {
                return createEditorBlock({ type: "image", path: blockElement.dataset.existingPath || "" });
            }
            const textarea = blockElement.querySelector(".editor-paragraph-input");
            return createEditorBlock({ type: "paragraph", text: textarea ? textarea.value : "" });
        });
        blocks.push(createEditorBlock({ type: "paragraph", text: "" }));
        renderEditorBlocks(blocks);
        updateFileNotes();
    });

    addImageBlockBtn.addEventListener("click", () => {
        const blocks = Array.from(editorBlocks.querySelectorAll(".editor-block")).map((blockElement) => {
            if (blockElement.dataset.blockType === "image") {
                return createEditorBlock({ type: "image", path: blockElement.dataset.existingPath || "" });
            }
            const textarea = blockElement.querySelector(".editor-paragraph-input");
            return createEditorBlock({ type: "paragraph", text: textarea ? textarea.value : "" });
        });
        blocks.push(createEditorBlock({ type: "image", path: "" }));
        renderEditorBlocks(blocks);
        updateFileNotes();
    });

    editorBlocks.addEventListener("click", (event) => {
        const removeButton = event.target.closest("[data-remove-block]");
        if (!removeButton) return;

        const index = Number(removeButton.dataset.removeBlock);
        const blocks = Array.from(editorBlocks.querySelectorAll(".editor-block")).map((blockElement) => {
            if (blockElement.dataset.blockType === "image") {
                return createEditorBlock({ type: "image", path: blockElement.dataset.existingPath || "" });
            }
            const textarea = blockElement.querySelector(".editor-paragraph-input");
            return createEditorBlock({ type: "paragraph", text: textarea ? textarea.value : "" });
        }).filter((_, blockIndex) => blockIndex !== index);

        renderEditorBlocks(blocks);
        updateFileNotes();
    });

    editorBlocks.addEventListener("change", (event) => {
        if (event.target.matches(".editor-image-input")) {
            const block = event.target.closest(".editor-block-image");
            const preview = block.querySelector(".editor-image-preview");
            const note = block.querySelector(".editor-image-note");

            if (event.target.files.length > 0) {
                const file = event.target.files[0];
                block.dataset.existingPath = "";
                preview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="${escapeHTML(file.name)}">`;
                note.textContent = file.name;
            }
            updateFileNotes();
        }
    });

    postImage.addEventListener("change", updateFileNotes);
    postVideo.addEventListener("change", updateFileNotes);

    tabs.forEach((tab) => tab.addEventListener("click", () => {
        setActiveCategory(tab.dataset.category);
        showHomeView();
    }));

    navHome.addEventListener("click", () => {
        if (window.location.hash.startsWith(BLOG_HASH_PREFIX)) returnToHome();
    });
    backToHomeBtn.addEventListener("click", returnToHome);
    viewAllPostsBtn.addEventListener("click", returnToHome);

    window.addEventListener("hashchange", () => {
        handleRouteFromHash().catch((error) => console.error(error));
    });
    window.addEventListener("popstate", () => {
        handleRouteFromHash().catch((error) => console.error(error));
    });

    adminUsersList.addEventListener("click", (event) => {
        const button = event.target.closest("[data-delete-user]");
        if (!button) return;
        const email = button.closest(".admin-card")?.querySelector("strong")?.textContent || "this user";
        deleteUserAccount(button.dataset.deleteUser, email);
    });

    adminPostsList.addEventListener("click", (event) => {
        const button = event.target.closest("[data-delete-blog]");
        if (!button) return;
        const title = button.closest(".admin-card")?.querySelector("strong")?.textContent || "this post";
        deleteBlogPost(button.dataset.deleteBlog, title);
    });

    Promise.all([loadSession(), loadBlogs()])
        .then(() => handleRouteFromHash())
        .catch((error) => console.error(error));
});
