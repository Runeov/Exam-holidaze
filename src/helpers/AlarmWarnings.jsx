// --- helper: big centered alert with fade --------------------
export function showAlert(message, variant = "error", ms = 3000) {
  const colors = {
    error: "bg-red-600 text-white",
    warning: "bg-yellow-500 text-black",
    info: "bg-blue-500 text-white",
  };

  const alertDiv = document.createElement("div");
  alertDiv.className = `
    fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
    w-[32rem] max-w-[92%] p-6 text-lg font-semibold
    shadow-2xl rounded-xl z-[9999]
    opacity-0 scale-95 transition-all duration-300
    ${colors[variant] || colors.error}
  `;
  alertDiv.innerHTML = `<span>🚨 ${message}</span>`;

  document.body.appendChild(alertDiv);

  // fade in
  requestAnimationFrame(() => {
    alertDiv.classList.remove("opacity-0", "scale-95");
    alertDiv.classList.add("opacity-100", "scale-100");
  });

  // auto-remove with fade out
  setTimeout(() => {
    alertDiv.classList.remove("opacity-100", "scale-100");
    alertDiv.classList.add("opacity-0", "scale-95");
    setTimeout(() => alertDiv.remove(), 300);
  }, ms);
}
