// Shared helpers
function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value ?? "";
    return element;
}

function showMessage(id, text) {
    setText(id, text);
}

function getTicketId() {
    const id = Number(new URLSearchParams(location.search).get("id"));
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function formatDate(value) {
    if (!value) return "Unknown";

    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "Unknown"
        : date.toLocaleString();
}

async function api(url, options = {}) {
    const response = await fetch(url, options);

    if (response.status === 401 || response.redirected) {
        const error = new Error("Please log in before continuing.");
        error.status = 401;
        throw error;
    }

    const text = await response.text();
    let body = null;

    if (text) {
        try {
            body = JSON.parse(text);
        } catch {
            body = text;
        }
    }

    if (!response.ok) {
        const message =
            typeof body === "string"
                ? body
                : body?.message || body?.detail || body?.title;

        const error = new Error(message || "The request failed.");
        error.status = response.status;
        throw error;
    }

    return body;
}

function jsonOptions(method, data) {
    return {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    };
}

function errorMessage(error, fallback) {
    if (error.status === 401) return "Please log in before continuing.";
    if (error.status === 403) return "You do not have permission to do that.";
    return error.message || fallback;
}


// Authentication
async function login(event) {
    event.preventDefault();

    try {
        await api("/login", jsonOptions("POST", {
            email: document.getElementById("email").value.trim(),
            password: document.getElementById("password").value
        }));

        location.href = "/Index.html";
    } catch (error) {
        console.error("Login failed:", error);
        alert("Could not log in. Check your email and password.");
    }
}

async function createUser(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!name) {
        showMessage("register-message", "Please enter your name.");
        return;
    }

    if (!email) {
        showMessage("register-message", "Please enter your email.");
        return;
    }

    if (password.length < 8) {
        showMessage(
            "register-message",
            "Password must be at least 8 characters."
        );
        return;
    }

    try {
        await api("/users", jsonOptions("POST", {
            name,
            email,
            password,
            userType: "User"
        }));

        location.href = "/Login.html";
    } catch (error) {
        console.error("Registration failed:", error);
        showMessage(
            "register-message",
            errorMessage(error, "Could not create user.")
        );
    }
}

async function logout() {
    try {
        await api("/logout", { method: "POST" });
        location.href = "/Login.html";
    } catch (error) {
        console.error("Logout failed:", error);
        alert(errorMessage(error, "Could not log out. Please try again."));
    }
}


// Projects
async function createProject(event) {
    event.preventDefault();

    const projectKey = document.getElementById("projectKey").value.trim();
    const name = document.getElementById("projectName").value.trim();
    const projectAdmin =
        document.getElementById("projectAdmin").value.trim();

    if (!projectKey || !name || !projectAdmin) {
        showMessage("project-message", "Please fill in all project fields.");
        return;
    }

    try {
        await api("/projects", jsonOptions("POST", {
            projectKey,
            name,
            projectAdmin
        }));

        location.href = "/Index.html";
    } catch (error) {
        console.error("Project creation failed:", error);
        showMessage(
            "project-message",
            errorMessage(error, "Could not create project.")
        );
    }
}

async function loadProjects() {
    const list = document.getElementById("projects-list");
    if (!list) return;

    list.textContent = "Loading projects…";

    try {
        const projects = await api("/projects");
        list.replaceChildren();

        if (projects.length === 0) {
            list.textContent = "No projects yet. Create your first project.";
            return;
        }

        projects.forEach(project => {
            const section = document.createElement("section");
            section.className = "project-card";

            const heading = document.createElement("h2");
            const link = document.createElement("a");
            link.href = `/Project.html?id=${project.id}`;
            link.textContent = `${project.name} (${project.projectKey})`;
            heading.appendChild(link);

            const admin = document.createElement("p");
            admin.textContent =
                `Admin: ${project.projectAdmin || "Not specified"}`;

            const tickets = project.tickets ?? [];
            const count = document.createElement("p");
            count.textContent =
                `${tickets.length} ${tickets.length === 1 ? "ticket" : "tickets"}`;

            section.append(heading, admin, count);
            list.appendChild(section);
        });
    } catch (error) {
        console.error("Could not load projects:", error);
        list.textContent = errorMessage(
            error,
            "Could not load projects. Please try again."
        );
    }
}

