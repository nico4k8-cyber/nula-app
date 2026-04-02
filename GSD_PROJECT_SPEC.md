# GSD Project: Formula Intellect Trainer v2 — Finalization & Team Coordination

## Project Overview
**Status:** Alpha → Beta (Ready for team collaboration)  
**Objective:** Polish, test, document, and deploy the AI-driven ТРИЗ trainer with full team coordination  
**Current Build:** Located in `/Users/username/Documents/triz/nula/`

---

## Phase 1: Understand Current State (DISCOVERY)

### What We Have
- ✅ **Engine:** Fully AI-driven (`src/bot/engine.js` + `/api/chat.js`)
- ✅ **Persona:** Character "Уголёк" with detailed system prompt
- ✅ **ПРИЗ System:** 5-stage scaffolding (Подготовка → Разведка → Идеи → Зачёт → Инсайт)
- ✅ **Star System:** Quality-based feedback (0-3 stars)
- ✅ **Client:** React app with Vite + TailwindCSS
- ✅ **Safety:** Harmful content filtering
- ✅ **Analytics:** PostHog integration for tracking

### What's Missing
- [ ] **Design System:** UI/UX consistency across all screens
- [ ] **Game Design Documentation:** Detailed GDD with difficulty curves, progression
- [ ] **Quality Assurance:** Testing matrix (unit, integration, playtest, UAT)
- [ ] **Content:** Task bank expansion, cultural layer integration
- [ ] **Deployment:** Production readiness checklist
- [ ] **Team Documentation:** Onboarding guides for designers, producers, developers

---

## Phase 2: Team Roles & Responsibilities

### Game Designer
**Goals:**
- Document game design (GDD) — 20-30 pages covering mechanics, progression, difficulty curves
- Design task progression difficulty curve
- Define reward/motivation loops
- Create playtest protocol based on production course principles
- Analyze telemetry (retention, churn, star distribution)

**Deliverables:**
- Game Design Document (GDD)
- Difficulty curve analysis
- Playtest report template
- Difficulty adjustment recommendations

