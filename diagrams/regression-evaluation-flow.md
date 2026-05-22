# Diagram — Regression Evaluation Flow

How two runs are compared, the validity checks that gate comparison, and the regression verdict.

```mermaid
flowchart TB
    A[Run A<br/>baseline] --> CHK{Comparison validity}
    B[Run B<br/>candidate] --> CHK

    CHK --> CHK1{Same dataset id?}
    CHK1 -->|no| BLK[Block comparison<br/>banner: non-comparable]
    CHK1 -->|yes| CHK2{Same rubric version?}
    CHK2 -->|no| BLK
    CHK2 -->|yes| CHK3{Variable tagged?}
    CHK3 -->|no| WARN[Allow with warning:<br/>no variable tag]
    CHK3 -->|yes| OK[Comparison valid]
    WARN --> OK

    OK --> COMP[Compute per-dimension deltas<br/>+ case-level pass/fail transitions]

    COMP --> AGG[Aggregate views]
    AGG --> A1[Per-dimension mean delta]
    AGG --> A2[Overall mean delta]
    AGG --> A3[Distribution shift]
    AGG --> A4[Significance check<br/>delta vs 2 sigma noise band]

    COMP --> CASES[Case-level views]
    CASES --> C1[Regressed: passing in A, failing in B]
    CASES --> C2[Recovered: failing in A, passing in B]
    CASES --> C3[Score-delta only: pass/fail same, score moved]
    CASES --> C4[Safety delta: new findings in B]

    A1 --> V{Regression triggers}
    A2 --> V
    C1 --> V
    C4 --> V

    V --> V1{Any dim mean drop > 5 pts?}
    V --> V2{Regressed cases > 2 percent?}
    V --> V3{New safety findings?}
    V --> V4{Dim status flipped from pass to fail?}

    V1 -->|yes| FLAG[Regression flagged]
    V2 -->|yes| FLAG
    V3 -->|yes| FLAG
    V4 -->|yes| FLAG
    V1 -->|no| V2
    V2 -->|no| V3
    V3 -->|no| V4
    V4 -->|no| CLR[No regression]

    FLAG --> REP[Generate regression report]
    CLR --> REP

    REP --> R1[Verdict + variable changed]
    REP --> R2[Top N regressed cases with evidence]
    REP --> R3[Recommendations: ship / hold / review]
```

---

## What the diagram says

A comparison cannot proceed without same-dataset and same-rubric. Both gates are hard. A missing variable tag is allowed but warns the reader that the run does not document what changed.

When the comparison is valid, the tool computes both aggregate deltas (per-dimension and overall) and case-level transitions (regressed, recovered, score-delta-only, safety-delta). The regression verdict comes from four independent triggers; any one firing flags the run as a regression.

The output is a regression report, not a tool verdict. The verdict is advisory: ship, hold, or review. The decision is human.

## What the diagram implies

- "Compare anyway" is not a feature. Mismatched datasets or rubrics block the comparison, with the reason on screen.
- Overall delta alone never triggers regression. The per-dimension and case-level checks always run too.
- A regression is **also** flagged when a dimension flips from passing-on-average to failing-on-average — even if the magnitude of the drop is below 5 points. Status changes matter.
- Safety findings are an independent regression trigger. A run with new safety findings is a regression even if every score went up.
- The 2σ noise check is shown but not used as a sole gate. It is an honesty annotation on small deltas; a 1-point overall delta that is well within noise gets labeled as such.

## What this diagram exists to prevent

- Shipping on a small mean improvement that is within LLM-judge noise.
- Shipping when one dimension regressed but the overall went up.
- Shipping when a new safety finding appeared but the aggregate did not move.
- Comparing apples to oranges and calling it a comparison.

## What a reader should leave with

Regression evaluation is a structured contract, not a feel. Four triggers, each independent, any one is enough. The dataset and rubric are locked. The verdict is a recommendation, not a decree.
