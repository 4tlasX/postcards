'use client';

interface GoalProgressBarProps {
  completed: number;
  total: number;
}

export function GoalProgressBar({ completed, total }: GoalProgressBarProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="goal-progress">
      <span className="goal-progress-label">Progress</span>
      <div className="goal-progress-bar">
        <div
          className="goal-progress-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="goal-progress-percent">{percent}%</span>
    </div>
  );
}
