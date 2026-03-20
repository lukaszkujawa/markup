export const CONSTANTS = {
  TITLE_MAX_LENGTH: 50,
  MIN_NOTES_COUNT: 1,
  SELECTORS: {
    CONTAINER: '.file-nav',
    LIST: '#file-nav-list',
    NOTE_ITEM: '.file-nav__item',
    FOLDER_ITEM: '.file-nav__folder',
    FOLDER_HEADER: '.file-nav__folder-header',
    FOLDER_NAME: '.file-nav__folder-name'
  },
  CLASSES: {
    ACTIVE: 'file-nav__item--active',
    EXPANDED: 'file-nav__folder--expanded',
    COLLAPSED: 'file-nav__folder--collapsed',
    DRAG_HIGHLIGHT: 'file-nav__folder--drag-over'
  },
  DRAG: {
    THRESHOLD: 7,
    AUTO_EXPAND_DELAY: 800,
    DROP_ZONE_THRESHOLD: 0.3
  }
} as const;

export const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
};
