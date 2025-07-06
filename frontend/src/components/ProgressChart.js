import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Stack,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import useMetronomeStore from '../stores/metronomeStore';

const ProgressChart = () => {
  const theme = useTheme();
  const { sessions } = useMetronomeStore();
  const [chartType, setChartType] = React.useState('practice-time');
  const [timeRange, setTimeRange] = React.useState('all');

  // Filter sessions based on time range
  const filteredSessions = useMemo(() => {
    if (timeRange === 'all') return sessions;
    
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeRange) {
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        cutoff.setMonth(now.getMonth() - 3);
        break;
      default:
        return sessions;
    }
    
    return sessions.filter(session => new Date(session.date) >= cutoff);
  }, [sessions, timeRange]);

  // Prepare data for different chart types
  const chartData = useMemo(() => {
    if (filteredSessions.length === 0) return [];

    switch (chartType) {
      case 'practice-time':
        return filteredSessions.map((session, index) => ({
          session: index + 1,
          date: new Date(session.date).toLocaleDateString(),
          practiceTime: Math.round(session.duration / (1000 * 60)), // Convert to minutes
          averageBpm: session.averageBpm,
        }));

      case 'bpm-progress':
        return filteredSessions.map((session, index) => ({
          session: index + 1,
          date: new Date(session.date).toLocaleDateString(),
          averageBpm: session.averageBpm,
          minBpm: session.bpmRange.min,
          maxBpm: session.bpmRange.max,
        }));

      case 'daily-summary':
        // Group by day
        const dailyData = {};
        filteredSessions.forEach(session => {
          const day = new Date(session.date).toLocaleDateString();
          if (!dailyData[day]) {
            dailyData[day] = {
              date: day,
              totalTime: 0,
              sessionCount: 0,
              avgBpm: 0,
              bpmSum: 0,
            };
          }
          dailyData[day].totalTime += session.duration;
          dailyData[day].sessionCount += 1;
          dailyData[day].bpmSum += session.averageBpm;
        });

        return Object.values(dailyData).map(day => ({
          ...day,
          totalTime: Math.round(day.totalTime / (1000 * 60)), // Convert to minutes
          avgBpm: Math.round(day.bpmSum / day.sessionCount),
        }));

      case 'bpm-distribution':
        // Group by BPM ranges
        const bpmRanges = {
          '60-80': 0,
          '81-100': 0,
          '101-120': 0,
          '121-140': 0,
          '141-160': 0,
          '161-180': 0,
          '181+': 0,
        };

        filteredSessions.forEach(session => {
          const bpm = session.averageBpm;
          if (bpm <= 80) bpmRanges['60-80']++;
          else if (bpm <= 100) bpmRanges['81-100']++;
          else if (bpm <= 120) bpmRanges['101-120']++;
          else if (bpm <= 140) bpmRanges['121-140']++;
          else if (bpm <= 160) bpmRanges['141-160']++;
          else if (bpm <= 180) bpmRanges['161-180']++;
          else bpmRanges['181+']++;
        });

        return Object.entries(bpmRanges).map(([range, count]) => ({
          range,
          count,
          percentage: Math.round((count / filteredSessions.length) * 100),
        }));

      default:
        return [];
    }
  }, [filteredSessions, chartType]);

  // Colors for pie chart
  const pieColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main,
    theme.palette.primary.light,
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card elevation={3} sx={{ p: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: entry.color }}
            >
              {entry.name}: {entry.value}
              {entry.name.includes('Time') && ' min'}
              {entry.name.includes('Bpm') && ' BPM'}
            </Typography>
          ))}
        </Card>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <Box
          sx={{
            height: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No data available for the selected time range
          </Typography>
        </Box>
      );
    }

    switch (chartType) {
      case 'practice-time':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="session" 
                stroke={theme.palette.text.secondary}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke={theme.palette.text.secondary}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="practiceTime"
                stroke={theme.palette.primary.main}
                strokeWidth={3}
                dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: 4 }}
                name="Practice Time"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bpm-progress':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="session" 
                stroke={theme.palette.text.secondary}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke={theme.palette.text.secondary}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="averageBpm"
                stroke={theme.palette.primary.main}
                strokeWidth={3}
                dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: 4 }}
                name="Average BPM"
              />
              <Line
                type="monotone"
                dataKey="maxBpm"
                stroke={theme.palette.secondary.main}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: theme.palette.secondary.main, strokeWidth: 2, r: 3 }}
                name="Max BPM"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'daily-summary':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="date" 
                stroke={theme.palette.text.secondary}
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke={theme.palette.text.secondary}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="totalTime"
                fill={theme.palette.primary.main}
                name="Total Time"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'bpm-distribution':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.filter(item => item.count > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ range, percentage }) => `${range} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  if (sessions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          No Progress Data Yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start practicing to see your progress charts and analytics.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Controls */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Chart Type</InputLabel>
            <Select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              label="Chart Type"
            >
              <MenuItem value="practice-time">Practice Time Progress</MenuItem>
              <MenuItem value="bpm-progress">BPM Progress</MenuItem>
              <MenuItem value="daily-summary">Daily Summary</MenuItem>
              <MenuItem value="bpm-distribution">BPM Distribution</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
              <MenuItem value="3months">Last 3 Months</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Chart Description */}
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
        {chartType === 'practice-time' && (
          <Chip 
            label="Shows practice time per session" 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
        )}
        {chartType === 'bpm-progress' && (
          <Chip 
            label="Shows BPM progression over time" 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
        )}
        {chartType === 'daily-summary' && (
          <Chip 
            label="Shows total practice time per day" 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
        )}
        {chartType === 'bpm-distribution' && (
          <Chip 
            label="Shows BPM range distribution" 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
        )}
      </Stack>

      {/* Chart */}
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
            {chartType === 'practice-time' && 'Practice Time Progress'}
            {chartType === 'bpm-progress' && 'BPM Progress Over Time'}
            {chartType === 'daily-summary' && 'Daily Practice Summary'}
            {chartType === 'bpm-distribution' && 'BPM Range Distribution'}
          </Typography>
          {renderChart()}
        </CardContent>
      </Card>

      {/* Insights */}
      {filteredSessions.length > 0 && (
        <Card elevation={1} sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Quick Insights
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main">
                    {filteredSessions.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sessions
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main">
                    {Math.round(
                      filteredSessions.reduce((sum, s) => sum + s.duration, 0) / (1000 * 60)
                    )}m
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Time
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main">
                    {Math.round(
                      filteredSessions.reduce((sum, s) => sum + s.averageBpm, 0) / filteredSessions.length
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg BPM
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main">
                    {Math.round(
                      filteredSessions.reduce((sum, s) => sum + s.duration, 0) / 
                      (1000 * 60 * filteredSessions.length)
                    )}m
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Session
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ProgressChart;
