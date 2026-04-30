import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import type { FlashCard, CardState } from './types'

type View = 'home' | 'study' | 'results'

function App() {
  const [view, setView] = useState<View>('home')
  const [cards, setCards] = useState<FlashCard[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [cardStates, setCardStates] = useState<CardState[]>([])
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const [lastAction, setLastAction] = useState<'correct' | 'incorrect' | null>(null)

  const fetchCards = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('flash_cards').select('*').order('category')
    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory)
    }
    const { data, error } = await query
    if (error) {
      console.error('Error fetching cards:', error)
      setLoading(false)
      return
    }
    const shuffled = (data || []).sort(() => Math.random() - 0.5)
    setCards(shuffled)
    setCardStates(new Array(shuffled.length).fill('unseen'))
    setCurrentIndex(0)
    setFlipped(false)
    setCorrectCount(0)
    setIncorrectCount(0)
    setLastAction(null)
    setLoading(false)
  }, [selectedCategory])

  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  const categories = ['all', 'greetings', 'numbers', 'common', 'time']

  const startStudy = () => {
    setView('study')
    setCurrentIndex(0)
    setFlipped(false)
    setCardStates(new Array(cards.length).fill('unseen'))
    setCorrectCount(0)
    setIncorrectCount(0)
    setLastAction(null)
  }

  const handleAnswer = (isCorrect: boolean) => {
    if (currentIndex >= cards.length) return

    const newStates = [...cardStates]
    newStates[currentIndex] = isCorrect ? 'correct' : 'incorrect'
    setCardStates(newStates)

    if (isCorrect) {
      setCorrectCount(c => c + 1)
      setLastAction('correct')
    } else {
      setIncorrectCount(c => c + 1)
      setLastAction('incorrect')
    }

    setTimeout(() => {
      if (currentIndex + 1 >= cards.length) {
        setView('results')
      } else {
        setCurrentIndex(i => i + 1)
        setFlipped(false)
        setLastAction(null)
      }
    }, 600)
  }

  const restart = () => {
    setView('home')
    fetchCards()
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--neutral-50)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid var(--neutral-200)',
            borderTopColor: 'var(--primary-500)', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ color: 'var(--neutral-500)' }}>Loading cards...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, var(--neutral-900) 0%, var(--primary-900) 100%)',
        padding: '16px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <div style={{
          maxWidth: 960, margin: '0 auto', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'var(--jp-red)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 18,
              fontFamily: '"Noto Sans JP", sans-serif',
            }}>漢</div>
            <h1 style={{
              color: 'white', fontSize: 20, fontWeight: 600,
              letterSpacing: '-0.02em',
            }}>Japanese Flash Cards</h1>
          </div>
          {view === 'study' && (
            <div style={{
              color: 'var(--primary-200)', fontSize: 14,
              fontWeight: 500,
            }}>
              {currentIndex + 1} / {cards.length}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1, maxWidth: 960, width: '100%', margin: '0 auto',
        padding: '32px 24px',
      }}>
        {view === 'home' && (
          <HomeView
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            cardCount={cards.length}
            onStart={startStudy}
          />
        )}
        {view === 'study' && cards.length > 0 && (
          <StudyView
            card={cards[currentIndex]}
            flipped={flipped}
            onFlip={() => setFlipped(true)}
            onAnswer={handleAnswer}
            lastAction={lastAction}
            progress={((currentIndex) / cards.length) * 100}
            correctCount={correctCount}
            incorrectCount={incorrectCount}
            currentIndex={currentIndex}
          />
        )}
        {view === 'results' && (
          <ResultsView
            correct={correctCount}
            incorrect={incorrectCount}
            total={cards.length}
            onRestart={restart}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        padding: '16px 24px', textAlign: 'center',
        color: 'var(--neutral-400)', fontSize: 13,
        borderTop: '1px solid var(--neutral-200)',
      }}>
        Keep practicing — consistency is key!
      </footer>
    </div>
  )
}

interface HomeViewProps {
  categories: string[]
  selectedCategory: string
  onSelectCategory: (cat: string) => void
  cardCount: number
  onStart: () => void
}