async function loadProjectDetails() {
    if (!document.getElementById("project-page")) return;

    const message = document.getElementById("project-load-message");
    const content = document.getElementById("project-content");
    const saveMessage = document.getElementById("project-save-message");

    content.hidden = true;
    message.textContent = "Loading project…";
    if (saveMessage) saveMessage.textContent = "";

    const projectId = Number(new URLSearchParams(location.search).get("id"));

    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
        message.textContent =
            "Invalid project ID. Return to Projects and choose a project.";
        return;
    }

    try {
        const project = await api(`/projects/${projectId}`);
        const tickets = project.tickets ?? [];
        const list = document.getElementById("project-ticket-list");
        const createTicketButton =
            document.getElementById("create-ticket-button");

        if (createTicketButton) {
            createTicketButton.href =
                `/CreateTicket.html?projectId=${project.id}`;
        }

        document.title = `${project.name} - TicketProject`;
        setText("project-heading", project.name);
        setText("project-key", project.projectKey);
        setText("project-admin", project.projectAdmin || "Not specified");
        setText(
            "project-ticket-count",
            tickets.length === 0
                ? "No tickets in this project yet."
                : `${tickets.length} ${tickets.length === 1 ? "ticket" : "tickets"}`
        );

        list.replaceChildren();

        tickets.forEach(ticket => {
            const row = document.createElement("li");
            row.className = "project-ticket-row";

            const information = document.createElement("div");
            information.className = "project-ticket-information";

            const link = document.createElement("a");
            link.href = `/Ticket.html?id=${ticket.id}`;
            link.textContent =
                `${ticket.ticketKey || `Ticket #${ticket.id}`} — ` +
                `${ticket.title || ticket.summary || "Untitled ticket"}`;

            const assignee = document.createElement("p");
            assignee.textContent =
                `Assignee: ${ticket.assigneeName || "Unassigned"}`;

            information.append(link, assignee);

            const status = document.createElement("select");
            status.className = "project-ticket-status";
            status.setAttribute(
                "aria-label",
                `Status for ${ticket.ticketKey || `ticket ${ticket.id}`}`
            );

            const statuses = ["To Do", "In Progress", "Done"];

            statuses.forEach(value => {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = value;
                status.appendChild(option);
            });

            if (statuses.includes(ticket.status)) {
                status.value = ticket.status;
            } else {
                const option = document.createElement("option");
                option.value = "";
                option.textContent = "Choose status";
                option.disabled = true;
                status.prepend(option);
                status.value = "";
            }

            setProjectTicketStatusColor(status);
            status.addEventListener("change", () => {
                saveProjectTicketStatus(ticket, status);
            });

            row.append(information, status);
            list.appendChild(row);
        });

        message.textContent = "";
        content.hidden = false;
    } catch (error) {
        console.error("Could not load project:", error);
        message.textContent = errorMessage(
            error,
            "Could not load project. Please try again."
        );
    }
}


// Ticket form dropdowns
async function loadProjectOptions() {
    const select = document.getElementById("project");
    if (!select) return;

    const requestedProjectId =
        new URLSearchParams(location.search).get("projectId");

    const cancelLink = document.getElementById("cancel-ticket");

    if (cancelLink) {
        const projectIdNumber = Number(requestedProjectId);

        cancelLink.href =
            Number.isSafeInteger(projectIdNumber) && projectIdNumber > 0
                ? `/Project.html?id=${projectIdNumber}`
                : "/Index.html";
    }

    try {
        const projects = await api("/projects");

        while (select.options.length > 1) {
            select.remove(1);
        }

        projects.forEach(project => {
            const option = document.createElement("option");
            option.value = project.id;
            option.textContent = `${project.name} (${project.projectKey})`;
            select.appendChild(option);
        });

        if (
            requestedProjectId &&
            Array.from(select.options).some(
                option => option.value === requestedProjectId
            )
        ) {
            select.value = requestedProjectId;
        }
    } catch (error) {
        console.error("Could not load project options:", error);
        showMessage(
            "ticket-message",
            errorMessage(error, "Could not load projects. Please refresh.")
        );
    }
}

