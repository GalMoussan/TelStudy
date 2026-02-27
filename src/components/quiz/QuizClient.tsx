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
      if (!state.showExplanation && !state.isSubmitting && state.selectedAnswer === null) {
        void handleSelectOption(index);
      }
    },
    onNext: () => {
      if (state.showExplanation && !state.isSubmitting) {
        void handleNext();
      }
    },
    disabled: state.isSubmitting,
  });

  if (!currentQuestion || isComplete) return null;

  async function handleSelectOption(index: number) {
    capturedTimeRef.current = captureQuestionTime();
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
          answer_index: index,
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
      });
    } catch (err) {
      dispatch({ type: 'SET_SUBMITTING', value: false });
      setNetworkError(err instanceof Error ? err.message : 'Submission failed');
    }
  }

  async function handleNext() {
    setNetworkError(null);
    if (isLastQuestion) {
      // Mark session complete in DB before redirecting
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