function HomeView({ categories, selectedCategory, onSelectCategory, cardCount, onStart }: HomeViewProps) {
  const categoryLabels: Record<string, string> = {
    all: 'All Categories',
    greetings: 'Greetings',
    numbers: 'Numbers',
    common: 'Common Words',
    time: 'Time',
  }

  return (
    <div className="animate-fade-in" style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 48 }}>
        <h2 style={{
          fontSize: 32, fontWeight: 700, color: 'var(--neutral-900)',
          marginBottom: 12, letterSpacing: '-0.03em',
        }}>
          Master Japanese Vocabulary
        </h2>
        <p style={{
          fontSize: 16, color: 'var(--neutral-500)',
          maxWidth: 480, margin: '0 auto', lineHeight: 1.6,
        }}>
          Flip through flash cards to build your Japanese vocabulary.
          Choose a category and start studying.
        </p>
      </div>

      {/* Category Selection */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8,
        justifyContent: 'center', marginBottom: 32,
      }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            style={{
              padding: '8px 20px', borderRadius: 100,
              fontSize: 14, fontWeight: 500,
              transition: 'all 0.2s ease',
              background: selectedCategory === cat
                ? 'var(--primary-600)'
                : 'var(--neutral-100)',
              color: selectedCategory === cat
                ? 'white'
                : 'var(--neutral-600)',
              border: selectedCategory === cat
                ? '1px solid var(--primary-600)'
                : '1px solid var(--neutral-200)',
            }}
          >
            {categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      {/* Card Count & Start Button */}
      <div className="animate-slide-up">
        <p style={{
          fontSize: 14, color: 'var(--neutral-400)',
          marginBottom: 24,
        }}>
          {cardCount} cards ready to study
        </p>
        <button
          onClick={onStart}
          disabled={cardCount === 0}
          style={{
            padding: '14px 48px', borderRadius: 12,
            fontSize: 16, fontWeight: 600,
            background: cardCount > 0
              ? 'linear-gradient(135deg, var(--primary-600), var(--primary-700))'
              : 'var(--neutral-300)',
            color: 'white',
            boxShadow: cardCount > 0
              ? '0 4px 14px rgba(37, 99, 235, 0.3)'
              : 'none',
            transition: 'all 0.2s ease',
            transform: 'scale(1)',
          }}
          onMouseEnter={e => {
            if (cardCount > 0) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
          }}
        >
          Start Studying
        </button>
      </div>
    </div>
  )
}

interface StudyViewProps {
  card: FlashCard
  flipped: boolean
  onFlip: () => void
  onAnswer: (correct: boolean) => void
  lastAction: 'correct' | 'incorrect' | null
  progress: number
  correctCount: number
  incorrectCount: number
  currentIndex: number
}

