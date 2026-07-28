import { useState } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Utensils, 
  Clock, 
  BookOpen, 
  CheckSquare, 
  HelpCircle, 
  ListChecks
} from 'lucide-react';

interface RecipeResult {
  title: string;
  description: string;
  cuisine: string;
  goal: string;
  cookingTime: string;
  nutrition: {
    calories: number;
    protein: string;
    carbs: string;
    fats: string;
  };
  instructions: string[];
  shoppingList: { item: string; qty: string; cost: string; checked?: boolean }[];
  alternatives: { item: string; swap: string; save: string; macroEffect: string }[];
}

export function RecipeGenerator() {
  const [ingredients, setIngredients] = useState('');
  const [goal, setGoal] = useState('Weight Loss');
  const [cuisine, setCuisine] = useState('mediterranean');
  const [calories, setCalories] = useState(450);
  const [protein, setProtein] = useState(35);
  const [budget, setBudget] = useState('balanced');
  const [cookingTime, setCookingTime] = useState(20);

  const [isLoading, setIsLoading] = useState(false);
  const [recipe, setRecipe] = useState<RecipeResult | null>(null);

  const handleGenerateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setRecipe(null);

    try {
      const response = await fetch('http://localhost:5000/api/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients, goal, cuisine, calories, protein, budget, cookingTime
        })
      });

      if (!response.ok) throw new Error('API server down');
      const data = await response.json();
      setRecipe(data);
    } catch (err) {
      console.warn('API recipe offline, executing fallback algorithm:', err);
      setTimeout(() => {
        // Fallback simulation data
        const fallbackRecipe: RecipeResult = {
          title: 'Lemon Herb Seared Salmon Bowl',
          description: 'A quick seared high-protein salmon plate with steamed greens.',
          cuisine,
          goal,
          cookingTime: `${cookingTime} mins`,
          nutrition: {
            calories,
            protein: `${protein}g`,
            carbs: '22g',
            fats: '18g'
          },
          instructions: [
            'Season salmon with dry herbs, black pepper, and lemon juice.',
            'Heat olive oil on a skillet, sear salmon for 4 minutes skin-down.',
            'Toss in asparagus and garlic, flip salmon and cook for another 3 minutes.',
            'Assemble over warm quinoa.'
          ],
          shoppingList: [
            { item: 'Fresh Salmon Fillet', qty: '160g', cost: '$5.50' },
            { item: 'Green Asparagus', qty: '100g', cost: '$1.20' },
            { item: 'Organic Quinoa pack', qty: '100g', cost: '$1.00' }
          ],
          alternatives: [
            { item: 'White Rice', swap: 'Cauliflower Rice', save: '-180 kcal', macroEffect: 'Reduces net carbs, adds fiber' }
          ]
        };
        setRecipe(fallbackRecipe);
      }, 1200);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleShopItem = (idx: number) => {
    if (!recipe) return;
    const copy = [...recipe.shoppingList];
    copy[idx].checked = !copy[idx].checked;
    setRecipe({ ...recipe, shoppingList: copy });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1.5rem' }} className="chat-layout-container">
        
        {/* Ingredients & Target parameters form */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Utensils size={18} style={{ color: 'var(--accent-purple)' }} /> Recipe Specifications
          </h3>

          <form onSubmit={handleGenerateRecipe} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Ingredients textbox */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>
                Ingredients in fridge (comma separated)
              </label>
              <textarea
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="salmon, garlic, asparagus, olive oil..."
                className="input-futuristic"
                style={{ width: '100%', height: '70px', resize: 'none', padding: '0.5rem', fontSize: '0.85rem' }}
                required
              />
            </div>

            {/* Goal + Cuisine dropdowns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Target Goal</label>
                <select value={goal} onChange={(e) => setGoal(e.target.value)} className="input-futuristic" style={{ cursor: 'pointer', fontSize: '0.8rem' }}>
                  {['Weight Loss', 'Muscle Gain', 'Keto', 'Balanced'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Target Cuisine</label>
                <select value={cuisine} onChange={(e) => setCuisine(e.target.value)} className="input-futuristic" style={{ cursor: 'pointer', fontSize: '0.8rem' }}>
                  {['mediterranean', 'asian', 'indian', 'american'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Calories + Protein */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Calories (kcal)</label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(Number(e.target.value))}
                  className="input-futuristic"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Protein (g)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(Number(e.target.value))}
                  className="input-futuristic"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Budget + Prep Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Budget Level</label>
                <select value={budget} onChange={(e) => setBudget(e.target.value)} className="input-futuristic" style={{ cursor: 'pointer', fontSize: '0.8rem' }}>
                  <option value="low-cost">Low-cost items</option>
                  <option value="balanced">Balanced baseline</option>
                  <option value="premium">Premium organic</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--foreground-muted)', marginBottom: '0.35rem' }}>Max Time (mins)</label>
                <input
                  type="number"
                  value={cookingTime}
                  onChange={(e) => setCookingTime(Number(e.target.value))}
                  className="input-futuristic"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <button type="submit" className="btn-premium" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem' }}>
              Generate Recipe <Sparkles size={16} />
            </button>

          </form>
        </div>

        {/* Generated Recipe telemetry breakout */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', justifyContent: 'center' }}>
          
          {isLoading && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', minHeight: '320px', justifyContent: 'center' }}>
              <RefreshCw className="spin" size={32} style={{ animation: 'spin 2s linear infinite', color: 'var(--accent-purple)' }} />
              <h4 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600 }}>Mixing ingredients splits...</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>Configuring macro ratios and shopping estimates.</p>
            </div>
          )}

          {!isLoading && !recipe && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', minHeight: '320px', justifyContent: 'center', color: 'var(--foreground-muted)' }}>
              <BookOpen size={36} style={{ strokeWidth: 1.2 }} />
              <p style={{ fontSize: '0.85rem', maxWidth: '240px' }}>
                Fill input variables to compile single-recipe templates.
              </p>
            </div>
          )}

          {!isLoading && recipe && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                    Goal target: {recipe.goal} ({recipe.cuisine})
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Clock size={12} /> {recipe.cookingTime}
                  </span>
                </div>
                <h4 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 600, margin: '0.25rem 0' }}>{recipe.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>{recipe.description}</p>
              </div>

              {/* Nutrition summary */}
              <div style={{
                backgroundColor: 'oklch(1 0 0 / 0.03)',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                textAlign: 'center',
                gap: '0.5rem'
              }}>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>Calories</p>
                  <p className="font-mono" style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{recipe.nutrition.calories}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>Protein</p>
                  <p className="font-mono" style={{ fontSize: '1rem', fontWeight: 'bold' }}>{recipe.nutrition.protein}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>Carbs</p>
                  <p className="font-mono" style={{ fontSize: '1rem', fontWeight: 'bold' }}>{recipe.nutrition.carbs}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--foreground-muted)' }}>Fats</p>
                  <p className="font-mono" style={{ fontSize: '1rem', fontWeight: 'bold' }}>{recipe.nutrition.fats}</p>
                </div>
              </div>

              {/* Instructions steps */}
              <div>
                <h5 className="font-display" style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ListChecks size={16} style={{ color: 'var(--accent-purple)' }} /> Cooking preparation
                </h5>
                <ol style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--foreground-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {recipe.instructions.map((step, idx) => (
                    <li key={idx} style={{ lineHeight: 1.4 }}>{step}</li>
                  ))}
                </ol>
              </div>

              {/* Shopping elements checklist */}
              <div style={{ borderTop: '1px solid oklch(1 0 0 / 0.05)', paddingTop: '0.75rem' }}>
                <h5 className="font-display" style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckSquare size={16} style={{ color: 'var(--accent-purple)' }} /> Ingestion Shopping checklist
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                  {recipe.shoppingList.map((item, idx) => (
                    <label key={idx} style={{ display: 'flex', justifySelf: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <input
                          type="checkbox"
                          checked={!!item.checked}
                          onChange={() => handleToggleShopItem(idx)}
                          style={{ accentColor: 'var(--accent-purple)' }}
                        />
                        <span style={{ textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? 'var(--foreground-muted)' : 'var(--foreground)' }}>
                          {item.item}
                        </span>
                      </div>
                      <span className="font-mono" style={{ color: 'var(--foreground-muted)' }}>{item.qty} ({item.cost})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Alternatives swaps */}
              {recipe.alternatives.length > 0 && (
                <div style={{
                  border: '1.5px solid var(--accent-cyan)',
                  backgroundColor: 'var(--accent-cyan-glow)',
                  borderRadius: '12px',
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                    <HelpCircle size={14} /> Alternative Swaps
                  </div>
                  {recipe.alternatives.map((alt, idx) => (
                    <div key={idx} style={{ fontSize: '0.75rem' }}>
                      <p style={{ fontWeight: 600 }}>Swap {alt.item} → {alt.swap} <span style={{ color: 'var(--accent-cyan)' }}>({alt.save})</span></p>
                      <p style={{ color: 'var(--foreground)', fontSize: '0.7rem', marginTop: '0.15rem' }}>{alt.macroEffect}</p>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
