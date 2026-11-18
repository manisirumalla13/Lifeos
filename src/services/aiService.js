// LifeMate AI Service — Real AI Integration
// Supports: Google Gemini API (primary), OpenAI-compatible APIs, intelligent heuristic fallback

export const AI_CONFIG_KEY = 'lifeos_ai_config';

// Default project key configured from environment
const DEFAULT_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_AI_API_KEY || '';

export function getAIConfig() {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_AI_API_KEY || DEFAULT_GEMINI_KEY;
  try {
    const saved = localStorage.getItem(AI_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.apiKey) {
        parsed.apiKey = envKey;
      }
      return parsed;
    }
  } catch (_) {}
  return {
    provider: 'gemini',
    apiKey: envKey,
    model: 'gemini-1.5-flash',
    temperature: 0.7,
  };
}

export function saveAIConfig(config) {
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
}

export function isAIConfigured() {
  const config = getAIConfig();
  return !!(config.apiKey && config.apiKey.length > 5);
}

// Build a rich system prompt using live user data
export function buildSystemPrompt(context) {
  const { tasks = [], studySessions = [], goals = [], habits = [] } = context;

  const pendingTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);
  const totalStudyMinutes = studySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  const overdueTasks = pendingTasks.filter(t => t.due_date && new Date(t.due_date) < new Date());

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return `You are LifeMate, an empathetic, highly structured, and encouraging AI personal productivity assistant embedded in the LifeOS platform.

CURRENT DATE & TIME: ${dayName}, ${dateStr} at ${timeStr}

USER'S LIVE PRODUCTIVITY STATE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TASKS:
  - Total: ${tasks.length} | Completed: ${completedTasks.length} | Pending: ${pendingTasks.length} | Overdue: ${overdueTasks.length}
  ${pendingTasks.length > 0 ? `- Pending Tasks:\n${pendingTasks.slice(0, 12).map(t =>
    `    • "${t.title}" [Priority: ${t.priority || 'Medium'}${t.due_date ? `, Due: ${t.due_date}` : ''}]`
  ).join('\n')}` : '  - No pending tasks.'}
  ${overdueTasks.length > 0 ? `- ⚠️ OVERDUE:\n${overdueTasks.slice(0, 5).map(t =>
    `    • "${t.title}" was due ${t.due_date}`
  ).join('\n')}` : ''}

📚 STUDY SESSIONS:
  - Total logged: ${studySessions.length} sessions
  - Total focused time: ${totalStudyMinutes} minutes (${(totalStudyMinutes / 60).toFixed(1)} hours)
  ${studySessions.length > 0 ? `- Average session: ${Math.round(totalStudyMinutes / studySessions.length)} minutes` : ''}
  ${studySessions.slice(-3).length > 0 ? `- Recent subjects: ${[...new Set(studySessions.slice(-5).map(s => s.subject).filter(Boolean))].join(', ') || 'Not specified'}` : ''}

🎯 GOALS:
  ${goals.length > 0 ? goals.slice(0, 8).map(g =>
    `- "${g.title}": ${g.current_progress || 0}% complete${g.target_date ? ` (target: ${g.target_date})` : ''}`
  ).join('\n  ') : '- No goals set yet.'}

🔄 HABITS:
  ${habits.length > 0 ? habits.slice(0, 8).map(h =>
    `- "${h.title}" (${h.frequency || 'daily'})`
  ).join('\n  ') : '- No habits tracked yet.'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR BEHAVIORAL GUIDELINES:
1. Be warm, motivating, and genuinely helpful — like a trusted mentor who cares about the user's wellbeing.
2. Give SPECIFIC, ACTIONABLE advice grounded in real behavioral science (time blocking, Pomodoro, progressive overload, implementation intentions, the 2-minute rule, Eisenhower matrix).
3. Use the user's ACTUAL data above to personalize every response — reference their real tasks, goals, and habits by name.
4. When suggesting schedules, use realistic time blocks with specific times of day.
5. When breaking down goals, give 3-5 concrete steps with priority levels and estimated durations.
6. Format responses with clear headings (###), bullet points, bold text, and emoji for readability.
7. If the user seems stressed or overwhelmed, acknowledge their feelings first, then offer practical help.
8. Suggest breaks based on research (Ultradian rhythms: ~90min work then 15-20min break).
9. Never be preachy or condescending. Keep responses concise but thorough.
10. If you identify patterns (e.g., many overdue tasks, no recent study), gently flag them with constructive suggestions.`;
}

