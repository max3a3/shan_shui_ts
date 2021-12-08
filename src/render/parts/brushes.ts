import { Noise } from '../basic/perlinNoise';
import { Point, Vector } from '../basic/point';
import PRNG from '../basic/PRNG';
import { loopNoise, poly } from '../basic/utils';
import { ISvgStyles, SvgPolyline } from '../svg';

const random = PRNG.random;

class StrokeArgs implements Partial<ISvgStyles> {
  xof: number = 0;
  yof: number = 0;
  strokeWidth: number = 2;
  fill: string = 'rgba(200,200,200,0.9)';
  stroke: string = 'rgba(200,200,200,0.9)';
  noi: number = 0.5;
  out: number = 1;
  fun: (x: number) => number = (x: number) => Math.sin(x * Math.PI);
}

export function stroke(
  ptlist: Point[],
  args: Partial<StrokeArgs> | undefined = undefined
): SvgPolyline {
  const _args = new StrokeArgs();
  Object.assign(_args, args);

  const { xof, yof, strokeWidth, fill, stroke, noi, out, fun } = _args;

  console.assert(ptlist.length > 0);

  const vtxlist0 = [];
  const vtxlist1 = [];
  let vtxlist = [];
  const n0 = random() * 10;
  for (let i = 1; i < ptlist.length - 1; i++) {
    let w = strokeWidth * fun(i / ptlist.length);
    w = w * (1 - noi) + w * noi * Noise.noise(i * 0.5, n0);
    const a1 = Math.atan2(
      ptlist[i].y - ptlist[i - 1].y,
      ptlist[i].x - ptlist[i - 1].x
    );
    const a2 = Math.atan2(
      ptlist[i].y - ptlist[i + 1].y,
      ptlist[i].x - ptlist[i + 1].x
    );
    let a = (a1 + a2) / 2;
    if (a < a2) {
      a += Math.PI;
    }
    vtxlist0.push(
      new Point(ptlist[i].x + w * Math.cos(a), ptlist[i].y + w * Math.sin(a))
    );
    vtxlist1.push(
      new Point(ptlist[i].x - w * Math.cos(a), ptlist[i].y - w * Math.sin(a))
    );
  }

  vtxlist = [ptlist[0]]
    .concat(
      vtxlist0.concat(vtxlist1.concat([ptlist[ptlist.length - 1]]).reverse())
    )
    .concat([ptlist[0]]);

  return poly(vtxlist, { xof, yof, fill, stroke, strokeWidth: out });
}

class BlobArgs implements Partial<ISvgStyles> {
  len: number = 20;
  strokeWidth: number = 5;
  ang: number = 0;
  col: string = 'rgba(200,200,200,0.9)';
  noi: number = 0.5;
  fun: (x: number) => number = (x: number) =>
    x <= 1
      ? Math.pow(Math.sin(x * Math.PI), 0.5)
      : -Math.pow(Math.sin((x + 1) * Math.PI), 0.5);
}

export function blob(
  x: number,
  y: number,
  args: Partial<BlobArgs> | undefined = undefined
): SvgPolyline {
  const _args = new BlobArgs();
  Object.assign(_args, args);

  const { col } = _args;

  const plist = blob_points(x, y, args);
  return poly(plist, { fill: col, stroke: col, strokeWidth: 0 });
}

export function blob_points(
  x: number,
  y: number,
  args: Partial<BlobArgs> | undefined = undefined
): Point[] {
  const _args = new BlobArgs();
  Object.assign(_args, args);

  const { len, strokeWidth, ang, noi, fun } = _args;

  const reso = 20.0;
  const lalist = [];
  for (let i = 0; i < reso + 1; i++) {
    const p = (i / reso) * 2;
    const xo = len / 2 - Math.abs(p - 1) * len;
    const yo = (fun(p) * strokeWidth) / 2;
    const a = Math.atan2(yo, xo);
    const l = Math.sqrt(xo * xo + yo * yo);
    lalist.push([l, a]);
  }
  let nslist = [];
  const n0 = random() * 10;
  for (let i = 0; i < reso + 1; i++) {
    nslist.push(Noise.noise(i * 0.05, n0));
  }

  nslist = loopNoise(nslist);
  const plist = [];
  for (let i = 0; i < lalist.length; i++) {
    const ns = nslist[i] * noi + (1 - noi);
    const nx = x + Math.cos(lalist[i][1] + ang) * lalist[i][0] * ns;
    const ny = y + Math.sin(lalist[i][1] + ang) * lalist[i][0] * ns;
    plist.push(new Point(nx, ny));
  }

  return plist;
}

