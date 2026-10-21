"use strict";

// Run from the project root with: node install-acceptance-email.js
// It preserves your existing Backend/server.js and Frontend/app.js,
// changing ONLY the application-decision route and its frontend handler.

const fs = require("node:fs");
const path = require("node:path");
const root = __dirname;
const backendPath = path.join(root, "Backend", "server.js");
const frontendPath = path.join(root, "Frontend", "app.js");
const modulePath = path.join(root, "Backend", "application-decision-email.js");

function fail(message) {
  console.error("Installation stopped:", message);
  process.exit(1);
}

if (![backendPath, frontendPath, modulePath].every((p) => fs.existsSync(p))) {
  fail("Expected Backend/server.js, Backend/application-decision-email.js, and Frontend/app.js. Extract this ZIP into your project root (New folder), not into Backend or Frontend.");
}

const server = fs.readFileSync(backendPath, "utf8");
const frontend = fs.readFileSync(frontendPath, "utf8");

if (!server.includes("function requireAuth(")) {
  fail("Your server.js is missing the JWT requireAuth middleware. Please use the profile-edit backend version before installing this add-on.");
}

const serverStart = server.search(/app\.put\(\s*["']\/api\/applications\/:id\/status["']/);
const frontendStart = frontend.indexOf("async function updateApplicationStatus(");
if (serverStart < 0 || frontendStart < 0) {
  fail("Could not find the existing application status route or updateApplicationStatus function. No files changed.");
}

const routeEndMatch = /^\}\);[ \t]*$/m.exec(server.slice(serverStart));
const functionEndMatch = /^\}[ \t]*$/m.exec(frontend.slice(frontendStart));
if (!routeEndMatch || !functionEndMatch) {
  fail("Could not safely locate the end of the existing route/function. No files changed.");
}
const serverEnd = serverStart + routeEndMatch.index + routeEndMatch[0].length;
const frontendEnd = frontendStart + functionEndMatch.index + functionEndMatch[0].length;

const replacementServer = `app.put(
  "/api/applications/:id/status",
  requireAuth,
  require("./application-decision-email")(pool)
);`;

const replacementFrontend = `async function updateApplicationStatus(id, status) {
  const token = localStorage.getItem("authToken");
  if (!token) {
    alert("Your session has expired. Please log in again.");
    window.location.href = "index.html";
    return;
  }

  try {
    const response = await fetch(\`\${API}/applications/\${id}/status\`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${token}\`
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
      alert(\`Application \${status}.\`);
    }

    if (typeof loadAdminApplicants === "function") {
      await loadAdminApplicants();
    }
  } catch (error) {
    console.error("Application update failed:", error);
    alert("Could not connect to the backend.");
  }
}`;

const updatedServer = server.slice(0, serverStart) + replacementServer + server.slice(serverEnd);
const updatedFrontend = frontend.slice(0, frontendStart) + replacementFrontend + frontend.slice(frontendEnd);

const backupServer = backendPath + ".backup-before-acceptance-email";
const backupFrontend = frontendPath + ".backup-before-acceptance-email";
if (fs.existsSync(backupServer) || fs.existsSync(backupFrontend)) {
  fail("Backups from an earlier installation already exist. Remove this installer or check your backups before running again. No files changed.");
}

fs.copyFileSync(backendPath, backupServer, fs.constants.COPYFILE_EXCL);
fs.copyFileSync(frontendPath, backupFrontend, fs.constants.COPYFILE_EXCL);
fs.writeFileSync(backendPath, updatedServer);
fs.writeFileSync(frontendPath, updatedFrontend);
console.log("Acceptance email feature installed.");
console.log("Only Backend/server.js and Frontend/app.js were edited.");
console.log("Original files backed up as *.backup-before-acceptance-email");
console.log("Now run: cd Backend && npm install nodemailer && node server.js");