// Format conversation history strictly compliant with Gemini API requirements
// - Must start with 'user'
// - Must strictly alternate between 'user' and 'model'
function buildConversationContents(systemPrompt, userMessage, conversationHistory = []) {
  const contents = [];

  // Filter out any welcome or cleared message
  const validHistory = conversationHistory.filter(
    m => m.id !== 'welcome' && !m.id?.toString().startsWith('cleared-') && m.text?.trim()
  );

  let lastRole = null;
  // Use last 6 valid exchanges
  for (const msg of validHistory.slice(-6)) {
    const role = msg.sender === 'user' ? 'user' : 'model';
    // First message must be 'user'
    if (contents.length === 0 && role !== 'user') continue;
    // Strictly alternate
    if (role === lastRole) continue;

    contents.push({
      role,
      parts: [{ text: msg.text.trim() }],
    });
    lastRole = role;
  }

  // If first message isn't present or last role was 'user', prepare final user turn
  if (lastRole === 'user' && contents.length > 0) {
    contents[contents.length - 1].parts[0].text += `\n\n${userMessage}`;
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });
  }

  return contents;
}

// Helper to call Gemini API with model fallback
async function callGemini(apiKey, modelName, contents, systemPrompt, temperature = 0.7) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      temperature,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048,
    },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const errMsg = errData?.error?.message || `HTTP ${res.status}`;
    const err = new Error(errMsg);
    err.status = res.status;
    err.details = errData;
    throw err;
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No candidate text returned by Gemini');
  }
  return text;
}

// Main entry point — calls real AI API or falls back to heuristic engine
export async function askLifeMate(userMessage, context = {}, conversationHistory = []) {
  const config = getAIConfig();
  const systemPrompt = buildSystemPrompt(context);

  // ━━━ GEMINI API (Primary) ━━━
  if (config.apiKey && config.provider === 'gemini') {
    try {
      const contents = buildConversationContents(systemPrompt, userMessage, conversationHistory);
      const primaryModel = config.model || 'gemini-1.5-flash';

      try {
        return await callGemini(config.apiKey, primaryModel, contents, systemPrompt, config.temperature);
      } catch (firstErr) {
        // If 404 or model not found, attempt fallback to gemini-1.5-flash or gemini-2.0-flash
        const fallbackModel = primaryModel === 'gemini-1.5-flash' ? 'gemini-2.0-flash' : 'gemini-1.5-flash';
        console.warn(`Gemini call to ${primaryModel} failed (${firstErr.message}), attempting fallback to ${fallbackModel}...`);
        return await callGemini(config.apiKey, fallbackModel, contents, systemPrompt, config.temperature);
      }
    } catch (err) {
      console.warn('Gemini API call failed, analyzing error:', err.message);
      // If it's a rate limit or quota message, inform the user
      if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('API key not valid')) {
        throw new Error('Your Gemini API key appears invalid or expired. Please verify it in AI Settings.');
      }
      if (err.message?.includes('quota') || err.status === 429) {
        throw new Error('Gemini API quota exceeded for this key. Please wait a moment or update the key in AI Settings.');
      }
      // If network is offline or blocked, fallback smoothly to heuristic engine
      console.info('Switching to intelligent heuristic engine with live data...');
    }
  }

  // ━━━ OPENAI-COMPATIBLE API ━━━
  if (config.apiKey && config.provider === 'openai') {
    try {
      const model = config.model || 'gpt-4o-mini';
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.filter(m => m.id !== 'welcome').slice(-8).map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        })),
        { role: 'user', content: userMessage },
      ];

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: config.temperature ?? 0.7,
          max_tokens: 2048,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) return text;
      }
    } catch (err) {
      console.warn('OpenAI API request failed:', err.message);
    }
  }

  // ━━━ HEURISTIC ENGINE (Ground-truth data fallback) ━━━
  return generateHeuristicResponse(userMessage, context);
}

