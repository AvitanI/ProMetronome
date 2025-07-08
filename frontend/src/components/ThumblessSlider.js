import React, { useState, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const ThumblessSlider = ({ 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1, 
  width = 120,
  label,
  formatValue,
  ...props 
}) => {
  const theme = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef(null);

  const handleChange = (newValue) => {
    onChange(newValue);
  };

  const size = typeof width === 'string' ? parseInt(width) : width;
  const center = size / 2;
  const strokeWidth = 24;
  const radius = (size - strokeWidth * 2) / 2; // Account for stroke width on both sides
  const circumference = 2 * Math.PI * radius;
  
  // Convert value to percentage and calculate stroke dash offset
  const valuePercentage = ((value - min) / (max - min)) * 100;
  const progressOffset = circumference - (valuePercentage / 100) * circumference;

  const getValueFromEvent = (event) => {
    if (!svgRef.current) return value;
    
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = event.clientX - centerX;
    const y = event.clientY - centerY;
    
    // Calculate angle from center
    let angle = Math.atan2(y, x) * 180 / Math.PI;
    angle = (angle + 90 + 360) % 360; // Normalize to 0-360, starting from top
    
    // Convert angle to value
    const percentage = angle / 360;
    const newValue = Math.round((percentage * (max - min) + min) / step) * step;
    const clampedValue = Math.min(Math.max(newValue, min), max);
    
    return clampedValue;
  };

  const handleMouseDown = (event) => {
    setIsDragging(true);
    const newValue = getValueFromEvent(event);
    handleChange(newValue);
    event.preventDefault();
  };

  const handleTouchStart = (event) => {
    setIsDragging(true);
    const touch = event.touches[0];
    const newValue = getValueFromEvent(touch);
    handleChange(newValue);
    event.preventDefault();
  };

  const handleClick = (event) => {
    const newValue = getValueFromEvent(event);
    handleChange(newValue);
  };

  const handleMouseMove = (event) => {
    if (!isDragging) return;
    const newValue = getValueFromEvent(event);
    handleChange(newValue);
    event.preventDefault();
  };

  const handleTouchMove = (event) => {
    if (!isDragging) return;
    const touch = event.touches[0];
    const newValue = getValueFromEvent(touch);
    handleChange(newValue);
    event.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Add event listeners for mouse and touch events
  React.useEffect(() => {
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
  }, [isDragging, value, min, max, step]);

  return (
    <Box sx={{ width: size, mb: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {label && (
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
          {label}
        </Typography>
      )}
      <Box sx={{ position: 'relative', width: size, height: size }}>
        <svg
          ref={svgRef}
          width={size}
          height={size}
          style={{ 
            cursor: 'pointer', 
            transform: 'rotate(-90deg)',
            userSelect: 'none',
            touchAction: 'none'
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={handleClick}
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={theme.palette.divider}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={theme.palette.primary.main}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
          />
        </svg>
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <Typography variant="h2" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
            {formatValue ? formatValue(value) : value}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ThumblessSlider;
