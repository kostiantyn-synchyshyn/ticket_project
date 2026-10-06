// Log in.
async function login(event) {
    event.preventDefault();

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: document.getElementById("email").value.trim(),
                password: document.getElementById("password").value
            })
        });

        if (!response.ok) {
            alert("Could not log in. Check your email and password.");
            return;
        }

        window.location.href = "/Index.html";
    } catch (error) {
        console.error("Login failed:", error);
        alert("Could not connect to the server.");
    }
}

// Create a project.
async function createProject(event) {
    event.preventDefault();

    const projectKey = document.getElementById("projectKey").value.trim();
    const name = document.getElementById("projectName").value.trim();
    const projectAdmin =
        document.getElementById("projectAdmin").value.trim();

    const message = document.getElementById("project-message");
    message.textContent = "";

    if (projectKey === "" || name === "" || projectAdmin === "") {
        message.textContent = "Please fill in all project fields.";
        return;
    }

    try {
        const response = await fetch("/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                projectKey: projectKey,
                name: name,
                projectAdmin: projectAdmin
            })
        });

        if (response.ok) {
            window.location.href = "/Index.html";
            return;
        }

        if (response.status === 401) {
            message.textContent = "Please log in before creating a project.";
            return;
        }

        message.textContent = "Could not create project.";
    } catch (error) {
        console.error("Project creation failed:", error);
        message.textContent = "Could not connect to the server.";
    }
}

// Register a user.
async function createUser(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("register-message");

    message.textContent = "";

    if (name === "") {
        message.textContent = "Please enter your name.";
        return;
    }

    if (email === "") {
        message.textContent = "Please enter your email.";
        return;
    }

    if (password.length < 8) {
        message.textContent = "Password must be at least 8 characters.";
        return;
    }

    try {
        const response = await fetch("/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password,
                userType: "User"
            })
        });

        if (response.ok) {
            window.location.href = "/Login.html";
            return;
        }

        const errorMessage = await response.text();
        message.textContent = errorMessage || "Could not create user.";
    } catch (error) {
        console.error("Registration failed:", error);
        message.textContent = "Could not connect to the server.";
    }
}

// Create a ticket.
async function createTicket(event) {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const summary = document.getElementById("summary").value.trim();
    const details = document.getElementById("details").value.trim();

    const projectId = Number(document.getElementById("project").value);
    const assigneeValue = document.getElementById("assignee").value;
    const assigneeId =
        assigneeValue === "" ? null : Number(assigneeValue);

    const message = document.getElementById("ticket-message");
    message.textContent = "";

    if (
        title === "" ||
        summary === "" ||
        !Number.isSafeInteger(projectId) ||
        projectId <= 0
    ) {
        message.textContent =
            "Enter a title and summary, and choose a project.";
        return;
    }

    if (
        assigneeId !== null &&
        (!Number.isSafeInteger(assigneeId) || assigneeId <= 0)
    ) {
        message.textContent = "Choose a valid assignee or Unassigned.";
        return;
    }

    try {
        const response = await fetch("/tickets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: title,
                summary: summary,
                details: details,
                projectId: projectId,
                assigneeId: assigneeId
            })
        });

        if (response.ok) {
            window.location.href = "/Index.html";
            return;
        }

        if (response.status === 401) {
            message.textContent = "Please log in before creating a ticket.";
            return;
        }

        const errorMessage = await response.text();
        message.textContent = errorMessage || "Could not create ticket.";
    } catch (error) {
        console.error("Ticket creation failed:", error);
        message.textContent = "Could not connect to the server.";
    }
}

// Fill the project dropdown on CreateTicket.html.
async function loadProjectOptions() {
    const select = document.getElementById("project");
    if (select === null) return;

    try {
        const response = await fetch("/projects");

        if (!response.ok) {
            throw new Error("Could not load projects.");
        }

        const projects = await response.json();

        // Preserve the first "Choose a project" option.
        while (select.options.length > 1) {
            select.remove(1);
        }

        projects.forEach(function (project) {
            const option = document.createElement("option");
            option.value = project.id;
            option.textContent =
                project.name + " (" + project.projectKey + ")";

            select.appendChild(option);
        });
    } catch (error) {
        console.error("Could not load project options:", error);

        const message = document.getElementById("ticket-message");
        if (message !== null) {
            message.textContent =
                "Could not load projects. Please refresh the page.";
        }
    }
}

