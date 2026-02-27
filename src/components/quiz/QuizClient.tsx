'use client';
import { useReducer, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { quizReducer, createInitialState } from '@/hooks/useQuizReducer';
import { useQuizTimers } from '@/hooks/useQuizTimers';
import { useQuizKeyboard } from '@/hooks/useQuizKeyboard';
import { QuizProgress } from './QuizProgress';
import { QuizTimer } from './QuizTimer';
import { QuizCard } from './QuizCard';
import { ExplanationPanel } from './ExplanationPanel';
import { Button, ErrorBanner, Spinner } from '@/components/ui';
import type { Question } from '../../../shared/types/question';

interface QuizClientProps {
  sessionId: string;
  questions: Question[];
  setId: string;
}

export function QuizClient({ sessionId, questions, setId: _setId }: QuizClientProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(quizReducer, createInitialState(sessionId, questions));
  const { cumulativeElapsed, perQuestionElapsed, captureQuestionTime } = useQuizTimers();
  const capturedTimeRef = useRef<number>(0);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const isReviewing = state.reviewIndex !== null;
  const reviewAnswer = isReviewing && state.reviewIndex !== null ? state.answers[state.reviewIndex] : null;
  const reviewQuestion = isReviewing && state.reviewIndex !== null ? state.questions?.[state.reviewIndex] : null;

  const currentQuestion = state.questions?.[state.currentIndex];
  const totalQuestions = state.questions?.length ?? 0;
  const isLastQuestion = state.currentIndex === totalQuestions - 1;
  const isComplete = state.currentIndex >= totalQuestions;

  useEffect(() => {
    if (state.isComplete) {
      router.push(`/results/${sessionId}`);
    }
  }, [state.isComplete, router, sessionId]);

  // Keyboard navigation: 1-4 to select, Enter to advance
  useQuizKeyboard({
    onSelectOption: (index: number) => {
      if (!isReviewing && !state.showExplanation && !state.isSubmitting) {
        void handleSelectOption(index);
      }
    },
    onNext: () => {
      if (!isReviewing && state.showExplanation && !state.isSubmitting) {
        void handleNext();
      }
    },
    disabled: state.isSubmitting || isReviewing,
  });

  if (!currentQuestion || isComplete) return null;

  async function handleSelectOption(index: number) {
    if (!currentQuestion) return;

    // Client-side check: is this already a tried-wrong option?
    if (state.wrongAttempts.includes(index)) return;

    const isCorrect = index === currentQuestion.correct_answer_index;

    if (!isCorrect) {
      // Mark as tried-wrong and let user try again — no API call yet
      dispatch({ type: 'MARK_WRONG_ATTEMPT', index });
      return;
    }

    // Correct answer — finalize and submit
    capturedTimeRef.current = captureQuestionTime();
    // Record first wrong attempt if any (question counts as wrong), else record correct
    const recordedIndex = state.wrongAttempts.length > 0 ? state.wrongAttempts[0] : index;

    dispatch({ type: 'SELECT_ANSWER', index });
    dispatch({ type: 'SET_SUBMITTING', value: true });
    setNetworkError(null);

    const questionIndex = state.currentIndex;

    try {
      const res = await fetch(`/api/quiz/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_index: questionIndex,
          answer_index: recordedIndex,
          time_taken_ms: capturedTimeRef.current,
        }),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? 'Submission failed');
      }

      const json = (await res.json()) as {
        isCorrect: boolean;
        correctIndex: number;
        explanation: string;
      };

      dispatch({
        type: 'SHOW_EXPLANATION',
        data: {
          isCorrect: json.isCorrect,
          correctIndex: json.correctIndex,
          explanation: json.explanation,
        },
        timeTakenMs: capturedTimeRef.current,
        recordedIndex,
      });
    } catch (err) {
      dispatch({ type: 'SET_SUBMITTING', value: false });
      setNetworkError(err instanceof Error ? err.message : 'Submission failed');
    }
  }

  async function handleNext() {
    setNetworkError(null);
    if (isLastQuestion) {
      try {
        await fetch(`/api/quiz/${sessionId}/complete`, { method: 'POST' });
      } catch {
        // Best-effort — continue with redirect even if this fails
      }
      dispatch({ type: 'COMPLETE' });
    } else {
      dispatch({ type: 'NEXT_QUESTION' });
    }
  }

  // --- Review mode render ---
  if (isReviewing && reviewAnswer && reviewQuestion) {
    const reviewIdx = state.reviewIndex!;
    return (
      <div className="space-y-4">
        <QuizProgress current={reviewIdx + 1} total={totalQuestions} />

        <div className="flex items-center gap-2 text-xs font-mono text-[var(--muted)] border border-[var(--border)] px-3 py-1.5 w-fit">
          Reviewing Q{reviewIdx + 1}
        </div>

        <QuizCard
          question={reviewQuestion}
          questionNumber={reviewIdx + 1}
          totalQuestions={totalQuestions}
          selectedAnswer={reviewAnswer.selectedIndex}
          showExplanation={true}
          correctAnswerIndex={reviewAnswer.correctAnswerIndex}
          wrongAttempts={[]}
          isReadOnly={true}
          disabled={true}
          onSelectOption={() => undefined}
        />

        <ExplanationPanel
          isCorrect={reviewAnswer.isCorrect}
          explanation={reviewAnswer.explanation}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => dispatch({ type: 'PREV_REVIEW' })}
              disabled={reviewIdx === 0}
            >
              ← Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => dispatch({ type: 'NEXT_REVIEW' })}
              disabled={reviewIdx >= state.currentIndex - 1}
            >
              Next →
            </Button>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => dispatch({ type: 'EXIT_REVIEW' })}
          >
            Back to Q{state.currentIndex + 1}
          </Button>
        </div>
      </div>
    );
  }

  // --- Normal quiz render ---
  return (
    <div className="space-y-4">
      <QuizProgress
        current={state.currentIndex + 1}
        total={totalQuestions}
      />

      <QuizTimer cumulativeMs={cumulativeElapsed} perQuestionMs={perQuestionElapsed} />

      {networkError && <ErrorBanner message={networkError} />}

      <QuizCard
        question={currentQuestion}
        questionNumber={state.currentIndex + 1}
        totalQuestions={totalQuestions}
        selectedAnswer={state.selectedAnswer}
        showExplanation={state.showExplanation}
        correctAnswerIndex={state.explanationData?.correctIndex}
        wrongAttempts={state.wrongAttempts}
        disabled={state.isSubmitting}
        onSelectOption={handleSelectOption}
      />

      {state.isSubmitting && !state.showExplanation && (
        <div className="flex justify-center py-2">
          <Spinner />
        </div>
      )}

      {state.showExplanation && state.explanationData && (
        <ExplanationPanel
          isCorrect={state.explanationData.isCorrect}
          explanation={state.explanationData.explanation}
        />
      )}

      <div className="flex items-center justify-between">
        {state.currentIndex > 0 && !state.isSubmitting ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => dispatch({ type: 'ENTER_REVIEW', index: state.currentIndex - 1 })}
          >
            ← Back
          </Button>
        ) : (
          <span />
        )}
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
