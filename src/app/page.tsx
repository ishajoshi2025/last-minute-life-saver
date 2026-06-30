"use client"

import { useState, useEffect, useMemo } from "react"
import ReactMarkdown from "react-markdown"
import { parsePlanToTasks, Task } from "@/lib/parsePlan"
import { TaskCard } from "@/components/TaskCard"
import { buildGoogleCalendarUrl, buildICSContent, downloadICS } from "@/lib/calendarExport"
import { useDriftDetector } from "@/hooks/useDriftDetector"
import { NudgeNotification } from "@/components/NudgeNotification"
import { calculateRiskScore } from "@/lib/riskScore"
import { RiskGauge } from "@/components/RiskGauge"
import ProcrastinationCounter from "@/components/ProcrastinationCounter"
import CelebrationOverlay from "@/components/CelebrationOverlay"
import LandingHero from "@/components/LandingHero"
import { useVoiceInput } from "@/hooks/useVoiceInput"
import PlanChat from "@/components/PlanChat"
import SkeletonPlan from "@/components/SkeletonPlan"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { Persona } from "@/lib/persona"
import PersonaToggle from "@/components/PersonaToggle"
import { FocusMode } from "@/components/FocusMode"
import { useDeadlineTheme } from "@/hooks/useDeadlineTheme"
import { NegotiatorModal } from "@/components/NegotiatorModal"
import { Mission } from "@/types/mission"
import { MissionSidebar } from "@/components/MissionSidebar"
import { useTheme } from "@/hooks/useTheme"
import { ThemePicker } from "@/components/ThemePicker"

