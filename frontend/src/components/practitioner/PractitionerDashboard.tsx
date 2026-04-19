import { Stack, Typography } from "@mui/material";
import { RealTimeIndicator } from "./RealTimeIndicator";
import { ClientList } from "./ClientList";
import { ClientTrendChart } from "./ClientTrendChart";
import type { ClientSummary } from "../../types/vivawav3";

type Props = {
  clients: ClientSummary[];
  trendPoints: number[];
  isLoading?: boolean;
};

export function PractitionerDashboard({
  clients,
  trendPoints,
  isLoading = false,
}: Props) {
  if (isLoading) {
    return (
      <Typography sx={{ color: "#cbd5e1" }}>
        Loading practitioner data...
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography sx={{ color: "#cbd5e1", fontSize: 13 }}>
        Clinic-side recovery view for quick trend checks
      </Typography>

      <RealTimeIndicator connected />

      <ClientList clients={clients} />

      <ClientTrendChart points={trendPoints} />
    </Stack>
  );
}