function StudyView({
  card, flipped, onFlip, onAnswer, lastAction, progress,
  correctCount, incorrectCount, currentIndex,
}: StudyViewProps) {
  return (
    <div className="animate-fade-in">
      {/* Progress Bar */}
      <div style={{
        height: 4, borderRadius: 2,
        background: 'var(--neutral-200)', marginBottom: 32,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: 'linear-gradient(90deg, var(--primary-500), var(--primary-400))',
          width: `${progress}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Score */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 24,
        marginBottom: 24,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 14, color: 'var(--accent-600)', fontWeight: 500,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--accent-500)',
          }} />
          {correctCount} correct
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 14, color: 'var(--error-600)', fontWeight: 500,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--error-500)',
          }} />
          {incorrectCount} incorrect
        </div>
      </div>

      {/* Card */}
      <div
        onClick={onFlip}
        style={{
          maxWidth: 420, margin: '0 auto', cursor: 'pointer',
          perspective: 1000,
        }}
      >
        <div
          className={lastAction ? 'animate-pulse' : 'animate-flip-in'}
          key={currentIndex}
          style={{
            minHeight: 280, borderRadius: 20,
            background: flipped
              ? 'linear-gradient(145deg, #ffffff, var(--neutral-50))'
              : 'linear-gradient(145deg, var(--neutral-900), var(--primary-900))',
            boxShadow: lastAction === 'correct'
              ? '0 0 0 3px var(--accent-400), 0 8px 30px rgba(0,0,0,0.12)'
              : lastAction === 'incorrect'
                ? '0 0 0 3px var(--error-400), 0 8px 30px rgba(0,0,0,0.12)'
                : '0 8px 30px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 40, position: 'relative',
            transition: 'box-shadow 0.3s ease',
          }}
        >
          {/* Category Badge */}
          <div style={{
            position: 'absolute', top: 16, left: 16,
            padding: '4px 12px', borderRadius: 100,
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.05em',
            background: flipped ? 'var(--primary-100)' : 'rgba(255,255,255,0.15)',
            color: flipped ? 'var(--primary-700)' : 'rgba(255,255,255,0.8)',
          }}>
            {card.category}
          </div>

          {/* Difficulty Badge */}
          <div style={{
            position: 'absolute', top: 16, right: 16,
            padding: '4px 12px', borderRadius: 100,
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.05em',
            background: flipped ? 'var(--warning-50)' : 'rgba(255,255,255,0.15)',
            color: flipped ? 'var(--warning-500)' : 'rgba(255,255,255,0.8)',
          }}>
            {card.difficulty}
          </div>

          {!flipped ? (
            <>
              <p style={{
                fontSize: 56, fontWeight: 700,
                fontFamily: '"Noto Sans JP", sans-serif',
                color: 'white', marginBottom: 16,
                lineHeight: 1.2,
              }}>
                {card.japanese}
              </p>
              <p style={{
                fontSize: 14, color: 'rgba(255,255,255,0.5)',
                fontWeight: 400,
              }}>
                Tap to reveal answer
              </p>
            </>
          ) : (
            <>
              <p style={{
                fontSize: 40, fontWeight: 700,
                fontFamily: '"Noto Sans JP", sans-serif',
                color: 'var(--neutral-800)', marginBottom: 8,
                lineHeight: 1.2,
              }}>
                {card.japanese}
              </p>
              <p style={{
                fontSize: 20, color: 'var(--primary-500)',
                fontWeight: 400, marginBottom: 20,
                fontFamily: '"Noto Sans JP", sans-serif',
              }}>
                {card.reading}
              </p>
              <div style={{
                width: 40, height: 2,
                background: 'var(--neutral-200)', marginBottom: 20,
                borderRadius: 1,
              }} />
              <p style={{
                fontSize: 24, color: 'var(--neutral-700)',
                fontWeight: 500,
              }}>
                {card.english}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {flipped && (
        <div className="animate-slide-up" style={{
          display: 'flex', gap: 16, justifyContent: 'center',
          marginTop: 32, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto',
        }}>
          <button
            onClick={() => onAnswer(false)}
            style={{
              flex: 1, padding: '14px 24px', borderRadius: 12,
              fontSize: 15, fontWeight: 600,
              background: 'var(--error-50)',
              color: 'var(--error-600)',
              border: '2px solid var(--error-200)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--error-100)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--error-50)'
            }}
          >
            Still Learning
          </button>
          <button
            onClick={() => onAnswer(true)}
            style={{
              flex: 1, padding: '14px 24px', borderRadius: 12,
              fontSize: 15, fontWeight: 600,
              background: 'var(--accent-50)',
              color: 'var(--accent-700)',
              border: '2px solid var(--accent-200)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-100)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-50)'
            }}
          >
            Got It!
          </button>
        </div>
      )}
    </div>
  )
}

interface ResultsViewProps {
  correct: number
  incorrect: number
  total: number
  onRestart: () => void
}

function ResultsView({ correct, incorrect, total, onRestart }: ResultsViewProps) {
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
  const message = percentage >= 90
    ? 'Outstanding! You have excellent recall.'
    : percentage >= 70
      ? 'Great work! Keep up the consistent practice.'
      : percentage >= 50
        ? 'Good effort! Review the ones you missed.'
        : 'Keep practicing — you will improve!'

  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', maxWidth: 420, margin: '0 auto' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: percentage >= 70
          ? 'var(--accent-100)'
          : 'var(--warning-50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
      }}>
        <span style={{
          fontSize: 36, fontWeight: 700,
          color: percentage >= 70 ? 'var(--accent-600)' : 'var(--warning-500)',
        }}>
          {percentage}%
        </span>
      </div>

      <h2 style={{
        fontSize: 28, fontWeight: 700, color: 'var(--neutral-900)',
        marginBottom: 8,
      }}>
        Session Complete
      </h2>
      <p style={{
        fontSize: 16, color: 'var(--neutral-500)',
        marginBottom: 32, lineHeight: 1.6,
      }}>
        {message}
      </p>

      {/* Stats */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 40,
      }}>
        <div style={{
          flex: 1, padding: 20, borderRadius: 16,
          background: 'var(--accent-50)', border: '1px solid var(--accent-200)',
        }}>
          <p style={{
            fontSize: 28, fontWeight: 700,
            color: 'var(--accent-600)', marginBottom: 4,
          }}>
            {correct}
          </p>
          <p style={{ fontSize: 13, color: 'var(--accent-700)', fontWeight: 500 }}>
            Correct
          </p>
        </div>
        <div style={{
          flex: 1, padding: 20, borderRadius: 16,
          background: 'var(--error-50)', border: '1px solid var(--error-200)',
        }}>
          <p style={{
            fontSize: 28, fontWeight: 700,
            color: 'var(--error-600)', marginBottom: 4,
          }}>
            {incorrect}
          </p>
          <p style={{ fontSize: 13, color: 'var(--error-600)', fontWeight: 500 }}>
            Still Learning
          </p>
        </div>
        <div style={{
          flex: 1, padding: 20, borderRadius: 16,
          background: 'var(--primary-50)', border: '1px solid var(--primary-200)',
        }}>
          <p style={{
            fontSize: 28, fontWeight: 700,
            color: 'var(--primary-700)', marginBottom: 4,
          }}>
            {total}
          </p>
          <p style={{ fontSize: 13, color: 'var(--primary-700)', fontWeight: 500 }}>
            Total
          </p>
        </div>
      </div>

      <button
        onClick={onRestart}
        style={{
          padding: '14px 48px', borderRadius: 12,
          fontSize: 16, fontWeight: 600,
          background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
          color: 'white',
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
        }}
      >
        Study Again
      </button>
    </div>
  )
}

export default App
