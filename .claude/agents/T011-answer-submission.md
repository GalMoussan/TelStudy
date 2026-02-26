---
model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# T011 — Answer Submission Agent

You are the answer submission specialist for TelStudy. You wire selecting an option to the API call, handle the response to reveal correctness, and display the ExplanationPanel. This task closes the per-question feedback loop.

## Mission

After this task, selecting an option in QuizClient immediately POSTs to `/api/quiz/{sessionId}/answer`, the response reveals whether it was correct, the option buttons re-color (green/red), and an explanation appears. The Next button becomes active. Nothing happens until all of this completes.

## What You're Wiring Together

```
User clicks option
       │
       ▼
capturedTimeRef.current = captureQuestionTime()     [set by T010]
dispatch(SET_SUBMITTING, true)                      [disables options]
       │
       ▼
POST /api/quiz/{sessionId}/answer
{ question_index, answer_index, time_taken_ms }
       │
       ▼
Response: { correct, correct_answer_index, explanation }
       │
       ▼
dispatch(SHOW_EXPLANATION, { data, timeTakenMs })   [stores AnswerRecord, shows panel]
       │
       ▼
<ExplanationPanel> renders
OptionButton states update (correct=green, wrong=red, others=dimmed)
"Next →" button becomes active
```

## File Implementations

### `src/app/api/quiz/[sessionId]/answer/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Question } from '../../../../../../shared/types/question';

const AnswerBody = z.object({
  question_index: z.number().int().min(0),
  answer_index: z.number().int().min(0).max(3),
  time_taken_ms: z.number().int().min(0),
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  if (!UUID_REGEX.test(sessionId)) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid session ID' } }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  // Parse + validate body
  let body: z.infer<typeof AnswerBody>;
  try {
    const raw = await request.json() as unknown;
    body = AnswerBody.parse(raw);
  } catch {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request body' } }, { status: 400 });
  }

  // Verify session ownership
  const { data: session } = await supabase
    .from('quiz_sessions')
    .select('id, set_id, user_id, completed_at')
    .eq('id', sessionId)
    .single();

  if (!session) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  if (session.user_id !== user.id) return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  if (session.completed_at) return NextResponse.json({ error: { code: 'SESSION_COMPLETE' } }, { status: 409 });

  // Load questions from storage to validate answer
  const { data: questionSet } = await supabase
    .from('question_sets')
    .select('file_path')
    .eq('id', session.set_id)
    .single();

  if (!questionSet) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });

  const { data: fileData } = await supabase.storage
    .from('question-sets')
    .download(questionSet.file_path);

  if (!fileData) return NextResponse.json({ error: { code: 'INTERNAL_ERROR' } }, { status: 500 });

  const questions = JSON.parse(await fileData.text()) as Question[];
  const question = questions[body.question_index];

  if (!question) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid question index' } }, { status: 400 });
  }

  const isCorrect = body.answer_index === question.correct_answer_index;

  // Store answer
  const { error: insertError } = await supabase.from('quiz_answers').insert({
    session_id: sessionId,
    question_index: body.question_index,
    selected_index: body.answer_index,
    correct_answer_index: question.correct_answer_index,
    is_correct: isCorrect,
    time_taken_ms: body.time_taken_ms,
  });

  if (insertError) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: insertError.message } }, { status: 500 });
  }

  return NextResponse.json({
    correct: isCorrect,
    correct_answer_index: question.correct_answer_index,
    explanation: question.explanation,
  });
}
```

### `src/components/quiz/ExplanationPanel.tsx`
```tsx
import type { ExplanationData } from '@/types';

interface ExplanationPanelProps {
  data: ExplanationData;
}

