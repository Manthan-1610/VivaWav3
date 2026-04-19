import { Stack, Typography } from "@mui/material";
import { ScoreCard } from "./ScoreCard";
import { StreakTracker } from "./StreakTracker";
import { XpLevelDisplay } from "./XpLevelDisplay";
import { BeforeAfterComparison } from "./BeforeAfterComparison";
import type { RecoveryState } from "../../types/vivawav3";

type Props = {
  data: RecoveryState | null;
  isLoading?: boolean;
};

export function RecoveryDashboard({ data, isLoading = false }: Props) {
  if (isLoading) {
    return <Typography sx={{ color: "#cbd5e1" }}>Loading recovery data...</Typography>;
  }

  if (!data) {
    return <Typography sx={{ color: "#cbd5e1" }}>No recovery data yet.</Typography>;
  }

  return (
    <Stack spacing={2}>
      <ScoreCard score={data.score} dateLabel={data.dateLabel} />
      <StreakTracker streakDays={data.streakDays} />
      <XpLevelDisplay
        xp={data.xp}
        level={data.level}
        nextLevelXp={data.nextLevelXp}
      />
      <BeforeAfterComparison before={data.before} after={data.after} />
    </Stack>
  );
}