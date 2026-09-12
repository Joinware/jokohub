#!/usr/bin/env bash
# Minimal faceless-short cutter used when ClipForge/Clutch Replays is unavailable.
# Usage: ofm-clipforge-lite.sh <source.mp4> <out.mp4>
# Expects a full-desktop capture with OpenFoot Manager window at ~2,85 1280x800 on 1920x1200.
set -euo pipefail
SRC=${1:?source mp4}
OUT=${2:?output mp4}
WORKDIR=$(mktemp -d)
FONT_B=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf

make_seg() {
  local start=$1 dur=$2 name=$3 caption=$4
  ffmpeg -y -ss "$start" -t "$dur" -i "$SRC" \
    -vf "crop=1280:800:2:85,scale=1080:675:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:#0B1220,drawbox=x=0:y=210:w=1080:h=6:color=#22C55E:t=fill,drawtext=fontfile=${FONT_B}:text='${caption}':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=120:box=1:boxcolor=#0B1220@0.7:boxborderw=18,drawtext=fontfile=${FONT}:text='OPENFOOT MANAGER  ·  FACELESS SHORT':fontcolor=#A3E635:fontsize=26:x=(w-text_w)/2:y=1720" \
    -an -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p \
    "$WORKDIR/${name}.mp4"
}

make_seg 88 6 seg01 "Senegalese manager. Custom world."
make_seg 175 7 seg02 "380 clubs. No licensed database."
make_seg 295 6 seg03 "Club Buenos Aires. Title run starts."
make_seg 535 8 seg04 "Friendly kickoff. 4-4-2 Counter."
make_seg 650 10 seg05 "Full time. 2-2. Pereyra brace."
make_seg 665 6 seg06 "Episode 1. Can we win the league?"

{
  echo "file '$WORKDIR/seg01.mp4'"
  echo "file '$WORKDIR/seg02.mp4'"
  echo "file '$WORKDIR/seg03.mp4'"
  echo "file '$WORKDIR/seg04.mp4'"
  echo "file '$WORKDIR/seg05.mp4'"
  echo "file '$WORKDIR/seg06.mp4'"
} > "$WORKDIR/concat.txt"

ffmpeg -y -f concat -safe 0 -i "$WORKDIR/concat.txt" -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -movflags +faststart "$OUT"
rm -rf "$WORKDIR"
echo "Wrote $OUT"
