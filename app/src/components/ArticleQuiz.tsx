"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import {
  getQuiz,
  markPassed,
  readPassed,
  type Quiz,
} from "@/lib/wikiQuizzes";

type Stage = "intro" | "playing" | "result";

export function ArticleQuiz({ slug }: { slug: string }) {
  const quiz = getQuiz(slug);
  const [stage, setStage] = useState<Stage>("intro");
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [alreadyPassed, setAlreadyPassed] = useState(false);

  useEffect(() => {
    setAlreadyPassed(readPassed().has(slug));
  }, [slug]);

  useEffect(() => {
    if (quiz) setAnswers(new Array(quiz.questions.length).fill(null));
  }, [quiz]);

  if (!quiz) return null;

  const allAnswered = answers.every((a) => a !== null);
  const correctCount = quiz.questions.reduce(
    (n, q, i) => n + (answers[i] === q.correct ? 1 : 0),
    0,
  );
  const passed = correctCount === quiz.questions.length;

  function pick(qi: number, oi: number) {
    if (stage !== "playing") return;
    setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)));
  }

  function submit() {
    if (!allAnswered) return;
    if (correctCount === quiz!.questions.length) {
      markPassed(slug);
      setAlreadyPassed(true);
    }
    setStage("result");
  }

  function retry() {
    setAnswers(new Array(quiz!.questions.length).fill(null));
    setStage("playing");
  }

  // Intro
  if (stage === "intro") {
    return (
      <Card className="p-5 space-y-3 border-brand/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide font-semibold text-brand mb-1">
              Mini-quiz · 3 questions
            </p>
            <h3 className="text-base font-semibold">Test your reading</h3>
            <p className="text-xs text-text-secondary mt-1">
              All three correct = article marked complete and highlighted in your Learning Paths.
            </p>
          </div>
          {alreadyPassed && (
            <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded border border-ok/40 text-ok shrink-0">
              ✓ Passed
            </span>
          )}
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => setStage("playing")}
            className="px-4 py-2 text-xs font-semibold rounded-md bg-brand hover:bg-brand-hover text-white transition-colors"
          >
            {alreadyPassed ? "Replay quiz" : "Start quiz →"}
          </button>
        </div>
      </Card>
    );
  }

  // Playing
  if (stage === "playing") {
    return (
      <Card className="p-5 space-y-5 border-brand/20">
        <p className="text-[10px] uppercase tracking-wide font-semibold text-brand">
          Mini-quiz · {quiz.questions.length} questions
        </p>
        {quiz.questions.map((q, qi) => (
          <div key={qi} className="space-y-2">
            <p className="text-xs font-semibold">
              <span className="text-text-muted font-mono mr-2">Q{qi + 1}.</span>
              {q.q}
            </p>
            <div className="space-y-1.5">
              {q.options.map((opt, oi) => {
                const active = answers[qi] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => pick(qi, oi)}
                    className={`block w-full text-left text-xs px-3 py-2 rounded border transition-colors ${
                      active
                        ? "border-brand bg-brand/10 text-text-primary"
                        : "border-border-subtle text-text-secondary hover:border-brand/40 hover:bg-bg-hover"
                    }`}
                  >
                    <span className="font-mono text-[10px] text-text-muted mr-2">
                      {String.fromCharCode(65 + oi)}.
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex justify-between items-center pt-2">
          <p className="text-[11px] text-text-muted">
            {answers.filter((a) => a !== null).length} / {quiz.questions.length} answered
          </p>
          <button
            disabled={!allAnswered}
            onClick={submit}
            className="px-4 py-2 text-xs font-semibold rounded-md bg-brand hover:bg-brand-hover text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Submit quiz
          </button>
        </div>
      </Card>
    );
  }

  // Result
  return (
    <Card
      className={`p-5 space-y-4 ${
        passed ? "border-ok/40 bg-gradient-to-br from-ok/5 to-bg-card" : "border-warn/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-[10px] uppercase tracking-wide font-semibold mb-1 ${
              passed ? "text-ok" : "text-warn"
            }`}
          >
            {passed ? "Quiz passed" : "Not yet"}
          </p>
          <h3 className="text-base font-semibold">
            {passed ? "✓ Article marked complete" : `${correctCount} / ${quiz.questions.length} correct`}
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            {passed
              ? "You read the article. This now shows green in your Learning Paths."
              : "Re-read the article and try again. All three must be correct to mark complete."}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {quiz.questions.map((q, qi) => {
          const yours = answers[qi];
          const right = yours === q.correct;
          return (
            <div key={qi} className="text-xs space-y-1 pb-2 border-b border-border-subtle/40 last:border-0">
              <p className="font-semibold">
                <span className="text-text-muted font-mono mr-2">Q{qi + 1}.</span>
                {q.q}
              </p>
              <p className="text-text-muted pl-6">
                Correct:{" "}
                <span className="text-ok font-semibold">{q.options[q.correct]}</span>
                {" · "}
                Your answer:{" "}
                <span className={`font-semibold ${right ? "text-ok" : "text-bad"}`}>
                  {yours !== null ? q.options[yours] : "—"}
                </span>
              </p>
              <p className="text-[11px] text-text-muted pl-6 italic">{q.why}</p>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-border-subtle">
        <Link href="/wiki" className="text-xs text-brand hover:text-brand-hover transition-colors">
          ← Back to Wiki index
        </Link>
        <button
          onClick={retry}
          className="px-4 py-2 text-xs font-semibold rounded-md bg-brand hover:bg-brand-hover text-white transition-colors"
        >
          {passed ? "Replay quiz" : "Retry quiz"}
        </button>
      </div>
    </Card>
  );
}
