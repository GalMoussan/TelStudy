import type { Question } from '../../../shared/types/question';

type OptionState = 'default' | 'selected' | 'correct' | 'incorrect' | 'dimmed';

interface QuizCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: number | null;
  showExplanation: boolean;
  correctAnswerIndex?: number;
  disabled: boolean;
  onSelectOption: (index: number) => void;
}

function getOptionState(
  index: number,
  selectedAnswer: number | null,
  showExplanation: boolean,
  correctAnswerIndex?: number,
): OptionState {
  if (!showExplanation) {
    return selectedAnswer === index ? 'selected' : 'default';
  }
  // Post-submission states
  if (index === correctAnswerIndex) return 'correct';
  if (index === selectedAnswer && index !== correctAnswerIndex) return 'incorrect';
  return 'dimmed';
}

export function QuizCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  showExplanation,
  correctAnswerIndex,
  disabled,
  onSelectOption,
}: QuizCardProps) {
  return (
    <div
      data-testid="quiz-card"
      className="border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm leading-relaxed text-[var(--text)]">{question.question_text}</p>
        <span className="shrink-0 font-mono text-xs text-[var(--muted)]">
          #{questionNumber}/{totalQuestions}
        </span>
      </div>

      <div className="space-y-2">
        {question.options.map((option, i) => {
          const state = getOptionState(i, selectedAnswer, showExplanation, correctAnswerIndex);
          const isDisabled = disabled || showExplanation;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectOption(i)}
              disabled={isDisabled}
              data-testid="option-button"
              data-option-index={i}
              className={`flex w-full items-start gap-3 border px-4 py-3 text-left text-sm font-mono disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${getOptionStateClasses(state)}`}
            >
              <span className="shrink-0 font-semibold text-xs">
                [{['A', 'B', 'C', 'D'][i]}]
              </span>
              <span className="leading-relaxed">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getOptionStateClasses(state: OptionState): string {
  switch (state) {
    case 'default':
      return 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)]';
    case 'selected':
      return 'border-[var(--accent)] bg-[var(--surface)] text-[var(--accent)]';
    case 'correct':
      return 'border-[var(--success)] bg-[#052e16] text-[var(--success)]';
    case 'incorrect':
      return 'border-[var(--error)] bg-[#1a0000] text-[var(--error)]';
    case 'dimmed':
      return 'border-[var(--border)] opacity-40 text-[var(--muted)]';
  }
}
