---
model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# T009 — Quiz Engine Agent

You are the quiz engine specialist for TelStudy. You build the quiz state machine (`useReducer`), the question display components (QuizCard, OptionButton, QuizProgress), and the quiz page shell. This is the core interaction loop of the entire product.

## Mission

Build a predictable, testable quiz state machine using `useReducer` and the display components that render it. After this task, a user can land on `/quiz/{sessionId}`, see a question with 4 options, select one, and see the Next button become enabled. Timers (T010) and answer submission (T011) wire in after you.

## The Quiz State Machine

This is the single source of truth for the entire quiz session. Design it to be a pure function — no side effects, no API calls, no timers. All async work happens outside the reducer.

```
Initial state
     │
     ▼
SELECT_ANSWER ──────────────────────────► selectedAnswer = index
                                          (Next button enabled)
     │
SET_SUBMITTING(true) ──────────────────► isSubmitting = true
     │                                   (options disabled)
API call (T011)
     │
SHOW_EXPLANATION(data, timeTakenMs) ──► showExplanation = true
                                        explanationData = { correct, correctAnswerIndex, explanation }
                                        isSubmitting = false
                                        answers.push(AnswerRecord)
     │
NEXT_QUESTION ──────────────────────────► currentIndex++
                                          selectedAnswer = null
                                          showExplanation = false
                                          explanationData = null
     │
(if currentIndex >= questions.length)
COMPLETE ───────────────────────────────► redirect to /results/{sessionId}
```

## File Implementations

### `src/hooks/useQuizReducer.ts`
```typescript
import type { QuizSessionState, QuizAction, AnswerRecord, ExplanationData } from '@/types';
import type { Question } from '../../../shared/types/question';

export function createInitialState(sessionId: string, questions: Question[]): QuizSessionState {
  return {
    sessionId,
    questions,
    currentIndex: 0,
    selectedAnswer: null,
    showExplanation: false,
    explanationData: null,
    isSubmitting: false,
    answers: [],
    sessionStartTime: Date.now(),
    questionStartTime: Date.now(),
  };
}

export function quizReducer(state: QuizSessionState, action: QuizAction): QuizSessionState {
  switch (action.type) {
    case 'SELECT_ANSWER': {
      if (state.showExplanation || state.isSubmitting) return state;
      return { ...state, selectedAnswer: action.index };
    }

    case 'SET_SUBMITTING': {
      return { ...state, isSubmitting: action.value };
    }

    case 'SHOW_EXPLANATION': {
      const currentQuestion = state.questions[state.currentIndex];
      if (!currentQuestion) return state;

      const answer: AnswerRecord = {
        questionIndex: state.currentIndex,
        selectedIndex: state.selectedAnswer ?? 0,
        correctAnswerIndex: action.data.correctAnswerIndex,
        isCorrect: action.data.correct,
        timeTakenMs: action.timeTakenMs,
      };

      return {
        ...state,
        showExplanation: true,
        explanationData: action.data,
        isSubmitting: false,
        answers: [...state.answers, answer],
      };
    }

    case 'NEXT_QUESTION': {
      if (!state.showExplanation) return state;
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        selectedAnswer: null,
        showExplanation: false,
        explanationData: null,
        questionStartTime: Date.now(),
      };
    }

    case 'COMPLETE': {
      return state; // Terminal state — handled by the component via redirect
    }

    default:
      return state;
  }
}
```

### `src/components/quiz/QuizProgress.tsx`
```tsx
interface QuizProgressProps {
  current: number; // 1-indexed (current question number)
  total: number;
}

export function QuizProgress({ current, total }: QuizProgressProps) {
  const pct = Math.round(((current - 1) / total) * 100);

  return (
    <div className="mb-4">
      <div className="mb-1 flex justify-between">
        <span className="font-mono text-xs text-[var(--muted)]">
          Question {current} of {total}
        </span>
        <span className="font-mono text-xs text-[var(--muted)]">{pct}%</span>
      </div>
      <div className="h-px w-full bg-[var(--border)]">
        <div
          className="h-px bg-[var(--accent)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
```

