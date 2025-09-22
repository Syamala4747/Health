import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip, TextField,
  InputAdornment, FormControl, InputLabel, Select, MenuItem, Container,
  useTheme, alpha, Avatar, IconButton
} from '@mui/material'
import {
  Search, Article, VideoLibrary, AudioFile, BookmarkBorder, Bookmark,
  PlayArrow, Download, SportsEsports, Games
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext.jsx'
import { BreathingGame, MemoryGame, MoodTracker } from './MindfulGames.jsx'

const RESOURCE_TYPES = [
  { value: 'all', label: 'All Resources' },
  { value: 'article', label: 'Articles' },
  { value: 'video', label: 'Videos' },
  { value: 'audio', label: 'Audio' },
  { value: 'pdf', label: 'Documents' },
  { value: 'game', label: 'Mindful Games' }
]

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'anxiety', label: 'Anxiety' },
  { value: 'depression', label: 'Depression' },
  { value: 'stress', label: 'Stress Management' },
  { value: 'mindfulness', label: 'Mindfulness' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'academic', label: 'Academic Pressure' },
  { value: 'general', label: 'General Wellness' }
]

const LANGUAGES = [
  { value: 'all', label: 'All Languages' },
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'te', label: 'Telugu' },
  { value: 'ta', label: 'Tamil' },
  { value: 'kn', label: 'Kannada' }
]

