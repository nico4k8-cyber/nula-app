# Formula Intellect Trainer v2

**AI-powered ТРИЗ coach that guides children through creative problem-solving — one question at a time.**

> "Ты не даёшь ответы. Ты задаёшь вопросы — не потому что не знаешь, а потому что ответ ребёнка интереснее твоего." — Уголёк

---

## 🚀 Quick Start

### For Players
1. Open app in browser
2. Choose a task
3. Solve it by thinking through the problem
4. Earn stars based on quality of thinking

### For Team Members
1. Read `TEAM_KICKOFF.md` (10 min)
2. Find your role (Designer / Producer / Developer / QA / UI-UX)
3. Follow the timeline in `GSD_PROJECT_SPEC.md`
4. Attend kickoff meeting

### For Developers
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

---

## 📚 Documentation Index

### For the Team
| Document | Purpose | Read Time | Audience |
|----------|---------|-----------|----------|
| **TEAM_KICKOFF.md** | Meeting prep + role assignments | 15 min | Everyone |
| **GSD_PROJECT_SPEC.md** | 6-week roadmap + team coordination | 30 min | Everyone |
| **PRODUCTION_COURSE.md** | Deep knowledge base (7 modules) | 4-8 hours | Everyone (role-specific) |

### For Specific Roles
- **Game Designer:** `PRODUCTION_COURSE.md` Modules 1-4 (game design, ПРИЗ system, playtesting)
- **Game Producer:** `GSD_PROJECT_SPEC.md` (timeline, milestones, risks)
- **Developer:** `PRODUCTION_COURSE.md` Module 6 (tech architecture)
- **QA:** `PRODUCTION_COURSE.md` Module 5 (playtest protocol, metrics)
- **UI/UX Designer:** `PRODUCTION_COURSE.md` Module 1 + accessibility references

---

## 🎮 How It Works

### The ПРИЗ System (5 Stages)

Child is solving a problem. Уголёк guides through:

| Stage | Letter | Role | Duration |
|-------|--------|------|----------|
| **Preparation** | П | Engage: "What's happening?" | 1 message |
| **Exploration** | Р | Explore: "What resources exist?" | 1-2 messages |
| **Ideas** | И | Generate: "How would you solve it?" | 1 message |
| **Acceptance** | З | Validate: "That works!" | 1 message |
| **Insight** | ✨ | Celebrate: "You solved it!" | 1 message |

**Total:** 5-7 messages = 15-30 minute optimal session

### The Star System

Instead of right/wrong, reward thinking quality:

- **⭐** (1 star): Noticed something important
- **⭐⭐** (2 stars): Found a working solution
- **⭐⭐⭐** (3 stars): Breakthrough insight (rare, special)

### The Golden Rule

**No answers. Only questions.**

Уголёк never tells the solution. Ever. The child discovers it through guided exploration.

---

## 🏗️ Architecture

### Frontend
```
React + Vite + TailwindCSS
├── src/bot/engine.js        ← Main logic
├── src/bot/ai.js            ← generateUgolokResponse()
├── src/TaskGenerator.jsx    ← UI component
└── src/App.jsx              ← Main app
```

### Backend
```
Vercel Serverless Functions
└── api/chat.js              ← Core endpoint
    ├── Build system prompt
    ├── Call Claude API (Haiku)
    ├── Parse [ПРИЗ:X|⭐:N] tag
    └── Return response
```

### AI Integration
- **Model:** Claude Haiku (fast, cost-effective)
- **System Prompt:** 500+ lines defining Уголёк's behavior
- **Guardrails:** No hints, no jargon, no answers

---

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Core Engine | ✅ Complete | Fully AI-driven |
| ПРИЗ System | ✅ Complete | 5-stage scaffolding working |
| Star Awards | ✅ Complete | Quality-based feedback |
| UI/Components | ⚠️ Needs Polish | Functional, not designed |
| Task Bank | ⚠️ Small | 5-10 tasks, need 20+ |
| Playtesting | 🔴 Not Done | Required before launch |
| Documentation | ✅ Complete | Course + team guides ready |
| Analytics | ✅ PostHog | Tracking implemented |
| Deployment | ✅ Vercel | CI/CD ready |

---

## 🎯 6-Week Timeline

### Week 1: Discovery
- [ ] Team kickoff meeting
- [ ] Designer: GDD outline
- [ ] Developer: CI/CD setup
- [ ] QA: Test matrix

### Week 2-3: Design & Playtest
- [ ] First external playtest (5-10 players)
- [ ] UI design system
- [ ] Task difficulty audit
- [ ] Uголёк voice consistency check

### Week 4-5: Iteration
- [ ] Implement playtest feedback
- [ ] Task difficulty adjustment
- [ ] Accessibility audit
- [ ] Go/no-go decision

### Week 6: Launch Prep
- [ ] Final polish
- [ ] Launch checklist verification
- [ ] Monitoring setup
- [ ] Production deployment

---

## 🧪 Testing