// Fill the assignee dropdown on CreateTicket.html.
async function loadAssigneeOptions() {
    const select = document.getElementById("assignee");
    if (select === null) return;

    try {
        const response = await fetch("/users");

        if (!response.ok) {
            throw new Error("Could not load users.");
        }

        const users = await response.json();

        // Preserve the first "Unassigned" option.
        while (select.options.length > 1) {
            select.remove(1);
        }

        users.forEach(function (user) {
            const option = document.createElement("option");
            option.value = user.id;
            option.textContent =
                user.name + " - " + user.email +
                " (" + user.userType + ")";

            select.appendChild(option);
        });
    } catch (error) {
        console.error("Could not load assignee options:", error);

        const message = document.getElementById("ticket-message");
        if (message !== null) {
            message.textContent =
                "Could not load assignees. Please refresh the page.";
        }
    }
}

// Project overview on Index.html.
async function loadProjects() {
    const list = document.getElementById("projects-list");
    if (list === null) return;

    list.textContent = "Loading projects…";

    try {
        const response = await fetch("/projects");

        if (!response.ok) {
            throw new Error("Could not load projects.");
        }

        const projects = await response.json();
        list.replaceChildren();

        if (projects.length === 0) {
            list.textContent = "No projects yet. Create your first project.";
            return;
        }

        projects.forEach(function (project) {
            const section = document.createElement("section");
            section.className = "project-card";

            const heading = document.createElement("h2");
            const link = document.createElement("a");

            link.href = "/Project.html?id=" + project.id;
            link.textContent =
                project.name + " (" + project.projectKey + ")";

            heading.appendChild(link);
            section.appendChild(heading);

            const admin = document.createElement("p");
            admin.textContent =
                "Admin: " + (project.projectAdmin || "Not specified");

            section.appendChild(admin);

            const tickets = project.tickets ?? [];

            const count = document.createElement("p");
            count.textContent =
                tickets.length +
                (tickets.length === 1 ? " ticket" : " tickets");

            section.appendChild(count);

            const toDo =
                tickets.filter(t => t.status === "To Do").length;

            const inProgress =
                tickets.filter(t => t.status === "In Progress").length;

            const done =
                tickets.filter(t => t.status === "Done").length;

            const overview = document.createElement("p");
            overview.textContent =
                "To Do: " + toDo +
                " · In Progress: " + inProgress +
                " · Done: " + done;

            section.appendChild(overview);
            list.appendChild(section);
        });
    } catch (error) {
        console.error("Could not load projects:", error);
        list.textContent = "Could not load projects. Please try again.";
    }
}

// Selected project on Project.html?id=...
async function loadProjectDetails() {
    const page = document.getElementById("project-page");
    if (page === null) return;

    const message = document.getElementById("project-load-message");
    const content = document.getElementById("project-content");

    content.hidden = true;
    message.textContent = "Loading project…";

    const params = new URLSearchParams(window.location.search);
    const projectId = Number(params.get("id"));

    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
        message.textContent =
            "Invalid project ID. Return to Projects and choose a project.";
        return;
    }

    try {
        const response = await fetch("/projects/" + projectId);

        if (response.status === 404) {
            message.textContent = "This project could not be found.";
            return;
        }

        if (!response.ok) {
            throw new Error("Could not load project.");
        }

        const project = await response.json();

        document.title = project.name + " - TicketProject";

        document.getElementById("project-heading").textContent =
            project.name;

        document.getElementById("project-key").textContent =
            project.projectKey;

        document.getElementById("project-admin").textContent =
            project.projectAdmin || "Not specified";

        const tickets = project.tickets ?? [];
        const list = document.getElementById("project-ticket-list");

        list.replaceChildren();

        document.getElementById("project-ticket-count").textContent =
            tickets.length === 0
                ? "No tickets in this project yet."
                : tickets.length +
                (tickets.length === 1 ? " ticket" : " tickets");

        tickets.forEach(function (ticket) {
            const row = document.createElement("li");
            row.className = "project-ticket-row";

            const information = document.createElement("div");
            information.className = "project-ticket-information";

            const link = document.createElement("a");
            link.href = "/Ticket.html?id=" + ticket.id;
            link.textContent =
                (ticket.ticketKey || "Ticket #" + ticket.id) +
                " — " +
                (ticket.title || ticket.summary || "Untitled ticket");

            information.appendChild(link);

            const assignee = document.createElement("p");
            assignee.textContent =
                "Assignee: " + (ticket.assigneeName || "Unassigned");

            information.appendChild(assignee);

            const status = document.createElement("span");
            status.className = "project-ticket-status";
            status.textContent = ticket.status || "No status";

            if (ticket.status === "In Progress") {
                status.classList.add("in-progress");
            } else if (ticket.status === "Done") {
                status.classList.add("done");
            }

            row.appendChild(information);
            row.appendChild(status);
            list.appendChild(row);
        });

        message.textContent = "";
        content.hidden = false;
    } catch (error) {
        console.error("Could not load project:", error);
        message.textContent = "Could not load project. Please try again.";
    }
}

