const $ = (id) => document.getElementById(id);

const form = $("postForm");
const posts = $("posts");
const message = $("message");
const editingId = $("editingId");
const titleInput = $("titleInput");
const contentInput = $("contentInput");
const formTitle = $("formTitle");
const refreshBtn = $("refreshBtn");
const cancelEditBtn = $("cancelEditBtn");

const text = (value) => (value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const setMessage = (value = "") => {
    message.textContent = value;
};

const resetForm = () => {
    form.reset();
    editingId.value = "";
    formTitle.textContent = "Create Blog Post";
    cancelEditBtn.classList.add("hidden");
};

async function request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.message || "Request failed.");
    }
    return data;
}

async function loadPosts() {
    posts.innerHTML = "<div class='post'>Loading posts...</div>";

    const blogs = await request("/api/blogs");
    posts.innerHTML = blogs.length ? blogs.map((blog) => `
        <article class="post">
            <h3>${text(blog.title)}</h3>
            <div class="post-meta">Created: ${text(new Date(blog.createdAt).toLocaleString())}</div>
            <p>${text(blog.content)}</p>
            <div class="actions" style="margin-top: 14px;">
                <button class="secondary-btn" type="button" data-edit="${blog.id}">Edit</button>
                <button class="danger-btn" type="button" data-delete="${blog.id}">Delete</button>
            </div>
        </article>
    `).join("") : "<div class='post'>No posts yet.</div>";
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        const id = editingId.value.trim();
        await request(id ? `/api/blogs/${id}` : "/api/blogs", {
            method: id ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: titleInput.value.trim(),
                content: contentInput.value.trim()
            })
        });

        resetForm();
        setMessage(id ? "Post updated successfully." : "Post created successfully.");
        await loadPosts();
    } catch (error) {
        setMessage(error.message);
    }
});

refreshBtn.addEventListener("click", () => {
    loadPosts().catch(() => {
        posts.innerHTML = "<div class='post'>Could not load posts.</div>";
    });
});

cancelEditBtn.addEventListener("click", () => {
    resetForm();
    setMessage();
});

posts.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-edit],[data-delete]");
    if (!button) {
        return;
    }

    try {
        if (button.dataset.edit) {
            const blog = await request(`/api/blogs/${button.dataset.edit}`);
            editingId.value = blog.id;
            titleInput.value = blog.title || "";
            contentInput.value = blog.content || "";
            formTitle.textContent = "Edit Blog Post";
            cancelEditBtn.classList.remove("hidden");
            setMessage();
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        await request(`/api/blogs/${button.dataset.delete}`, { method: "DELETE" });
        if (editingId.value === button.dataset.delete) {
            resetForm();
        }
        setMessage("Post deleted successfully.");
        await loadPosts();
    } catch (error) {
        setMessage(error.message);
    }
});

loadPosts().catch(() => {
    posts.innerHTML = "<div class='post'>Could not load posts.</div>";
});
