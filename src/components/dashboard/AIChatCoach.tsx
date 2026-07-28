import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { 
  Send, 
  Sparkles, 
  User, 
  RefreshCw, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Paperclip, 
  Plus, 
  History, 
  Activity, 
  Settings 
} from 'lucide-react';

interface MacroProfile {
  protein: string;
  carbs: string;
  fats: string;
  fiber: string;
  sugar: string;
}

interface MicronutrientProfile {
  vitamins: Record<string, string>;
  minerals: Record<string, string>;
}

interface FoodDetectionResult {
  foodName: string;
  servingSize: string;
  cookingMethod: string;
  calories: number;
  macros: MacroProfile;
  micros: MicronutrientProfile;
  confidenceScore: number;
  healthScore: number;
}

interface Message {
  id: number;
  sender: 'ai' | 'user';
  text: string;
  imagePreview?: string;
  foodMetrics?: FoodDetectionResult;
}

interface ChatSession {
  id: number;
  title: string;
  messages: Message[];
  context: {
    goal: string;
    clinicalProfile: string;
  };
}

export function AIChatCoach() {
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: 1,
      title: 'Active Performance Log',
      messages: [
        { id: 1, sender: 'ai', text: "NutriVerse AI Coaching core online. Biometrics, structural 3D body maps, and active meal logs are synced. How can I optimize your performance target today?" }
      ],
      context: { goal: 'Weight Loss', clinicalProfile: 'None' }
    }
  ]);
  const [activeSessionId, setActiveSessionId] = useState<number>(1);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Voice synthesis / Speech recognition state hooks
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingId, setIsSpeakingId] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  // Initialize SpeechRecognition Web API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setInputValue(prev => (prev ? `${prev} ${text}` : text));
        setIsListening(false);
      };

      rec.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession.messages, isTyping]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition API is not supported on this browser browser. Try Chrome/Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const speakText = (text: string, msgId: number) => {
    // If speaking this message, stop
    if (isSpeakingId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }

    // Stop past voices
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      setIsSpeakingId(null);
    };
    utterance.onerror = () => {
      setIsSpeakingId(null);
    };

    setIsSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const createNewSession = () => {
    const newId = Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: `Session ${sessions.length + 1}`,
      messages: [
        { id: 1, sender: 'ai', text: 'New session started. Set your dietary variables in the sidebar to calibrate the telemetry.' }
      ],
      context: { goal: 'Gym Diet', clinicalProfile: 'None' }
    };
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newId);
  };

  const handleSendMessage = async (text: string, imagePreview?: string, foodMetrics?: FoodDetectionResult) => {
    if (!text.trim() && !imagePreview) return;

    // Add user message to active session
    const userMsgId = Date.now();
    const userMsg: Message = { id: userMsgId, sender: 'user', text, imagePreview, foodMetrics };
    
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: [...s.messages, userMsg] };
      }
      return s;
    }));

    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...activeSession.messages, userMsg],
          context: activeSession.context
        })
      });

      if (!response.ok) throw new Error('API server down');
      const data = await response.json();

      setIsTyping(false);
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, { id: Date.now(), sender: 'ai', text: data.reply }]
          };
        }
        return s;
      }));
    } catch (err) {
      console.warn('API chat offline, running local fallback logic:', err);
      setTimeout(() => {
        setIsTyping(false);
        let fallbackReply = "Biometrics parsed. Aim for low-glycemic nutrients and maintain clean hydration parameters (3L daily). Reach out if you want me to plan an active meal split.";
        if (text.toLowerCase().includes('keto')) {
          fallbackReply = "[NUTRIVERSE AI] Keto parameters matched: Target 75% Fats, 20% Protein, and 5% Carbs. Prioritize seared salmon, butter herbs, and ribeye.";
        } else if (text.toLowerCase().includes('diabetes')) {
          fallbackReply = "[NUTRIVERSE AI] Glucose stabilizer active: Target fiber-dense complex carbohydrates to eliminate insulin spikes.";
        }

        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: [...s.messages, { id: Date.now(), sender: 'ai', text: fallbackReply }]
            };
          }
          return s;
        }));
      }, 1200);
    }
  };

  const handleImageAttachment = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const base64Uri = event.target.result as string;
        
        // Call vision API to fetch food details
        try {
          const response = await fetch('http://localhost:5000/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUri: base64Uri, filename: file.name })
          });
          if (!response.ok) throw new Error('API server offline');
          const data = await response.json();
          
          handleSendMessage(
            `Diagnostic upload complete: Scanned ${data.foodName} (${data.calories} kcal).`,
            base64Uri,
            data
          );
        } catch (err) {
          console.warn('Scan server unreachable, executing visual mock fallback:', err);
          const fallbackScan: FoodDetectionResult = {
            foodName: 'Wild Caught Seared Salmon Fillet',
            servingSize: '160g fillet',
            cookingMethod: 'Pan-Seared in Light Olive Oil',
            calories: 320,
            macros: { protein: '34g', carbs: '0g', fats: '18g', fiber: '0g', sugar: '0g' },
            micros: {
              vitamins: { 'Vitamin D': '120%' },
              minerals: { 'Iron': '4%' }
            },
            confidenceScore: 98,
            healthScore: 9
          };
          handleSendMessage(
            `Diagnostic upload complete (Fallback): Scanned ${fallbackScan.foodName} (${fallbackScan.calories} kcal).`,
            base64Uri,
            fallbackScan
          );
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const updateGoal = (goal: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, context: { ...s.context, goal } };
      }
      return s;
    }));
  };

  const updateProfile = (clinicalProfile: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, context: { ...s.context, clinicalProfile } };
      }
      return s;
    }));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: '1.5rem',
        minHeight: '560px',
        alignItems: 'stretch'
      }} className="chat-layout-container">
        
        {/* Left Side Navigation & Biometric Context Settings */}
        <div className="glass-panel desktop-only" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* New session button */}
            <button onClick={createNewSession} className="btn-premium" style={{ width: '100%', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.6rem' }}>
              <Plus size={14} /> New Coach Session
            </button>

            {/* Past history list */}
            <div>
              <span className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                <History size={12} /> Active Conversations
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSessionId(s.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: activeSessionId === s.id ? 'oklch(1 0 0 / 0.05)' : 'transparent',
                      border: 'none',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      color: activeSessionId === s.id ? 'var(--foreground)' : 'var(--foreground-muted)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontWeight: activeSessionId === s.id ? 600 : 500
                    }}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Goal Configuration triggers */}
            <div>
              <span className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                <Settings size={12} /> Metabolic Goal
              </span>
              <select
                value={activeSession.context.goal}
                onChange={(e) => updateGoal(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem',
                  borderRadius: '6px',
                  backgroundColor: 'oklch(1 0 0 / 0.05)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--foreground)',
                  fontSize: '0.8rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {['Weight Loss', 'Weight Gain', 'Keto', 'High Protein', 'Gym Diet', 'Pregnancy Diet'].map(goal => (
                  <option key={goal} value={goal}>{goal}</option>
                ))}
              </select>
            </div>

            {/* Clinical constraints profile */}
            <div>
              <span className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                <Activity size={12} /> Clinical Profile
              </span>
              <select
                value={activeSession.context.clinicalProfile}
                onChange={(e) => updateProfile(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem',
                  borderRadius: '6px',
                  backgroundColor: 'oklch(1 0 0 / 0.05)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--foreground)',
                  fontSize: '0.8rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {['None', 'Diabetes', 'PCOS'].map(prof => (
                  <option key={prof} value={prof}>{prof}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.7rem', color: 'var(--foreground-muted)' }}>
            <Sparkles size={14} style={{ color: 'var(--accent-purple)' }} />
            <span>Context memory calibrated.</span>
          </div>

        </div>

        {/* ChatGPT main Chat Console */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Header metadata indicator */}
          <div style={{
            padding: '1.2rem',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'oklch(0.12 0.03 270 / 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ padding: '0.4rem', borderRadius: '50%', backgroundColor: 'var(--accent-purple-glow)', color: 'var(--accent-purple)', display: 'flex' }}>
                <Sparkles size={16} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>NutriVerse Nutrition Agent</h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
                  Active context: {activeSession.context.goal} {activeSession.context.clinicalProfile !== 'None' && `(${activeSession.context.clinicalProfile})`}
                </span>
              </div>
            </div>
          </div>

          {/* Messages feed viewport */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              padding: '1.5rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              backgroundColor: 'oklch(0.08 0.02 270 / 0.1)'
            }}
          >
            {activeSession.messages.map((msg) => {
              const isAI = msg.sender === 'ai';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignSelf: isAI ? 'flex-start' : 'flex-end',
                    flexDirection: isAI ? 'row' : 'row-reverse',
                    maxWidth: '85%'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: isAI ? 'var(--accent-purple-glow)' : 'oklch(1 0 0 / 0.05)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isAI ? 'var(--accent-purple)' : 'var(--foreground)',
                    flexShrink: 0
                  }}>
                    {isAI ? <Sparkles size={14} /> : <User size={14} />}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: isAI ? 'flex-start' : 'flex-end' }}>
                    {/* Text bubble */}
                    <div style={{
                      backgroundColor: isAI ? 'oklch(1 0 0 / 0.03)' : 'var(--accent-purple-glow)',
                      border: '1px solid',
                      borderColor: isAI ? 'var(--border-light)' : 'var(--accent-purple-glow)',
                      padding: '0.85rem 1.1rem',
                      borderRadius: isAI ? '0px 16px 16px 16px' : '16px 0px 16px 16px',
                      fontSize: '0.85rem',
                      lineHeight: 1.45,
                      position: 'relative'
                    }}>
                      {/* Paste/Upload image attachment inside chat bubble */}
                      {msg.imagePreview && (
                        <div style={{ width: '100%', maxWidth: '240px', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.5rem', border: '1px solid var(--border-light)' }}>
                          <img src={msg.imagePreview} alt="Attached food item" style={{ width: '100%', height: 'auto', display: 'block' }} />
                        </div>
                      )}

                      {/* Diagnostic metrics embed block */}
                      {msg.foodMetrics && (
                        <div style={{
                          backgroundColor: 'oklch(1 0 0 / 0.03)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '8px',
                          padding: '0.65rem',
                          fontSize: '0.75rem',
                          marginBottom: '0.5rem',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '0.35rem'
                        }}>
                          <span style={{ gridColumn: 'span 2', fontWeight: 'bold', borderBottom: '1px solid oklch(1 0 0 / 0.05)', paddingBottom: '0.2rem' }}>
                            {msg.foodMetrics.foodName} ({msg.foodMetrics.calories} kcal)
                          </span>
                          <span>Protein: {msg.foodMetrics.macros.protein}</span>
                          <span>Carbs: {msg.foodMetrics.macros.carbs}</span>
                          <span>Fats: {msg.foodMetrics.macros.fats}</span>
                          <span>Rating: {msg.foodMetrics.healthScore}/10</span>
                        </div>
                      )}

                      {msg.text}
                    </div>

                    {/* Interactive read voice triggers */}
                    {isAI && (
                      <button
                        onClick={() => speakText(msg.text, msg.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: isSpeakingId === msg.id ? 'var(--accent-cyan)' : 'var(--foreground-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.7rem',
                          marginTop: '0.15rem'
                        }}
                      >
                        {isSpeakingId === msg.id ? <VolumeX size={12} /> : <Volume2 size={12} />}
                        <span>{isSpeakingId === msg.id ? 'Mute' : 'Play voice'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-purple-glow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-purple)'
                }}>
                  <Sparkles size={14} />
                </div>
                <div style={{
                  backgroundColor: 'oklch(1 0 0 / 0.03)',
                  border: '1px solid var(--border-light)',
                  padding: '0.85rem 1.1rem',
                  borderRadius: '0px 16px 16px 16px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <RefreshCw className="spin" size={12} style={{ animation: 'spin 2s linear infinite' }} /> 
                  <span>Mapping glycemic/HRV context...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Preset queries chips */}
          <div style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-light)', backgroundColor: 'oklch(0.12 0.03 270 / 0.2)' }}>
            {[
              'Configure Keto Macros',
              'Diabetes Glycemic guidelines',
              'PCOS Supplement stacks',
              'Pregnancy Diet parameters',
              'Gym split high-protein timing'
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="btn-outline"
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.7rem',
                  borderRadius: '9999px',
                  cursor: 'pointer'
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Form write interface */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            style={{
              padding: '1rem',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              backgroundColor: 'oklch(0.12 0.03 270 / 0.3)'
            }}
          >
            {/* Hidden Attachment input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageAttachment}
              style={{ display: 'none' }}
              accept="image/*"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'oklch(1 0 0 / 0.04)',
                border: '1px solid var(--border-light)',
                color: 'var(--foreground-muted)',
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Attach Image"
            >
              <Paperclip size={18} />
            </button>

            <button
              type="button"
              onClick={toggleListening}
              style={{
                background: isListening ? 'var(--accent-magenta-glow)' : 'oklch(1 0 0 / 0.04)',
                border: isListening ? '1px solid var(--accent-magenta)' : '1px solid var(--border-light)',
                color: isListening ? 'var(--accent-magenta)' : 'var(--foreground-muted)',
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Voice Input"
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask NutriVerse AI Coach about recipes, timing targets, or hormonal profiles..."
              className="input-futuristic"
              style={{ flex: 1, fontSize: '0.85rem' }}
            />

            <button
              type="submit"
              className="btn-premium"
              style={{
                padding: '0.75rem',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px'
              }}
              aria-label="Send query"
            >
              <Send size={16} />
            </button>
          </form>
        </div>

      </div>

      {styleOverrides}
    </div>
  );
}

const styleOverrides = (
  <style>{`
    @media (max-width: 768px) {
      .chat-layout-container {
        grid-template-columns: 1fr !important;
      }
    }
  `}</style>
);
