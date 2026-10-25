export const residentIds = ["otter", "turtle", "crane"];
export function createPatrol(points, speed = 0.85) {
  return {
    points: points.map((p) => [...p]),
    x: points[0][0],
    z: points[0][1],
    next: 1 % safeLength(points),
    speed,
    moving: false,
    rotation: 0,
  };
}
function safeLength(points) {
  if (points.length < 2)
    throw new Error("산책 경로는 두 지점 이상이어야 해요.");
  return points.length;
}
export function stepPatrol(
  p,
  dt,
  { paused = false, player = null, blocked = () => false } = {},
) {
  p.moving = false;
  if (paused || (player && Math.hypot(p.x - player.x, p.z - player.z) < 2.6)) {
    if (player) p.rotation = Math.atan2(player.x - p.x, player.z - p.z);
    return p;
  }
  const [tx, tz] = p.points[p.next],
    dx = tx - p.x,
    dz = tz - p.z,
    d = Math.hypot(dx, dz);
  if (d < 0.04) {
    p.next = (p.next + 1) % p.points.length;
    return p;
  }
  const step = Math.min(d, Math.max(0, Math.min(dt, 0.25)) * p.speed),
    nx = p.x + (dx / d) * step,
    nz = p.z + (dz / d) * step;
  if (blocked(nx, nz)) return p;
  p.x = nx;
  p.z = nz;
  p.rotation = Math.atan2(dx, dz);
  p.moving = step > 0;
  return p;
}
