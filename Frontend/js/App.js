function login(event) {
    event.preventDefault();

    window.location.href = "/Index.html";
}

function register(event) {
    event.preventDefault();

    window.location.href = "/Index.html";
}

function createProject(projectKey, name, projectAdmin) {
    console.log(projectKey, name, projectAdmin);

    fetch("/projects", {
        method: "POST",
        body: JSON.stringify({
            projectKey: projectKey,
            name: name,
            projectAdmin: projectAdmin
        }),
        headers: {
            "Content-Type": "application/json; charset=UTF-8"
        }
    })
        .then(response => {
            if (response.ok) {
                window.location.href = "/Index.html";
            } else {
                alert("Could not create project.");
            }
        });
}

function createUser(name, email, password, userType) {
    console.log(name, email, password, userType);

    fetch("/users", {
        method: "POST",
        body: JSON.stringify({
            name: name,
            email: email,
            password: password,
            userType: userType
        }),
        headers: {
            "Content-Type": "application/json; charset=UTF-8"
        }
    })
        .then(response => {
            if (response.ok) {
                window.location.href = "/Index.html";
            } else {
                alert("Could not create user.");
            }
        });
}

async function loadProjects() {
    const response = await fetch("/projects");

    if (!response.ok) {
        console.log("Could not load projects.");
        return;
    }

    const projects = await response.json();

    const projectsList = document.getElementById("projects-list");

    projectsList.innerHTML = "";

    projects.forEach(project => {
        projectsList.innerHTML += `
            <section class="project-card">

                <div class="project-header">

                    <div>
                        <span class="project-key">
                            ${project.projectKey}
                        </span>

                        <h2>${project.name}</h2>
                    </div>

                    <span class="project-admin">
                        Admin: ${project.projectAdmin ?? ""}
                    </span>

                </div>

                <div class="tickets-section">

                    <h3>Tickets</h3>

                    <div class="empty-state">
                        No tickets in this project yet.
                    </div>

                </div>

            </section>
        `;
    });
}
loadProjects();

async function createTicket() {
    const title = document.getElementById("title").value.trim();
    const summary = document.getElementById("summary").value.trim();
    const details = document.getElementById("details").value.trim();
    const projectId = Number(document.getElementById("project").value);
    const creatorId = Number(document.getElementById("creator").value);
    const assigneeValue = document.getElementById("assignee").value;

    if (title === "" || summary === "" || projectId === 0 || creatorId === 0) {
        alert("Enter a title and summary, and choose a project and creator.");
        return;
    }

    const ticket = {
        title: title,
        summary: summary,
        details: details,
        projectId: projectId,
        creatorId: creatorId,
        assigneeId: assigneeValue === "" ? null : Number(assigneeValue)
    };

    try {
        const response = await fetch("/tickets", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(ticket)
        });

        if (!response.ok) {
            const error = await response.text();
            alert("Could not create ticket. " + error);
            return;
        }

        window.location.href = "/Index.html";
    } catch (error) {
        console.error("Could not create ticket:", error);
        alert("Could not connect to the server.");
    }
}

async function loadProjectOptions() {
    const projectSelect = document.getElementById("project");

    if (projectSelect === null) {
        return;
    }

    try {
        const response = await fetch("/projects");

        if (!response.ok) {
            console.log("Could not load projects.");
            return;
        }

        const projects = await response.json();

        projects.forEach(function (project) {
            const option = document.createElement("option");
            option.value = project.id;
            option.textContent = project.name + " (" + project.projectKey + ")";
            projectSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Could not load projects:", error);
    }
}

async function loadUserOptions() {
    const creatorSelect = document.getElementById("creator");
    const assigneeSelect = document.getElementById("assignee");

    if (creatorSelect === null || assigneeSelect === null) {
        return;
    }

    try {
        const response = await fetch("/users");

        if (!response.ok) {
            console.log("Could not load users.");
            return;
        }

        const users = await response.json();

        users.forEach(function (user) {
            const role = user.userType ? " (" + user.userType + ")" : "";
            const label = user.name + " - " + user.email + role;

            const creatorOption = document.createElement("option");
            creatorOption.value = user.id;
            creatorOption.textContent = label;
            creatorSelect.appendChild(creatorOption);

            const assigneeOption = document.createElement("option");
            assigneeOption.value = user.id;
            assigneeOption.textContent = label;
            assigneeSelect.appendChild(assigneeOption);
        });
    } catch (error) {
        console.error("Could not load users:", error);
    }
}

loadProjectOptions();
loadUserOptions();
