#!/usr/bin/env bash
set -euo pipefail
cd /workspace/System
export npm_config_cache=/workspace/.cache/npm
mkdir -p /workspace/.tools/downloads
if [[ ! -x /workspace/.tools/java/bin/javac ]]; then
  JDK_RELEASE='https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.9%2B10'
  curl -fsSL --retry 2 "$JDK_RELEASE/OpenJDK21U-jdk_x64_linux_hotspot_21.0.9_10.tar.gz" -o /workspace/.tools/downloads/jdk.tar.gz
  curl -fsSL --retry 2 "$JDK_RELEASE/OpenJDK21U-jdk_x64_linux_hotspot_21.0.9_10.tar.gz.sha256.txt" -o /workspace/.tools/downloads/jdk.sha256
  python3 - <<'PY'
import hashlib, pathlib, tarfile
p = pathlib.Path('/workspace/.tools/downloads')
assert hashlib.sha256((p/'jdk.tar.gz').read_bytes()).hexdigest() == (p/'jdk.sha256').read_text().split()[0], 'JDK checksum mismatch'
with tarfile.open(p/'jdk.tar.gz') as t:
    root = t.getmembers()[0].name.split('/')[0]
    t.extractall('/workspace/.tools', filter='data')
pathlib.Path('/workspace/.tools/java').symlink_to('/workspace/.tools/' + root, target_is_directory=True)
PY
fi
if [[ ! -x /workspace/.tools/android-sdk/cmdline-tools/latest/bin/sdkmanager ]]; then
  curl -fsSL --retry 2 https://dl.google.com/android/repository/commandlinetools-linux-16111833_latest.zip -o /workspace/.tools/downloads/android-tools.zip
  python3 - <<'PY'
import hashlib, pathlib, zipfile
p = pathlib.Path('/workspace/.tools/downloads/android-tools.zip')
# Checksum from Google's repository2-1.xml metadata for this exact release.
assert hashlib.sha1(p.read_bytes()).hexdigest() == 'e025545c62a8e64c7559119566a569fb1dec5f60', 'Android tools checksum mismatch'
d = pathlib.Path('/workspace/.tools/android-sdk/cmdline-tools')
d.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(p) as z:
    z.extractall(d)
(d/'cmdline-tools').rename(d/'latest')
for f in (d/'latest/bin').iterdir():
    f.chmod(0o755)
PY
fi
export JAVA_HOME=/workspace/.tools/java
export ANDROID_HOME=/workspace/.tools/android-sdk
export ANDROID_USER_HOME=/workspace/.tools/android-user
export PATH="$JAVA_HOME/bin:$PATH"
export JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS:-} -Djava.util.prefs.userRoot=/workspace/.cache/java-prefs"
/workspace/.tools/android-sdk/cmdline-tools/latest/bin/sdkmanager --sdk_root="$ANDROID_HOME" 'platform-tools' 'platforms;android-36' 'build-tools;35.0.0' 'build-tools;36.0.0'
npm ci
npm test
npm run build
./scripts/cloud-android.sh
