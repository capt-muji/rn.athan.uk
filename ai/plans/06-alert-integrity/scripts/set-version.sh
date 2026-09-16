#!/bin/bash
# Sets the next patch version after uat-2's package.json in app.json, package.json and the local
# android/app/build.gradle, then checks all three match. Run from /Users/muji/repos/rn.athan.uk.
# Prints "VERSION <x.y.z>" and "VERSIONS MATCH", or "VERSIONS DIFFER ..." and exits 1.
set -e
current=$(git show uat-2:package.json | node -e 'let s="";process.stdin.on("data",(d)=>{s+=d}).on("end",()=>console.log(JSON.parse(s).version))')
next=$(node -e 'const [a,b,c]=process.argv[1].split(".").map(Number);console.log(a+"."+b+"."+(c+1))' "$current")
perl -0pi -e "s/\"version\": \"\Q$current\E\"/\"version\": \"$next\"/" app.json package.json
perl -0pi -e "s/versionName \"\Q$current\E\"/versionName \"$next\"/" android/app/build.gradle
a=$(node -p 'require("./app.json").expo.version')
p=$(node -p 'require("./package.json").version')
g=$(grep -o 'versionName "[^"]*"' android/app/build.gradle | cut -d'"' -f2)
echo "VERSION $next"
if [ "$a" = "$next" ] && [ "$p" = "$next" ] && [ "$g" = "$next" ]; then
  echo "VERSIONS MATCH"
else
  echo "VERSIONS DIFFER app.json=$a package.json=$p build.gradle=$g"
  exit 1
fi
