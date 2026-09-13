const { getDefaultConfig } = require("expo/metro-config")
const path = require("path")

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, "..")
const platformDir = path.resolve(workspaceRoot, "src/lib/platform")

const config = getDefaultConfig(projectRoot)

config.watchFolders = [platformDir]
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")]
config.resolver.extraNodeModules = {
  "@supabase/supabase-js": path.resolve(projectRoot, "node_modules/@supabase/supabase-js"),
  react: path.resolve(projectRoot, "node_modules/react"),
  "react-native": path.resolve(projectRoot, "node_modules/react-native"),
}

module.exports = config