export function div(plist: Point[], reso: number): Point[] {
  const tl = (plist.length - 1) * reso;
  const rlist = [];

  for (let i = 0; i < tl; i += 1) {
    const lastp = plist[Math.floor(i / reso)];
    const nextp = plist[Math.ceil(i / reso)];
    const p = (i % reso) / reso;
    const nx = lastp.x * (1 - p) + nextp.x * p;
    const ny = lastp.y * (1 - p) + nextp.y * p;

    // const ang = Math.atan2(ny - ly, nx - lx);

    rlist.push(new Point(nx, ny));
  }

  if (plist.length > 0) {
    rlist.push(plist[plist.length - 1]);
  }
  return rlist;
}

class TextureArgs implements Partial<ISvgStyles> {
  xof: number = 0;
  yof: number = 0;
  tex: number = 400;
  strokeWidth: number = 1.5;
  len: number = 0.2;
  sha: number = 0;
  noi: (x: number) => number = (x) => 30 / x;
  col: (x: number) => string = (x) =>
    `rgba(100,100,100,${(random() * 0.3).toFixed(3)})`;
  dis: () => number = () =>
    random() > 0.5 ? (1 / 3) * random() : (1 * 2) / 3 + (1 / 3) * random();
}

export function texture(
  ptlist: Point[][],
  args: Partial<TextureArgs> | undefined = undefined
): SvgPolyline[] {
  const _args = new TextureArgs();
  Object.assign(_args, args);

  const { xof, yof, tex, strokeWidth, len, sha, noi, col, dis } = _args;

  const offset = new Vector(xof, yof);
  const reso = [ptlist.length, ptlist[0].length];
  const texlist: Point[][] = [];

  for (let i = 0; i < tex; i++) {
    const mid = (dis() * reso[1]) | 0;
    //mid = (reso[1]/3+reso[1]/3*random())|0

    const hlen = Math.floor(random() * (reso[1] * len));

    let start = mid - hlen;
    let end = mid + hlen;
    start = Math.min(Math.max(start, 0), reso[1]);
    end = Math.min(Math.max(end, 0), reso[1]);

    const layer = (i / tex) * (reso[0] - 1);

    texlist.push([]);
    for (let j = start; j < end; j++) {
      const p = layer - Math.floor(layer);

      const x =
        ptlist[Math.floor(layer)][j].x * p +
        ptlist[Math.ceil(layer)][j].x * (1 - p);

      const y =
        ptlist[Math.floor(layer)][j].y * p +
        ptlist[Math.ceil(layer)][j].y * (1 - p);

      const nx = noi(layer + 1) * (Noise.noise(x, j * 0.5) - 0.5);
      const ny = noi(layer + 1) * (Noise.noise(y, j * 0.5) - 0.5);

      texlist[texlist.length - 1].push(new Point(x + nx, y + ny));
    }
  }

  const polylines: SvgPolyline[] = [];

  //SHADE
  if (sha) {
    const step = 1 + (sha !== 0 ? 1 : 0);
    for (let j = 0; j < texlist.length; j += step) {
      if (texlist[j].length > 0) {
        polylines.push(
          stroke(
            texlist[j].map((p) => p.move(offset)),
            {
              fill: 'rgba(100,100,100,0.1)',
              stroke: 'rgba(100,100,100,0.1)',
              strokeWidth: sha,
            }
          )
        );
      }
    }
  }
  //TEXTURE
  for (let j = 0 + sha; j < texlist.length; j += 1 + sha) {
    if (texlist[j].length > 0) {
      polylines.push(
        stroke(
          texlist[j].map((p) => p.move(offset)),
          {
            fill: col(j / texlist.length),
            stroke: col(j / texlist.length),
            strokeWidth: strokeWidth,
          }
        )
      );
    }
  }

  return polylines;
}