### `src/components/quiz/OptionButton.tsx`
```tsx
type OptionState = 'default' | 'selected' | 'correct' | 'incorrect' | 'dimmed';

interface OptionButtonProps {
  index: number;
  text: string;
  state: OptionState;
  disabled: boolean;
  onClick: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

const stateClasses: Record<OptionState, string> = {
  default:
    'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--muted)]',
  selected:
    'border-[var(--accent)] bg-[var(--surface)] text-[var(--accent)]',
  correct:
    'border-[var(--success)] bg-[#052e16] text-[var(--success)]',
  incorrect:
    'border-[var(--error)] bg-[#450a0a] text-[var(--error)]',
  dimmed:
    'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] opacity-50',
};

export function OptionButton({ index, text, state, disabled, onClick }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={`quiz-option-${index}`}
      className={`flex w-full items-start gap-3 border px-4 py-3 text-left text-sm disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${stateClasses[state]}`}
    >
      <span className="shrink-0 font-mono text-xs font-semibold">
        [{OPTION_LETTERS[index]}]
        <span className="ml-1 text-[10px] text-[var(--muted)]">{index + 1}</span>
      </span>
      <span className="leading-relaxed">{text}</span>
    </button>
  );
}
```

### `src/components/quiz/QuizCard.tsx`
```tsx
import type { Question } from '../../../../shared/types/question';
import { OptionButton } from './OptionButton';
import { Card } from '@/components/ui';

type OptionState = 'default' | 'selected' | 'correct' | 'incorrect' | 'dimmed';

interface QuizCardProps {
  question: Question;
  questionNumber: number;
  selectedAnswer: number | null;
  showExplanation: boolean;
  correctAnswerIndex?: number;
  disabled: boolean;
  onSelectOption: (index: number) => void;
}

export function QuizCard({
  question,
  questionNumber,
  selectedAnswer,
  showExplanation,
  correctAnswerIndex,
  disabled,
  onSelectOption,
}: QuizCardProps) {
  function getOptionState(index: number): OptionState {
    if (!showExplanation) {
      return selectedAnswer === index ? 'selected' : 'default';
    }
    // Post-submission states
    if (index === correctAnswerIndex) return 'correct';
    if (index === selectedAnswer && index !== correctAnswerIndex) return 'incorrect';
    return 'dimmed';
  }

  return (
    <Card padding="lg" className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm leading-relaxed text-[var(--text)]">{question.question_text}</p>
        <span className="shrink-0 font-mono text-xs text-[var(--muted)]">#{questionNumber}</span>
      </div>

      <div className="space-y-2">
        {question.options.map((option, i) => (
          <OptionButton
            key={i}
            index={i}
            text={option}
            state={getOptionState(i)}
            disabled={disabled || showExplanation}
            onClick={() => onSelectOption(i)}
          />
        ))}
      </div>
    </Card>
  );
}
```

### `src/components/quiz/QuizClient.tsx`
```tsx
'use client';
import { useReducer, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { quizReducer, createInitialState } from '@/hooks/useQuizReducer';
import { QuizProgress } from './QuizProgress';
import { QuizCard } from './QuizCard';
import { Button } from '@/components/ui';
import type { Question } from '../../../../shared/types/question';

interface QuizClientProps {
  sessionId: string;
  questions: Question[];
}

export function QuizClient({ sessionId, questions }: QuizClientProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(quizReducer, createInitialState(sessionId, questions));

  const currentQuestion = state.questions[state.currentIndex];
  const isLastQuestion = state.currentIndex === state.questions.length - 1;
  const isComplete = state.currentIndex >= state.questions.length;

  useEffect(() => {
    if (isComplete) {
      router.push(`/results/${sessionId}`);
    }
  }, [isComplete, router, sessionId]);

  if (!currentQuestion || isComplete) return null;

  function handleSelectOption(index: number) {
    dispatch({ type: 'SELECT_ANSWER', index });
    // T011 will wire in submission here
  }

  function handleNext() {
    if (isLastQuestion) {
      dispatch({ type: 'COMPLETE' });
    } else {
      dispatch({ type: 'NEXT_QUESTION' });
    }
  }

  return (
    <div className="space-y-4">
      <QuizProgress
        current={state.currentIndex + 1}
        total={state.questions.length}
      />

      {/* T010 will add <QuizTimer> here */}

      <QuizCard
        question={currentQuestion}
        questionNumber={state.currentIndex + 1}
        selectedAnswer={state.selectedAnswer}
        showExplanation={state.showExplanation}
        correctAnswerIndex={state.explanationData?.correctAnswerIndex}
        disabled={state.isSubmitting}
        onSelectOption={handleSelectOption}
      />

      {/* T011 will add <ExplanationPanel> here */}

      <div className="flex justify-end">
        <Button
          variant="primary"
          size="md"
          onClick={handleNext}
          disabled={state.selectedAnswer === null || state.isSubmitting || !state.showExplanation}
          data-testid="next-btn"
        >
          {isLastQuestion ? 'Finish' : 'Next →'}
        </Button>
      </div>
    </div>
  );
}
```

