async function login(event) {
    event.preventDefault();

    const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: document.getElementById("email").value,
            password: document.getElementById("password").value
        })
    });

    if (!response.ok) {
        alert("Email or password is incorrect.");
        return;
    }

    window.location.href = "/Index.html";
}

async function createProject(event) {
    

    const projectKey = document.getElementById("projectKey").value.trim();
    const name = document.getElementById("projectName").value.trim();
    const projectAdmin = document.getElementById("projectAdmin").value.trim();
    const message = document.getElementById("project-message");

    message.textContent = "";

    if (projectKey === "" || name === "" || projectAdmin === "") {
        message.textContent = "Please fill in all project fields.";
        return;
    }

    const response = await fetch("/projects", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
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

    message.textContent = "Could not create project.";
}

async function createUser(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("register-message");

    message.textContent = "";

    if (name === "") {message.textContent = "Please enter your name.";
        return;
    }

    if (password.length < 8) {message.textContent = "Password must be at least 8 characters.";
        return;
    }

    try {
        const response = await fetch("/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
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

async function createTicket(event) {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const summary = document.getElementById("summary").value.trim();
    const details = document.getElementById("details").value.trim();
    const projectId = Number(document.getElementById("project").value);
    const assigneeValue = document.getElementById("assignee").value;
    const message = document.getElementById("ticket-message");

    message.textContent = "";

    if (title === "" || summary === "" || projectId === 0) {
        message.textContent =
            "Enter a title and summary, and choose a project.";
        return;
    }

    try {
        const response = await fetch("/tickets", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                summary: summary,
                details: details,
                projectId: projectId,
                assigneeId: assigneeValue === ""
                    ? null
                    : Number(assigneeValue)
            })
        });

        if (response.ok) {
            window.location.href = "/Index.html";
            return;
        }

        const errorMessage = await response.text();
        message.textContent = errorMessage || "Could not create ticket.";
    } catch (error) {
        console.error("Could not create ticket:", error);
        message.textContent = "Could not connect to the server.";
    }
}

async function loadProjectOptions() {
    const select = document.getElementById("project");
    if (select === null) return;

    const response = await fetch("/projects");
    if (!response.ok) return;

    const projects = await response.json();

    projects.forEach(function (project) {
        const option = document.createElement("option");
        option.value = project.id;
        option.textContent = project.name + " (" + project.projectKey + ")";
        select.appendChild(option);
    });
}

async function loadAssigneeOptions() {
    const select = document.getElementById("assignee");
    if (select === null) return;

    const response = await fetch("/users");
    if (!response.ok) return;

    const users = await response.json();

    users.forEach(function (user) {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent =
            user.name + " - " + user.email + " (" + user.userType + ")";
        select.appendChild(option);
    });
}

async function loadProjects() {
    const list = document.getElementById("projects-list");
    if (list === null) return;

    const response = await fetch("/projects");
    if (!response.ok) {
        list.textContent = "Could not load projects.";
        return;
    }

    const projects = await response.json();
    list.replaceChildren();

    projects.forEach(function (project) {
        const section = document.createElement("section");
        section.className = "project-card";

        const heading = document.createElement("h2");
        heading.textContent = project.name + " (" + project.projectKey + ")";
        section.appendChild(heading);

        const admin = document.createElement("p");
        admin.textContent = "Admin: " + (project.projectAdmin || "");
        section.appendChild(admin);

        const ticketsHeading = document.createElement("h3");
        ticketsHeading.textContent = "Tickets";
        section.appendChild(ticketsHeading);

        if (project.tickets === undefined || project.tickets.length === 0) {
            const empty = document.createElement("p");
            empty.textContent = "No tickets in this project yet.";
            section.appendChild(empty);
        } else {
            project.tickets.forEach(function (ticket) {
                const link = document.createElement("a");
                link.href = "/Ticket.html?id=" + ticket.id;
                link.className = "ticket-link";
                link.textContent =
                    ticket.ticketKey + " — " + ticket.summary +
                    " [" + ticket.status + "]";
                section.appendChild(link);
            });
        }

        list.appendChild(section);
    });
}

async function loadTicketDetails() {
    const params = new URLSearchParams(window.location.search);
    const ticketId = params.get("id");
    if (ticketId === null) return;

    const response = await fetch("/tickets/" + ticketId);
    if (!response.ok) {
        document.getElementById("ticket-details").textContent =
            "Ticket could not be found.";
        return;
    }

    const ticket = await response.json();

    document.getElementById("ticket-key").textContent = ticket.ticketKey;
    document.getElementById("ticket-title").textContent = ticket.title;
    document.getElementById("ticket-summary").textContent = ticket.summary;
    document.getElementById("ticket-description").textContent =
        ticket.details || "No description.";
    document.getElementById("ticket-project").textContent = ticket.projectName;
    document.getElementById("ticket-assignee").textContent =
        ticket.assigneeName || "Unassigned";
    document.getElementById("ticket-status").value = ticket.status;
}

async function updateTicketStatus() {
    const params = new URLSearchParams(window.location.search);
    const ticketId = params.get("id");
    const status = document.getElementById("ticket-status").value;

    const response = await fetch("/tickets/" + ticketId + "/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: status })
    });

    if (!response.ok) {
        alert("Couldn't update ticket status.");
        return;
    }

    alert("Ticket status updated.");
}

async function logout() {
    await fetch("/logout", { method: "POST" });
    window.location.href = "/Login.html";
}

loadProjects();
loadProjectOptions();
loadAssigneeOptions();
loadTicketDetails();
