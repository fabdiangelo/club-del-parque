import React from "react";

function Footer() {
  return (
    <footer style={{ backgroundColor: "white", padding: "20px 0", textAlign: "center" }}>
      <p style={{ color: "var(--neutro)", fontSize: "14px" }}>
        © {new Date().getFullYear()} Club del Parque. Todos los derechos reservados.
      </p>
    </footer>
  );
}

export default Footer;