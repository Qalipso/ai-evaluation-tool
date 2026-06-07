#!/usr/bin/env bash
# Free audio generation — VO (edge-tts, MS neural, no key) + music + SFX (ffmpeg).
# Run: bash scripts/gen-audio.sh   (needs: ffmpeg, python3 -m edge_tts)
#   pip install --user --break-system-packages edge-tts
set -e
cd "$(dirname "$0")/.."
mkdir -p public/audio/film public/audio/sfx

VOICE="en-GB-RyanNeural"
declare -A L=(
  [hook]="AI can lie beautifully."
  [problem]="A fluent answer can hide a false claim, a broken policy, or a risky action."
  [reveal]="AI Evaluation Tool gives every output a quality trial."
  [rubrics]="Rubrics define the rules."
  [claims]="Evidence checks the claims."
  [safety]="Safety gates block the risks."
  [verdict]="And every run ends with a verdict your team can trust."
  [cta]="Evaluate AI with evidence, not vibes."
)
for k in "${!L[@]}"; do
  python3 -m edge_tts --voice "$VOICE" --rate=-6% --text "${L[$k]}" --write-media "public/audio/film/$k.mp3"
done

# Music bed is now an external licensed track (monume-advertising) trimmed to
# the film length — kept in repo at public/audio/music-bed.mp3. Skip regen.
# Legacy procedural generator below (disabled). To use it, set GEN_MUSIC=1.
if [ "${GEN_MUSIC:-0}" = "1" ]; then
tmp=$(mktemp -d)
mkchord(){ ffmpeg -y -loglevel error -f lavfi -i "sine=$1:d=3" -f lavfi -i "sine=$2:d=3" -f lavfi -i "sine=$3:d=3" \
  -filter_complex "[0][1][2]amix=inputs=3:weights=0.5 0.9 0.7,afade=t=in:st=0:d=0.4,afade=t=out:st=2.4:d=0.6" "$tmp/$4.wav"; }
mkchord 110 261.63 329.63 c1; mkchord 87.31 220 261.63 c2; mkchord 130.81 329.63 392 c3; mkchord 98 246.94 293.66 c4
printf "file '%s'\n" "$tmp/c1.wav" "$tmp/c2.wav" "$tmp/c3.wav" "$tmp/c4.wav" > "$tmp/list.txt"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$tmp/list.txt" "$tmp/prog.wav"
ffmpeg -y -loglevel error -stream_loop 3 -i "$tmp/prog.wav" -f lavfi -i "sine=55:d=48" \
  -filter_complex "[0]volume=0.9[pad];[1]tremolo=f=1.6:d=0.6,volume=0.35[sub];[pad][sub]amix=inputs=2:duration=first,aecho=0.8:0.85:600:0.3,lowpass=f=2600,highpass=f=40,volume=2.2,afade=t=in:st=0:d=2,afade=t=out:st=44:d=4" \
  "$tmp/music.mp3"
ffmpeg -y -loglevel error -i "$tmp/music.mp3" -af "volume=6dB" public/audio/music-bed.mp3
rm -rf "$tmp"
fi

# SFX
ffmpeg -y -loglevel error -f lavfi -i "sine=58:d=0.6" -af "afade=t=out:st=0.06:d=0.54,volume=1.4,lowpass=f=200" public/audio/sfx/thump.mp3
ffmpeg -y -loglevel error -f lavfi -i "anoisesrc=d=0.7:c=pink" -af "highpass=f=300,lowpass=f=6000,afade=t=in:st=0:d=0.3,afade=t=out:st=0.35:d=0.35,volume=0.5" public/audio/sfx/whoosh.mp3
ffmpeg -y -loglevel error -f lavfi -i "sine=880:d=0.5" -f lavfi -i "sine=1320:d=0.5" -filter_complex "[0][1]amix=inputs=2,afade=t=out:st=0.08:d=0.42,volume=0.5" public/audio/sfx/chime.mp3
ffmpeg -y -loglevel error -f lavfi -i "sine=42:d=0.5" -af "afade=t=out:st=0.04:d=0.46,volume=1.6,lowpass=f=160" public/audio/sfx/lock.mp3

echo "Audio generated. Render with sound: npx remotion render EvalFilm out/ai-eval-film.mp4"
