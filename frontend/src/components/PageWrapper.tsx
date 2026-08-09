import type { FC, ReactNode } from 'react'

export const PageWrapper: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="transicion-pagina">{children}</div>
)