export default function LifeSaverDashboard() {
  // Theme switcher hooks
  const { themeId, setThemeId } = useTheme()

  // Persistent localStorage auto-save states
  const [task, setTask] = useLocalStorage('lmls_task', "")
  const [deadline, setDeadline] = useLocalStorage('lmls_deadline', "")
  const [energy, setEnergy] = useLocalStorage('lmls_energy', 5)
  const [tasks, setTasks] = useLocalStorage<Task[]>('lmls_tasks', [])
  const [planMarkdown, setPlanMarkdown] = useLocalStorage('lmls_plan', "")
  const [planGeneratedAt, setPlanGeneratedAt] = useLocalStorage<string | null>('lmls_plan_at', null)
  const [revisedPlan, setRevisedPlan] = useLocalStorage('lmls_revised_plan', "")
  const [persona, setPersona] = useLocalStorage<Persona>('lmls_persona', 'supportive')

  // Multi-deadline mission states
  const [missions, setMissions] = useLocalStorage<Mission[]>('lmls_missions', [])
  const [activeMissionId, setActiveMissionId] = useLocalStorage<string | null>('lmls_active_mission', null)
  const [priorityAdvice, setPriorityAdvice] = useState<string | null>(null)
  const [isFetchingAdvice, setIsFetchingAdvice] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)

  // Sync virtual state variable to match restored planMarkdown
  const aiResponse = planMarkdown || null
  const setAiResponse = (val: string | null) => setPlanMarkdown(val || '')

  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Rotating thinking message for premium UX
  const [thinkingMessage, setThinkingMessage] = useState("Analyzing goals & deadlines...")

  // Checklist and Re-planning state variables
  const [isReplanning, setIsReplanning] = useState(false)
  const [isPlanCollapsed, setIsPlanCollapsed] = useState(true)

  // Toast Notification state
  const [showToast, setShowToast] = useState(false)

  // Drift Detector Agent state variables
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null)
  const [isNudgeVisible, setIsNudgeVisible] = useState(false)
  const [isFetchingNudge, setIsFetchingNudge] = useState(false)

  // Image Upload vision extraction states
  const [isExtractingImage, setIsExtractingImage] = useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [extractionSuccess, setExtractionSuccess] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)

  // Confetti victory celebration state
  const [showCelebration, setShowCelebration] = useState(false)

  // Landing Hero visibility states
  const [showLanding, setShowLanding] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Google Search grounding states
  const [useGrounding, setUseGrounding] = useState(true)
  const [wasGrounded, setWasGrounded] = useState(false)
  const [sources, setSources] = useState<Array<{ title: string; url: string }> | null>(null)

  // Smart restore banner visibility state
  const [showRestoredBanner, setShowRestoredBanner] = useState(false)

  // Focus Mode active task ID state
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null)

  // The Negotiator Modal visibility state
  const [showNegotiator, setShowNegotiator] = useState(false)

  // Compute the current deadline urgency theme variables
  const { theme, hoursLeft } = useDeadlineTheme(deadline)

  // Sync body theme classes on change
  useEffect(() => {
    const body = document.body
    body.classList.remove('theme-calm', 'theme-alert', 'theme-critical')
    if (theme !== 'none') {
      body.classList.add(`theme-${theme}`)
    }
    return () => {
      body.classList.remove('theme-calm', 'theme-alert', 'theme-critical')
    }
  }, [theme])

  // Sync browser document title based on critical proximity
  useEffect(() => {
    document.title = theme === 'critical'
      ? '🔴 DEADLINE APPROACHING — Last-Minute Life Saver'
      : 'Last-Minute Life Saver'
  }, [theme])

  // Memoized Deadline Danger risk calculations
  const riskData = useMemo(() => {
    if (tasks.length === 0) return null
    return calculateRiskScore({
      deadline,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.isComplete).length,
      blockedTasks: tasks.filter(t => t.isBlocked).length,
      energyLevel: energy
    })
  }, [tasks, deadline, energy])

  // Synchronize current local state variables back to missions array safely
  useEffect(() => {
    if (!activeMissionId || isSelecting) return;
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id === activeMissionId) {
          return {
            ...m,
            taskDescription: task,
            deadline: deadline,
            energyLevel: energy,
            tasks: tasks,
            planMarkdown: planMarkdown,
            revisedPlan: revisedPlan,
          };
        }
        return m;
      })
    );
  }, [task, deadline, energy, tasks, planMarkdown, revisedPlan, activeMissionId, isSelecting]);

  // Sync risk score to active mission array
  useEffect(() => {
    if (!activeMissionId || !riskData) return;
    setMissions((prev) =>
      prev.map((m) =>
        m.id === activeMissionId ? { ...m, riskScore: riskData.score } : m
      )
    );
  }, [riskData?.score, activeMissionId]);

  useEffect(() => {
    if (!isGenerating) return;
    const messages = [
      "Analyzing goals & deadlines...",
      "Evaluating energy constraints...",
      "Drafting 15-minute micro-steps...",
      "Formatting clean markdown roadmap...",
      "Optimizing priorities for productivity..."
    ];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setThinkingMessage(messages[index]);
    }, 1500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Toast Auto-dismiss Timer Effect
  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => {
      setShowToast(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [showToast]);

  // Smart restore detection notification on first mount
  useEffect(() => {
    if (tasks.length > 0 || planMarkdown) {
      setShowRestoredBanner(true)
      const timer = setTimeout(() => setShowRestoredBanner(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [])

  // Background agent callback when user goes idle for 5 minutes
  async function handleDriftDetected(minutesIdle: number) {
    if (isFetchingNudge) return;
    setIsFetchingNudge(true);

    try {
      const res = await fetch("/api/nudge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskDescription: task,
          energyLevel: energy,
          minutesIdle,
          persona
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch AI nudge.");
      }

      setNudgeMessage(data.message);
      setIsNudgeVisible(true);
    } catch (err) {
      console.error("Error generating motivational nudge:", err);
    } finally {
      setIsFetchingNudge(false);
    }
  }

  // Mount the Drift Detector hook
  const { snooze } = useDriftDetector({
    taskDescription: task,
    energyLevel: energy,
    isActive: tasks.length > 0, // only active after plan is generated
    onDriftDetected: handleDriftDetected
  });

  // Base64 file reader and Gemini extraction dispatcher
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setExtractionError("Invalid file type. Please upload a valid image file (JPG, PNG, WEBP).");
      return;
    }

    setExtractionError(null);
    setExtractionSuccess(false);
    setIsExtractingImage(true);

    // Show thumbnail preview locally
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string;
        // Strip out base64 data prefix string
        const base64Content = dataUrl.split(",")[1];

        const res = await fetch("/api/extract-from-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageBase64: base64Content,
            mimeType: file.type,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Could not read image.");
        }

        setTask(data.extractedText);
        setExtractionSuccess(true);
      } catch (err) {
        console.error("Error parsing vision photo:", err);
        setExtractionError("Could not read image. Please try typing your task instead.");
        setImagePreviewUrl(null);
      } finally {
        setIsExtractingImage(false);
      }
    };

    reader.onerror = () => {
      setExtractionError("Could not read image. Please try typing your task instead.");
      setIsExtractingImage(false);
      setImagePreviewUrl(null);
    };

    reader.readAsDataURL(file);
  };

  // Mount browser-based Speech Recognition voice hook
  const { isListening, isSupported, start, stop, error: voiceError } = useVoiceInput(async (transcript) => {
    setTask(transcript) // immediately fill raw transcript
    
    try {
      const res = await fetch('/api/clean-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawTranscript: transcript })
      })
      const data = await res.json()
      if (res.ok && data.cleanedText) {
        setTask(data.cleanedText)
      }
    } catch (err) {
      console.error("Failed to clean voice transcript:", err)
    }
  })

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!task.trim()) return

    setIsGenerating(true)
    setAiResponse(null)
    setPlanMarkdown("")
    setTasks([])
    setRevisedPlan("")
    setError(null)
    setIsPlanCollapsed(true)
    setIsNudgeVisible(false) // reset nudge state
    setPlanGeneratedAt(null) // reset counter
    setShowCelebration(false) // reset overlay
    setWasGrounded(false) // reset grounding
    setSources(null) // reset sources

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task, deadline, energy, useGrounding, persona }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate plan.")
      }

      setAiResponse(data.plan)
      setPlanMarkdown(data.plan) // Save original plan text
      const parsedTasks = parsePlanToTasks(data.plan)
      setTasks(parsedTasks)
      
      const generatedAtStr = new Date().toISOString()
      setPlanGeneratedAt(generatedAtStr) // Set generation timestamp string
      setWasGrounded(data.wasGrounded)
      setSources(data.sources)

      // Create and save new mission if activeMissionId is null
      if (!activeMissionId) {
        const newMissionId = crypto.randomUUID();
        const newMission = {
          id: newMissionId,
          taskDescription: task,
          deadline: deadline,
          energyLevel: energy,
          tasks: parsedTasks,
          planMarkdown: data.plan,
          revisedPlan: '',
          createdAt: generatedAtStr,
          riskScore: 50
        };
        setMissions([...missions, newMission]);
        setActiveMissionId(newMissionId);
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setIsGenerating(false)
    }
  }

  // API re-plan pipeline dispatcher helper
  async function triggerReplan({ completedTasks, blockedTask, remainingTasks }: { completedTasks: string[]; blockedTask: string; remainingTasks: string[] }) {
    setIsReplanning(true)
    setRevisedPlan("")
    setError(null)

    try {
      const res = await fetch("/api/replan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completedTasks,
          blockedTask,
          remainingTasks,
          taskDescription: task,
          energyLevel: energy,
          deadline: deadline,
          persona
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to recalculate plan.")
      }

      setRevisedPlan(data.revisedPlan)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "An error occurred during re-planning.")
    } finally {
      setIsReplanning(false)
    }
  }

  // Checkbox complete event hook
  async function handleComplete(id: string) {
    const updatedTasks = tasks.map((t) => {
      if (t.id === id) {
        return { ...t, isComplete: !t.isComplete, isBlocked: false }
      }
      return t
    })
    setTasks(updatedTasks)

    const allDone = updatedTasks.every(t => t.isComplete)
    if (allDone) {
      setTimeout(() => setShowCelebration(true), 600)
    }

    const completed = updatedTasks.filter((t) => t.isComplete).map((t) => t.text)
    const remaining = updatedTasks.filter((t) => !t.isComplete).map((t) => t.text)

    await triggerReplan({
      completedTasks: completed,
      blockedTask: "",
      remainingTasks: remaining
    })
  }

  // Stuck trigger block event hook
  async function handleBlocked(id: string) {
    let blockedText = ""
    const updatedTasks = tasks.map((t) => {
      if (t.id === id) {
        const nextBlocked = !t.isBlocked
        if (nextBlocked) blockedText = t.text
        return { ...t, isBlocked: nextBlocked }
      }
      return t
    })
    setTasks(updatedTasks)

    const completed = updatedTasks.filter((t) => t.isComplete).map((t) => t.text)
    // Remaining tasks exclude the blocked task itself from list of items to plan
    const remaining = updatedTasks
      .filter((t) => !t.isComplete && t.id !== id)
      .map((t) => t.text)

    await triggerReplan({
      completedTasks: completed,
      blockedTask: blockedText,
      remainingTasks: remaining
    })
  }

  // Google Calendar Event redirect builder
  function handleGoogleCalendarExport() {
    if (tasks.length === 0) return
    const url = buildGoogleCalendarUrl(tasks[0].text, new Date(), 15)
    window.open(url, "_blank")
    setShowToast(true)
  }

  // ICS File download pipeline builder
  function handleICSDownload() {
    if (tasks.length === 0) return
    const now = new Date()
    const scheduledTasks = tasks.map((taskItem, idx) => ({
      text: taskItem.text,
      startTime: new Date(now.getTime() + idx * 15 * 60 * 1000), // starts 15 minutes after previous
      duration: 15
    }))

    const icsContent = buildICSContent(scheduledTasks)
    downloadICS(icsContent)
    setShowToast(true)
  }

  // Clean dashboard and reset all localStorage persistent variables
  const handleStartFresh = () => {
    if (confirm('Clear your current plan and start over?')) {
      setTask('')
      setDeadline('')
      setEnergy(5)
      setTasks([])
      setPlanMarkdown('')
      setPlanGeneratedAt(null)
      setRevisedPlan('')
      
      const keys = [
        'lmls_task',
        'lmls_deadline',
        'lmls_energy',
        'lmls_tasks',
        'lmls_plan',
        'lmls_plan_at',
        'lmls_revised_plan'
      ];
      keys.forEach(k => localStorage.removeItem(k));

      // Reset standard helper ui views
      setError(null)
      setImagePreviewUrl(null)
      setExtractionSuccess(false)
      setExtractionError(null)
      setShowCelebration(false)
      setWasGrounded(false)
      setSources(null)
    }
  }

  // Selecting a mission from sidebar: load details into local states
  const handleSelectMission = (id: string) => {
    const m = missions.find(item => item.id === id)
    if (!m) return
    setIsSelecting(true)
    setActiveMissionId(id)
    setTask(m.taskDescription)
    setDeadline(m.deadline)
    setEnergy(m.energyLevel)
    setTasks(m.tasks)
    setPlanMarkdown(m.planMarkdown)
    setRevisedPlan(m.revisedPlan)
    setPlanGeneratedAt(m.createdAt)
    setTimeout(() => setIsSelecting(false), 50)
  }

  // New Mission trigger: clear all states ready for new input
  const handleNewMission = () => {
    setActiveMissionId(null)
    setTask('')
    setDeadline('')
    setEnergy(5)
    setTasks([])
    setPlanMarkdown('')
    setRevisedPlan('')
    setPlanGeneratedAt(null)

    setError(null)
    setImagePreviewUrl(null)
    setExtractionSuccess(false)
    setExtractionError(null)
    setShowCelebration(false)
    setWasGrounded(false)
    setSources(null)
  }

  // Delete specific mission ID
  const handleDeleteMission = (id: string) => {
    const updated = missions.filter(m => m.id !== id)
    setMissions(updated)
    if (activeMissionId === id) {
      handleNewMission()
    }
  }

  // AI priority analysis query call
  const handleAskPriorityAdvice = async () => {
    setIsFetchingAdvice(true)
    setPriorityAdvice(null)
    try {
      const payload = missions.map(m => ({
        id: m.id,
        taskDescription: m.taskDescription,
        deadline: m.deadline,
        riskScore: m.riskScore,
        completedCount: m.tasks.filter(t => t.isComplete).length,
        totalCount: m.tasks.length
      }))

      const res = await fetch('/api/prioritize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ missions: payload })
      })

      const data = await res.json()
      if (res.ok && data.advice) {
        setPriorityAdvice(data.advice)
      }
    } catch (err) {
      console.error('Failed to get priority advice:', err)
    } finally {
      setIsFetchingAdvice(false)
    }
  }

  // Transition handler for Get Started click event
  function handleGetStarted() {
    setIsTransitioning(true)
    setTimeout(() => {
      setShowLanding(false)
      setIsTransitioning(false)
    }, 300)
  }

  // Render header branding logo based on active theme
  const renderBrandingLogo = () => {
    if (themeId === 'beast') {
      return (
        <span style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.08em', color: 'var(--accent)', textTransform: 'uppercase', fontFamily: 'var(--font)' }}>
          LAST·MINUTE
        </span>
      )
    }
    if (themeId === 'royale') {
      return (
        <span style={{ fontSize: '15px', fontWeight: 700, fontStyle: 'italic', color: 'var(--accent)', fontFamily: 'var(--font)' }}>
          Last·Minute
        </span>
      )
    }
    if (themeId === 'pixel') {
      return (
        <span style={{ fontSize: '15px', fontWeight: 400, color: 'var(--accent)', fontFamily: 'var(--font)', letterSpacing: '0.05em' }}>
          LAST.MINUTE
        </span>
      )
    }
    if (themeId === 'sakura') {
      return (
        <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-1)', fontFamily: 'var(--font)' }}>
          Last·Minute <span style={{ color: 'var(--accent)' }}>✨</span>
        </span>
      )
    }
    if (themeId === 'vitality') {
      return (
        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font)' }}>
          Last·Minute 🌿
        </span>
      )
    }
    return (
      <span className="app-logo">
        Last·Minute
      </span>
    )
  }

  // Render hero landing page conditionally
  if (showLanding) {
    return (
      <LandingHero
        onGetStarted={handleGetStarted}
        isTransitioning={isTransitioning}
      />
    )
  }

  const completedCount = tasks.filter((t) => t.isComplete).length
  const completionPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  // Energy descriptors
  const getEnergyDescription = (val: number) => {
    if (val <= 3) return "💤 Low Energy (Focusing on short, administrative, or highly paced steps)";
    if (val <= 7) return "⚡ Medium Energy (Standard execution, steady task division)";
    return "🔥 High Energy (Deep focus mode, tackling heavy modules head-on)";
  };

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', background: 'var(--bg)' }}>
      
      {/* Mission sidebar navigation */}
      <MissionSidebar
        missions={missions}
        activeMissionId={activeMissionId}
        onSelect={handleSelectMission}
        onNew={handleNewMission}
        onDelete={handleDeleteMission}
        priorityAdvice={priorityAdvice}
        onAskAdvice={handleAskPriorityAdvice}
        isFetchingAdvice={isFetchingAdvice}
      />

      {/* Main dashboard content container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* 2px Pulsing Top Border indicator on critical theme */}
        {theme === 'critical' && (
          <div 
            className="animate-pulse"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'var(--accent)',
              zIndex: 9999
            }}
          />
        )}

        {/* Smart restored state notification banner */}
        <div 
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-opacity duration-500
            ${showRestoredBanner ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          <div className="badge badge-accent py-2 px-4 shadow-lg text-xs font-semibold">
            ✓ Your plan was restored
          </div>
        </div>

        {/* Sticky Header with minimalistic design */}
        <header className="app-header">
          <div className="max-w-3xl mx-auto flex items-center justify-between w-full">
            {/* Logo & Back to Home */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowLanding(true)}
                className="btn btn-ghost text-xs py-1"
              >
                ← Back to Home
              </button>
              <div className="h-4 w-px bg-zinc-800" />
              
              {/* BRANDING LOGO */}
              {renderBrandingLogo()}

              {/* Urgency Status Chip inside header */}
              {theme !== 'none' && (
                <div 
                  className={`
                    ${theme === 'critical' ? 'badge badge-red animate-pulse' : ''}
                    ${theme === 'alert' ? 'badge badge-amber' : ''}
                    ${theme === 'calm' ? 'badge badge-green' : ''}
                  `}
                >
                  {theme === 'critical' && `🔴 CRITICAL — ${Math.floor(hoursLeft)}h left`}
                  {theme === 'alert' && `⚠️ ${Math.floor(hoursLeft)}h remaining`}
                  {theme === 'calm' && `✓ ${Math.floor(hoursLeft)}h until deadline`}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Theme Picker Component */}
              <ThemePicker themeId={themeId} onChange={setThemeId} />

              <div className="h-4 w-px bg-zinc-800" />

              {/* Persona Toggle Capsule */}
              <PersonaToggle persona={persona} onChange={setPersona} />
            </div>
          </div>
        </header>

        {/* Main Body - single column flow container */}
        <main className="page-wrap" style={{ paddingTop: '32px', width: '100%', maxWidth: '780px' }}>
          
          {/* Top status bar metadata info */}
          <div className="flex justify-between items-center mb-6">
            <span className="t-caption select-none">Coach Settings</span>
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
              {persona === 'supportive' ? 'Empathetic guidance active 🌱' : "No excuses coach active. 🔥"}
            </span>
          </div>

          {/* Form Section */}
          <section className="flex flex-col space-y-6">
            <div className="card">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="t-heading flex items-center space-x-2">
                    <span>📋</span>
                    <span>Initialize Task Breakdown</span>
                  </h2>
                  
                  {/* Start Fresh Reset Button */}
                  <button
                    type="button"
                    onClick={handleStartFresh}
                    className="btn btn-ghost text-xs"
                  >
                    ↺ Start fresh
                  </button>
                </div>

                <p className="t-body mt-2 mb-6">
                  Tell us what you need to do, when it's due, and your energy level. Our AI productivity coach will draft a realistic, prioritized schedule.
                </p>

                <form onSubmit={handleGenerate} className="space-y-6">
                  
                  {/* Vision Photo Upload Zone */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="field-label">
                        Upload your assignment photo
                      </span>
                      {extractionSuccess && imagePreviewUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreviewUrl(null)
                            setExtractionSuccess(false)
                            setExtractionError(null)
                          }}
                          className="btn btn-ghost text-xs"
                        >
                          📷 Change image
                        </button>
                      )}
                    </div>

                    {!extractionSuccess && (
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault()
                          const file = e.dataTransfer.files?.[0]
                          if (file) handleImageFile(file)
                        }}
                        onClick={() => {
                          const fileInput = document.getElementById("image-upload-input")
                          fileInput?.click()
                        }}
                        className="border border-dashed border-zinc-800 rounded-xl p-6 text-center cursor-pointer transition-colors bg-zinc-950/20"
                      >
                        <input
                          id="image-upload-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageFile(file)
                          }}
                        />
                        <span className="text-sm text-zinc-400 block font-medium">
                          📷 Upload assignment photo or drop image here
                        </span>
                        <span className="text-zinc-650 text-xs mt-1 block">
                          (JPG, PNG, WEBP supported)
                        </span>
                      </div>
                    )}

                    {/* Extracting loading status spinner */}
                    {isExtractingImage && (
                      <div className="card-sm card-accent animate-pulse flex items-center justify-center space-x-2.5">
                        <svg className="animate-spin h-5 w-5 text-zinc-555" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="t-accent text-sm font-semibold">
                          🔍 Gemini is reading your image...
                        </span>
                      </div>
                    )}

                    {/* Image preview thumbnail */}
                    {imagePreviewUrl && (
                      <div className="mt-2 flex items-center space-x-3 bg-zinc-950/40 p-2 rounded-xl border border-zinc-800/60 max-w-max">
                        <img
                          src={imagePreviewUrl}
                          alt="Task Preview"
                          className="h-14 max-h-[80px] object-contain rounded-lg border border-zinc-855"
                        />
                        <span className="text-xs text-zinc-550 font-medium">Thumbnail Loaded</span>
                      </div>
                    )}

                    {/* Extraction Errors */}
                    {extractionError && (
                      <div className="badge badge-red w-full justify-center p-3">
                        ⚠️ {extractionError}
                      </div>
                    )}
                  </div>

                  {/* Task Input Textarea */}
                  <div className="space-y-1.5">
                    <label htmlFor="task" className="field-label">
                      What task do you want to break down?
                    </label>
                    
                    <div className="flex items-start space-x-2">
                      <textarea
                        id="task"
                        required
                        rows={3}
                        disabled={isGenerating || isReplanning || isExtractingImage || isListening}
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                        placeholder="e.g., Study for Chemistry Exam, Clean the entire garage..."
                        className="input flex-1"
                        maxLength={2000}
                      />

                      {isSupported && (
                        <button
                          type="button"
                          onClick={isListening ? stop : start}
                          disabled={isGenerating || isReplanning || isExtractingImage}
                          className={`btn-icon flex-shrink-0 self-start p-3
                            ${isListening 
                              ? 'btn-danger-ghost animate-pulse' 
                              : ''
                            }
                          `}
                          title={isListening ? "Stop voice recording" : "Record voice input"}
                        >
                          {isListening ? (
                            <span className="text-sm font-bold block leading-none">⏹</span>
                          ) : (
                            <span className="text-sm block leading-none">🎤</span>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Voice recording helpers */}
                    {isListening && (
                      <p className="t-accent text-xs font-semibold animate-pulse flex items-center space-x-1">
                        <span>🎙</span>
                        <span>Listening... speak your task clearly</span>
                      </p>
                    )}

                    {voiceError && (
                      <div className="badge badge-red w-full justify-center p-2.5">
                        ⚠️ Voice error: {voiceError}. Please type instead.
                      </div>
                    )}

                    {/* Vision Extraction Success Notification */}
                    {extractionSuccess && (
                      <div className="badge badge-green w-full justify-center p-2.5">
                        ✅ Tasks extracted from your image! Review and edit above.
                      </div>
                    )}
                  </div>

                  {/* Deadline Input */}
                  <div>
                    <label htmlFor="deadline" className="field-label">
                      When is the deadline?
                    </label>
                    <input
                      id="deadline"
                      type="text"
                      disabled={isGenerating || isReplanning || isExtractingImage}
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      placeholder="e.g., In 3 hours, Tomorrow at 5 PM, Next Friday..."
                      className="input"
                      maxLength={2000}
                    />
                  </div>

                  {/* Energy Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="energy" className="field-label mb-0">
                        Your current energy level:
                      </label>
                      <span className="badge badge-accent">
                        {energy} / 10
                      </span>
                    </div>
                    <input
                      id="energy"
                      type="range"
                      min="1"
                      max="10"
                      disabled={isGenerating || isReplanning || isExtractingImage}
                      value={energy}
                      onChange={(e) => setEnergy(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs font-medium text-zinc-555 mt-2 bg-zinc-950/30 p-2.5 rounded-lg border border-zinc-800/40">
                      {getEnergyDescription(energy)}
                    </div>
                  </div>

                  {/* Google Search Grounding Toggle Switch */}
                  <div className="flex items-center justify-between p-3.5 bg-zinc-950/40 border border-zinc-800/60 rounded-xl">
                    <div className="flex flex-col pr-4">
                      <span className="text-sm font-semibold text-zinc-300 flex items-center space-x-1.5 flex-wrap">
                        <span>🌐</span>
                        <span>Enhance with Google Search</span>
                      </span>
                      <span className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                        Gemini will fetch current reference guides & tutorials online
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none flex-shrink-0">
                      <input
                        type="checkbox"
                        disabled={isGenerating || isReplanning || isExtractingImage}
                        checked={useGrounding}
                        onChange={(e) => setUseGrounding(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-zinc-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${useGrounding ? 'bg-[var(--accent)]' : ''} peer-checked:after:bg-white`} />
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isGenerating || isReplanning || isExtractingImage || !task.trim()}
                    className="btn btn-primary"
                  >
                    <span>⚡ Generate Execution Plan</span>
                  </button>

                </form>
              </div>
            </div>
          </section>

          {/* Section Divider - visible only when generating or plan is present */}
          {(isGenerating || aiResponse || error) && (
            <div className="section-divider" />
          )}

          {/* Execution Plan Display Section */}
          {(isGenerating || aiResponse || error) && (
            <section className="flex flex-col">
              <div className="card">
                
                {/* Error State */}
                {!isGenerating && error && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 my-auto space-y-4">
                    <div className="text-5xl">⚠️</div>
                    <h3 className="text-lg font-bold text-rose-400">Failed to Process Plan</h3>
                    <p className="text-sm text-zinc-400 max-w-sm">
                      {error}
                    </p>
                    <button
                      onClick={handleGenerate}
                      className="btn btn-secondary"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {/* Shimmer Skeleton Loader replacing "Loading..." text */}
                {isGenerating && (
                  <div className="flex-1 py-4">
                    <SkeletonPlan />
                  </div>
                )}

                {/* Plan Display State */}
                {!isGenerating && aiResponse && (
                  <div className="flex-1 flex flex-col h-full space-y-6">
                    
                    {/* Plan Header */}
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                      <div>
                        <span className="badge badge-accent">
                          Execution Roadmap
                        </span>
                        <h3 className="t-heading mt-2">
                          {task}
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          const textToCopy = revisedPlan || aiResponse || '';
                          navigator.clipboard.writeText(textToCopy);
                          alert(revisedPlan ? "Updated adaptive plan copied!" : "Roadmap copied to clipboard!");
                        }}
                        className="btn btn-secondary text-xs"
                      >
                        <span>📋 Copy Plan</span>
                      </button>
                    </div>

                    {/* Deadline Danger Risk Score Widget */}
                    {riskData && (
                      <RiskGauge
                        score={riskData.score}
                        label={riskData.label}
                        color={riskData.color}
                        message={riskData.message}
                      />
                    )}

                    {/* Negotiator Trigger Button - under 25 risk score */}
                    {riskData && riskData.score < 25 && tasks.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-secondary animate-pulse"
                        style={{
                          width: '100%',
                          borderColor: 'rgba(239,68,68,0.25)',
                          color: 'var(--red)',
                          marginTop: '-8px',
                          marginBottom: '16px'
                        }}
                        onClick={() => setShowNegotiator(true)}
                      >
                        😅 Need More Time? Let AI write the email.
                      </button>
                    )}

                    {/* Progress Bar Container */}
                    <div className="progress-wrap">
                      <div className="progress-meta">
                        <span className="t-caption">{completedCount} of {tasks.length} micro-tasks complete</span>
                        <span className="badge badge-neutral">{completionPercentage}%</span>
                      </div>
                      <div className="progress-track">
                        <div 
                          className="progress-fill"
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Cost of Procrastination counter widget */}
                    {planGeneratedAt && (
                      <ProcrastinationCounter
                        planGeneratedAt={new Date(planGeneratedAt)}
                        totalTasks={tasks.length}
                        completedTasks={tasks.filter(t => t.isComplete).length}
                      />
                    )}

                    {/* Pulsing Agent Re-plan message */}
                    {isReplanning && (
                      <div className="card-sm card-accent animate-pulse flex items-center justify-center p-4">
                        <span className="t-accent text-sm font-semibold">
                          🤖 Agent is recalculating your plan...
                        </span>
                      </div>
                    )}

                    {/* Tasks Interactive Checklist */}
                    {tasks.length > 0 && (
                      <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                        {tasks.map((taskItem) => (
                          <TaskCard
                            key={taskItem.id}
                            task={taskItem}
                            onComplete={handleComplete}
                            onBlocked={handleBlocked}
                            onFocus={(id) => setFocusTaskId(id)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Calendar Export Buttons Row */}
                    {tasks.length > 0 && (
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleGoogleCalendarExport}
                          className="btn btn-secondary flex-1"
                        >
                          📅 Add First Task to Calendar
                        </button>
                        <button
                          type="button"
                          onClick={handleICSDownload}
                          className="btn btn-secondary flex-1"
                        >
                          ⬇️ Download Full Plan (.ics)
                        </button>
                      </div>
                    )}

                    {/* Google Search Grounding Sources Citation Display */}
                    {wasGrounded && (
                      <div className="card mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="field-label mb-0">
                            🌐 Sources Used
                          </span>
                          <span className="badge badge-accent">
                            Powered by Google Search
                          </span>
                        </div>

                        {sources && sources.length > 0 ? (
                          <ul className="space-y-2 list-none pl-0">
                            {sources.map((src, index) => (
                              <li key={index} className="flex items-start text-xs">
                                <span className="mr-1.5 text-zinc-555 select-none">📎</span>
                                <a
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="t-accent underline leading-normal break-all transition-colors"
                                >
                                  {src.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="t-accent text-xs font-medium">
                            🌐 This plan was enhanced with real-time Google Search
                          </p>
                        )}
                      </div>
                    )}

                    {/* Adaptive Re-planned Plan Box */}
                    {revisedPlan && !isReplanning && (
                      <div className="card mt-4 space-y-3">
                        <div className="flex items-center">
                          <span className="badge badge-accent">
                            📋 Updated Plan from Your AI Agent
                        </span>
                        </div>
                        <div className="text-xs text-zinc-300 space-y-3 leading-relaxed">
                          {revisedPlan.split('\n').filter(p => p.trim() !== '').map((para, i) => (
                            <p key={i}>{para}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section Divider between checklist and chat follow-up */}
                    {tasks.length > 0 && (
                      <div className="section-divider" />
                    )}

                    {/* Conversational follow-up Ask Your AI Coach Chat Interface */}
                    {tasks.length > 0 && (
                      <PlanChat
                        planContext={planMarkdown}
                        taskDescription={task}
                        energyLevel={energy}
                        deadline={deadline}
                        persona={persona}
                      />
                    )}

                    {/* Collapsible original markdown roadmap */}
                    <div className="border-t border-zinc-800/60 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsPlanCollapsed(!isPlanCollapsed)}
                        className="btn btn-ghost w-full justify-between text-xs py-2"
                      >
                        <span>View full raw plan markdown</span>
                        <span>{isPlanCollapsed ? '▼ Show' : '▲ Hide'}</span>
                      </button>

                      {!isPlanCollapsed && (
                        <div className="card mt-4 max-h-[250px] overflow-y-auto">
                          <div className="font-sans text-sm text-zinc-300 leading-relaxed space-y-4">
                            <ReactMarkdown
                              components={{
                                h1: ({node, ...props}) => <h1 className="t-heading mt-6 mb-2 border-b border-zinc-855 pb-1" {...props} />,
                                h2: ({node, ...props}) => <h2 className="t-title mt-5 mb-2" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-base font-bold text-zinc-250 mt-4 mb-2" {...props} />,
                                p: ({node, ...props}) => <p className="mb-3 text-zinc-400 leading-relaxed" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2 text-zinc-400" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-zinc-400" {...props} />,
                                li: ({node, ...props}) => <li className="marker:text-indigo-400" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-semibold text-indigo-300" {...props} />,
                                code: ({node, ...props}) => <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-xs text-zinc-200 font-mono" {...props} />
                              }}
                            >
                              {aiResponse || ""}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                )}
                
                {/* Plan Footer controls */}
                {aiResponse && !isGenerating && (
                  <div className="border-t border-zinc-800/60 pt-4 mt-6 flex justify-between items-center text-xs text-zinc-500">
                    <span>⚡ Powered by Gemini API SDK</span>
                    <button 
                      onClick={() => {
                        setAiResponse(null)
                        setError(null)
                        setTask("")
                        setDeadline("")
                        setEnergy(5)
                        setTasks([])
                        setRevisedPlan("")
                        setIsPlanCollapsed(true)
                        setPlanGeneratedAt(null)
                        setImagePreviewUrl(null)
                        setExtractionSuccess(false)
                        setExtractionError(null)
                        setShowCelebration(false)
                        setWasGrounded(false)
                        setSources(null)
                        setPlanMarkdown("")
                      }}
                      className="btn btn-ghost flex items-center space-x-1.5"
                    >
                      <span>🔄 Reset Dashboard</span>
                    </button>
                  </div>
                )}

              </div>
            </section>
          )}

        </main>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="toast">
          ✅ Exported! Check your Google Calendar.
        </div>
      )}

      {/* Dynamic Nudge Notification Card from the Proactive Coach */}
      {isNudgeVisible && nudgeMessage && (
        <NudgeNotification
          message={nudgeMessage}
          onDismiss={() => setIsNudgeVisible(false)}
          onSnooze={() => {
            snooze();
            setIsNudgeVisible(false);
          }}
        />
      )}

      {/* Dynamic Victory Confetti Overlay */}
      {showCelebration && (
        <CelebrationOverlay
          taskDescription={task}
          totalTasks={tasks.length}
          persona={persona}
          onClose={() => {
            setShowCelebration(false)
            setTasks([])
            setPlanGeneratedAt(null)
            setTask("")
            setImagePreviewUrl(null)
            setExtractionSuccess(false)
            setExtractionError(null)
            setWasGrounded(false)
            setSources(null)
            setPlanMarkdown("")
          }}
        />
      )}

      {/* Distraction-free Focus Mode Overlay */}
      {focusTaskId && (() => {
        const t = tasks.find(item => item.id === focusTaskId)
        if (!t) return null
        const idx = tasks.filter(item => !item.isComplete)
          .findIndex(item => item.id === focusTaskId)
        return (
          <FocusMode
            task={t}
            taskIndex={idx}
            totalTasks={tasks.filter(item => !item.isComplete).length}
            onComplete={handleComplete}
            onExit={() => setFocusTaskId(null)}
            persona={persona}
          />
        )
      })()}

      {/* The Negotiator Extension Request Email Drafter Modal */}
      {showNegotiator && riskData && (
        <NegotiatorModal
          taskDescription={task}
          deadline={deadline}
          riskScore={riskData.score}
          completedCount={tasks.filter(t => t.isComplete).length}
          totalCount={tasks.length}
          onClose={() => setShowNegotiator(false)}
        />
      )}

    </div>
  )
}
