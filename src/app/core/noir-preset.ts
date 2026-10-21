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
    select: {
      css: `
        .p-select-label {
          line-height: normal;
        }
      `,
    },
  },
});