export default function ResourceHub() {
  const theme = useTheme()
  const [resources, setResources] = useState([])
  const [filteredResources, setFilteredResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookmarkedResources, setBookmarkedResources] = useState(new Set())
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: 'all',
    language: 'all'
  })
  const [activeGame, setActiveGame] = useState(null)

  useEffect(() => {
    fetchResources()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [resources, filters])

  const fetchResources = async () => {
    try {
      setLoading(true)
      
      // Mock data for resources
      const mockResources = [
        {
          id: '1',
          title: { en: 'Managing Anxiety in College', hi: 'कॉलेज में चिंता का प्रबंधन' },
          description: { en: 'Learn effective techniques to manage anxiety during your college years' },
          type: 'article',
          category: 'anxiety',
          language: 'en',
          duration: 5,
          difficulty: 'beginner',
          tags: ['anxiety', 'college', 'stress'],
          url: '#',
          createdAt: new Date()
        },
        {
          id: '2',
          title: { en: 'Mindfulness Meditation for Students', hi: 'छात्रों के लिए माइंडफुलनेस मेडिटेशन' },
          description: { en: '10-minute guided meditation for stress relief' },
          type: 'audio',
          category: 'mindfulness',
          language: 'en',
          duration: 10,
          difficulty: 'beginner',
          tags: ['meditation', 'mindfulness', 'relaxation'],
          url: '#',
          createdAt: new Date()
        },
        {
          id: '3',
          title: { en: 'Understanding Depression', hi: 'अवसाद को समझना' },
          description: { en: 'Educational video about depression symptoms and treatment' },
          type: 'video',
          category: 'depression',
          language: 'en',
          duration: 15,
          difficulty: 'intermediate',
          tags: ['depression', 'mental health', 'education'],
          url: '#',
          createdAt: new Date()
        },
        {
          id: '4',
          title: { en: 'Study Stress Management', hi: 'अध्ययन तनाव प्रबंधन' },
          description: { en: 'Comprehensive guide to managing academic stress' },
          type: 'pdf',
          category: 'academic',
          language: 'en',
          duration: 20,
          difficulty: 'intermediate',
          tags: ['stress', 'academic', 'study tips'],
          url: '#',
          createdAt: new Date()
        },
        {
          id: '5',
          title: { en: 'Breathing Bubble Game', hi: 'सांस लेने का बुलबुला खेल' },
          description: { en: 'Interactive breathing exercise to reduce anxiety and stress' },
          type: 'game',
          category: 'mindfulness',
          language: 'en',
          duration: 5,
          difficulty: 'beginner',
          tags: ['breathing', 'anxiety', 'interactive', 'mindfulness'],
          url: 'breathing-game',
          gameType: 'breathing',
          createdAt: new Date()
        },
        {
          id: '6',
          title: { en: 'Mood Tracker Puzzle', hi: 'मूड ट्रैकर पहेली' },
          description: { en: 'Fun puzzle game to help track and understand your emotions' },
          type: 'game',
          category: 'general',
          language: 'en',
          duration: 10,
          difficulty: 'beginner',
          tags: ['mood', 'emotions', 'puzzle', 'tracking'],
          url: 'mood-tracker',
          gameType: 'mood',
          createdAt: new Date()
        },
        {
          id: '7',
          title: { en: 'Stress Relief Memory Game', hi: 'तनाव राहत स्मृति खेल' },
          description: { en: 'Memory matching game with calming images and sounds' },
          type: 'game',
          category: 'stress',
          language: 'en',
          duration: 8,
          difficulty: 'intermediate',
          tags: ['memory', 'stress relief', 'calming', 'focus'],
          url: 'memory-game',
          gameType: 'memory',
          createdAt: new Date()
        },
        {
          id: '8',
          title: { en: 'Mindful Coloring', hi: 'माइंडफुल कलरिंग' },
          description: { en: 'Digital coloring book for relaxation and mindfulness' },
          type: 'game',
          category: 'mindfulness',
          language: 'en',
          duration: 15,
          difficulty: 'beginner',
          tags: ['coloring', 'relaxation', 'creativity', 'mindfulness'],
          url: '#coloring-game',
          gameType: 'creative',
          createdAt: new Date()
        },
        {
          id: '9',
          title: { en: 'Gratitude Garden', hi: 'कृतज्ञता बगीचा' },
          description: { en: 'Plant and grow a virtual garden while practicing gratitude' },
          type: 'game',
          category: 'general',
          language: 'en',
          duration: 12,
          difficulty: 'beginner',
          tags: ['gratitude', 'growth', 'positive thinking', 'virtual'],
          url: '#gratitude-garden',
          gameType: 'simulation',
          createdAt: new Date()
        }
      ]
      
      setResources(mockResources)
    } catch (error) {
      console.error('Error fetching resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = resources

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(resource =>
        resource.title.en.toLowerCase().includes(filters.search.toLowerCase()) ||
        resource.description.en.toLowerCase().includes(filters.search.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()))
      )
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(resource => resource.type === filters.type)
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(resource => resource.category === filters.category)
    }

    // Language filter
    if (filters.language !== 'all') {
      filtered = filtered.filter(resource => resource.language === filters.language)
    }

    setFilteredResources(filtered)
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const toggleBookmark = (resourceId) => {
    setBookmarkedResources(prev => {
      const newSet = new Set(prev)
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId)
      } else {
        newSet.add(resourceId)
      }
      return newSet
    })
  }

  const handleGameClick = (gameType) => {
    setActiveGame(gameType)
  }

  const getResourceIcon = (type) => {
    switch (type) {
      case 'article': return <Article />
      case 'video': return <VideoLibrary />
      case 'audio': return <AudioFile />
      case 'pdf': return <Article />
      case 'game': return <Games />
      default: return <Article />
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'article': return theme.palette.primary.main
      case 'video': return theme.palette.error.main
      case 'audio': return theme.palette.success.main
      case 'pdf': return theme.palette.warning.main
      case 'game': return theme.palette.secondary.main
      default: return theme.palette.grey[500]
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          Resource Hub
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Access mental health resources, articles, videos, and tools for your wellness journey
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search resources..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4} md={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                label="Type"
              >
                {RESOURCE_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                label="Category"
              >
                {CATEGORIES.map(category => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select
                value={filters.language}
                onChange={(e) => handleFilterChange('language', e.target.value)}
                label="Language"
              >
                {LANGUAGES.map(language => (
                  <MenuItem key={language.value} value={language.value}>
                    {language.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Featured Mindful Games Section */}
      {filters.type === 'all' || filters.type === 'game' ? (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Games color="secondary" />
            Mindful Games
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {filteredResources.filter(resource => resource.type === 'game').slice(0, 4).map((game) => (
              <Grid item xs={12} sm={6} md={3} key={game.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                      borderColor: theme.palette.secondary.main
                    }
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: theme.palette.secondary.main,
                        color: 'white',
                        width: 56,
                        height: 56,
                        mx: 'auto',
                        mb: 2
                      }}
                    >
                      <SportsEsports sx={{ fontSize: 28 }} />
                    </Avatar>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {game.title.en}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {game.description.en}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mb: 2 }}>
                      <Chip 
                        label={`${game.duration} min`} 
                        size="small" 
                        color="secondary"
                        variant="outlined"
                      />
                      <Chip 
                        label={game.difficulty} 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>

                    <Button
                      variant="contained"
                      color="secondary"
                      fullWidth
                      startIcon={<SportsEsports />}
                      onClick={() => handleGameClick(game.gameType)}
                      sx={{ borderRadius: 2 }}
                    >
                      Play Now
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : null}

      {/* All Resources Section */}
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        All Resources
      </Typography>

      {/* Resources Grid */}
      <Grid container spacing={3}>
        {filteredResources.map((resource) => (
          <Grid item xs={12} sm={6} md={4} key={resource.id}>
            <Card 
              sx={{ 
                height: '100%', 
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: alpha(getTypeColor(resource.type), 0.1),
                      color: getTypeColor(resource.type),
                      width: 48,
                      height: 48
                    }}
                  >
                    {getResourceIcon(resource.type)}
                  </Avatar>
                  
                  <IconButton
                    onClick={() => toggleBookmark(resource.id)}
                    sx={{ color: bookmarkedResources.has(resource.id) ? theme.palette.warning.main : 'inherit' }}
                  >
                    {bookmarkedResources.has(resource.id) ? <Bookmark /> : <BookmarkBorder />}
                  </IconButton>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {resource.title.en}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {resource.description.en}
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  <Chip 
                    label={resource.type.toUpperCase()} 
                    size="small" 
                    sx={{ 
                      bgcolor: alpha(getTypeColor(resource.type), 0.1),
                      color: getTypeColor(resource.type),
                      fontWeight: 600
                    }}
                  />
                  <Chip 
                    label={resource.category} 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`${resource.duration} min`} 
                    size="small" 
                    variant="outlined"
                  />
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 3 }}>
                  {resource.tags.map((tag) => (
                    <Chip 
                      key={tag}
                      label={tag} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={
                    resource.type === 'video' ? <PlayArrow /> : 
                    resource.type === 'game' ? <SportsEsports /> : 
                    <Download />
                  }
                  onClick={resource.type === 'game' ? () => handleGameClick(resource.gameType) : undefined}
                  href={resource.type !== 'game' ? resource.url : undefined}
                  target={resource.type !== 'game' ? "_blank" : undefined}
                  rel={resource.type !== 'game' ? "noopener noreferrer" : undefined}
                  sx={{ borderRadius: 2 }}
                >
                  {resource.type === 'video' ? 'Watch' : 
                   resource.type === 'audio' ? 'Listen' : 
                   resource.type === 'game' ? 'Play Game' :
                   'Read'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredResources.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No resources found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search criteria or filters
          </Typography>
        </Box>
      )}

      {/* Game Dialogs */}
      <BreathingGame 
        open={activeGame === 'breathing'} 
        onClose={() => setActiveGame(null)} 
      />
      <MemoryGame 
        open={activeGame === 'memory'} 
        onClose={() => setActiveGame(null)} 
      />
      <MoodTracker 
        open={activeGame === 'mood'} 
        onClose={() => setActiveGame(null)} 
      />
    </Container>
  )
}