// Selected ticket on Ticket.html?id=...
async function loadTicketDetails() {
    const container = document.getElementById("ticket-details");

    // Important: do not run this loader on Project.html.
    if (container === null) return;

    const params = new URLSearchParams(window.location.search);
    const ticketId = Number(params.get("id"));

    if (!Number.isSafeInteger(ticketId) || ticketId <= 0) {
        container.textContent =
            "Invalid ticket ID. Return to Projects and choose a ticket.";
        return;
    }

    try {
        const response = await fetch("/tickets/" + ticketId);

        if (response.status === 404) {
            container.textContent = "Ticket could not be found.";
            return;
        }

        if (!response.ok) {
            throw new Error("Could not load ticket.");
        }

        const ticket = await response.json();

        document.getElementById("ticket-key").textContent =
            ticket.ticketKey || "Ticket #" + ticket.id;

        document.getElementById("ticket-title").textContent =
            ticket.title || "";

        document.getElementById("ticket-summary").textContent =
            ticket.summary || "";

        document.getElementById("ticket-description").textContent =
            ticket.details || "No description.";

        document.getElementById("ticket-project").textContent =
            ticket.projectName;

        document.getElementById("ticket-assignee").textContent =
            ticket.assigneeName || "Unassigned";

        document.getElementById("ticket-status").value =
            ticket.status || "";
    } catch (error) {
        console.error("Could not load ticket:", error);
        container.textContent = "Could not load ticket. Please try again.";
    }
}

// Save the status selected on Ticket.html.
async function updateTicketStatus() {
    const params = new URLSearchParams(window.location.search);
    const ticketId = Number(params.get("id"));
    const select = document.getElementById("ticket-status");

    if (
        select === null ||
        !Number.isSafeInteger(ticketId) ||
        ticketId <= 0
    ) {
        alert("Invalid ticket.");
        return;
    }

    const status = select.value;

    try {
        const response = await fetch("/tickets/" + ticketId + "/status", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: status })
        });

        if (!response.ok) {
            alert("Couldn't update ticket status. Check that you are logged in.");
            return;
        }

        alert("Ticket status updated.");
    } catch (error) {
        console.error("Could not update ticket status:", error);
        alert("Could not connect to the server.");
    }
}

// End the login session.
async function logout() {
    try {
        const response = await fetch("/logout", { method: "POST" });

        if (!response.ok) {
            alert("Could not log out. Please try again.");
            return;
        }

        window.location.href = "/Login.html";
    } catch (error) {
        console.error("Logout failed:", error);
        alert("Could not connect to the server.");
    }
}

// Each loader first checks whether its page elements exist.
function initializePage() {
    loadProjects();
    loadProjectOptions();
    loadAssigneeOptions();
    loadProjectDetails();
    loadTicketDetails();
}

// Wait for the HTML elements to exist before loading data.
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePage, {
        once: true
    });
} else {
    initializePage();
}