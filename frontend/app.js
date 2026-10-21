const API =

    "http://localhost:5000/api";





/* ======================================================

   AUTHENTICATION HELPERS

====================================================== */



function getUser() {



    const saved =

        localStorage.getItem("currentUser");



    return saved

        ? JSON.parse(saved)

        : null;

}





function saveUser(user) {



    localStorage.setItem(

        "currentUser",

        JSON.stringify(user)

    );

}





function logout() {



    localStorage.removeItem(

        "currentUser"

    );



    localStorage.removeItem("authToken");

    window.location.href =

        "index.html";

}





/* ======================================================

   LOGIN

====================================================== */



async function login(event) {



    event.preventDefault();



    const email =

        document.getElementById("email").value;



    const password =

        document.getElementById("password").value;



    try {



        const response = await fetch(

            `${API}/login`,

            {

                method: "POST",



                headers: {

                    "Content-Type":

                        "application/json"

                },



                body: JSON.stringify({

                    email,

                    password

                })

            }

        );



        const result =

            await response.json();



        if (!response.ok) {

            showMessage(

                result.error,

                "error"

            );



            return;

        }



        saveUser(result.user);

        localStorage.setItem("authToken", result.token);



        if (

            result.user.role ===

            "organisation_admin"

        ) {



            window.location.href =

                "admin-dashboard.html";



        } else {



            window.location.href =

                "volunteer-dashboard.html";

        }



    } catch (error) {



        showMessage(

            "Could not connect to server.",

            "error"

        );

    }

}





/* ======================================================

   REGISTER

====================================================== */



function toggleRegistrationFields() {



    const role =

        document.getElementById(

            "registerRole"

        )?.value;



    const volunteerFields =

        document.getElementById(

            "volunteerFields"

        );



    const organisationFields =

        document.getElementById(

            "organisationFields"

        );



    if (!volunteerFields) return;



    volunteerFields.style.display =

        role === "volunteer"

            ? "grid"

            : "none";



    organisationFields.style.display =

        role === "organisation_admin"

            ? "block"

            : "none";

}





async function registerUser(event) {



    event.preventDefault();



    const role =

        document.getElementById(

            "registerRole"

        ).value;



    const data = {

        email:

            document.getElementById(

                "registerEmail"

            ).value,



        password:

            document.getElementById(

                "registerPassword"

            ).value,



        role,



        first_name:

            document.getElementById(

                "firstName"

            )?.value,



        last_name:

            document.getElementById(

                "lastName"

            )?.value,



        phone:

            document.getElementById(

                "phone"

            )?.value,



        location:

            document.getElementById(

                "location"

            )?.value,



        organisation_name:

            document.getElementById(

                "organisationName"

            )?.value

    };



    try {



        const response = await fetch(

            `${API}/register`,

            {

                method: "POST",



                headers: {

                    "Content-Type":

                        "application/json"

                },



                body:

                    JSON.stringify(data)

            }

        );



        const result =

            await response.json();



        if (!response.ok) {



            showMessage(

                result.error,

                "error"

            );



            return;

        }



        showMessage(

            "Account created successfully. You can now log in.",

            "success"

        );



    } catch (error) {



        showMessage(

            "Server connection failed.",

            "error"

        );

    }

}





/* ======================================================

   OPPORTUNITIES

====================================================== */



async function loadOpportunities() {



    const container =

        document.getElementById(

            "opportunityList"

        );



    if (!container) return;



    try {



        const response =

            await fetch(

                `${API}/opportunities`

            );



        const opportunities =

            await response.json();



        if (

            opportunities.length === 0

        ) {



            container.innerHTML =

                `<div class="empty">

                    No opportunities available.

                 </div>`;



            return;

        }



        container.innerHTML =

            opportunities.map(o => {



                const date =

                    new Date(

                        o.start_datetime

                    ).toLocaleDateString(

                        "en-ZA"

                    );



                return `



                <div class="item">



                    <div>



                        <h3>

                            ${o.title}

                        </h3>



                        <p>

                            ${o.organisation_name}

                        </p>



                        <p>

                            ${o.location}

                            •

                            ${date}

                        </p>



                        <p>

                            ${o.signed}

                            /

                            ${o.required_volunteers}

                            volunteers registered

                        </p>



                    </div>



                    <div class="item-actions">



                        <span class="badge">

                            ${o.status}

                        </span>



                        <a

                            class="btn small"

                            href="opportunity-details.html?id=${o.opportunity_id}"

                        >

                            View

                        </a>



                    </div>



                </div>

                `;



            }).join("");



    } catch (error) {



        container.innerHTML =

            `<div class="empty">

                Unable to load opportunities.

             </div>`;

    }

}





