// EGA-16-Farbpalette, exakt wie Turbo Pascal BGI
const EGA = [
  '#000000', // 0  Black
  '#0000AA', // 1  Blue
  '#00AA00', // 2  Green
  '#00AAAA', // 3  Cyan
  '#AA0000', // 4  Red
  '#AA00AA', // 5  Magenta
  '#AA5500', // 6  Brown
  '#AAAAAA', // 7  LightGray
  '#555555', // 8  DarkGray
  '#5555FF', // 9  LightBlue
  '#55FF55', // 10 LightGreen
  '#55FFFF', // 11 LightCyan
  '#FF5555', // 12 LightRed
  '#FF55FF', // 13 LightMagenta
  '#FFFF55', // 14 Yellow
  '#FFFFFF', // 15 White
];

function ega(n) {
  return EGA[((n % 16) + 16) % 16];
}
