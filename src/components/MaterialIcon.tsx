import React from 'react';

export interface MaterialIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

/**
 * Self-contained inline SVG icon set matching the Material Symbols Outlined icons used in
 * `UI_TEMPLATES/home_page` and `UI_TEMPLATES/kids_spelling_word_game` (Task 10.2).
 * Makes zero external requests to Google Fonts.
 */
export function MaterialIcon({
  name,
  size = 22,
  color = 'currentColor',
  style,
}: MaterialIconProps) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    'aria-hidden': true as const,
    style: {
      display: 'inline-block',
      verticalAlign: 'middle',
      flexShrink: 0,
      ...style,
    },
  };

  switch (name) {
    case 'star':
      return (
        <svg {...commonProps}>
          <path
            d="M12 2.5L14.9 8.4L21.4 9.3L16.7 13.9L17.8 20.4L12 17.3L6.2 20.4L7.3 13.9L2.6 9.3L9.1 8.4L12 2.5Z"
            fill={color}
          />
        </svg>
      );
    case 'person':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="8" r="4" fill={color} />
          <path
            d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20V21H4V20Z"
            fill={color}
          />
        </svg>
      );
    case 'spellcheck':
      return (
        <svg {...commonProps}>
          <path
            d="M12.45 16H14.54L9.43 3H7.57L2.46 16H4.55L5.67 13H11.31L12.45 16ZM6.43 11L8.5 5.48L10.57 11H6.43ZM21.59 11.59L13.5 19.68L9.83 16L8.42 17.41L13.5 22.5L23 13L21.59 11.59Z"
            fill={color}
          />
        </svg>
      );
    case 'favorite':
      return (
        <svg {...commonProps}>
          <path
            d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
            fill={color}
          />
        </svg>
      );
    case 'check_circle':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="10" fill={color} />
          <path
            d="M8.5 12.5L10.8 14.8L15.8 9.8"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'bolt':
      return (
        <svg {...commonProps}>
          <path d="M11 21H10L11 14H7.5L13 3H14L13 10H16.5L11 21Z" fill={color} />
        </svg>
      );
    case 'play_arrow':
      return (
        <svg {...commonProps}>
          <path d="M8 5V19L19 12L8 5Z" fill={color} />
        </svg>
      );
    case 'cottage':
      return (
        <svg {...commonProps}>
          <path
            d="M12 3L4 9V21H9V14H15V21H20V9L12 3Z"
            fill={color}
          />
        </svg>
      );
    case 'sports_esports':
      return (
        <svg {...commonProps}>
          <path
            d="M21 6H3C1.9 6 1 6.9 1 8V16C1 17.1 1.9 18 3 18H21C22.1 18 23 17.1 23 16V8C23 6.9 22.1 6 21 6ZM11 13H8V16H6V13H3V11H6V8H8V11H11V13ZM15.5 15C14.67 15 14 14.33 14 13.5C14 12.67 14.67 12 15.5 12C16.33 12 17 12.67 17 13.5C17 14.33 16.33 15 15.5 15ZM19.5 12C18.67 12 18 11.33 18 10.5C18 9.67 18.67 9 19.5 9C20.33 9 21 9.67 21 10.5C21 11.33 20.33 12 19.5 12Z"
            fill={color}
          />
        </svg>
      );
    case 'family_restroom':
      return (
        <svg {...commonProps}>
          <circle cx="7" cy="5" r="2.2" fill={color} />
          <circle cx="17" cy="5" r="2.2" fill={color} />
          <circle cx="12" cy="9" r="1.8" fill={color} />
          <path
            d="M4 19V11C4 9.9 4.9 9 6 9H8C9.1 9 10 9.9 10 11V19H4ZM14 19V11C14 9.9 14.9 9 16 9H18C19.1 9 20 9.9 20 11V19H14ZM10.5 19V13.5C10.5 12.67 11.17 12 12 12C12.83 12 13.5 12.67 13.5 13.5V19H10.5Z"
            fill={color}
          />
        </svg>
      );
    case 'arrow_back':
      return (
        <svg {...commonProps}>
          <path
            d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z"
            fill={color}
          />
        </svg>
      );
    case 'emoji_events':
      return (
        <svg {...commonProps}>
          <path
            d="M19 5H17V3H7V5H5C3.9 5 3 5.9 3 7V8C3 10.55 4.92 12.63 7.39 12.94C8.02 14.44 9.37 15.57 11 15.9V19H7V21H17V19H13V15.9C14.63 15.57 15.98 14.44 16.61 12.94C19.08 12.63 21 10.55 21 8V7C21 5.9 20.1 5 19 5Z"
            fill={color}
          />
        </svg>
      );
    case 'help':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="10" fill={color} opacity="0.15" />
          <path
            d="M11 18H13V16H11V18ZM12 6C9.79 6 8 7.79 8 10H10C10 8.9 10.9 8 12 8C13.1 8 14 8.9 14 10C14 12 11 11.75 11 15H13C13 12.75 16 12.5 16 10C16 7.79 14.21 6 12 6Z"
            fill={color}
          />
        </svg>
      );
    case 'touch_app':
      return (
        <svg {...commonProps}>
          <path
            d="M9 11.24V7.5C9 6.12 10.12 5 11.5 5C12.88 5 14 6.12 14 7.5V11.24C15.21 10.43 16 9.06 16 7.5C16 5.01 13.99 3 11.5 3C9.01 3 7 5.01 7 7.5C7 9.06 7.79 10.43 9 11.24ZM18.84 15.87L14.3 13.61C13.96 13.44 13.59 13.35 13.21 13.35H13V7.5C13 6.67 12.33 6 11.5 6C10.67 6 10 6.67 10 7.5V18.24L6.57 17.52L5.8 18.3L10.98 22H18C19.1 22 20 21.1 20 20V17.24C20 16.66 19.57 16.14 18.84 15.87Z"
            fill={color}
          />
        </svg>
      );
    case 'restart_alt':
      return (
        <svg {...commonProps}>
          <path
            d="M12 5V2L8 6L12 10V7C15.31 7 18 9.69 18 13C18 15.97 15.84 18.43 13 18.91V20.93C16.95 20.44 20 17.08 20 13C20 8.58 16.42 5 12 5ZM6 13C6 11.35 6.67 9.85 7.76 8.76L6.34 7.34C4.9 8.79 4 10.79 4 13C4 17.08 7.05 20.44 11 20.93V18.91C8.16 18.43 6 15.97 6 13Z"
            fill={color}
          />
        </svg>
      );
    case 'backspace':
      return (
        <svg {...commonProps}>
          <path
            d="M22 3H7C6.31 3 5.77 3.35 5.41 3.88L0 12L5.41 20.11C5.77 20.64 6.31 21 7 21H22C23.1 21 24 20.1 24 19V5C24 3.9 23.1 3 22 3ZM19 15.59L17.59 17L14 13.41L10.41 17L9 15.59L12.59 12L9 8.41L10.41 7L14 10.59L17.59 7L19 8.41L15.41 12L19 15.59Z"
            fill={color}
          />
        </svg>
      );
    case 'lightbulb':
      return (
        <svg {...commonProps}>
          <path
            d="M9 21C9 21.55 9.45 22 10 22H14C14.55 22 15 21.55 15 21V20H9V21ZM12 2C8.14 2 5 5.14 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.14 15.86 2 12 2Z"
            fill={color}
          />
        </svg>
      );
    case 'share':
      return (
        <svg {...commonProps}>
          <path
            d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.35C15.11 18.56 15.08 18.78 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z"
            fill={color}
          />
        </svg>
      );
    case 'pets':
    case 'local_florist':
    case 'sailing':
    case 'forest':
    case 'rocket_launch':
    default:
      return (
        <svg {...commonProps}>
          <circle cx="6.5" cy="9.5" r="2.2" fill={color} />
          <circle cx="10" cy="6.5" r="2.2" fill={color} />
          <circle cx="14" cy="6.5" r="2.2" fill={color} />
          <circle cx="17.5" cy="9.5" r="2.2" fill={color} />
          <path
            d="M12 11.5C9.3 11.5 7 13.6 7 16.2C7 17.9 8.3 19 10 19C10.9 19 11.5 18.6 12 18.6C12.5 18.6 13.1 19 14 19C15.7 19 17 17.9 17 16.2C17 13.6 14.7 11.5 12 11.5Z"
            fill={color}
          />
        </svg>
      );
  }
}