/* ======================================================

   OPPORTUNITY DETAILS

====================================================== */



async function loadOpportunityDetails() {



    const container =

        document.getElementById(

            "opportunityDetail"

        );



    if (!container) return;



    const params =

        new URLSearchParams(

            window.location.search

        );



    const id =

        params.get("id");



    try {



        const response =

            await fetch(

                `${API}/opportunities/${id}`

            );



        const o =

            await response.json();



        const start =

            new Date(o.start_datetime);



        const end =

            new Date(o.end_datetime);



        container.innerHTML = `



            <div class="grid grid-2">



                <div class="card">



                    <h2>

                        ${o.title}

                    </h2>



                    <p>

                        <strong>

                            Organisation:

                        </strong>

                        ${o.organisation_name}

                    </p>



                    <p>

                        <strong>

                            Location:

                        </strong>

                        ${o.location}

                    </p>



                    <p>

                        <strong>

                            Date:

                        </strong>



                        ${start.toLocaleDateString("en-ZA")}

                    </p>



                    <p>

                        <strong>

                            Time:

                        </strong>



                        ${start.toLocaleTimeString([], {

                            hour: "2-digit",

                            minute: "2-digit"

                        })}



                        -



                        ${end.toLocaleTimeString([], {

                            hour: "2-digit",

                            minute: "2-digit"

                        })}

                    </p>



                    <p>

                        <strong>

                            Volunteers:

                        </strong>



                        ${o.signed}

                        /

                        ${o.required_volunteers}

                    </p>



                </div>



                <div class="card">



                    <h3>Description</h3>



                    <p>

                        ${o.description}

                    </p>



                    <button

                        class="btn success"

                        onclick="applyForOpportunity(${o.opportunity_id})"

                    >

                        Apply Now

                    </button>



                </div>



            </div>

        `;



    } catch (error) {



        container.innerHTML =

            `<div class="empty">

                Opportunity could not be loaded.

             </div>`;

    }

}





/* ======================================================

   APPLY

====================================================== */



async function applyForOpportunity(

    opportunityId

) {



    const user =

        getUser();



    if (!user) {



        alert(

            "Please log in before applying."

        );



        window.location.href =

            "index.html";



        return;

    }



    if (

        user.role !== "volunteer"

    ) {



        alert(

            "Only volunteers can apply."

        );



        return;

    }



    try {



        const response =

            await fetch(

                `${API}/applications`,

                {

                    method: "POST",



                    headers: {

                        "Content-Type":

                            "application/json"

                    },



                    body: JSON.stringify({

                        volunteer_id:

                            user.user_id,



                        opportunity_id:

                            opportunityId

                    })

                }

            );



        const result =

            await response.json();



        if (!response.ok) {



            alert(result.error);



            return;

        }



        alert(

            "Application submitted successfully."

        );



    } catch (error) {



        alert(

            "Application could not be submitted."

        );

    }

}





/* ======================================================

   MY APPLICATIONS

====================================================== */



async function loadMyApplications() {



    const container =

        document.getElementById(

            "myApplicationList"

        );



    if (!container) return;



    const user =

        getUser();



    if (!user) return;



    const response =

        await fetch(

            `${API}/my-applications/${user.user_id}`

        );



    const data =

        await response.json();



    container.innerHTML =

        data.length

        ? data.map(a => `



            <div class="item">



                <div>



                    <h3>

                        ${a.title}

                    </h3>



                    <p>

                        ${a.location}

                    </p>



                    <p>

                        Applied:

                        ${new Date(

                            a.applied_at

                        ).toLocaleDateString("en-ZA")}

                    </p>



                </div>



                <span

                    class="badge ${a.status}"

                >

                    ${a.status}

                </span>



            </div>



        `).join("")



        :



        `<div class="empty">

            You have not applied

            for any opportunities yet.

         </div>`;

}





/* ======================================================

   POST OPPORTUNITY

====================================================== */



