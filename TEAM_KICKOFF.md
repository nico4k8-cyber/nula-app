# 🚀 Formula Intellect Trainer: Team Kickoff

**Project Status:** Alpha → Beta (Ready for team collaboration)
**Launch Target:** 6 weeks
**Team Size:** 5-7 people

---

## 📋 Pre-Meeting Prep (Do This Before Kickoff)

**By: [24 hours before]**

### 1. Read These Documents (in order)
1. `GSD_PROJECT_SPEC.md` — High-level roadmap (15 min)
2. `PRODUCTION_COURSE.md` Module 1-2 — What we're building (30 min)
3. This document — Team structure (10 min)

### 2. Play the Trainer (10 minutes)
- Go to production URL: [INSERT URL]
- Play 2 tasks as a child (don't cheat!)
- Notice: How does Уголёк guide you?
- Note: Where did you get stuck?

### 3. Know Your Role
- See "Team Roles" section below
- Mentally prepare for 6-week sprint
- Think of 2-3 questions for the team

---

## 👥 Team Structure

### Game Designer (1 person)
**Owns:** Game design document, difficulty curve, playtest protocol

**Your First Week:**
- [ ] Read `PRODUCTION_COURSE.md` Module 1-4 (2 hours)
- [ ] Audit current task bank (what difficulty tier is each?)
- [ ] Draft GDD outline (2 pages: vision, mechanics, progression)
- [ ] Plan first playtest (recruit 5-10 external players)

**Success Metric:** GDD v0.1 by end of week 1

---

### Game Producer (1 person)
**Owns:** Timeline, risk management, playtest coordination, launch readiness

**Your First Week:**
- [ ] Read `GSD_PROJECT_SPEC.md` (1 hour)
- [ ] Set up Linear/Jira workspace (team issue tracking)
- [ ] Create project timeline (Gantt chart)
- [ ] Schedule weekly team syncs (1 hour each)

**Success Metric:** All team members in workspace, first sync scheduled

---

### Lead Developer / Tech Lead (1 person)
**Owns:** Code quality, architecture, deployment pipeline

**Your First Week:**
- [ ] Code walkthrough to team (1 hour)
- [ ] Tech debt assessment (`src/bot/engine.js` → `/api/chat.js` flow)
- [ ] Set up CI/CD (GitHub Actions + Vercel auto-deploy)
- [ ] Review error handling & monitoring setup

**Success Metric:** CI/CD pipeline working, tech debt list created

---

### UI/UX Designer (1 person)
**Owns:** Design system, component library, accessibility

**Your First Week:**
- [ ] UI audit (screenshot all current screens)
- [ ] Design system draft (colors, typography, spacing)
- [ ] Accessibility checklist (WCAG 2.1 AA audit)
- [ ] Responsive design assessment (mobile, tablet, desktop)

**Success Metric:** Design system file created, audit report written

---

### QA / Tester (1 person)
**Owns:** Test matrix, regression testing, bug tracking

**Your First Week:**
- [ ] Read `PRODUCTION_COURSE.md` Module 5 (Playtest protocol)
- [ ] Create test matrix (features × platforms × edge cases)
- [ ] Set up bug tracking (Linear/Jira issue templates)
- [ ] Run smoke test on current build

**Success Metric:** Test matrix document, first test cases written

---

### (Optional) Content Lead / Educator (0-1 person)
**Owns:** Task design, cultural layer, learning outcomes

**Your First Week:**
- [ ] Read `PRODUCTION_COURSE.md` Module 1 (Trainer overview)
- [ ] Audit task difficulty classification
- [ ] Propose new task ideas (5-10)
- [ ] Fact-check cultural references in existing tasks

**Success Metric:** Task difficulty tier assignments, 3 new task proposals

---

## 📅 6-Week Timeline at a Glance

```
WEEK 1: Discovery & Planning
  ├─ Designer: GDD outline
  ├─ Producer: Team setup + timeline
  ├─ Developer: Code walkthrough + CI/CD
  ├─ QA: Test matrix
  └─ All: Team kickoff meeting

WEEK 2-3: Design & Iteration
  ├─ Designer: Organize first playtest (external players)
  ├─ Developer: Performance optimization
  ├─ QA: Test case implementation
  ├─ UI/UX: Design system v0.1
  └─ Producer: Playtest coordination

WEEK 4-5: Implementation & Refinement
  ├─ Designer: Analyze playtest data, recommend changes
  ├─ Developer: Implement feedback
  ├─ QA: Regression testing
  ├─ UI/UX: Component refinement
  └─ Producer: Go/no-go decision after playtest

WEEK 6: Launch Prep & Polish
  ├─ All: Final polish round
  ├─ QA: UAT (User Acceptance Testing)
  ├─ Developer: Production deployment setup
  ├─ Producer: Launch checklist
  └─ All: Launch readiness review
```

---

## 🎯 Key Principles (Everyone Must Know)

### 1. "No Answers, Only Questions"
Уголёк NEVER gives the solution. Only guides through questions.
- ❌ "Use the carpet to walk"
- ✅ "What's not slippery?"

### 2. Fast Tempo (5-7 messages per task)
- Session length: 15-30 minutes (production course findings)
- Not longer → kids get bored
- Not shorter → can't think through problem

### 3. Difficulty Sweet Spot: 60-80% Completion
- <40% → too hard → fix
- >95% → too easy → fix
- 60-80% → goldilocks zone

### 4. Stars Reward Thinking, Not Correctness
- ⭐0: Random/guessing
- ⭐1: Good effort
- ⭐⭐: Solid solution
- ⭐⭐⭐: Breakthrough (rare)

### 5. Accessibility First
- All children, all devices, all abilities
- Target: WCAG 2.1 AA compliance

---

## 📊 Success Metrics (Team OKRs)

### Engagement (Product)
- **DAU:** 100 users by week 6
- **Task Completion:** 60-80%
- **NPS:** >40 (nice to have, not hard requirement)

### Quality (Code)
- **Test Coverage:** >80%
- **Performance:** <2s load time, API <1s
- **Accessibility:** WCAG 2.1 AA pass
- **Bugs:** <5 critical issues at launch

### Team (Operational)
- **All deliverables on time:** Yes/No
- **Zero scope creep:** Stay focused on MVP
- **Communication:** Weekly syncs, no surprises

---

## 🚨 Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| API overloaded (slow responses) | User frustration | Fallback to Haiku 3.0, caching, rate limiting |
| Uголёк gives away answers | Learning broken | Prompt testing, QA review of 20 responses |
| Tasks too hard (high quit rate) | Low engagement | Playtest early, adjust difficulty quickly |
| Merge conflicts on git | Development blocked | Feature branches, small commits, daily syncs |
| Accessibility missed | Excludes users | Audit in week 1, fix by week 5 |

**Mitigation Strategy:** Identify blockers in weekly sync. Escalate immediately.

---

## 📚 Resources & Links

### Documentation
- `GSD_PROJECT_SPEC.md` — Project roadmap
- `PRODUCTION_COURSE.md` — Team knowledge base
- `/src/bot/engine.js` — Main logic
- `/api/chat.js` — Uголёк system prompt

### Tools (Set Up Week 1)
- Linear/Jira — Issue tracking
- GitHub — Code repo
- Figma — Design system
- PostHog — Analytics
- Vercel — Deployment

### External References
- Кирилл Золовкин's game production course (shared library)
- Claude API docs: https://docs.anthropic.com
- WCAG 2.1 guidelines: https://www.w3.org/WAI/WCAG21/quickref/

---

## ✅ Kickoff Agenda (60 minutes)

### 1. Welcome & Overview (5 min)
- Why this project matters
- 6-week sprint overview

### 2. Module Overview (10 min)
- Play 1-2 tasks together as audience
- Ask: "What did Уголёк do well?"

### 3. Role Assignments (10 min)
- Confirm each team member's role
- Clarify ownership & decision rights

### 4. Week 1 Deliverables (10 min)
- Designer: GDD outline
- Producer: Team workspace + sync schedule
- Developer: Code review + CI/CD
- QA: Test matrix
- All: Read PRODUCTION_COURSE.md Module 1-2

### 5. Q&A (15 min)
- Open floor for questions
- Clarify any ambiguity

### 6. Next Steps (10 min)
- Confirm: Who's doing what this week?
- Confirm: When is next sync?
- Confirm: Where to ask questions?

---

## 🔄 Weekly Team Sync (Recurring)

**When:** Every Monday 10:00 AM (1 hour)
**Who:** All hands
**Format:**
1. Status update (each role, 2 min)
2. Blockers & decisions (10 min)
3. Risk review (5 min)
4. Next week priorities (5 min)
5. Q&A (remaining time)

**How to Participate:**
- Come with written status (bullet points)
- Flag blockers ASAP (don't wait for sync)
- Share wins & learnings

---

## 🎓 Reading Order (Self-Paced)

**If you have 2 hours:** Start here
1. This document (15 min)
2. `GSD_PROJECT_SPEC.md` (45 min)
3. `PRODUCTION_COURSE.md` Module 1 (30 min)

**If you have 4 hours:** Complete this
1. All of above (2 hours)
2. `PRODUCTION_COURSE.md` Modules 2-4 (1.5 hours)
3. Code walkthrough with tech lead (30 min)

**If you have 8 hours:** Deep dive
1. All of above (4 hours)
2. Full `PRODUCTION_COURSE.md` (2.5 hours)
3. Play trainer + analyze playtest data (1.5 hours)

---

## ❓ FAQ

**Q: What if I don't have a background in [my role]?**
A: That's OK. This course teaches you everything. Your primary role is learning + execution.

**Q: What if we discover a big blocker?**
A: Flag it in the sync. We'll solve it together. Don't wait.

**Q: Can we extend the 6 weeks?**
A: No. 6 weeks is intentional (keeps momentum). If scope is too big, we cut features, not time.

**Q: What if playtest feedback contradicts design?**
A: Playtest data wins. We iterate based on real user behavior.

**Q: Who decides go/no-go for launch?**
A: Producer (in consultation with team). Based on launch checklist.

---

## 🎉 Let's Build This

You're about to build something that helps kids think creatively. That's important work.

**Come ready to:**
- Learn (read the docs)
- Collaborate (ask questions, share ideas)
- Execute (own your deliverables)
- Iterate (be OK with feedback)

**See you at kickoff!**

---

**Questions before the meeting?**
Post in Slack #formula-intellect-launch

