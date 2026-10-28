/* PortfolioForge frontend. The browser talks only to the Express API. */
const API = "/api";
const $ = (id) => document.getElementById(id);
let authMode = "register";
let token = sessionStorage.getItem("pf_token") || "";
let currentUser = null;
let currentPortfolioId = null;
let toastTimer;

const defaults = {
  title: "My Portfolio", personName: "Your Name", headline: "Student • Future professional",
  about: "Write a short introduction about yourself, your interests, and your goals.",
  contactEmail: "", location: "", skills: "HTML, CSS, JavaScript",
  projects: "Portfolio Website - A responsive personal website\nStudent Planner - A simple study planning app",
  education: "B.Tech Student", template: "minimal", accent: "#6d5ce8", appearance: "light",
  showAbout: true, showSkills: true, showProjects: true, showEducation: true, showContact: true
};

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function cleanText(value, max=2000) { return String(value ?? "").trim().slice(0, max); }
function openAuth(mode="register") {
  authMode = mode;
  $("authTitle").textContent = mode === "register" ? "Create your account" : "Welcome back";
  $("authSubtitle").textContent = mode === "register" ? "Your personal portfolio workspace starts here." : "Log in to continue editing your portfolio.";
  $("authSubmit").textContent = mode === "register" ? "Create account" : "Log in";
  $("nameLabel").classList.toggle("hidden", mode !== "register");
  $("fullName").required = mode === "register";
  $("password").autocomplete = mode === "register" ? "new-password" : "current-password";
  $("switchText").textContent = mode === "register" ? "Already have an account?" : "New to PortfolioForge?";
  $("switchAuth").textContent = mode === "register" ? "Log in" : "Create an account";
  $("authError").textContent = "";
  $("authModal").classList.remove("hidden");
}
function closeAuth() { $("authModal").classList.add("hidden"); }

