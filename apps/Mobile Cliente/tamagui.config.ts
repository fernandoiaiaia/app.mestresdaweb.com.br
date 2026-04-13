import { createTamagui } from 'tamagui'
import { config } from '@tamagui/config/v3'

const appConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    dark: {
      ...config.themes.dark,
      background: '#0f172a',
      color: '#cbd5e1',
      primary: '#22ffb5',
      primaryHover: '#16c992',
    },
  },
})

export type AppConfig = typeof appConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig
