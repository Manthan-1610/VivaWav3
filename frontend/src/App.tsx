import { AssessmentView } from "./components/assessment/AssessmentView";
import { RecoveryDashboard } from "./components/recovery/RecoveryDashboard";
import { PractitionerDashboard } from "./components/practitioner/PractitionerDashboard";

export function App() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem" }}>
      <h1 style={{ marginTop: 0 }}>ViVaWav3</h1>
      <p style={{ color: "#475569" }}>
        Frontend scaffold — feature flows are not implemented yet.
      </p>
      <section style={{ marginTop: "2rem" }}>
        <AssessmentView />
      </section>
      <section style={{ marginTop: "2rem" }}>
        <RecoveryDashboard />
      </section>
      <section style={{ marginTop: "2rem" }}>
        <PractitionerDashboard />
      </section>
    </main>
  );
}