async function createOpportunity(

    event

) {



    event.preventDefault();



    const user =

        getUser();



    if (

        !user ||

        !user.organisation_id

    ) {



        alert(

            "Organisation account required."

        );



        return;

    }



    const data = {



        organisation_id:

            user.organisation_id,



        title:

            document.getElementById(

                "title"

            ).value,



        description:

            document.getElementById(

                "description"

            ).value,



        location:

            document.getElementById(

                "opportunityLocation"

            ).value,



        start_datetime:

            document.getElementById(

                "startDate"

            ).value,



        end_datetime:

            document.getElementById(

                "endDate"

            ).value,



        required_volunteers:

            Number(

                document.getElementById(

                    "requiredVolunteers"

                ).value

            )

    };



    const response =

        await fetch(

            `${API}/opportunities`,

            {

                method: "POST",



                headers: {

                    "Content-Type":

                        "application/json"

                },



                body:

                    JSON.stringify(data)

            }

        );



    if (response.ok) {



        alert(

            "Opportunity created successfully."

        );



        window.location.href =

            "admin-opportunities.html";



    } else {



        alert(

            "Opportunity could not be created."

        );

    }

}





/* ======================================================

   ADMIN APPLICANTS

====================================================== */



async function loadAdminApplicants() {



    const container =

        document.getElementById(

            "applicantList"

        );



    if (!container) return;



    const user =

        getUser();



    if (

        !user ||

        !user.organisation_id

    ) {



        container.innerHTML =

            "Organisation account required.";



        return;

    }



    const response =

        await fetch(

            `${API}/organisation/${user.organisation_id}/applications`

        );



    const applications =

        await response.json();



    container.innerHTML =

        applications.length

        ? applications.map(a => `



            <div class="item">



                <div>



                    <h3>

                        ${a.first_name}

                        ${a.last_name}

                    </h3>



                    <p>

                        ${a.opportunity_title}

                    </p>



                    <p>

                        ${a.location || ""}

                    </p>



                    <span

                        class="badge ${a.status}"

                    >

                        ${a.status}

                    </span>



                </div>



                <div class="item-actions">



                    <button

                        class="btn small success"

                        onclick="updateApplicationStatus(

                            ${a.application_id},

                            'accepted'

                        )"

                    >

                        Accept

                    </button>



                    <button

                        class="btn small danger"

                        onclick="updateApplicationStatus(

                            ${a.application_id},

                            'rejected'

                        )"

                    >

                        Reject

                    </button>



                </div>



            </div>



        `).join("")



        :



        `<div class="empty">

            No applications found.

         </div>`;

}





