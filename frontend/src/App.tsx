import { useEffect, useState } from "react";
import { Box, Container, Typography, CssBaseline } from "@mui/material";
import { AssessmentView } from "./components/assessment/AssessmentView";
import { RecoveryDashboard } from "./components/recovery/RecoveryDashboard";
import { PractitionerDashboard } from "./components/practitioner/PractitionerDashboard";
import type { ClientSummary, RecoveryState } from "./types/vivawav3";

export function App() {
  const [recoveryData, setRecoveryData] = useState<RecoveryState | null>(null);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [isRecoveryLoading, setIsRecoveryLoading] = useState(true);
  const [isPractitionerLoading, setIsPractitionerLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsRecoveryLoading(true);
        setIsPractitionerLoading(true);

        const [recoveryRes, clientsRes] = await Promise.all([
          fetch("/api/recovery/current"),
          fetch("/api/clients"),
        ]);

        if (recoveryRes.ok) {
          const recoveryJson = (await recoveryRes.json()) as RecoveryState;
          setRecoveryData(recoveryJson);
        } else {
          setRecoveryData(null);
        }

        if (clientsRes.ok) {
          const clientsJson = (await clientsRes.json()) as ClientSummary[];
          setClients(clientsJson);
        } else {
          setClients([]);
        }
      } catch (error) {
        console.error("Failed to load backend data:", error);
        setRecoveryData(null);
        setClients([]);
      } finally {
        setIsRecoveryLoading(false);
        setIsPractitionerLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", py: 3, bgcolor: "#0b1220" }}>
        <Container maxWidth="xl">
          <Typography
            sx={{ color: "#f8fafc", fontSize: 32, fontWeight: 900, mb: 2 }}
          >
            ViVaWav3
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "stretch",
            }}
          >
            <Box sx={{ flex: "1 1 320px" }}>
              <Typography sx={{ color: "#A8BBA3", mb: 1, fontWeight: 700 }}>
                Assessment
              </Typography>
              <AssessmentView />
            </Box>

            <Box sx={{ flex: "1 1 320px" }}>
              <Typography sx={{ color: "#A8BBA3", mb: 1, fontWeight: 700 }}>
                Recovery
              </Typography>
              <RecoveryDashboard
                data={recoveryData}
                isLoading={isRecoveryLoading}
              />
            </Box>

            <Box sx={{ flex: "1 1 320px" }}>
              <Typography sx={{ color: "#A8BBA3", mb: 1, fontWeight: 700 }}>
                Practitioner
              </Typography>
              <PractitionerDashboard
                clients={clients}
                trendPoints={recoveryData?.trendPoints ?? []}
                isLoading={isPractitionerLoading}
              />
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}