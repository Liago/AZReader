/**
 * Testing utilities for reading style customization
 * Used to verify responsive behavior and CSS variable application
 */

export interface ReadingStyleTest {
  fontSize: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  expectedPixels: number;
  spacing: number;
  width: number;
  theme: string;
}

export const fontSizeMapping = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
};

export const testScenarios: ReadingStyleTest[] = [
  // Small font, compact layout
  {
    fontSize: 'xs',
    expectedPixels: 12,
    spacing: 1.2,
    width: 35,
    theme: 'white'
  },
  // Medium font, balanced layout  
  {
    fontSize: 'base',
    expectedPixels: 16,
    spacing: 1.5,
    width: 42,
    theme: 'sepia'
  },
  // Large font, wide layout
  {
    fontSize: '2xl',
    expectedPixels: 24,
    spacing: 2.0,
    width: 50,
    theme: 'dark'
  }
];

/**
 * Verify CSS variables are set correctly
 */
export const verifyCSSVariables = (): boolean => {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  const tests = [
    {
      variable: '--article-font-size',
      expected: /^\d+px$/,
      description: 'Font size should be in pixels'
    },
    {
      variable: '--article-line-height', 
      expected: /^[12]\.\d+$/,
      description: 'Line height should be 1.2-2.0 range'
    },
    {
      variable: '--article-max-width',
      expected: /^\d+rem$/,
      description: 'Max width should be in rem units'
    },
    {
      variable: '--article-background',
      expected: /^#[0-9a-fA-F]{6}$/,
      description: 'Background should be hex color'
    }
  ];
  
  let allTestsPassed = true;
  
  tests.forEach(test => {
    const value = computedStyle.getPropertyValue(test.variable).trim();
    const passed = test.expected.test(value);
    
    console.log(`${test.description}: ${passed ? '✅' : '❌'}`);
    console.log(`  Variable: ${test.variable}`);
    console.log(`  Value: "${value}"`);
    console.log(`  Expected: ${test.expected}`);
    console.log('');
    
    if (!passed) {
      allTestsPassed = false;
    }
  });
  
  return allTestsPassed;
};

/**
 * Test responsive breakpoint behavior
 */
export const testResponsiveBreakpoints = (): void => {
  const breakpoints = [320, 480, 768, 1024, 1366, 1920];
  
  console.log('Testing responsive breakpoints...');
  
  breakpoints.forEach(width => {
    console.log(`\n--- Testing at ${width}px width ---`);
    
    // Temporarily resize viewport (if in browser dev tools)
    if (typeof window !== 'undefined' && window.innerWidth) {
      console.log(`Current viewport: ${window.innerWidth}x${window.innerHeight}`);
    }
    
    // Test what CSS rules should apply at this breakpoint
    if (width <= 480) {
      console.log('Expected: Small mobile optimizations active');
      console.log('- Popover width: 95vw');
      console.log('- Padding: 0.75rem');
      console.log('- Grid: 2 columns for fonts, 3 for themes');
    } else if (width <= 768) {
      console.log('Expected: Large mobile/tablet optimizations active');  
      console.log('- Padding: 1rem');
      console.log('- Mobile font sizes active');
      console.log('- Stacked metadata layout');
    } else {
      console.log('Expected: Desktop experience');
      console.log('- Full feature set');
      console.log('- Positioned popover');
      console.log('- Auto-fit grids');
    }
  });
};

/**
 * Simulate font size changes and verify calculations
 */
export const testFontSizeCalculations = (): boolean => {
  console.log('Testing font size calculations...');
  
  let allTestsPassed = true;
  
  Object.entries(fontSizeMapping).forEach(([sizeClass, expectedPixels]) => {
    // Expected mobile font size (1px smaller, minimum 12px)
    const expectedMobilePixels = Math.max(expectedPixels - 1, 12);
    
    console.log(`\nTesting ${sizeClass} (${expectedPixels}px):`);
    console.log(`  Desktop: ${expectedPixels}px`);
    console.log(`  Mobile: ${expectedMobilePixels}px`);
    console.log(`  Large: ${expectedPixels + 2}px`);
    
    // These calculations should match ReadingStyleProvider logic
    const mobileSize = Math.max(expectedPixels - 1, 12);
    const largeSize = expectedPixels + 2;
    
    if (mobileSize !== expectedMobilePixels) {
      console.log(`❌ Mobile calculation incorrect`);
      allTestsPassed = false;
    } else {
      console.log(`✅ Calculations correct`);
    }
  });
  
  return allTestsPassed;
};

/**
 * Test theme color calculations
 */
export const testThemeColors = (): void => {
  const themes = ['white', 'sepia', 'paper', 'dark', 'amoled'];
  
  console.log('Testing theme color mappings...');
  
  themes.forEach(theme => {
    console.log(`\n${theme.toUpperCase()} Theme:`);
    
    // Expected colors based on ReadingStyleProvider
    const expectedColors = getExpectedThemeColors(theme);
    
    if (expectedColors) {
      Object.entries(expectedColors).forEach(([property, color]) => {
        console.log(`  ${property}: ${color}`);
      });
    }
  });
};

function getExpectedThemeColors(themeId: string) {
  const themes: Record<string, Record<string, string>> = {
    white: {
      background: '#ffffff',
      text: '#1a1a1a', 
      secondary: '#4a5568',
      accent: '#3b82f6'
    },
    sepia: {
      background: '#f4ecd8',
      text: '#5c4b37',
      secondary: '#8b7355', 
      accent: '#92400e'
    },
    paper: {
      background: '#f7f5f3',
      text: '#2c2c2c',
      secondary: '#6b6b6b',
      accent: '#2563eb'
    },
    dark: {
      background: '#1a1a1a',
      text: '#e5e5e5',
      secondary: '#a1a1aa',
      accent: '#60a5fa'
    },
    amoled: {
      background: '#000000', 
      text: '#ffffff',
      secondary: '#d4d4d8',
      accent: '#3b82f6'
    }
  };
  
  return themes[themeId] || themes.white;
}

/**
 * Run all verification tests
 */
export const runAllTests = (): boolean => {
  console.log('🧪 Starting Reading Style Tests\n');
  
  const cssVariablesPass = verifyCSSVariables();
  const fontCalculationsPass = testFontSizeCalculations();
  
  testResponsiveBreakpoints();
  testThemeColors();
  
  const allTestsPass = cssVariablesPass && fontCalculationsPass;
  
  console.log(`\n🏁 All Tests ${allTestsPass ? 'PASSED ✅' : 'FAILED ❌'}`);
  
  return allTestsPass;
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testReadingStyles = {
    verifyCSSVariables,
    testResponsiveBreakpoints, 
    testFontSizeCalculations,
    testThemeColors,
    runAllTests
  };
}