// Validate that an API key works by making a minimal test call
export async function testAPIConnection(config) {
  if (!config.apiKey) {
    return { success: false, error: 'No API key provided' };
  }

  try {
    if (config.provider === 'gemini') {
      const model = config.model || 'gemini-1.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': config.apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Respond with exactly: CONNECTION_OK' }] }],
          generationConfig: { maxOutputTokens: 20 },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData?.error?.message || `HTTP ${res.status}` };
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return { success: !!text, model, response: text?.slice(0, 50) };
    }

    if (config.provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Respond with CONNECTION_OK' }],
          max_tokens: 20,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData?.error?.message || `HTTP ${res.status}` };
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      return { success: !!text, model: config.model || 'gpt-4o-mini', response: text?.slice(0, 50) };
    }

    return { success: false, error: 'Unknown provider' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ━━━ HEURISTIC ENGINE ━━━
// Intelligent offline responses using actual user data — used when no API key is configured or offline
function generateHeuristicResponse(query, context) {
  const q = query.toLowerCase();
  const { tasks = [], studySessions = [], goals = [], habits = [] } = context;
  const pendingTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);
  const totalStudyMinutes = studySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  const overdueTasks = pendingTasks.filter(t => t.due_date && new Date(t.due_date) < new Date());

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

  // Intent: Plan Day / Schedule
  if (q.includes('plan') || q.includes('schedule') || q.includes('today') || q.includes('routine') || q.includes('morning')) {
    if (pendingTasks.length === 0) {
      return `### 🌅 ${dayName} Planning Strategy

You currently have no pending tasks — a clean slate! Here's an optimized high-energy template:

| Time | Activity | Duration |
|------|----------|----------|
| 🌅 09:00 | Deep Work Block — high-leverage learning or creative output | 90 min |
| ☕ 10:30 | Mindful Break — hydrate, stretch, eyes rest | 15 min |
| 📚 10:45 | Study / Skill Acquisition (try Focus Mode Pomodoro) | 90 min |
| 🥗 12:15 | Nourishment & Rest | 60 min |
| ⚡ 02:00 | Habit Execution & Personal Goals | 120 min |
| 🌆 05:30 | Evening reflection and tomorrow planning | 30 min |

**💡 Pro tip:** Head to **My Day** to set your top 3 priorities, then use **Focus Mode** for deep work blocks.`;
    }

    const highP = pendingTasks.filter(t => t.priority === 'High');
    const medP = pendingTasks.filter(t => t.priority === 'Medium');
    const lowP = pendingTasks.filter(t => t.priority === 'Low' || !t.priority);
    const ordered = [...highP, ...medP, ...lowP];
    const times = ['09:00 AM', '10:15 AM', '11:30 AM', '02:00 PM', '03:30 PM', '04:45 PM'];

    return `### ⚡ ${dayName} — Intelligent Time-Blocked Schedule

Based on your **${pendingTasks.length} pending tasks**${overdueTasks.length > 0 ? ` (⚠️ ${overdueTasks.length} overdue!)` : ''}:

${ordered.slice(0, 6).map((t, idx) => {
  const emoji = t.priority === 'High' ? '🔴' : t.priority === 'Medium' ? '🟡' : '🟢';
  const overdue = t.due_date && new Date(t.due_date) < new Date() ? ' ⚠️ OVERDUE' : '';
  return `**${times[idx] || '05:00 PM'}** — ${emoji} **${t.title}**${overdue}\n> Priority: ${t.priority || 'Medium'}${t.due_date ? ` • Due: ${t.due_date}` : ''} • Est. effort: ~45 min`;
}).join('\n\n')}

---
**📋 Strategy:** Complete **"${ordered[0]?.title}"** first — highest priority + peak willpower in the morning. Take a 5-min break every 50 minutes.`;
  }

  // Intent: Goal breakdown
  if (q.includes('goal') || q.includes('break down') || q.includes('subtask') || q.includes('step') || q.includes('milestone')) {
    const targetGoal = goals.find(g => g.current_progress < 100) || goals[0];
    const goalTitle = targetGoal?.title || 'your next major milestone';
    const progress = targetGoal?.current_progress || 0;

    return `### 🎯 Goal Deconstruction: "${goalTitle}"

Current progress: **${progress}%** ${progress < 25 ? '(Just getting started!)' : progress < 50 ? '(Building momentum!)' : progress < 75 ? '(Past the halfway mark!)' : '(Almost there!)'}

**4-Phase Action Plan:**

1. **📐 Phase 1: Research & Scope** (Est. 45 min)
   - Define exact deliverables and success criteria
   - List required resources and dependencies
   - Set a specific, measurable completion benchmark

2. **🏗️ Phase 2: Foundation** (Est. 90 min)
   - Build the core framework or outline
   - Don't aim for perfection — aim for a working prototype
   - Use the "2-Minute Rule": if a sub-step takes < 2 min, do it immediately

3. **⚡ Phase 3: Deep Execution** (Est. 2 hours)
   - Flesh out primary details in a focused session
   - Use **Focus Mode** with a 50/10 Pomodoro cycle
   - Test assumptions and iterate

4. **✨ Phase 4: Polish & Ship** (Est. 30 min)
   - Quality review and final refinements
   - Mark milestone complete in **Goals**!

**🧠 Behavioral Science Tip:** The hardest part is starting. Commit to just Phase 1 today — once you begin, momentum carries you forward (Newton's First Law of Productivity).`;
  }

  // Intent: Procrastination / Patterns / Analysis
  if (q.includes('procrastinat') || q.includes('pattern') || q.includes('lazy') || q.includes('delay') || q.includes('analyz') || q.includes('productiv') || q.includes('momentum')) {
    const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
    const avgStudy = studySessions.length > 0 ? Math.round(totalStudyMinutes / studySessions.length) : 0;

    return `### 🔍 Productivity Intelligence Report

**📊 Your Numbers:**
| Metric | Value | Assessment |
|--------|-------|------------|
| Task Completion Rate | **${completionRate}%** (${completedTasks.length}/${tasks.length}) | ${completionRate >= 70 ? '✅ Strong' : completionRate >= 40 ? '⚠️ Room for improvement' : '🔴 Needs attention'} |
| Overdue Tasks | **${overdueTasks.length}** | ${overdueTasks.length === 0 ? '✅ Clean slate' : overdueTasks.length <= 2 ? '⚠️ Minor friction' : '🔴 Accumulating debt'} |
| Study Focus | **${totalStudyMinutes} min** (${(totalStudyMinutes / 60).toFixed(1)}h total) | ${totalStudyMinutes > 300 ? '✅ Dedicated' : totalStudyMinutes > 60 ? '⚠️ Building habit' : '🔴 Needs more focus time'} |
| Avg Session Length | **${avgStudy} min** | ${avgStudy >= 45 ? '✅ Deep work ready' : avgStudy >= 20 ? '⚠️ Try longer sessions' : '🔴 Very short — aim for 25min Pomodoros'} |
| Active Habits | **${habits.length}** | ${habits.length >= 3 ? '✅ Good variety' : habits.length > 0 ? '⚠️ Consider adding more' : '🔴 Start with 1 keystone habit'} |

**🧠 Root Cause Analysis:**
${overdueTasks.length > 2 ? `- **Task Accumulation Pattern Detected**: ${overdueTasks.length} overdue tasks suggest you may be taking on more than you can execute. Try the **1-3-5 Rule**: each day commit to 1 big task, 3 medium tasks, and 5 small tasks max.\n` : ''}${avgStudy < 25 ? `- **Short Focus Sessions**: Your average study session is ${avgStudy}min. The brain needs ~23 minutes to reach deep focus. Try a full 25-minute Pomodoro in **Focus Mode**.\n` : ''}${completionRate < 50 ? `- **Low Completion Rate**: This often signals task ambiguity. Break each task into sub-tasks that take < 20 minutes — the amygdala resists vague, large tasks.\n` : ''}
**💊 Three Actions for Today:**
1. Pick your single most important overdue task and do it for just 5 minutes (the **5-Minute Rule**)
2. Open **Focus Mode**, select "Rain" ambient sound, and complete one 25-minute Pomodoro
3. At day's end, review your progress in **My Day** → Evening Review`;
  }

  // Intent: Breaks / Fatigue / Burnout
  if (q.includes('break') || q.includes('tired') || q.includes('burnout') || q.includes('rest') || q.includes('exhaust') || q.includes('stress')) {
    return `### 🧘 Active Recovery Protocol

Your brain follows **Ultradian Rhythms** — it cycles through ~90 minutes of focus followed by ~20 minutes of recovery. Fighting this leads to diminishing returns.

**Choose your break type:**

🟢 **Micro-Break (5 min)** — Quick Reset
- 20-20-20 Eye Rule: Look 20ft away for 20 seconds
- Drink 250ml water
- 10 shoulder rolls + 5 neck stretches

🟡 **Medium Break (15 min)** — Neural Refresh
- Screen-free walk around your space
- Box Breathing: 4s inhale → 4s hold → 4s exhale → 4s hold (5 cycles)
- Light stretching or standing

🔴 **Deep Recovery (30 min)** — Full Recharge
- Go outside if possible — natural light resets circadian rhythms
- Listen to music (not podcasts — give your language centers a rest)
- Light physical movement (walk, yoga, stretching)

**📊 Your study load:** ${totalStudyMinutes} minutes logged total. ${totalStudyMinutes > 120 ? "You've earned a solid break — take 15-20 minutes." : "Your load is moderate — a 5-minute micro-break should suffice."}

**Next Step:** Go to **Focus Mode** → set a break timer → let your brain reset before the next block.

*Remember: Rest is not the opposite of productivity — it's the foundation of it.* 🌱`;
  }

  // Default: Status overview with guidance
  return `### 🤖 LifeMate Intelligence — Live Status

**📊 Your Ecosystem Snapshot:**
- 📋 **Active Tasks**: ${pendingTasks.length} pending (${tasks.filter(t => t.priority === 'High' && !t.is_completed).length} high priority${overdueTasks.length > 0 ? `, ⚠️ ${overdueTasks.length} overdue` : ''})
- ✅ **Completed**: ${completedTasks.length} tasks accomplished
- 📚 **Study Focus**: ${totalStudyMinutes} minutes (${(totalStudyMinutes / 60).toFixed(1)}h) of deep immersion
- 🎯 **Goals**: ${goals.length} active trajectories
- 🔄 **Habits**: ${habits.length} daily routines tracked

**💬 What can I help with?**

| Command | What it does |
|---------|-------------|
| 📅 **"Plan my day"** | Generate a personalized time-blocked schedule |
| 🎯 **"Break down my goal"** | Decompose a goal into actionable steps |
| 📊 **"Analyze my productivity"** | Deep-dive into your patterns & metrics |
| 🧘 **"Suggest a break"** | Evidence-based recovery recommendations |
| 📚 **"Study strategy"** | Personalized study technique suggestions |
| 💪 **"I need motivation"** | Data-driven encouragement |

Or just ask me anything — I have full visibility into your tasks, goals, habits, and study history!`;
}
