import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
} from '@mui/material'
import {
  People,
  Schedule,
  TrendingUp,
  Warning,
  Person,
} from '@mui/icons-material'

const StatCard = ({ title, value, icon, color }) => (
  <Card className="dashboard-card" sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: color, mr: 2 }}>
          {icon}
        </Avatar>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" color="primary">
        {value}
      </Typography>
    </CardContent>
  </Card>
)

export default function CounsellorDashboard() {
  // Mock data - replace with real API calls
  const stats = {
    myStudents: 24,
    todaySessions: 6,
    weeklyProgress: 18,
    urgentCases: 2,
  }

  const upcomingSessions = [
    { id: 1, student: 'John D.', time: '10:00 AM', type: 'Video Call' },
    { id: 2, student: 'Sarah M.', time: '2:00 PM', type: 'Chat Session' },
    { id: 3, student: 'Mike R.', time: '4:30 PM', type: 'Video Call' },
  ]

  const recentActivity = [
    { id: 1, student: 'Emma L.', action: 'Completed PHQ-9 assessment', time: '2 hours ago', priority: 'normal' },
    { id: 2, student: 'Alex K.', action: 'Sent urgent message', time: '4 hours ago', priority: 'high' },
    { id: 3, student: 'Lisa P.', action: 'Scheduled new session', time: '1 day ago', priority: 'normal' },
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        ZenCare Counsellor Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="My Students"
            value={stats.myStudents}
            icon={<People />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Sessions"
            value={stats.todaySessions}
            icon={<Schedule />}
            color="secondary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Weekly Progress"
            value={stats.weeklyProgress}
            icon={<TrendingUp />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Urgent Cases"
            value={stats.urgentCases}
            icon={<Warning />}
            color="error.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Sessions
            </Typography>
            <List>
              {upcomingSessions.map((session) => (
                <ListItem key={session.id}>
                  <ListItemAvatar>
                    <Avatar>
                      <Person />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={session.student}
                    secondary={`${session.time} - ${session.type}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <List>
              {recentActivity.map((activity) => (
                <ListItem key={activity.id}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          <strong>{activity.student}</strong> {activity.action}
                        </Typography>
                        {activity.priority === 'high' && (
                          <Chip label="Urgent" color="error" size="small" />
                        )}
                      </Box>
                    }
                    secondary={activity.time}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}