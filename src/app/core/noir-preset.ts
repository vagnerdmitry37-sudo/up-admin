import { definePreset } from '@openng/optimus-ui-themes';
import Aura from '@openng/optimus-ui-themes/aura';

const zincSurface = {
  0: '#ffffff',
  50: '{zinc.50}',
  100: '{zinc.100}',
  200: '{zinc.200}',
  300: '{zinc.300}',
  400: '{zinc.400}',
  500: '{zinc.500}',
  600: '{zinc.600}',
  700: '{zinc.700}',
  800: '{zinc.800}',
  900: '{zinc.900}',
  950: '{zinc.950}',
};

export const NoirPreset = definePreset(Aura, {
  semantic: {
    primary: zincSurface,
    colorScheme: {
      light: {
        surface: zincSurface,
        primary: {
          color: '{zinc.950}',
          contrastColor: '#ffffff',
          hoverColor: '{zinc.900}',
          activeColor: '{zinc.800}',
        },
        highlight: {
          background: '{zinc.950}',
          focusBackground: '{zinc.700}',
          color: '#ffffff',
          focusColor: '#ffffff',
        },
      },
      dark: {
        primary: {
          color: '{zinc.50}',
          contrastColor: '{zinc.950}',
          hoverColor: '{zinc.100}',
          activeColor: '{zinc.200}',
        },
        highlight: {
          background: 'rgba(250, 250, 250, .16)',
          focusBackground: 'rgba(250, 250, 250, .24)',
          color: 'rgba(255, 255, 255, .87)',
          focusColor: 'rgba(255, 255, 255, .87)',
        },
      },
    },
  },
  components: {
    menu: {
      item: {
        padding: '0.875rem 1rem',
      },
      css: `
        .p-menu-overlay.p-anchored-overlay-enter-active {
          animation-name: p-menu-overlay-fade-in;
        }
        .p-menu-overlay.p-anchored-overlay-leave-active {
          animation-name: p-menu-overlay-fade-out;
        }
        @keyframes p-menu-overlay-fade-in {
          from { opacity: 0; }
        }
        @keyframes p-menu-overlay-fade-out {
          to { opacity: 0; }
        }
      `,
    },
    speeddial: {
      css: `
        .p-speeddial-item {
          transition:
            transform 200ms cubic-bezier(0.4, 0, 0.2, 1),
            opacity 200ms ease-out,
            visibility 0s linear 0s;
        }
        .p-speeddial-open .p-speeddial-item.p-hidden {
          transform: scale(0.6);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition:
            transform 150ms ease-in,
            opacity 150ms ease-in,
            visibility 0s linear 150ms;
          transition-delay: 0s, 0s, 150ms;
        }
        @media (prefers-reduced-motion: reduce) {
          .p-speeddial-item,
          .p-speeddial-open .p-speeddial-item.p-hidden {
            transition: none;
          }
        }
        .p-speeddial-action:has(.action-menu-suggested),
        app-action-menu.suggesting .p-speeddial-button {
          animation: action-menu-pulse 1.6s ease-out infinite;
        }
        @keyframes action-menu-pulse {
          0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--p-primary-color) 50%, transparent); }
          70% { box-shadow: 0 0 0 0.75rem transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
        @media (prefers-reduced-motion: reduce) {
          .p-speeddial-action:has(.action-menu-suggested),
          app-action-menu.suggesting .p-speeddial-button {
            animation: none;
            outline: 2px solid var(--p-primary-color);
            outline-offset: 2px;
          }
        }
      `,
    },
    progressspinner: {
      colorScheme: {
        light: {
          root: {
            colorOne: '{primary.color}',
            colorTwo: '{primary.color}',
            colorThree: '{primary.color}',
            colorFour: '{primary.color}',
          },
        },
        dark: {
          root: {
            colorOne: '{primary.color}',
            colorTwo: '{primary.color}',
            colorThree: '{primary.color}',
            colorFour: '{primary.color}',
          },
        },
      },
    },
    toast: {
      css: `
        .p-toast {
          line-height: normal;
        }
        .p-toast .p-toast-summary {
          line-height: var(--p-toast-close-button-height);
        }
        .p-toast .p-toast-message-content .p-toast-message-icon {
          margin-block: calc((var(--p-toast-close-button-height) - var(--p-toast-icon-size)) / 2);
        }
        .p-toast .p-toast-message-content .p-toast-close-button {
          margin-block-start: 0;
        }
      `,
    },
    select: {
      css: `
        .p-select-label {
          line-height: normal;
        }
      `,
    },
    textarea: {
      css: `
        .p-textarea {
          vertical-align: top;
        }
      `,
    },
  },
});
