import { Task } from '@/lib/parsePlan';

export interface Mission {
  id: string;
  taskDescription: string;
  deadline: string;
  energyLevel: number;
  tasks: Task[];
  planMarkdown: string;
  revisedPlan: string;
  createdAt: string;
  riskScore: number;
}
