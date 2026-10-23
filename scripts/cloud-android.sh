#!/usr/bin/env bash
set -euo pipefail
cd /workspace/System
export JAVA_HOME=/workspace/.tools/java
export ANDROID_HOME=/workspace/.tools/android-sdk
export ANDROID_USER_HOME=/workspace/.tools/android-user
export GRADLE_USER_HOME=/workspace/.cache/gradle
export npm_config_cache=/workspace/.cache/npm
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
# Java does not automatically use the cloud's HTTP(S)_PROXY variables.
read -r GUILD_PROXY_HOST GUILD_PROXY_PORT < <(python3 - <<'PY'
import os, urllib.parse
p = urllib.parse.urlsplit(os.environ.get('HTTPS_PROXY', os.environ.get('https_proxy', '')))
print(p.hostname or 'none', p.port or 80)
PY
)
if [[ "$GUILD_PROXY_HOST" != none ]]; then
  export GRADLE_OPTS="${GRADLE_OPTS:-} -Dhttps.proxyHost=$GUILD_PROXY_HOST -Dhttps.proxyPort=$GUILD_PROXY_PORT -Dhttp.proxyHost=$GUILD_PROXY_HOST -Dhttp.proxyPort=$GUILD_PROXY_PORT -Djavax.net.ssl.trustStore=/etc/ssl/certs/java/cacerts"
fi
npm run android:sync
./android/gradlew -p android assembleDebug --max-workers=2 --console=plain
