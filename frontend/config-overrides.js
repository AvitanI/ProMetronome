const { override } = require('customize-cra');

module.exports = override(
  // Simple override for now - remove complex optimizations that might be causing issues
  (config) => {
    return config;
  }
);
