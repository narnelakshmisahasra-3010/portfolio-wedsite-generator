function validEmail(email) {
  return typeof email === "string" && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validPassword(password) {
  return typeof password === "string" && password.length >= 8 && password.length <= 72;
}
function validName(name) {
  return typeof name === "string" && name.trim().length >= 2 && name.trim().length <= 80;
}
function validPortfolioContent(content) {
  if (!content || typeof content !== "object" || Array.isArray(content)) return "Portfolio content must be an object.";
  const limits = { title:100, personName:100, headline:160, about:1200, contactEmail:254, location:100, skills:500, projects:2000, education:600 };
  for (const [key, max] of Object.entries(limits)) {
    if (content[key] !== undefined && (typeof content[key] !== "string" || content[key].length > max)) return `${key} must be text no longer than ${max} characters.`;
  }
  if (content.template !== undefined && !["minimal","bold","classic"].includes(content.template)) return "Choose a valid portfolio template.";
  if (content.appearance !== undefined && !["light","dark"].includes(content.appearance)) return "Choose a valid appearance.";
  if (content.accent !== undefined && (typeof content.accent !== "string" || !/^#[0-9a-f]{6}$/i.test(content.accent))) return "Accent must be a six-digit hex color.";
  for (const key of ["showAbout","showSkills","showProjects","showEducation","showContact"]) {
    if (content[key] !== undefined && typeof content[key] !== "boolean") return `${key} must be true or false.`;
  }
  return null;
}
module.exports = { validEmail, validPassword, validName, validPortfolioContent };