async function api(path, options={}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, { ...options, headers });
  let payload = {};
  try { payload = await response.json(); } catch {}
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}
function showWorkspace(user) {
  currentUser = user;
  $("hero").classList.add("hidden");
  $("features").classList.add("hidden");
  document.querySelector(".cta-band").classList.add("hidden");
  document.querySelector("footer").classList.add("hidden");
  document.querySelector(".topbar").classList.add("hidden");
  $("workspace").classList.remove("hidden");
  $("welcomeUser").textContent = `Hi, ${user.name}`;
}
function showLanding() {
  $("workspace").classList.add("hidden");
  $("hero").classList.remove("hidden");
  $("features").classList.remove("hidden");
  document.querySelector(".cta-band").classList.remove("hidden");
  document.querySelector("footer").classList.remove("hidden");
  document.querySelector(".topbar").classList.remove("hidden");
}
function collectForm() {
  return {
    title: cleanText($("portfolioTitle").value,100) || "My Portfolio",
    personName: cleanText($("personName").value,100) || "Your Name",
    headline: cleanText($("headline").value,160),
    about: cleanText($("about").value,1200),
    contactEmail: cleanText($("contactEmail").value,254),
    location: cleanText($("location").value,100),
    skills: cleanText($("skills").value,500),
    projects: cleanText($("projects").value,2000),
    education: cleanText($("education").value,600),
    template: $("template").value,
    accent: /^#[0-9a-f]{6}$/i.test($("accent").value) ? $("accent").value : "#6d5ce8",
    appearance: $("appearance").value,
    showAbout: $("showAbout").checked, showSkills: $("showSkills").checked,
    showProjects: $("showProjects").checked, showEducation: $("showEducation").checked,
    showContact: $("showContact").checked
  };
}
function setForm(data={}) {
  const merged = {...defaults, ...data};
  $("portfolioTitle").value = merged.title;
  $("personName").value = merged.personName;
  $("headline").value = merged.headline;
  $("about").value = merged.about;
  $("contactEmail").value = merged.contactEmail;
  $("location").value = merged.location;
  $("skills").value = merged.skills;
  $("projects").value = merged.projects;
  $("education").value = merged.education;
  $("template").value = ["minimal","bold","classic"].includes(merged.template) ? merged.template : "minimal";
  $("accent").value = /^#[0-9a-f]{6}$/i.test(merged.accent) ? merged.accent : "#6d5ce8";
  $("accentValue").textContent = $("accent").value.toUpperCase();
  $("appearance").value = merged.appearance === "dark" ? "dark" : "light";
  for (const field of ["showAbout","showSkills","showProjects","showEducation","showContact"]) $(field).checked = Boolean(merged[field]);
  renderPreview();
}
function projectItems(text) {
  return String(text || "").split("\n").map(line => line.trim()).filter(Boolean).slice(0,12).map(line => {
    const separator = line.indexOf(" - ");
    return separator >= 0 ? {name: line.slice(0,separator).trim(), description:line.slice(separator+3).trim()} : {name:line,description:""};
  });
}
function section(title, body, extra="") {
  return `<section class="site-section ${extra}"><h2>${escapeHTML(title)}</h2>${body}</section>`;
}
function renderPreview() {
  const d = collectForm();
  const skills = d.skills.split(",").map(s=>s.trim()).filter(Boolean).slice(0,30);
  const projects = projectItems(d.projects);
  const email = d.contactEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.contactEmail) ? d.contactEmail : "";
  let html = `<div class="portfolio-site ${d.appearance==="dark"?"dark":""} template-${d.template}" style="--site-accent:${d.accent}">
    <nav class="site-nav"><div class="site-logo">${escapeHTML(d.personName || d.title)}</div><div class="site-nav-links"><span>ABOUT</span><span>WORK</span><span>CONTACT</span></div></nav>
    <header class="site-hero"><div class="site-kicker">HELLO, I'M</div><h1>${escapeHTML(d.personName)}<span>.</span></h1><p class="site-headline">${escapeHTML(d.headline)}</p>
    ${d.showAbout ? `<p class="site-about">${escapeHTML(d.about)}</p>` : ""}
    ${d.location ? `<p class="site-location">⌖ ${escapeHTML(d.location)}</p>` : ""}</header>`;
  if (d.showSkills) html += section("Skills", `<div class="site-skill-list">${skills.length ? skills.map(s=>`<span class="site-skill">${escapeHTML(s)}</span>`).join("") : `<span class="site-skill">Add your skills in the editor</span>`}</div>`);
  if (d.showProjects) html += section("Selected projects", `<div class="site-project-grid">${projects.length ? projects.map(p=>`<article class="site-project"><h3>${escapeHTML(p.name)}</h3><p>${escapeHTML(p.description)}</p></article>`).join("") : `<p class="site-about">Add projects in the editor to show your work.</p>`}</div>`);
  if (d.showEducation) html += section("Education", `<p class="site-about">${escapeHTML(d.education || "Add your education details in the editor.")}</p>`);
  if (d.showContact) html += section("Let's connect", `${email ? `<p class="site-about">Interested in collaborating or learning more? Reach out.</p><a href="mailto:${escapeHTML(email)}">${escapeHTML(email)}</a>` : `<p class="site-about">Add a valid email address in the editor to show your contact link.</p>`}`, "site-contact");
  html += `</div>`;
  $("portfolioPreview").innerHTML = html;
  $("accentValue").textContent = d.accent.toUpperCase();
  $("saveStatus").textContent = "Unsaved changes";
  $("saveStatus").style.color = "#9a6b24";
}
function loadPortfolioIntoForm(portfolio) {
  currentPortfolioId = portfolio.id;
  setForm(portfolio.content || {});
  $("saveStatus").textContent = "Saved portfolio";
  $("saveStatus").style.color = "#368d65";
}
async function startWorkspace() {
  try {
    const me = await api("/auth/me");
    showWorkspace(me.user);
    const result = await api("/portfolios");
    if (result.portfolios.length) loadPortfolioIntoForm(result.portfolios[0]);
    else { currentPortfolioId = null; setForm(defaults); }
  } catch (error) {
    token = ""; sessionStorage.removeItem("pf_token");
    showLanding(); openAuth("login");
    $("authError").textContent = error.message;
  }
}
async function savePortfolio(event) {
  event.preventDefault();
  const content = collectForm();
  $("editorMessage").textContent = "Saving…";
  try {
    const result = currentPortfolioId
      ? await api(`/portfolios/${encodeURIComponent(currentPortfolioId)}`, {method:"PUT",body:JSON.stringify({content})})
      : await api("/portfolios", {method:"POST",body:JSON.stringify({content})});
    currentPortfolioId = result.portfolio.id;
    $("saveStatus").textContent = "All changes saved";
    $("saveStatus").style.color = "#368d65";
    $("editorMessage").textContent = "Portfolio saved securely to your account.";
    showToast("Portfolio saved successfully.");
  } catch (error) {
    $("editorMessage").textContent = error.message;
    $("editorMessage").style.color = "#bd3b4a";
  }
}
async function authenticate(event) {
  event.preventDefault();
  $("authError").textContent = "";
  const body = {email:$("email").value.trim(), password:$("password").value};
  if (authMode === "register") body.name = $("fullName").value.trim();
  $("authSubmit").disabled = true;
  $("authSubmit").textContent = "Please wait…";
  try {
    const result = await api(authMode === "register" ? "/auth/register" : "/auth/login", {method:"POST",body:JSON.stringify(body)});
    token = result.token;
    sessionStorage.setItem("pf_token",token);
    closeAuth();
    $("authForm").reset();
    await startWorkspace();
    showToast(authMode === "register" ? "Account created. Welcome!" : "Logged in successfully.");
  } catch (error) { $("authError").textContent = error.message; }
  finally {
    $("authSubmit").disabled = false;
    $("authSubmit").textContent = authMode === "register" ? "Create account" : "Log in";
  }
}
function openPortfolioPreview() {
  const d = collectForm();
  const preview = $("portfolioPreview").innerHTML;
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) { showToast("Allow pop-ups to open the preview."); return; }
  const css = Array.from(document.styleSheets).map(sheet => { try { return Array.from(sheet.cssRules).map(rule=>rule.cssText).join("\n"); } catch { return ""; } }).join("\n");
  w.document.open();
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHTML(d.title)}</title><style>${css}body{padding:25px;background:#f7f7fb}.portfolio-preview{max-width:1000px;margin:auto}.portfolio-site{border-radius:12px}</style></head><body><div class="portfolio-preview">${preview}</div></body></html>`);
  w.document.close();
}
document.addEventListener("DOMContentLoaded", () => {
  $("year").textContent = new Date().getFullYear();
  ["navRegister","heroStart","ctaStart"].forEach(id => $(id).addEventListener("click",()=>openAuth("register")));
  $("navLogin").addEventListener("click",()=>openAuth("login"));
  $("closeAuth").addEventListener("click",closeAuth);
  $("authModal").addEventListener("click",e=>{if(e.target===$("authModal"))closeAuth();});
  $("switchAuth").addEventListener("click",()=>openAuth(authMode==="register"?"login":"register"));
  $("authForm").addEventListener("submit",authenticate);
  $("portfolioForm").addEventListener("submit",savePortfolio);
  $("logoutBtn").addEventListener("click",()=>{token="";currentUser=null;currentPortfolioId=null;sessionStorage.removeItem("pf_token");showLanding();showToast("You have logged out.");});
  $("newPortfolio").addEventListener("click",()=>{currentPortfolioId=null;setForm(defaults);$("editorMessage").textContent="New draft — save it to create a portfolio.";});
  $("openPreview").addEventListener("click",openPortfolioPreview);
  ["portfolioTitle","personName","headline","about","contactEmail","location","skills","projects","education","template","accent","appearance","showAbout","showSkills","showProjects","showEducation","showContact"].forEach(id=>{
    $(id).addEventListener("input",renderPreview);
    $(id).addEventListener("change",renderPreview);
  });
  setForm(defaults);
  if (token) startWorkspace();
});
