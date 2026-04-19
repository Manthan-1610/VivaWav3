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

      <Box sx={{ 
        p: 2.5, 
        borderRadius: 4, 
        background: "linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(0, 0, 0, 0.4))", 
        border: "1px solid rgba(34, 197, 94, 0.25)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.25)"
      }}>
        <Typography sx={{ 
          fontSize: 10, 
          color: "#4ade80", 
          fontWeight: 900, 
          textTransform: "uppercase", 
          letterSpacing: 1.2, 
          mb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4ade80', display: 'inline-block' }} />
          Daily Recovery Insight
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#f1f5f9", lineHeight: 1.7, fontWeight: 500 }}>
          {data.dailyHabit || "Consistency is key to metabolic recovery. Your next assessment will unlock a personalized habit recommendation based on your mobility trends."}
        </Typography>
      </Box>

      <BeforeAfterComparison before={data.before} after={data.after} />
      <RecoveryTimeline entries={data.entries} />
    </Stack>
  );
}