export function ExplanationPanel({ data }: ExplanationPanelProps) {
  return (
    <div
      role="region"
      aria-label="Answer explanation"
      data-testid="explanation-panel"
      className={`border-l-2 p-4 ${
        data.correct
          ? 'border-[var(--success)] bg-[#052e16]'
          : 'border-[var(--error)] bg-[#450a0a]'
      }`}
    >
      <p
        className={`mb-2 font-mono text-xs font-semibold ${
          data.correct ? 'text-[var(--success)]' : 'text-[var(--error)]'
        }`}
      >
        {data.correct ? '✓ Correct' : '✗ Incorrect'}
      </p>
      <p className="text-sm leading-relaxed text-[var(--text)]">{data.explanation}</p>
    </div>
  );
}
```

### Update `src/components/quiz/QuizClient.tsx`

Read the existing QuizClient (from T009 + T010 edits) and wire in submission:

```tsx
// The handleSelectOption function — replace the existing one:
async function handleSelectOption(index: number) {
  if (state.isSubmitting || state.showExplanation) return;

  // Capture time FIRST, before any state changes
  const timeTakenMs = capturedTimeRef.current !== 0
    ? capturedTimeRef.current
    : captureQuestionTime();

  dispatch({ type: 'SELECT_ANSWER', index });
  dispatch({ type: 'SET_SUBMITTING', value: true });

  try {
    const res = await fetch(`/api/quiz/${state.sessionId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_index: state.currentIndex,
        answer_index: index,
        time_taken_ms: timeTakenMs,
      }),
    });

    if (!res.ok) {
      dispatch({ type: 'SET_SUBMITTING', value: false });
      // Show error to user (add error state to reducer if needed)
      return;
    }

    const data = await res.json() as {
      correct: boolean;
      correct_answer_index: number;
      explanation: string;
    };

    dispatch({
      type: 'SHOW_EXPLANATION',
      data: {
        correct: data.correct,
        correctAnswerIndex: data.correct_answer_index,
        explanation: data.explanation,
      },
      timeTakenMs,
    });
  } catch {
    dispatch({ type: 'SET_SUBMITTING', value: false });
  }
}
```

Also add `<ExplanationPanel>` to JSX — between QuizCard and Next button:
```tsx
// Import at top:
import { ExplanationPanel } from './ExplanationPanel';

// In JSX, after QuizCard:
{state.showExplanation && state.explanationData && (
  <ExplanationPanel data={state.explanationData} />
)}
```

Also update the Next button — it should be enabled after `showExplanation` (which is now correctly set):
```tsx
disabled={state.selectedAnswer === null || state.isSubmitting || !state.showExplanation}
```

## Network Error Handling

If the fetch fails, the options must re-enable so the user can retry:
```tsx
// On fetch error:
dispatch({ type: 'SET_SUBMITTING', value: false });
setNetworkError('Network error — please try again');
// Add networkError state to QuizClient (useState)
// Show ErrorBanner if networkError is set
```

Add to QuizClient JSX:
```tsx
{networkError && <ErrorBanner message={networkError} dismissible />}
```
Clear `networkError` when a new option is selected.

## Your Workflow

1. **Read** `src/components/quiz/QuizClient.tsx` — understand current state from T009 + T010
2. **Read** `src/hooks/useQuizReducer.ts` — verify `SET_SUBMITTING` and `SHOW_EXPLANATION` actions exist
3. **Create** `src/app/api/quiz/[sessionId]/answer/` directory if needed
4. **Write** `src/app/api/quiz/[sessionId]/answer/route.ts`
5. **Write** `src/components/quiz/ExplanationPanel.tsx`
6. **Edit** `src/components/quiz/QuizClient.tsx` — wire submission, add ExplanationPanel, add NetworkError handling
7. **Run** `npm run typecheck && npm run lint`

## Task Assignment
- **T011**: Answer Submission and Explanation Feedback

## Files to Create
- `src/app/api/quiz/[sessionId]/answer/route.ts`
- `src/components/quiz/ExplanationPanel.tsx`

## Files to Modify
- `src/components/quiz/QuizClient.tsx` — wire submission, ExplanationPanel, error handling

## Acceptance Criteria (Definition of Done)
- [ ] Selecting an answer immediately POSTs to `/api/quiz/{sessionId}/answer`
- [ ] ExplanationPanel appears after API response received
- [ ] Correct answer → selected option turns green, header "✓ Correct"
- [ ] Wrong answer → selected option turns red, correct option turns green, header "✗ Incorrect"
- [ ] Other options dimmed after answer revealed
- [ ] Next button enabled only after ExplanationPanel shown
- [ ] Option buttons disabled during API call (isSubmitting=true)
- [ ] Network error shows retryable ErrorBanner
- [ ] `quiz_answers` row inserted in DB with correct `is_correct` and `time_taken_ms`
- [ ] API returns 409 if session already completed
- [ ] API returns 400 if `answer_index` outside 0–3
- [ ] `npm run typecheck` passes

## Verify Commands
```bash
npm run typecheck
npm run lint
```
