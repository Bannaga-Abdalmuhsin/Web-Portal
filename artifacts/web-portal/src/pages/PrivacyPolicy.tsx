export default function PrivacyPolicy() {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 800, margin: "0 auto", padding: "40px 24px", color: "#1a1a1a", lineHeight: 1.7 }}>
      <div style={{ marginBottom: 32 }}>
        <img src="/images/logo.png" alt="ACES Logo" style={{ height: 48, marginBottom: 16 }} />
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 4px" }}>Privacy Policy</h1>
        <p style={{ color: "#666", margin: 0 }}>ACES-MSD Fueling — Technician App</p>
        <p style={{ color: "#666", fontSize: 14, margin: "4px 0 0" }}>Last updated: May 2025</p>
      </div>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#002D62", marginBottom: 8 }}>1. Overview</h2>
        <p>
          The ACES-MSD Fueling app ("App") is developed and operated by Advanced Communications and Electronics Systems Company ("ACES", "we", "our"). This App is intended exclusively for internal use by authorised ACES field technicians and drivers. This Privacy Policy explains what data we collect, how it is used, and how it is protected.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#002D62", marginBottom: 8 }}>2. Data We Collect</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Account information:</strong> Name, email address, and employee zone provided at login.</li>
          <li><strong>Mission data:</strong> Fuel delivery records, odometer readings, tank readings, and mission completion reports submitted through the App.</li>
          <li><strong>Photos:</strong> Images of odometer meters and fuel tank readings captured for mission documentation.</li>
          <li><strong>Location:</strong> GPS coordinates recorded when logging fuel delivery activities in the field.</li>
          <li><strong>Device token:</strong> A push notification token used to deliver mission alerts to your device.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#002D62", marginBottom: 8 }}>3. How We Use Your Data</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li>To assign, track, and complete fuel delivery missions.</li>
          <li>To generate operational reports for ACES management.</li>
          <li>To send push notifications about new or updated mission assignments.</li>
          <li>To maintain accurate records of field activities for audit and compliance purposes.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#002D62", marginBottom: 8 }}>4. Camera &amp; Photos</h2>
        <p>
          The App requests access to your device's camera and photo library solely to photograph odometer readings and fuel tank levels as part of mission documentation. Images are uploaded securely to ACES internal servers and are not shared with any third parties.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#002D62", marginBottom: 8 }}>5. Location</h2>
        <p>
          Location data is collected when you log a fuel delivery activity to record the site of the operation. Location access is used only while the App is in use and is not tracked in the background. Location data is stored on ACES internal servers and is not shared with third parties.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#002D62", marginBottom: 8 }}>6. Data Sharing</h2>
        <p>
          We do not sell, rent, or share your personal data with any third parties. Data is accessible only to authorised ACES operations staff for internal management purposes.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#002D62", marginBottom: 8 }}>7. Data Security</h2>
        <p>
          All data transmitted between the App and ACES servers is encrypted using HTTPS/TLS. Access to the system is protected by authenticated login credentials. We apply industry-standard security practices to protect your information.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#002D62", marginBottom: 8 }}>8. Data Retention</h2>
        <p>
          Mission records and associated data are retained for as long as required for operational, audit, and legal compliance purposes. Employee account data is removed upon termination of employment or system access.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#002D62", marginBottom: 8 }}>9. Your Rights</h2>
        <p>
          If you have questions about the data we hold about you or wish to request correction or deletion, please contact your ACES system administrator or reach us at the address below.
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#002D62", marginBottom: 8 }}>10. Contact</h2>
        <p>
          Advanced Communications and Electronics Systems Company<br />
          Saudi Arabia<br />
          Email: <a href="mailto:info@aces-co.com" style={{ color: "#002D62" }}>info@aces-co.com</a>
        </p>
      </section>

      <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 20, marginTop: 8, fontSize: 13, color: "#999" }}>
        &copy; {new Date().getFullYear()} Advanced Communications and Electronics Systems Company. All rights reserved.
      </div>
    </div>
  );
}
