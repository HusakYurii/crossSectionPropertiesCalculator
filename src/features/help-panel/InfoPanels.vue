<script setup lang="ts">
import 'katex/dist/katex.min.css'
import './markdown.css'

import WhatIsNegativeArea from './pages/WhatIsNegativeArea.vue';
import WhatIsGreensTheoremSolver from './pages/WhatIsGreensTheoremSolver.vue';
import WhatIsFEMSolver from './pages/WhatIsFEMSolver.vue';
import WhatIsCustomShapeCsvFormat from './pages/WhatIsCustomShapeCsvFormat.vue';
import AboutThisApp from './pages/AboutThisApp.vue';
import NavigationAndShortcuts from './pages/NavigationAndShortcuts.vue';
import WhatIsCompositeSolver from './pages/WhatIsCompositeSolver.vue';
import WhatIsClassicSolver from './pages/WhatIsClassicSolver.vue';
</script>

<template>
	<WhatIsNegativeArea />
	<WhatIsClassicSolver />
	<WhatIsCompositeSolver />
	<WhatIsGreensTheoremSolver />
	<WhatIsFEMSolver />
	<WhatIsCustomShapeCsvFormat />
	<AboutThisApp />
	<NavigationAndShortcuts />
</template>