### Unit Tests
```bash
npm test                    # Run all tests
npm test -- --coverage      # With coverage report (target >80%)
```

### Playtest Protocol
- External players (not developers)
- 15-30 minute sessions
- Measure: completion rate, stars earned, NPS
- See `PRODUCTION_COURSE.md` Module 5 for details

---

## 📈 Success Metrics

### Engagement
- **DAU:** 100+ unique users by week 6
- **Task Completion:** 60-80% (optimal difficulty)
- **NPS:** >40 (child would recommend to friend)

### Quality
- **Test Coverage:** >80%
- **Accessibility:** WCAG 2.1 AA compliance
- **Performance:** <2s load, <1s API response

### Launch
- **All deliverables on time:** Yes
- **Zero critical bugs at launch:** Yes
- **Team trained & ready:** Yes

---

## 🤖 Uголёк's Character

**Who:** An ember (уголёк) living in a library of important books

**What:** Asks questions instead of giving answers

**Why:** The child's thinking is more valuable than any answer

**How:**
- Age-appropriate vocabulary (6-9y, 10-11y, 12+y versions)
- Never uses ТРИЗ jargon
- Never repeats same phrases
- Always responds emotionally & warmly
- Celebrates thinking, not just correctness

---

## 🔗 Important Links

- **Docs:** See files below
- **GitHub:** [Insert repo URL]
- **Vercel:** [Insert deployment URL]
- **Linear/Jira:** [Insert issue tracker URL]
- **Figma:** [Insert design system URL]

---

## 📖 Recommended Reading Order

**1. Get context (20 min)**
- [ ] This README
- [ ] `TEAM_KICKOFF.md`

**2. Understand the product (1 hour)**
- [ ] `PRODUCTION_COURSE.md` Module 1 (Overview)
- [ ] `PRODUCTION_COURSE.md` Module 2 (ПРИЗ system)
- [ ] Play the app yourself (15 min)

**3. Know your role (2-3 hours)**
- [ ] `GSD_PROJECT_SPEC.md` (all roles)
- [ ] `PRODUCTION_COURSE.md` (module for your role)

**4. Deep dive (4-6 hours)**
- [ ] Full `PRODUCTION_COURSE.md` (all 7 modules)
- [ ] Code walkthrough with tech lead
- [ ] Playtest data analysis

---

## 🚦 Getting Help

**I have a question about the product:**
→ Read `PRODUCTION_COURSE.md` first (has most answers)

**I'm stuck on my deliverable:**
→ Flag in weekly team sync or Slack #formula-intellect-launch

**I found a bug:**
→ Create ticket in Linear/Jira with steps to reproduce

**I see a blocker:**
→ Tell producer immediately (don't wait for sync)

---

## 🎓 Training Curriculum (For Team)

All team members should complete:
1. Read this README (5 min)
2. Read `TEAM_KICKOFF.md` (10 min)
3. Attend kickoff meeting (60 min)

Then, by role:
- **Designer:** `PRODUCTION_COURSE.md` Modules 1-4 (2 hours)
- **Producer:** `GSD_PROJECT_SPEC.md` + Module 1-2 (1.5 hours)
- **Developer:** `PRODUCTION_COURSE.md` Modules 6-7 (1.5 hours)
- **QA:** `PRODUCTION_COURSE.md` Modules 5-6 (1.5 hours)
- **UI/UX:** `PRODUCTION_COURSE.md` Module 1 + accessibility (1 hour)

**Total team training time:** ~40 hours (5 hours/person × 8 weeks)

---

## 🔐 Security & Privacy

- ✅ No API keys in frontend code
- ✅ All requests go through `/api/chat` (server-side)
- ✅ User data stored securely
- ✅ No user tracking without consent
- ✅ GDPR-compliant (on roadmap for international launch)

---

## 📞 Contact

**Project Lead:** [Name] ([email])
**Slack:** #formula-intellect-launch
**Docs:** [This folder]

---

## 📄 File Structure

```
nula/
├── README.md                    ← You are here
├── TEAM_KICKOFF.md              ← Before meeting
├── GSD_PROJECT_SPEC.md          ← 6-week roadmap
├── PRODUCTION_COURSE.md         ← Knowledge base (7 modules)
├── src/
│   ├── bot/
│   │   ├── engine.js            ← Main logic
│   │   ├── ai.js                ← Claude integration
│   │   └── tasks.js             ← Task definitions
│   ├── App.jsx
│   ├── TaskGenerator.jsx
│   └── ...
├── api/
│   ├── chat.js                  ← Core endpoint (Уголёк)
│   ├── personas.js              ← Character variants
│   └── ...
├── package.json
└── ...
```

---

## 🎉 Let's Build This

This is a chance to create something meaningful:
- **For kids:** Help them think creatively
- **For parents:** Give them confidence in their thinking
- **For educators:** Provide a tool that actually teaches

Come ready to collaborate, iterate, and ship.

**See you at kickoff! 🚀**

---

**Last Updated:** March 25, 2026
**Version:** v0.2 (Pre-launch)
**Status:** Ready for team coordination
