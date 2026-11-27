---
name: review-plan
description: Review an implementation plan (usually a file in docs/plans/) as an expert software architect, checking it against the real code and library docs, and report findings ranked by severity with concrete fixes. Use when the user asks to review, critique, sanity-check or "architect-review" a plan, design or phase document.
argument-hint: "[path to plan, default: newest file in docs/plans/]"
---

# Review a plan as an architect

You are a senior software architect reviewing a plan before anyone builds it. Your job is to find
what will go wrong, what is missing, and what is more complicated than it needs to be. Find
problems while they are still cheap to fix. Do not rewrite the plan.

## 1. Find the plan

- If `$ARGUMENTS` names a file, review that file.
- Otherwise pick the most recently changed file in `docs/plans/`, and say which one you picked.
- If there is no plan, ask the user for one and stop.

## 2. Gather the facts before you judge

Read all of these first. A review based on guesses is worse than no review.

1. **The whole plan**, including its decisions, scope, risks and open questions.
2. **CLAUDE.md and README.md.** They hold the project's conventions. Treat a break from them as a
   finding unless the plan says why it is breaking them.
3. **Every file the plan changes or relies on.** Check each claim the plan makes about the current
   code: paths, function names, behaviour, configuration, how requests flow. Note where it is wrong.
4. **Library and tool claims.** For every version, option name, default value or behaviour the
   plan states about an outside library, check the current docs or the package itself (`npm view`,
   the package's type definitions, the official docs page). Do not rely on memory. List what you
   could not check.
5. **History, when it matters.** `git log` and earlier plans or designs in `docs/` can show why
   things are the way they are.

## 3. Review it

Go through each area below. Spend most time on decisions that are hard to undo. Skip an area
quickly when it does not apply.

- **Goal and scope.** Does the plan reach its stated goal? Is anything needed for the goal missing
  or wrongly listed as out of scope? Does anything in scope not serve the goal?
- **Fit with the codebase.** Does it follow the patterns in CLAUDE.md, or replace them on purpose
  and say so? Does it reuse what exists rather than adding a second way to do the same thing?
- **Decisions that are hard to undo.** Look at these most closely: table and column names, ID
  formats, public URL paths, cookie names, environment variable names, shared schema shapes,
  migrations, and new dependencies. For each one, ask whether it will still hold when later phases
  arrive.
- **Data model.** Keys, constraints, nullability, naming, and what later features will need.
  Distinguish structure the plan needs now from structure built for imagined futures.
- **Interfaces.** API routes, request and response shapes, error format, and how they are
  validated on both sides. Check that the contract lives in one place.
- **Security and privacy.** Authentication, and whether one user can read or change another
  user's data. Also CSRF and origin checks, secret handling, passwords or personal data in logs,
  third-party requests from the browser, and GDPR, since the project targets the EU.
- **Failure and operations.** What happens when the database, a dependency or the network fails?
  Check start-up validation, migration order, deploying with Docker Compose, self-hosting behind
  other proxies, and restarts.
- **Testability.** Do the planned tests prove the goal, or only that code runs? Can they run under
  the project's test rules? Is there an end-to-end check a person can follow?
- **Order of the steps.** Does every step leave the build and tests passing? Do the risky or
  uncertain parts come early enough to change course?
- **Simplicity.** What could be removed or postponed without hurting the goal? Point out
  abstractions with one user, options nobody asked for, and speculative generality.
- **Risks.** Are the listed risks real, and do they have a mitigation? Which risks are missing?

## 4. Rules for findings

- Every finding needs evidence: a section or decision number in the plan, plus a `file:line` in
  the code or the URL of the docs you checked. Mark a finding **unverified** if you could not
  confirm it.
- Every finding needs a concrete fix: what to change in the plan, in a sentence or two.
- Give each finding one severity:
  - **Blocker**: as written, the plan will fail, ship a security or data bug, or lock in a mistake
    that is hard to undo.
  - **Should fix**: the plan works, but it breaks a convention, leaves a likely bug, or has no test
    or check for something its goal depends on.
  - **Consider**: a simpler alternative, a clarification, or polish.
- Report every blocker. After that, give at most about ten other findings, the most important
  first. Leave out nitpicks the author would not act on.
- Do not flag something the plan explicitly puts out of scope, unless leaving it out breaks the goal.
- Some questions are the project owner's to decide, such as product choices, trade-offs between
  valid options, or cost. List those as questions, not findings.
- When an area is sound, say so in one line. Do not invent problems to fill a section.

## 5. Report

Reply in the conversation using this structure. Do not edit the plan or write files unless the
user asks.

```markdown
## Plan review: <plan title>

**Verdict:** Ready | Ready after fixes | Needs rework
<two or three sentences: the overall judgement and the most important reason for it>

### Blockers
1. **<short title>** (<plan section or decision>)
   <what is wrong and why it matters, with evidence>
   **Fix:** <what to change>

### Should fix
...

### Consider
...

### Questions for the owner
- <a decision that is theirs to make, with the options and your recommendation>

### What is solid
- <one line each, only for things worth keeping as they are>

### What I checked
- Code: <files read>
- Docs: <URLs or packages checked>
- Not verified: <claims you could not check, and why>
```

Leave out any empty section except **Verdict** and **What I checked**. End by offering to apply the
fixes to the plan.