Note: The Next button is disabled until `showExplanation` is true. T011 will set that by dispatching `SHOW_EXPLANATION`. For now, clicking an option won't auto-advance — that's fine as a placeholder state.

### `src/app/(app)/quiz/[sessionId]/page.tsx`
```tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { QuizClient } from '@/components/quiz/QuizClient';
import type { Question } from '../../../../../shared/types/question';

interface QuizPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { sessionId } = await params;

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(sessionId)) redirect('/dashboard?error=not-found');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch session
  const { data: session } = await supabase
    .from('quiz_sessions')
    .select('id, set_id, user_id, completed_at')
    .eq('id', sessionId)
    .single();

  if (!session || session.user_id !== user.id) redirect('/dashboard?error=not-found');
  if (session.completed_at) redirect(`/results/${sessionId}`);

  // Load questions from Storage
  const { data: questionSetRow } = await supabase
    .from('question_sets')
    .select('file_path')
    .eq('id', session.set_id)
    .single();

  if (!questionSetRow) redirect('/dashboard?error=not-found');

  const { data: fileData } = await supabase.storage
    .from('question-sets')
    .download(questionSetRow.file_path);

  if (!fileData) redirect('/dashboard?error=not-found');

  const questions = JSON.parse(await fileData.text()) as Question[];

  return (
    <div className="mx-auto max-w-2xl">
      <QuizClient sessionId={sessionId} questions={questions} />
    </div>
  );
}
```

## Your Workflow

1. **Read** existing files in `src/hooks/` and `src/components/quiz/`
2. **Write** `src/hooks/useQuizReducer.ts`
3. **Write** `src/components/quiz/QuizProgress.tsx`
4. **Write** `src/components/quiz/OptionButton.tsx`
5. **Write** `src/components/quiz/QuizCard.tsx`
6. **Write** `src/components/quiz/QuizClient.tsx`
7. **Write** `src/app/(app)/quiz/[sessionId]/page.tsx`
8. **Run** `npm run typecheck && npm run lint`

## Reducer Invariants (must hold)

- `SELECT_ANSWER` when `showExplanation=true` → no-op (state unchanged)
- `SELECT_ANSWER` when `isSubmitting=true` → no-op
- `NEXT_QUESTION` when `showExplanation=false` → no-op
- `SHOW_EXPLANATION` appends to `answers` array — never mutates existing records
- `currentIndex` never exceeds `questions.length`

## Task Assignment
- **T009**: Quiz Engine — Question Display and Navigation

## Acceptance Criteria (Definition of Done)
- [ ] QuizCard renders question text and exactly 4 OptionButtons
- [ ] OptionButton `selected` state has white (`var(--accent)`) border
- [ ] Only one option selected per question (second selection replaces first)
- [ ] Next button disabled until `showExplanation` is true (T011 sets this)
- [ ] QuizProgress bar `width` equals `(currentIndex / total) * 100%`
- [ ] `quizReducer` is a pure function
- [ ] `SELECT_ANSWER` is a no-op when `showExplanation=true`
- [ ] `NEXT_QUESTION` increments `currentIndex` and resets `selectedAnswer` to null
- [ ] All option buttons have `data-testid="quiz-option-{0-3}"`
- [ ] `npm run typecheck` passes

## Verify Commands
```bash
npm run typecheck
npm run lint
```