async function updateApplicationStatus(id, status) {
  const token = localStorage.getItem("authToken");
  if (!token) {
    alert("Your session has expired. Please log in again.");
    window.location.href = "index.html";
    return;
  }

  try {
    const response = await fetch(`${API}/applications/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      alert(result.error || "Unable to update application.");
      return;
    }

    if (status === "accepted") {
      if (!result.changed) {
        alert("This application was already accepted. No duplicate email was sent.");
      } else if (result.email_sent === true) {
        alert("Application accepted! An event-details email was sent to the volunteer.");
      } else {
        alert("Application accepted, but the email could not be sent. Check the backend terminal for the SMTP error.");
      }
    } else {
      alert(`Application ${status}.`);
    }

    if (typeof loadAdminApplicants === "function") {
      await loadAdminApplicants();
    }
  } catch (error) {
    console.error("Application update failed:", error);
    alert("Could not connect to the backend.");
  }
}





/* ======================================================

   ADMIN DASHBOARD

====================================================== */



async function loadAdminDashboard() {

    if (!document.getElementById("totalOpportunities") ||
        !document.getElementById("totalApplications") ||
        !document.getElementById("totalAccepted")) return;

    const user =

        getUser();



    if (

        !user ||

        !user.organisation_id

    ) return;



    const response =

        await fetch(

            `${API}/admin/dashboard/${user.organisation_id}`

        );



    const data =

        await response.json();



    document.getElementById(

        "totalOpportunities"

    ).textContent =

        data.opportunities;



    document.getElementById(

        "totalApplications"

    ).textContent =

        data.applications;



    document.getElementById(

        "totalAccepted"

    ).textContent =

        data.accepted;

}





/* ======================================================

   CHATBOT

====================================================== */



function createChatbot() {



    document.body.insertAdjacentHTML(

        "beforeend",



        `



        <button

            class="chatbot-button"

            onclick="toggleChatbot()"

            title="Chat with Volunteer Assistant"

        >

            💬

        </button>



        <div

            class="chatbot-window"

            id="chatbotWindow"

        >



            <div class="chatbot-header">

                Volunteer Assistant

            </div>



            <div

                class="chatbot-messages"

                id="chatbotMessages"

            >



                <div

                    class="chat-message bot"

                >

                    Hello! How can I help you

                    with volunteering today?

                </div>



            </div>



            <div class="chatbot-input">



                <input

                    id="chatbotInput"

                    placeholder="Type your question..."

                    onkeydown="

                        if(event.key === 'Enter')

                        sendChatMessage()

                    "

                >



                <button

                    onclick="sendChatMessage()"

                >

                    Send

                </button>



            </div>



        </div>



        `

    );

}





function toggleChatbot() {



    document

        .getElementById(

            "chatbotWindow"

        )

        .classList.toggle("open");

}





async function sendChatMessage() {



    const input =

        document.getElementById(

            "chatbotInput"

        );



    const message =

        input.value.trim();



    if (!message) return;



    const messageBox =

        document.getElementById(

            "chatbotMessages"

        );



    messageBox.insertAdjacentHTML(

        "beforeend",



        `

        <div

            class="chat-message user"

        >

            ${escapeHtml(message)}

        </div>

        `

    );



    input.value = "";



    try {



        const response =

            await fetch(

                `${API}/chatbot`,

                {

                    method: "POST",



                    headers: {

                        "Content-Type":

                            "application/json"

                    },



                    body:

                        JSON.stringify({

                            message

                        })

                }

            );



        const result =

            await response.json();



        messageBox.insertAdjacentHTML(

            "beforeend",



            `

            <div

                class="chat-message bot"

            >

                ${escapeHtml(result.reply)}

            </div>

            `

        );



    } catch (error) {



        messageBox.insertAdjacentHTML(

            "beforeend",



            `

            <div

                class="chat-message bot"

            >

                Sorry, the assistant

                is temporarily unavailable.

            </div>

            `

        );

    }



    messageBox.scrollTop =

        messageBox.scrollHeight;

}





/* ======================================================

   HELPERS

====================================================== */



function escapeHtml(text) {



    const div =

        document.createElement("div");



    div.textContent = text;



    return div.innerHTML;

}





function showMessage(

    text,

    type

) {



    const box =

        document.getElementById(

            "message"

        );



    if (!box) return;



    box.textContent = text;



    box.className =

        `message ${type}`;

}





/* ======================================================
   EDIT PROFILE
====================================================== */

async function loadEditableProfile() {
    const form = document.getElementById("editProfileForm");
    if (!form) return;
    const user = getUser();
    const token = localStorage.getItem("authToken");
    const message = document.getElementById("profileMessage");
    if (!user || !token) {
        message.textContent = "Please log in again to edit your profile.";
        return;
    }
    const expectedRole = form.dataset.role;
    if (expectedRole !== user.role) {
        message.textContent = "This profile page is not for your account type.";
        return;
    }
    try {
        const response = await fetch(`${API}/me/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load profile.");
        for (const field of form.querySelectorAll("[name]")) {
            field.value = data[field.name] ?? "";
        }
    } catch (err) {
        message.textContent = err.message;
    }
}

async function saveEditableProfile(event) {
    event.preventDefault();
    const form = document.getElementById("editProfileForm");
    const message = document.getElementById("profileMessage");
    const token = localStorage.getItem("authToken");
    if (!token) {
        message.textContent = "Please log in again.";
        return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    message.textContent = "Saving...";
    try {
        const response = await fetch(`${API}/me/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to save changes.");
        message.textContent = result.message;
    } catch (err) {
        message.textContent = err.message;
    } finally {
        submit.disabled = false;
    }
}

/* ======================================================
   PAGE INITIALISATION
====================================================== */



document.addEventListener(

    "DOMContentLoaded",

    () => {



        createChatbot();
        loadEditableProfile();



        loadOpportunities();



        loadOpportunityDetails();



        loadMyApplications();



        loadAdminApplicants();



        loadAdminDashboard();



        toggleRegistrationFields();

    }

);
