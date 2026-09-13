import { requireOptionalNativeModule } from "expo"
import { NativeModules } from "react-native"

type ToolsButtonModule = {
  setToolsButtonVisible?: (visible: boolean) => void
  hideMenu?: () => void
  setPreferencesAsync?: (prefs: { showFloatingActionButton?: boolean }) => Promise<unknown>
}

function modules(): Array<ToolsButtonModule | null | undefined> {
  return [
    requireOptionalNativeModule<ToolsButtonModule>("ExpoDevMenu"),
    requireOptionalNativeModule<ToolsButtonModule>("DevMenuPreferences"),
    NativeModules.ExpoDevMenu as ToolsButtonModule | undefined,
    NativeModules.DevMenuPreferences as ToolsButtonModule | undefined,
  ]
}

/** Expo Go floating gear is host debug chrome, not Motodo UI. */
export function setExpoToolsButtonVisible(visible: boolean) {
  for (const mod of modules()) {
    if (!mod) continue
    try {
      if (typeof mod.setToolsButtonVisible === "function") {
        mod.setToolsButtonVisible(visible)
      }
      if (!visible && typeof mod.hideMenu === "function") {
        mod.hideMenu()
      }
      if (typeof mod.setPreferencesAsync === "function") {
        void mod.setPreferencesAsync({ showFloatingActionButton: visible })
      }
    } catch {
      /* try the next host module */
    }
  }
}
