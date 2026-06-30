export function calculateRiskScore(params: {
  deadline: string;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  energyLevel: number;
}): { score: number; label: string; color: string; message: string } {
  const now = new Date();
  const deadlineDate = new Date(params.deadline);
  
  // Safe validation in case of unconfigured or invalid dates
  let hoursLeft = 0;
  if (params.deadline && !isNaN(deadlineDate.getTime())) {
    hoursLeft = Math.max(0, (deadlineDate.getTime() - now.getTime()) / 3600000);
  } else {
    // Default fallback: if no deadline or invalid deadline, treat as having a 2-hour window
    hoursLeft = 2;
  }

  const remainingTasks = params.totalTasks - params.completedTasks;
  const tasksDoneRatio = params.totalTasks > 0 
    ? params.completedTasks / params.totalTasks 
    : 0;
  
  const blockedPenalty = params.blockedTasks * 10;
  const energyBonus = (params.energyLevel / 10) * 15;
  
  const timeScore = Math.min(
    100,
    hoursLeft > 0 && remainingTasks > 0
      ? (hoursLeft / (remainingTasks * 0.25)) * 50
      : hoursLeft > 0 ? 100 : 0
  );
  
  const progressScore = tasksDoneRatio * 35;
  
  let score = Math.round(timeScore + progressScore + energyBonus - blockedPenalty);
  score = Math.max(0, Math.min(100, score));

  let label = "Danger Zone";
  let color = "#ef4444";
  let message = "Critical: drop non-essentials and work only on this now.";

  if (score >= 70) {
    label = "On Track";
    color = "#22c55e";
    message = "Keep this pace and you'll finish with time to spare.";
  } else if (score >= 40) {
    label = "At Risk";
    color = "#f59e0b";
    message = "You're falling behind — focus and eliminate distractions.";
  }

  return { score, label, color, message };
}
