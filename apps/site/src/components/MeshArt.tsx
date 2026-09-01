/** Decorative, abstract illustration of peers connected in a mesh — original
 *  artwork, not a literal network map. */
export function MeshArt() {
  const nodes = [
    { x: 60, y: 200, r: 7 },
    { x: 170, y: 90, r: 9 },
    { x: 260, y: 175, r: 6 },
    { x: 330, y: 60, r: 8 },
    { x: 380, y: 190, r: 10 },
    { x: 300, y: 260, r: 6 },
  ];
  const edges: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [2, 5],
    [4, 5],
    [1, 3],
  ];

  return (
    <svg viewBox="0 0 420 300" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="meshGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#ea6a3c" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ea6a3c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="420" height="300" fill="url(#meshGlow)" />
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke="#ea6a3c"
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />
      ))}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={n.r} fill="#0a0a0b" stroke="#ea6a3c" strokeWidth="2.5" />
      ))}
    </svg>
  );
}