### Game Producer
**Goals:**
- Coordinate team workflow (design → dev → QA → launch)
- Track milestones and blockers
- Manage scope (what's MVP vs. post-launch)
- Organize playtests with external players
- Define launch criteria and go/no-go decisions

**Deliverables:**
- Project timeline with milestones
- Risk register and mitigation plans
- Playtest schedule and recruitment
- Launch checklist
- Post-launch metrics dashboard

### UI/UX Designer
**Goals:**
- Audit current UI for consistency
- Design system (components, colors, typography, spacing)
- Responsive design for all devices
- Accessibility audit (WCAG 2.1 AA)
- Animation/micro-interaction polish

**Deliverables:**
- Design system (Figma file)
- UI audit report
- Component library specs
- Animation guidelines
- Accessibility checklist

### Lead Developer / Tech Lead
**Goals:**
- Code quality review (refactor, test coverage)
- Performance optimization (bundle size, API latency)
- Infrastructure setup (CI/CD, monitoring, error tracking)
- Dependency updates and security audit
- Database/state management review

**Deliverables:**
- Architecture diagram
- Tech debt assessment
- Test coverage report
- Performance metrics baseline
- Deployment pipeline setup

### QA / Tester
**Goals:**
- Test matrix creation (functionality, edge cases, platforms)
- Regression testing for each build
- Player experience testing (usability, fun factor)
- Bug tracking and severity classification
- Localization testing (Russian, and future languages)

**Deliverables:**
- Test plan and test cases
- Bug database (Jira/Linear tickets)
- Test coverage report
- Usability issues summary
- Localization checklist

---

## Phase 3: Deliverables & Timeline

### Week 1: Discovery & Planning
- [ ] **Designer:** GDD outline (mechanics, progression, tasks)
- [ ] **Producer:** Playtest protocol, team kickoff
- [ ] **Developer:** Codebase walkthrough, tech debt assessment
- [ ] **QA:** Test matrix draft
- [ ] **All:** Create shared Notion/Linear workspace for tracking

### Week 2-3: Design & Content
- [ ] **Designer:** Full GDD (20-30 pages), difficulty curve
- [ ] **Developer:** API performance optimization, error handling
- [ ] **QA:** Test case implementation
- [ ] **UI/UX:** Design system v0.1 (Figma)
- [ ] **Producer:** Organize first external playtest (5-10 players)

### Week 4-5: Implementation & Iteration
- [ ] **Developer:** Implement design feedback, refactor code
- [ ] **QA:** Regression testing, bug triage
- [ ] **Designer:** Analyze playtest data, iterate mechanics
- [ ] **UI/UX:** Component refinement, responsive testing
- [ ] **Producer:** Playtest analysis, go/no-go decision

### Week 6: Polish & Launch Prep
- [ ] **All:** Final round of polish
- [ ] **QA:** UAT (User Acceptance Testing)
- [ ] **Producer:** Launch checklist verification
- [ ] **Developer:** Production deployment setup
- [ ] **All:** Launch readiness review

---

## Phase 4: Documentation Framework

### 1. Game Design Document (GDD)
**Sections:**
- Vision & Target Audience
- Core Mechanics (ПРИЗ system, star awards, task progression)
- Difficulty Curve & Progression
- Content Strategy (task bank, cultural layer, personalization)
- Monetization & Retention (if applicable)
- Success Metrics & KPIs

### 2. Production Course for Team
**Modules:**
1. **Overview:** What is the trainer? Who's it for? Why ТРИЗ?
2. **AI Architecture:** How Уголёк works, prompt engineering, ПРИЗ system
3. **Game Design Principles:** Scaffolding, hints vs answers, difficulty curves
4. **Quality Metrics:** Star system logic, playtest analysis, retention goals
5. **Technical Stack:** React, Vite, Claude API, error handling
6. **Deployment & Monitoring:** Vercel setup, PostHog analytics, error tracking

**Format:**
- Video walkthroughs (15-30 min each)
- Written guides with code examples
- Live demos of key features
- Q&A sessions

### 3. Playtest Protocol
**Based on production course principles:**
- Recruit 5-10 external players (not developers)
- 15-30 minute sessions
- Measure:
  - Task completion rate
  - Star distribution
  - Time per task
  - Frustration points (where players give up)
  - NPS: "Would you recommend to a friend?"
- Analyze retention curve (which tasks drop off)

### 4. Technical Documentation
- Architecture & data flow diagrams
- API endpoint specs
- Component library documentation
- Deployment & monitoring setup
- Error handling & logging strategy

---

## Phase 5: Success Metrics

### Engagement Metrics
- **Session completion rate:** % of children completing 3+ tasks
- **Task completion rate:** % of tasks started that are finished
- **Star distribution:** Should be 0-1 stars (struggling), 2 stars (good), 3 stars (excellent)
- **Session duration:** Optimal 15-30 minutes

### Quality Metrics
- **Code coverage:** >80% unit test coverage
- **Performance:** <2s task load time, API <1s response
- **Bug density:** <5 bugs per 1000 LOC
- **Accessibility:** WCAG 2.1 AA compliance

### Business Metrics
- **Retention Day 1/7/30:** % returning after first play
- **NPS:** Net Promoter Score (target >50)
- **Star earned per session:** Average quality of solutions
- **Session count:** Distribution across player base

---

## Phase 6: Launch Checklist

### Code Quality
- [ ] All tests passing (unit + integration)
- [ ] Code review by tech lead
- [ ] Linting clean (ESLint, Prettier)
- [ ] Performance optimized (Lighthouse >90)
- [ ] Security audit done (dependencies up-to-date)

### Content
- [ ] All tasks reviewed by educator
- [ ] Difficulty curve validated
- [ ] Persona voice consistent across all responses
- [ ] Cultural references fact-checked
- [ ] Localization strings finalized

### QA
- [ ] All test cases passed
- [ ] Regression testing done
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Mobile/tablet/desktop tested
- [ ] Network error handling verified

### Deployment
- [ ] Production environment setup
- [ ] Monitoring & alerting configured (Sentry/DataDog)
- [ ] Analytics pipeline verified (PostHog)
- [ ] Database backups tested
- [ ] Rollback plan documented

### Launch
- [ ] Go/no-go decision made
- [ ] Marketing materials ready
- [ ] Support team briefed
- [ ] On-call schedule for first week
- [ ] Daily metrics review scheduled

---

## Appendix: Production Course Structure

**Module 1: Trainer Overview (30 min)**
- Problem: How to teach kids creative thinking?
- Solution: AI-driven ТРИЗ coach
- Key principles: No answers, only questions
- Demo: Playing through a task

**Module 2: ПРИЗ System Deep Dive (45 min)**
- Stage 1 (П - Подготовка): Initial engagement question
- Stage 2 (Р - Разведка): Exploration of problem space
- Stage 3 (И - Идеи): Idea generation
- Stage 4 (З - Зачёт): Solution validation
- Stage 5 (✨ - Инсайт): Celebration & insight
- Practice: Manually running through a task

**Module 3: Prompt Engineering & Уголёк's Voice (45 min)**
- System prompt architecture
- Persona consistency
- Temperature & token tuning
- Common failure modes and fixes
- Hands-on: Editing persona prompt, testing responses

**Module 4: Game Design Principles (60 min)**
- Difficulty curves and retention
- Star system rationale
- Task progression design
- Playtesting & metrics analysis
- Case study: How difficulty affects completion rate

**Module 5: QA & Playtest Analysis (30 min)**
- Playtest protocol execution
- Data collection & analysis
- Churn point identification
- Iteration planning
- Tools: PostHog, playtest templates

**Module 6: Technical Architecture (45 min)**
- Frontend: React component structure
- Backend: /api/chat.js flow
- Claude API integration
- Error handling & retry logic
- Performance optimization

**Module 7: Launch & Operations (30 min)**
- Deployment checklist
- Monitoring & alerting setup
- User support workflows
- Post-launch metrics review
- Scaling considerations

---

## Next Steps

1. **Share this spec** with the team
2. **Schedule kickoff meeting** with all roles represented
3. **Assign owners** for each deliverable
4. **Create Notion/Linear workspace** for tracking
5. **Set up weekly sync** (1 hour, all hands)
6. **Begin Week 1 discovery** phase
