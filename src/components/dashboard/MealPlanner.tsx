import { useState } from 'react';
import { 
  RefreshCw, 
  ShoppingCart, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Calendar
} from 'lucide-react';
import { RecipeGenerator } from './RecipeGenerator';

interface MacroProfile {
  protein: string;
  carbs: string;
  fats: string;
}

interface WeeklyPlanDay {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
  calories: number;
  macros: MacroProfile;
}

interface ShoppingItem {
  item: string;
  category: string;
  qty: string;
  estCost: string;
  checked?: boolean;
}

interface PlannerResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  macros: MacroProfile;
  weeklyPlan: WeeklyPlanDay[];
  shoppingList: ShoppingItem[];
}

export function MealPlanner() {
  const [subTab, setSubTab] = useState<'plan' | 'recipe'>('plan');

  // Intake Form variables
  const [formStep, setFormStep] = useState(1); // 1: Stats, 2: Lifestyle/Cuisine, 3: Completed
  const [age, setAge] = useState(28);
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState(178); // cm
  const [weight, setWeight] = useState(78); // kg
  const [goal, setGoal] = useState('Weight Loss');
  const [activity, setActivity] = useState('moderate');
  const [lifestyle, setLifestyle] = useState('balanced');
  const [country] = useState('USA');
  const [cuisine, setCuisine] = useState('mediterranean');
  const [budget, setBudget] = useState('balanced');
  const [medicalConditions, setMedicalConditions] = useState('None');

  const [isLoading, setIsLoading] = useState(false);
  const [planResult, setPlanResult] = useState<PlannerResult | null>(null);
  const [selectedDay, setSelectedDay] = useState<WeeklyPlanDay | null>(null);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [showRecipes, setShowRecipes] = useState<string | null>(null);

  const triggerPlanGeneration = async () => {
    setIsLoading(true);
    setFormStep(3);

    try {
      const response = await fetch('http://localhost:5000/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age, gender, height, weight, goal, activity, lifestyle, country, cuisine, budget, medicalConditions
        })
      });

      if (!response.ok) throw new Error('API server down');
      const data = await response.json();
      setPlanResult(data);
      setSelectedDay(data.weeklyPlan[0]);
      setShoppingItems(data.shoppingList);
    } catch (err) {
      console.warn('API planner down, running fallback heuristics engine:', err);
      setTimeout(() => {
        const bmrVal = Math.round(10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161));
        const tdeeVal = Math.round(bmrVal * 1.375);
        const caloriesVal = goal === 'Weight Loss' ? tdeeVal - 450 : tdeeVal + 350;
        
        const fallbackData: PlannerResult = {
          bmr: bmrVal,
          tdee: tdeeVal,
          targetCalories: caloriesVal,
          macros: { protein: '156g', carbs: '190g', fats: '68g' },
          weeklyPlan: [
            { day: 'Monday', breakfast: 'Greek feta toast with olive oil', lunch: 'Tuna Salad with chickpeas', dinner: 'Baked Salmon with lemon asparagus', snack: 'Mixed walnuts', calories: caloriesVal, macros: { protein: '156g', carbs: '190g', fats: '68g' } },
            { day: 'Tuesday', breakfast: 'Greek feta toast with olive oil', lunch: 'Tuna Salad with chickpeas', dinner: 'Baked Salmon with lemon asparagus', snack: 'Mixed walnuts', calories: caloriesVal, macros: { protein: '156g', carbs: '190g', fats: '68g' } },
            { day: 'Wednesday', breakfast: 'Greek feta toast with olive oil', lunch: 'Tuna Salad with chickpeas', dinner: 'Baked Salmon with lemon asparagus', snack: 'Mixed walnuts', calories: caloriesVal, macros: { protein: '156g', carbs: '190g', fats: '68g' } },
            { day: 'Thursday', breakfast: 'Greek feta toast with olive oil', lunch: 'Tuna Salad with chickpeas', dinner: 'Baked Salmon with lemon asparagus', snack: 'Mixed walnuts', calories: caloriesVal, macros: { protein: '156g', carbs: '190g', fats: '68g' } },
            { day: 'Friday', breakfast: 'Greek feta toast with olive oil', lunch: 'Tuna Salad with chickpeas', dinner: 'Baked Salmon with lemon asparagus', snack: 'Mixed walnuts', calories: caloriesVal, macros: { protein: '156g', carbs: '190g', fats: '68g' } },
            { day: 'Saturday', breakfast: 'Greek feta toast with olive oil', lunch: 'Tuna Salad with chickpeas', dinner: 'Baked Salmon with lemon asparagus', snack: 'Mixed walnuts', calories: caloriesVal, macros: { protein: '156g', carbs: '190g', fats: '68g' } },
            { day: 'Sunday', breakfast: 'Greek feta toast with olive oil', lunch: 'Tuna Salad with chickpeas', dinner: 'Baked Salmon with lemon asparagus', snack: 'Mixed walnuts', calories: caloriesVal, macros: { protein: '156g', carbs: '190g', fats: '68g' } }
          ],
          shoppingList: [
            { item: 'Fresh Salmon Fillet', category: 'Proteins', qty: '1.2 kg', estCost: '$24' },
            { item: 'Organic Asparagus', category: 'Produce', qty: '800g', estCost: '$8' },
            { item: 'Organic Quinoa', category: 'Grains', qty: '1 kg', estCost: '$10' },
            { item: 'Extra Virgin Olive Oil', category: 'Dairy & Fats', qty: '500ml', estCost: '$12' }
          ]
        };
        setPlanResult(fallbackData);
        setSelectedDay(fallbackData.weeklyPlan[0]);
        setShoppingItems(fallbackData.shoppingList);
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleShoppingItem = (idx: number) => {
    const copy = [...shoppingItems];
    copy[idx].checked = !copy[idx].checked;
    setShoppingItems(copy);
  };

  const handleSub = () => {
    alert('AI Substitution calibrated: White rice replaced with steamed cauliflower rice. Saves 180 kcal, glycemic load offset.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Sub-tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setSubTab('plan')}
          className={`tab-trigger ${subTab === 'plan' ? 'active' : ''}`}
          style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', fontWeight: 600 }}
        >
          AI Diet Planner
        </button>
        <button
          onClick={() => setSubTab('recipe')}
          className={`tab-trigger ${subTab === 'recipe' ? 'active' : ''}`}
          style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', fontWeight: 600 }}
        >
          AI Recipe Generator
        </button>
      </div>

      {subTab === 'recipe' ? (
        <RecipeGenerator />
      ) : (
        <>
          {/* 1. Intake diagnostic form */}
          {formStep < 3 && (
            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '0.45rem', borderRadius: '50%', backgroundColor: 'var(--accent-purple-glow)', color: 'var(--accent-purple)', display: 'flex' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 600 }}>NutriVerse AI Diet Planner</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>Step {formStep} of 2: Calibrating baseline metabolic load</p>
                </div>
              </div>

              {formStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Age</label>
                      <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} className="input-futuristic" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Gender</label>
                      <select value={gender} onChange={(e) => setGender(e.target.value)} className="input-futuristic" style={{ cursor: 'pointer' }}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Height (cm)</label>
                      <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="input-futuristic" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Weight (kg)</label>
                      <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="input-futuristic" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Dietary Goal</label>
                      <select value={goal} onChange={(e) => setGoal(e.target.value)} className="input-futuristic" style={{ cursor: 'pointer' }}>
                        {['Weight Loss', 'Muscle Gain', 'Endurance', 'Metabolic Balance'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Activity Level</label>
                      <select value={activity} onChange={(e) => setActivity(e.target.value)} className="input-futuristic" style={{ cursor: 'pointer' }}>
                        <option value="sedentary">Sedentary (Office job)</option>
                        <option value="light">Light active (1-2 days/wk)</option>
                        <option value="moderate">Moderately active (3-5 days/wk)</option>
                        <option value="heavy">Highly active (6-7 days/wk)</option>
                      </select>
                    </div>
                  </div>

                  <button onClick={() => setFormStep(2)} className="btn-premium" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem' }}>
                    Continue to parameters <ChevronRight size={16} />
                  </button>
                </div>
              )}

              {formStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Lifestyle Style</label>
                      <select value={lifestyle} onChange={(e) => setLifestyle(e.target.value)} className="input-futuristic" style={{ cursor: 'pointer' }}>
                        <option value="sedentary">High Stress / Minimal Sleep</option>
                        <option value="balanced">Balanced load parameters</option>
                        <option value="active">High recovery / Deep sleep cycles</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Target Cuisine</label>
                      <select value={cuisine} onChange={(e) => setCuisine(e.target.value)} className="input-futuristic" style={{ cursor: 'pointer' }}>
                        {['mediterranean', 'asian', 'indian', 'american'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Weekly budget</label>
                      <select value={budget} onChange={(e) => setBudget(e.target.value)} className="input-futuristic" style={{ cursor: 'pointer' }}>
                        <option value="low-cost">Low-cost balanced items</option>
                        <option value="balanced">Balanced baseline metrics</option>
                        <option value="premium">Premium organic imports</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Medical conditions</label>
                      <select value={medicalConditions} onChange={(e) => setMedicalConditions(e.target.value)} className="input-futuristic" style={{ cursor: 'pointer' }}>
                        <option value="None">None</option>
                        <option value="diabetes">Diabetes (Glycemic constraints)</option>
                        <option value="pcos">PCOS (Hormonal splits)</option>
                        <option value="gluten-sensitivity">Gluten Sensitivity</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button onClick={() => setFormStep(1)} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <ChevronLeft size={16} /> Back
                    </button>
                    <button onClick={triggerPlanGeneration} className="btn-premium" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem' }}>
                      Generate AI telemetry plan <Sparkles size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Loader */}
          {isLoading && (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
              <RefreshCw className="spin" size={32} style={{ animation: 'spin 2s linear infinite', color: 'var(--accent-purple)' }} />
              <h4 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 600 }}>Calculating Metabolic Split Matrices...</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>Using Mifflin-St Jeor formulas to map target calories and weekly items list.</p>
            </div>
          )}

          {/* 3. Generated Plan Viewports */}
          {formStep === 3 && planResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem'
              }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>Calculated BMR baseline</span>
                  <h4 style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{planResult.bmr} kcal</h4>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>TDEE (Active maintenance)</span>
                  <h4 style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{planResult.tdee} kcal</h4>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>Goal target daily calories</span>
                  <h4 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{planResult.targetCalories} kcal</h4>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>Calibrated Macros ratio</span>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 'bold', marginTop: '0.35rem' }}>
                    P: {planResult.macros.protein} | C: {planResult.macros.carbs} | F: {planResult.macros.fats}
                  </h4>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }} className="chat-layout-container">
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {planResult.weeklyPlan.map((day) => (
                      <button
                        key={day.day}
                        onClick={() => setSelectedDay(day)}
                        className={`tab-trigger ${selectedDay?.day === day.day ? 'active' : ''}`}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                      >
                        {day.day}
                      </button>
                    ))}
                  </div>

                  {selectedDay && (
                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid oklch(1 0 0 / 0.05)', paddingBottom: '0.6rem' }}>
                        <h4 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600 }}>{selectedDay.day} Scheduled Menu</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>Target: {selectedDay.calories} kcal</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                          { type: 'Breakfast', name: selectedDay.breakfast, time: '08:00', swap: false },
                          { type: 'Lunch', name: selectedDay.lunch, time: '13:00', swap: true },
                          { type: 'Dinner', name: selectedDay.dinner, time: '18:00', swap: true },
                          { type: 'Snack', name: selectedDay.snack, time: '21:00', swap: false }
                        ].map((meal, idx) => (
                          <div key={idx} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid oklch(1 0 0 / 0.03)',
                            paddingBottom: '0.75rem'
                          }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', textTransform: 'uppercase' }}>{meal.type}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--foreground-muted)' }}>[{meal.time}]</span>
                              </div>
                              <h5 style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.15rem', cursor: 'pointer' }} onClick={() => setShowRecipes(meal.name)}>{meal.name}</h5>
                            </div>
                            {meal.swap && (
                              <button onClick={handleSub} className="btn-outline" style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem' }}>
                                Swap
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} style={{ color: 'var(--accent-purple)' }} /> Monthly Progressive Calibration view
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                      {Array.from({ length: 28 }).map((_, idx) => {
                        const activeWeek = Math.floor(idx / 7) + 1;
                        const calorieVariation = planResult.targetCalories + (activeWeek * 30 - 60);
                        return (
                          <div key={idx} style={{
                            backgroundColor: 'oklch(1 0 0 / 0.03)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '6px',
                            padding: '0.5rem 0.2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.15rem'
                          }}>
                            <span style={{ fontSize: '0.6rem', color: 'var(--foreground-muted)' }}>Day {idx + 1}</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>{calorieVariation}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ShoppingCart size={16} style={{ color: 'var(--accent-purple)' }} /> Integrated Grocery List
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {shoppingItems.map((item, idx) => (
                        <label key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid oklch(1 0 0 / 0.03)', paddingBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                              type="checkbox"
                              checked={!!item.checked}
                              onChange={() => handleToggleShoppingItem(idx)}
                              style={{ accentColor: 'var(--accent-purple)', width: '16px', height: '16px' }}
                            />
                            <span style={{ fontSize: '0.85rem', textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? 'var(--foreground-muted)' : 'var(--foreground)' }}>
                              {item.item}
                            </span>
                          </div>
                          <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>{item.qty} ({item.estCost})</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {showRecipes && (
                    <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '3px solid var(--accent-cyan)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>Recipe & Preparation</span>
                        <button onClick={() => setShowRecipes(null)} style={{ background: 'none', border: 'none', color: 'var(--accent-magenta)', cursor: 'pointer', fontSize: '0.8rem' }}>Close</button>
                      </div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{showRecipes}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', lineHeight: 1.35 }}>
                        Season with fresh herbs, pan-sear on medium hot for 4-5 mins skin-down. Assemble over target grains bed with steamed asparagus spears. Serves 1 plate.
                      </p>
                    </div>
                  )}

                  <button onClick={() => setFormStep(1)} className="btn-outline" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem' }}>
                    <ChevronLeft size={16} /> Re-configure diagnostic profile
                  </button>

                </div>

              </div>

            </div>
          )}
        </>
      )}

    </div>
  );
}