async function loadAssigneeOptions() {
    const select = document.getElementById("assignee");
    if (!select) return;

    try {
        const users = await api("/users");

        while (select.options.length > 1) {
            select.remove(1);
        }

        users.forEach(user => {
            const option = document.createElement("option");
            option.value = user.id;
            option.textContent =
                `${user.name} - ${user.email} (${user.userType})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Could not load assignee options:", error);
        showMessage(
            "ticket-message",
            errorMessage(error, "Could not load assignees. Please refresh.")
        );
    }
}


// Tickets
async function createTicket(event) {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const summary = document.getElementById("summary").value.trim();
    const details = document.getElementById("details").value.trim();
    const projectId = Number(document.getElementById("project").value);
    const assigneeValue = document.getElementById("assignee").value;
    const assigneeId = assigneeValue === "" ? null : Number(assigneeValue);

    if (
        !title ||
        !summary ||
        !Number.isSafeInteger(projectId) ||
        projectId <= 0
    ) {
        showMessage(
            "ticket-message",
            "Enter a title and summary, and choose a project."
        );
        return;
    }

    if (
        assigneeId !== null &&
        (!Number.isSafeInteger(assigneeId) || assigneeId <= 0)
    ) {
        showMessage(
            "ticket-message",
            "Choose a valid assignee or Unassigned."
        );
        return;
    }

    try {
        await api("/tickets", jsonOptions("POST", {
            title,
            summary,
            details,
            projectId,
            assigneeId
        }));

        location.href = `/Project.html?id=${projectId}`;
    } catch (error) {
        console.error("Ticket creation failed:", error);
        showMessage(
            "ticket-message",
            errorMessage(error, "Could not create ticket.")
        );
    }
}

async function loadTicketDetails() {
    if (!document.getElementById("ticket-details")) return;

    const ticketId = getTicketId();
    const message = document.getElementById("ticket-status-message");

    if (!ticketId) {
        showMessage(
            "ticket-status-message",
            "Invalid ticket ID. Return to Projects and choose a ticket."
        );
        return;
    }

    if (message) message.textContent = "Loading ticket…";

    try {
        const ticket = await api(`/tickets/${ticketId}`);
        const backLink = document.getElementById("back-to-project"); // go back to project

        if (backLink && ticket.projectId) {
            backLink.href = `/Project.html?id=${ticket.projectId}`;
        }

        document.title =
            `${ticket.ticketKey || "Ticket details"} - TicketProject`;

        setText(
            "ticket-key",
            ticket.ticketKey || `Ticket #${ticket.id}`
        );
        setText("ticket-title", ticket.title);
        setText("ticket-summary", ticket.summary);
        setText(
            "ticket-description",
            ticket.details || "No description."
        );
        setText("ticket-project", ticket.projectName || "Unknown project");
        setText("ticket-assignee", ticket.assigneeName || "Unassigned");
        setText("ticket-created", formatDate(ticket.createdTime));

        const status = document.getElementById("ticket-status");
        if (status) status.value = ticket.status || "To Do";

        if (message) message.textContent = "";
    } catch (error) {
        console.error("Could not load ticket:", error);
        showMessage(
            "ticket-status-message",
            errorMessage(error, "Could not load ticket.")
        );
    }
}

async function updateTicketStatus() {
    const ticketId = getTicketId();
    const select = document.getElementById("ticket-status");
    const message = document.getElementById("ticket-status-message");

    if (!ticketId || !select) {
        showMessage("ticket-status-message", "Invalid ticket.");
        return;
    }

    select.disabled = true;
    if (message) message.textContent = "Saving status…";

    try {
        const result = await api(
            `/tickets/${ticketId}/status`,
            jsonOptions("PUT", { status: select.value })
        );

        if (message) {
            message.textContent = `Status saved as ${result.status}.`;
        }
    } catch (error) {
        console.error("Could not update ticket status:", error);
        showMessage(
            "ticket-status-message",
            errorMessage(error, "Could not update ticket status.")
        );
    } finally {
        select.disabled = false;
    }
}

function setProjectTicketStatusColor(select) {
    select.classList.toggle(
        "in-progress",
        select.value === "In Progress"
    );
    select.classList.toggle("done", select.value === "Done");
}

async function saveProjectTicketStatus(ticket, select) {
    const message =
        document.getElementById("project-save-message") ||
        document.getElementById("project-load-message");

    const previousStatus = ticket.status;
    const ticketName = ticket.ticketKey || `Ticket #${ticket.id}`;

    select.disabled = true;
    if (message) message.textContent = `Saving status for ${ticketName}…`;

    try {
        const result = await api(
            `/tickets/${ticket.id}/status`,
            jsonOptions("PUT", { status: select.value })
        );

        const statuses = ["To Do", "In Progress", "Done"];
        if (!statuses.includes(result.status)) {
            throw new Error("Could not confirm the saved status. Refresh the page.");
        }

        ticket.status = result.status;
        select.value = result.status;
        setProjectTicketStatusColor(select);

        if (message) {
            message.textContent =
                `${ticketName} status changed to ${ticket.status}.`;
        }
    } catch (error) {
        select.value = previousStatus || "";
        setProjectTicketStatusColor(select);

        console.error("Could not update ticket status:", error);
        if (message) {
            message.textContent = errorMessage(
                error,
                "Could not save the ticket status."
            );
        }
    } finally {
        select.disabled = false;
    }
}

// Initialize page
function initializePage() {
    loadProjects();
    loadProjectDetails();
    loadProjectOptions();
    loadAssigneeOptions();
    loadTicketDetails();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePage, {
        once: true
    });
} else {
    initializePage();
}