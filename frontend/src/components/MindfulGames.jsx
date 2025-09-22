import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, Grid, Avatar, Chip, IconButton
} from '@mui/material'
import { 
  SportsEsports, Close, PlayArrow, Pause, Refresh
} from '@mui/icons-material'

// Breathing Game Component
const BreathingGame = ({ open, onClose }) => {
  const [phase, setPhase] = useState('inhale') // 'inhale', 'hold', 'exhale'
  const [isPlaying, setIsPlaying] = useState(false)
  const [count, setCount] = useState(4)
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    let interval
    if (isPlaying) {
      interval = setInterval(() => {
        setCount(prev => {
          if (prev <= 1) {
            if (phase === 'inhale') {
              setPhase('hold')
              return 4
            } else if (phase === 'hold') {
              setPhase('exhale')
              return 4
            } else {
              setPhase('inhale')
              setCycle(c => c + 1)
              return 4
            }
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, phase])

  const handleStart = () => setIsPlaying(!isPlaying)
  const handleReset = () => {
    setIsPlaying(false)
    setPhase('inhale')
    setCount(4)
    setCycle(0)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Breathing Exercise
        <IconButton onClick={onClose}><Close /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Avatar sx={{ 
            width: 120, height: 120, mx: 'auto', mb: 2,
            bgcolor: phase === 'inhale' ? 'primary.main' : 
                   phase === 'hold' ? 'warning.main' : 'success.main',
            transform: `scale(${phase === 'inhale' ? 1.2 : phase === 'hold' ? 1.1 : 0.9})`,
            transition: 'all 1s ease-in-out'
          }}>
            <Typography variant="h3" color="white">{count}</Typography>
          </Avatar>
          <Typography variant="h5" sx={{ mb: 1, textTransform: 'capitalize' }}>
            {phase}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Cycle: {cycle}/5
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="contained" onClick={handleStart} startIcon={isPlaying ? <Pause /> : <PlayArrow />}>
            {isPlaying ? 'Pause' : 'Start'}
          </Button>
          <Button variant="outlined" onClick={handleReset} startIcon={<Refresh />}>
            Reset
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

// Memory Game Component
const MemoryGame = ({ open, onClose }) => {
  const [cards, setCards] = useState([])
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [moves, setMoves] = useState(0)
  const [gameWon, setGameWon] = useState(false)

  const emojis = ['🌸', '🌺', '🌻', '🌷', '🌹', '🌼', '🍀', '🌿']

  useEffect(() => {
    if (open) {
      initializeGame()
    }
  }, [open])

  const initializeGame = () => {
    const gameCards = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({ id: index, emoji, flipped: false }))
    setCards(gameCards)
    setFlipped([])
    setMatched([])
    setMoves(0)
    setGameWon(false)
  }

  const handleCardClick = (id) => {
    if (flipped.length === 2 || flipped.includes(id) || matched.includes(id)) return

    const newFlipped = [...flipped, id]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(moves + 1)
      const [first, second] = newFlipped
      if (cards[first].emoji === cards[second].emoji) {
        setMatched([...matched, first, second])
        setFlipped([])
        if (matched.length + 2 === cards.length) {
          setGameWon(true)
        }
      } else {
        setTimeout(() => setFlipped([]), 1000)
      }
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Memory Game
        <IconButton onClick={onClose}><Close /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h6">Moves: {moves}</Typography>
          {gameWon && <Typography variant="h5" color="success.main">🎉 You Won!</Typography>}
        </Box>
        <Grid container spacing={1}>
          {cards.map((card) => (
            <Grid item xs={3} key={card.id}>
              <Card 
                sx={{ 
                  aspectRatio: '1',
                  cursor: 'pointer',
                  bgcolor: flipped.includes(card.id) || matched.includes(card.id) ? 'primary.light' : 'grey.200'
                }}
                onClick={() => handleCardClick(card.id)}
              >
                <CardContent sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  p: 1
                }}>
                  <Typography variant="h4">
                    {flipped.includes(card.id) || matched.includes(card.id) ? card.emoji : '?'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button variant="outlined" onClick={initializeGame} startIcon={<Refresh />}>
            New Game
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

// Mood Tracker Game Component  
const MoodTracker = ({ open, onClose }) => {
  const [selectedMood, setSelectedMood] = useState('')
  const [moodHistory, setMoodHistory] = useState([])

  const moods = [
    { emoji: '😊', label: 'Happy', color: '#4CAF50' },
    { emoji: '😢', label: 'Sad', color: '#2196F3' },
    { emoji: '😠', label: 'Angry', color: '#F44336' },
    { emoji: '😰', label: 'Anxious', color: '#FF9800' },
    { emoji: '😴', label: 'Tired', color: '#9C27B0' },
    { emoji: '🤔', label: 'Confused', color: '#607D8B' }
  ]

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood.label)
    setMoodHistory([...moodHistory, { ...mood, timestamp: new Date() }])
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Mood Tracker
        <IconButton onClick={onClose}><Close /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
          How are you feeling right now?
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {moods.map((mood) => (
            <Grid item xs={4} key={mood.label}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  textAlign: 'center',
                  border: selectedMood === mood.label ? `2px solid ${mood.color}` : '1px solid #ddd',
                  '&:hover': { bgcolor: 'grey.50' }
                }}
                onClick={() => handleMoodSelect(mood)}
              >
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="h3" sx={{ mb: 1 }}>{mood.emoji}</Typography>
                  <Typography variant="body2">{mood.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        {moodHistory.length > 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Recent Moods:</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {moodHistory.slice(-5).map((mood, index) => (
                <Chip 
                  key={index}
                  label={`${mood.emoji} ${mood.label}`}
                  sx={{ bgcolor: mood.color + '20', color: mood.color }}
                />
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { BreathingGame, MemoryGame, MoodTracker }