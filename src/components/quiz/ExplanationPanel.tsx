interface ExplanationPanelProps {
  isCorrect: boolean;
  explanation: string;
}

export function ExplanationPanel({ isCorrect, explanation }: ExplanationPanelProps) {
  return (
    <div
      data-testid="explanation-panel"
      className={`border-l-4 p-4 bg-[var(--surface)] ${
        isCorrect ? 'border-[var(--success)]' : 'border-[var(--error)]'
      }`}
    >
      <p
        className={`text-sm font-semibold font-mono mb-2 ${
          isCorrect ? 'text-[var(--success)]' : 'text-[var(--error)]'
        }`}
      >
        {isCorrect ? 'Correct!' : 'Incorrect'}
      </p>
      <p className="text-sm text-[var(--text)] leading-relaxed">{explanation}</p>
    </div>
  );
}
