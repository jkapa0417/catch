/**
 * electron-builder afterPack hook: ad-hoc code-sign the macOS .app.
 *
 * Without a paid Apple Developer certificate, electron-builder leaves the app's
 * (renamed) bundle with an invalid signature, which Apple Silicon flags as
 * "damaged and can't be opened". Re-signing ad-hoc ("-") produces a valid
 * signature so the app launches (users still allow it once via
 * Settings → Privacy & Security → Open Anyway, since it isn't notarized).
 */
const { execFileSync } = require('child_process')
const path = require('path')
const fs = require('fs')

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return
  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`)
  if (!fs.existsSync(appPath)) {
    console.warn('[afterPack] app bundle not found, skipping ad-hoc sign:', appPath)
    return
  }
  console.log('[afterPack] ad-hoc code-signing', appPath)
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', '--timestamp=none', appPath], {
    stdio: 'inherit'
  })
}
