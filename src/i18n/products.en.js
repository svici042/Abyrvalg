import range0 from './products/en-1-50.json' with { type: 'json' }
import range1 from './products/en-51-100.json' with { type: 'json' }
import range2 from './products/en-101-150.json' with { type: 'json' }
import range3 from './products/en-151-194.json' with { type: 'json' }

// Stable entry point for the complete dictionary.
export default { ...range0, ...range1, ...range2, ...range3 }
