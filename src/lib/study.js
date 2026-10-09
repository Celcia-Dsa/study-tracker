export const STORAGE_KEY = "my-study-space-topics";
export const CATEGORIES = [
  "Python",
  "DSA",
  "SQL",
  "Backend",
  "System Design",
  "Projects",
  "Other",
];
export function createEmptyForm() {
  return { title: "", category: "Python", notes: "", revisionNotes: "" };
}
export function getToday() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
export function formatDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
