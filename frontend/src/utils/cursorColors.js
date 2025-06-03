// A set of distinct colors for cursors to easily distinguish between different users
export const CURSOR_COLORS = [
    '#FF5733', // Coral
    '#33FF57', // Lime Green
    '#3357FF', // Royal Blue
    '#FF33A8', // Pink
    '#33FFF9', // Turquoise
    '#FF9933', // Orange
    '#8C33FF', // Purple
    '#FFFF33', // Yellow
    '#33CEFF', // Sky Blue
    '#FF3358', // Crimson
    '#7AFF33', // Bright Green
    '#FF33F5', // Magenta
    '#FF5733', // Red-Orange
    '#33FF99', // Spring Green
    '#3399FF', // Azure
  ];
  
  /**
   * Gets a consistent color for a specific username
   * @param {string} username - The username to assign a color to
   * @returns {string} A hexadecimal color code
   */
  export const getCursorColorForUser = (username) => {
    if (!username) return CURSOR_COLORS[0];
    
    // Create a simple hash of the username to get a consistent color
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use the hash to get an index from the colors array
    const colorIndex = Math.abs(hash) % CURSOR_COLORS.length;
    return CURSOR_COLORS[colorIndex];
  };
  
  /**
   * Creates cursor style objects for Monaco Editor decorations
   * @param {string} username - The username for the cursor
   * @param {string} color - The color to use for the cursor
   * @returns {Object} Styles for the cursor and label
   */
  export const createCursorStyle = (username, color) => {
    return {
      cursorStyle: {
        className: `remote-cursor-${username.replace(/\s+/g, '-')}`,
        style: `background-color: ${color}; width: 2px !important;`
      },
      labelStyle: {
        className: `remote-cursor-label-${username.replace(/\s+/g, '-')}`,
        style: `
          background-color: ${color};
          color: white;
          padding: 2px 5px;
          border-radius: 2px;
          font-size: 12px;
          font-family: monospace;
          pointer-events: none;
          z-index: 100;
        `
      }
    };
  };