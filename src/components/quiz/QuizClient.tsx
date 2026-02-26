'use client';
import { useReducer, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { quizReducer, createInitialState } from '@/hooks/useQuizReducer';
import { useQuizTimers } from '@/hooks/useQuizTimers';
import { QuizProgress } from './QuizProgress';
import { QuizTimer } from './QuizTimer';
import { QuizCard } from './QuizCard';
import { Button } from '@/components/ui';
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

  const currentQuestion = state.questions?.[state.currentIndex];
  const totalQuestions = state.questions?.length ?? 0;
  const isLastQuestion = state.currentIndex === totalQuestions - 1;
  const isComplete = state.currentIndex >= totalQuestions;

  useEffect(() => {
    if (state.isComplete) {
      router.push(`/results/${sessionId}`);
    }
  }, [state.isComplete, router, sessionId]);

  if (!currentQuestion || isComplete) return null;

  function handleSelectOption(index: number) {
    capturedTimeRef.current = captureQuestionTime();
    dispatch({ type: 'SELECT_ANSWER', index });
    // TODO: T011 wires submission here - will use capturedTimeRef.current
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
        total={totalQuestions}
      />

      {/* T010: Timer display */}
      <QuizTimer cumulativeMs={cumulativeElapsed} perQuestionMs={perQuestionElapsed} />

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
