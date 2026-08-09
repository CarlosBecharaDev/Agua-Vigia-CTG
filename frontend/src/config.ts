export type FrontendMode = 'simulation' | 'api'

// Simulation is the safe default until the backend endpoints are deployed.
export const FRONTEND_MODE: FrontendMode = import.meta.env.VITE_FRONTEND_MODE === 'api'
  ? 'api'
  : 'simulation'

export const isSimulationMode = FRONTEND_MODE === 'simulation'
