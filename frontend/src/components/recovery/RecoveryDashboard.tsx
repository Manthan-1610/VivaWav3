import { Box, Stack, Typography } from "@mui/material";
import { ScoreCard } from "./ScoreCard";
import { StreakTracker } from "./StreakTracker";
import { XpLevelDisplay } from "./XpLevelDisplay";
import { BeforeAfterComparison } from "./BeforeAfterComparison";
import { RecoveryTimeline } from "./RecoveryTimeline";
import { RecoveryTrendChart } from "./RecoveryTrendChart";
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
      
      <RecoveryTrendChart points={data.trendPoints} />

      {data.dailyHabit && (
        <Box sx={{ p: 2, borderRadius: 4, bgcolor: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.25)" }}>
          <Typography sx={{ fontSize: 12, color: "#22c55e", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, mb: 0.5 }}>
            Daily Recovery Habit
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#f8fafc", lineHeight: 1.6 }}>
            {data.dailyHabit}
          </Typography>
        </Box>
      )}
      <BeforeAfterComparison before={data.before} after={data.after} />
      <RecoveryTimeline entries={data.entries} />
    </Stack>
  );
}