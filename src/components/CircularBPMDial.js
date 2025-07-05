import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import useMetronomeStore from '../stores/metronomeStore';

const CircularBPMDial = ({ size = 280 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const adjustedSize = isMobile ? Math.min(size, 240) : size;
  const dialRef = useRef(null);
  
  const { 
    bpm, 
    setBpm, 
    isPlaying, 
    subdivision, 
    currentBeat, 
    currentSubdivision,
    timeSignature 
  } = useMetronomeStore();
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0);

  const minBpm = 30;
  const maxBpm = 300;
  const radius = adjustedSize * 0.35;
  const strokeWidth = adjustedSize * 0.08;

  // Calculate rotation based on BPM
  useEffect(() => {
    const percentage = (bpm - minBpm) / (maxBpm - minBpm);
    const degrees = percentage * 270 - 135; // -135 to 135 degrees
    setRotation(degrees);
  }, [bpm, minBpm, maxBpm]);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !dialRef.current) return;

    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360; // Normalize to 0-360, with 0 at top
    
    // Map angle to BPM (270 degrees of rotation)
    let normalizedAngle;
    if (angle <= 45) {
      normalizedAngle = angle + 315; // Handle wrap-around at top
    } else if (angle >= 315) {
      normalizedAngle = angle - 315;
    } else {
      normalizedAngle = angle - 45;
    }
    
    normalizedAngle = Math.max(0, Math.min(270, normalizedAngle));
    const percentage = normalizedAngle / 270;
    const newBpm = Math.round(minBpm + percentage * (maxBpm - minBpm));
    
    setBpm(newBpm);
  }, [isDragging, setBpm, minBpm, maxBpm]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch event handlers
  const handleTouchStart = useCallback((e) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || !dialRef.current) return;

    const touch = e.touches[0];
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;
    
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360;
    
    let normalizedAngle;
    if (angle <= 45) {
      normalizedAngle = angle + 315;
    } else if (angle >= 315) {
      normalizedAngle = angle - 315;
    } else {
      normalizedAngle = angle - 45;
    }
    
    normalizedAngle = Math.max(0, Math.min(270, normalizedAngle));
    const percentage = normalizedAngle / 270;
    const newBpm = Math.round(minBpm + percentage * (maxBpm - minBpm));
    
    setBpm(newBpm);
  }, [isDragging, setBpm, minBpm, maxBpm]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Calculate progress for the arc
  const progress = (bpm - minBpm) / (maxBpm - minBpm);

  // Pulse animation when playing
  const pulseKeyframes = `
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  `;

  return (
    <Paper
      ref={dialRef}
      elevation={3}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: adjustedSize,
        height: adjustedSize,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '50%',
          background: `conic-gradient(from 0deg, ${theme.palette.primary.main} 0deg, ${theme.palette.primary.light} ${progress * 270}deg, ${theme.palette.divider} ${progress * 270}deg, ${theme.palette.divider} 270deg, transparent 270deg)`,
          mask: `radial-gradient(circle, transparent ${radius - strokeWidth / 2}px, black ${radius - strokeWidth / 2}px, black ${radius + strokeWidth / 2}px, transparent ${radius + strokeWidth / 2}px)`,
          WebkitMask: `radial-gradient(circle, transparent ${radius - strokeWidth / 2}px, black ${radius - strokeWidth / 2}px, black ${radius + strokeWidth / 2}px, transparent ${radius + strokeWidth / 2}px)`,
        },
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <style>{pulseKeyframes}</style>
      
      {/* BPM Display */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          animation: isPlaying ? `pulse ${60 / bpm}s infinite` : 'none',
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontWeight: 700,
            color: theme.palette.primary.main,
            fontSize: isMobile ? '2.5rem' : '3rem',
            lineHeight: 1,
            textShadow: `0 2px 8px ${theme.palette.primary.main}33`,
          }}
        >
          {bpm}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 500,
            fontSize: isMobile ? '0.875rem' : '1rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          BPM
        </Typography>
        {subdivision.id !== 'none' && (
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 600,
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginTop: '2px',
              opacity: 0.8,
            }}
          >
            {subdivision.label}
          </Typography>
        )}
      </Box>

      {/* Handle */}
      <Box
        sx={{
          position: 'absolute',
          width: strokeWidth * 1.5,
          height: strokeWidth * 1.5,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          boxShadow: `0 4px 12px ${theme.palette.primary.main}44`,
          transform: `rotate(${rotation}deg) translateY(-${radius}px)`,
          transformOrigin: `50% ${radius}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
          border: `2px solid ${theme.palette.background.paper}`,
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: theme.palette.background.paper,
            transform: 'translate(-50%, -50%)',
          },
        }}
      />

      {/* Tick marks */}
      {[...Array(12)].map((_, i) => {
        const tickAngle = (i * 22.5) - 135; // Every 22.5 degrees
        const isMainTick = i % 3 === 0;
        return (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: isMainTick ? '3px' : '1px',
              height: isMainTick ? '20px' : '12px',
              background: theme.palette.text.secondary,
              borderRadius: '2px',
              transform: `rotate(${tickAngle}deg) translateY(-${radius + strokeWidth / 2 + 10}px)`,
              transformOrigin: `50% ${radius + strokeWidth / 2 + 10}px`,
              opacity: isMainTick ? 0.8 : 0.4,
            }}
          />
        );
      })}

      {/* Subdivision indicators */}
      {subdivision.id !== 'none' && [...Array(subdivision.value * timeSignature.beats)].map((_, i) => {
        const beatIndex = Math.floor(i / subdivision.value);
        const subdivisionIndex = i % subdivision.value;
        const totalIndicators = subdivision.value * timeSignature.beats;
        const angle = (i / totalIndicators) * 360 - 90; // Start from top, spread evenly
        
        // Determine if this indicator should be active
        const isCurrentBeat = isPlaying && beatIndex === currentBeat;
        const isCurrentSubdivision = isCurrentBeat && subdivisionIndex === currentSubdivision;
        const isBeatStart = subdivisionIndex === 0;
        
        // Different sizes and colors for beat starts vs subdivisions
        const indicatorSize = isBeatStart ? 8 : 5;
        const indicatorColor = isCurrentSubdivision 
          ? theme.palette.primary.main
          : isBeatStart 
            ? theme.palette.secondary.main
            : theme.palette.text.disabled;
        
        const indicatorOpacity = isCurrentSubdivision ? 1 : isBeatStart ? 0.8 : 0.5;
        const indicatorRadius = radius + strokeWidth / 2 + 35;
        
        return (
          <Box
            key={`subdivision-${i}`}
            sx={{
              position: 'absolute',
              width: `${indicatorSize}px`,
              height: `${indicatorSize}px`,
              borderRadius: '50%',
              background: indicatorColor,
              transform: `rotate(${angle}deg) translateY(-${indicatorRadius}px)`,
              transformOrigin: `50% ${indicatorRadius}px`,
              opacity: indicatorOpacity,
              transition: isPlaying ? 'opacity 0.1s ease-in-out, background-color 0.1s ease-in-out' : 'none',
              boxShadow: isCurrentSubdivision ? `0 0 8px ${theme.palette.primary.main}` : 'none',
              border: isBeatStart ? `1px solid ${theme.palette.background.paper}` : 'none',
            }}
          />
        );
      })}
    </Paper>
  );
};

export default CircularBPMDial;
