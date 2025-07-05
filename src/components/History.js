import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
  Button,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ClearAll as ClearAllIcon,
  Timer as TimerIcon,
  Speed as SpeedIcon,
  PlayArrow as PlayIcon,
  ShowChart as ShowChartIcon,
  List as ListIcon,
} from '@mui/icons-material';
import useMetronomeStore from '../stores/metronomeStore';
import ProgressChart from './ProgressChart';

const History = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [historyTab, setHistoryTab] = useState(0);
  
  const { 
    sessions, 
    clearHistory, 
    deleteSession, 
    getHistoryStats,
    generateSampleData
  } = useMetronomeStore();
  
  console.log('History component - sessions:', sessions);
  
  const stats = getHistoryStats();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (duration) => {
    const minutes = Math.floor(duration / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const StatCard = ({ icon, title, value, subtitle }) => (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <CardContent sx={{ textAlign: 'center', py: 3 }}>
        <Box sx={{ color: theme.palette.primary.main, mb: 1 }}>
          {icon}
        </Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: theme.palette.primary.main,
            mb: 1,
          }}
        >
          {value}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: 0.5,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (sessions.length === 0) {
    return (
      <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', p: 2 }}>
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3,
            '& .MuiAlert-message': {
              width: '100%',
              textAlign: 'center'
            }
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            No Practice History Yet
          </Typography>
          <Typography variant="body2">
            Start practicing with the metronome to track your sessions and see detailed statistics about your practice time and BPM usage.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', p: 2 }}>
      {/* History Tabs */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={historyTab}
          onChange={(e, newValue) => setHistoryTab(newValue)}
          centered
          sx={{
            '& .MuiTab-root': {
              minHeight: 56,
              fontSize: '0.95rem',
              fontWeight: 600,
              textTransform: 'none',
            },
          }}
        >
          <Tab
            icon={<ShowChartIcon />}
            label="Progress Charts"
            iconPosition="start"
          />
          <Tab
            icon={<ListIcon />}
            label="Session History"
            iconPosition="start"
          />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {historyTab === 0 && <ProgressChart />}
      
      {historyTab === 1 && (
        <>
          {sessions.length === 0 ? (
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3,
                '& .MuiAlert-message': {
                  width: '100%',
                  textAlign: 'center'
                }
              }}
            >
              <Typography variant="h6" sx={{ mb: 1 }}>
                No Practice History Yet
              </Typography>
              <Typography variant="body2">
                Start practicing with the metronome to track your sessions and see detailed statistics about your practice time and BPM usage.
              </Typography>
              <Button
                variant="outlined"
                onClick={generateSampleData}
                sx={{ mt: 2 }}
                size="small"
              >
                Generate Sample Data (For Demo)
              </Button>
            </Alert>
          ) : (
            <>
              {/* Statistics Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <StatCard
                    icon={<PlayIcon sx={{ fontSize: 32 }} />}
                    title="Total Sessions"
                    value={stats.totalSessions}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <StatCard
                    icon={<TimerIcon sx={{ fontSize: 32 }} />}
                    title="Total Practice"
                    value={stats.totalPracticeTimeFormatted}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <StatCard
                    icon={<SpeedIcon sx={{ fontSize: 32 }} />}
                    title="Average BPM"
                    value={stats.averageBpm}
                  />
                </Grid>
              </Grid>

              {/* Sessions List */}
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Practice Sessions
                    </Typography>
                    <Button
                      startIcon={<ClearAllIcon />}
                      onClick={clearHistory}
                      size="small"
                      color="error"
                      variant="outlined"
                    >
                      Clear All
                    </Button>
                  </Box>
                  
                  <List>
                    {sessions.slice().reverse().map((session, index) => (
                      <React.Fragment key={session.id}>
                        <ListItem
                          sx={{
                            px: 0,
                            py: 2,
                            flexDirection: isMobile ? 'column' : 'row',
                            alignItems: isMobile ? 'flex-start' : 'center',
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {formatDate(session.date)}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  <Chip
                                    label={`${formatDuration(session.duration)}`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                  <Chip
                                    label={`Avg: ${session.averageBpm} BPM`}
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                  />
                                  <Chip
                                    label={`${session.bpmRange.min}-${session.bpmRange.max} BPM`}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Chip
                                    label={session.timeSignature}
                                    size="small"
                                    variant="outlined"
                                  />
                                  {session.subdivision !== 'None' && (
                                    <Chip
                                      label={session.subdivision}
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                              </Box>
                            }
                            primaryTypographyProps={{ component: 'div' }}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => deleteSession(session.id)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < sessions.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default History;
