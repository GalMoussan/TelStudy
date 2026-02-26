type OptionState = 'default' | 'selected' | 'correct' | 'incorrect' | 'dimmed';

interface OptionButtonProps {
  index: number;
  option: string;
  state: OptionState;
  onClick: () => void;
  disabled?: boolean;
  keyHint?: string;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

const stateClasses: Record<OptionState, string> = {
  default:
    'border-[var(--border)] bg-[var(--surface)] text-[var(--text)]',
  selected:
    'border-[var(--accent)] bg-[var(--surface)] text-[var(--accent)]',
  correct:
    'border-[var(--success)] bg-[#052e16] text-[var(--success)]',
  incorrect:
    'border-[var(--error)] bg-[#1a0000] text-[var(--error)]',
  dimmed:
    'border-[var(--border)] opacity-40 text-[var(--muted)]',
};

export function OptionButton({ index, option, state, onClick, disabled, keyHint }: OptionButtonProps) {
  const letter = OPTION_LETTERS[index];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid="option-button"
      data-option-index={index}
      className={`flex w-full items-start gap-3 border px-4 py-3 text-left text-sm font-mono disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${stateClasses[state]}`}
    >
      <span className="shrink-0 font-semibold text-xs">
        [{letter}]
        {keyHint && (
          <span className="ml-1 text-[10px] text-[var(--muted)]">{keyHint}</span>
        )}
      </span>
      <span className="leading-relaxed">{option}</span>
    </button>
  );
}
