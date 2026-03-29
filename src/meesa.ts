export interface Source {
  type: string;
  props: Record<string, number | string | boolean>;
  chain: Array<{ op: string; args: any[] }>;
}

export interface MeesaInstance {
  render: (source: Source) => void;
  play: (callback: (t: number, f: number) => void) => void;
  width: number;
  height: number;
}

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 v_uv;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform int u_sourceType;
  uniform float u_radius;
  uniform vec2 u_position;
  uniform vec2 u_scale;
  uniform float u_rotation;
  uniform vec2 u_repeat;
  uniform vec2 u_scroll;
  uniform float u_brightness;
  uniform float u_contrast;
  uniform float u_saturate;
  uniform float u_hue;
  uniform int u_invert;
  uniform float u_threshold;
  uniform float u_pixelate;
  uniform int u_operator;
  uniform int u_layerCount;
  uniform sampler2D u_texture;
  uniform sampler2D u_layers[8];
  uniform vec2 u_layersPos[8];
  uniform vec2 u_layersScale[8];
  uniform float u_layersRot[8];
  uniform vec2 u_layersRepeat[8];
  uniform vec2 u_layersScroll[8];
  uniform float u_layersBrightness[8];
  uniform float u_layersContrast[8];
  uniform float u_layersSaturate[8];
  uniform float u_layersHue[8];
  uniform int u_layersInvert[8];
  uniform float u_layersThres[8];
  uniform float u_layersPixelate[8];
  uniform int u_layersType[8];
  uniform float u_layersRadius[8];
  uniform int u_layerType;

  vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  vec2 rotateUV(vec2 uv, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  vec4 sampleSource(vec2 uv, int st, float r, vec2 pos, vec2 scl, float rot, vec2 rep, vec2 scr, float br, float con, float sat, float h, int inv, float th, float px) {
    uv = rotateUV((uv - 0.5) / scl + pos + u_time * scr, rot);
    uv = fract(uv * rep);

    vec3 col = vec3(0.0);
    float alpha = 0.0;

    if (st == 1) {
      float d = length(uv - 0.5);
      alpha = 1.0 - smoothstep(r - 0.01, r + 0.01, d);
      col = vec3(alpha);
    } else if (st == 2) {
      vec2 size = vec2(0.5) * scl;
      vec2 p = abs(uv - 0.5);
      alpha = step(p.x, size.x) * step(p.y, size.y);
      col = vec3(alpha);
    } else if (st == 3) {
      float thickness = 0.02;
      float d = distance(uv, vec2(0.0));
      alpha = step(d, r) * step(r - thickness, d);
      col = vec3(alpha);
    } else if (st == 4) {
      alpha = 1.0;
      col = vec3(fbm(uv * 4.0 + u_time * 0.5));
    } else if (st == 5) {
      alpha = 1.0;
      col = vec3(uv.x, uv.x, uv.x);
    } else if (st == 6) {
      alpha = 1.0;
      col = texture2D(u_texture, uv).rgb;
    }

    // Create color from hue if saturation is high
    if (sat > 1.0) {
      col = hsv2rgb(vec3(h / 360.0, 1.0, col.r));
    }
    
    vec3 hsv = rgb2hsv(col);
    hsv.x = fract(hsv.x + h / 360.0);
    hsv.y *= sat;
    col = hsv2rgb(hsv);
    col = (col - 0.5) * con + 0.5 + br;
    if (inv == 1) col = 1.0 - col;
    if (th > 0.0) {
      col = step(th, col);
      alpha = step(th, alpha);
    }
    if (px > 1.0) {
      uv = floor(uv * px) / px;
    }

    return vec4(col, alpha);
  }

  void main() {
    vec2 uv = v_uv;
    vec3 col = vec3(0.0);

    if (u_layerType == 1) {
      for (int i = 0; i < 8; i++) {
        if (i >= u_layerCount) break;
        vec4 layer = sampleSource(
          uv, u_layersType[i], u_layersRadius[i], u_layersPos[i], u_layersScale[i], u_layersRot[i],
          u_layersRepeat[i], u_layersScroll[i], u_layersBrightness[i], u_layersContrast[i],
          u_layersSaturate[i], u_layersHue[i], u_layersInvert[i], u_layersThres[i], u_layersPixelate[i]
        );
        col = mix(col, layer.rgb, layer.a);
      }
    } else {
      col = sampleSource(uv, u_sourceType, u_radius, u_position, u_scale, u_rotation,
        u_repeat, u_scroll, u_brightness, u_contrast, u_saturate, u_hue, u_invert, u_threshold, u_pixelate).rgb;
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || 'Shader compile error');
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const program = gl.createProgram()!;
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'Program link error');
  }
  return program;
}

interface LayerData {
  type: number;
  radius: number;
  pos: [number, number];
  scale: [number, number];
  rot: number;
  repeat: [number, number];
  scroll: [number, number];
  brightness: number;
  contrast: number;
  saturate: number;
  hue: number;
  invert: number;
  thres: number;
  pixelate: number;
}

export function createMeesa(canvas: HTMLCanvasElement): MeesaInstance {
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true })!;
  const program = createProgram(gl);
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const posAttr = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posAttr);
  gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(program, 'u_time');
  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uSourceType = gl.getUniformLocation(program, 'u_sourceType');
  const uRadius = gl.getUniformLocation(program, 'u_radius');
  const uPosition = gl.getUniformLocation(program, 'u_position');
  const uScale = gl.getUniformLocation(program, 'u_scale');
  const uRotation = gl.getUniformLocation(program, 'u_rotation');
  const uRepeat = gl.getUniformLocation(program, 'u_repeat');
  const uScroll = gl.getUniformLocation(program, 'u_scroll');
  const uBrightness = gl.getUniformLocation(program, 'u_brightness');
  const uContrast = gl.getUniformLocation(program, 'u_contrast');
  const uSaturate = gl.getUniformLocation(program, 'u_saturate');
  const uHue = gl.getUniformLocation(program, 'u_hue');
  const uInvert = gl.getUniformLocation(program, 'u_invert');
  const uThreshold = gl.getUniformLocation(program, 'u_threshold');
  const uPixelate = gl.getUniformLocation(program, 'u_pixelate');
  const uLayerCount = gl.getUniformLocation(program, 'u_layerCount');
  const uLayerType = gl.getUniformLocation(program, 'u_layerType');
  const uTexture = gl.getUniformLocation(program, 'u_texture');

  const layerLocs = {
    type: gl.getUniformLocation(program, 'u_layersType'),
    radius: gl.getUniformLocation(program, 'u_layersRadius'),
    pos: gl.getUniformLocation(program, 'u_layersPos'),
    scale: gl.getUniformLocation(program, 'u_layersScale'),
    rot: gl.getUniformLocation(program, 'u_layersRot'),
    repeat: gl.getUniformLocation(program, 'u_layersRepeat'),
    scroll: gl.getUniformLocation(program, 'u_layersScroll'),
    brightness: gl.getUniformLocation(program, 'u_layersBrightness'),
    contrast: gl.getUniformLocation(program, 'u_layersContrast'),
    saturate: gl.getUniformLocation(program, 'u_layersSaturate'),
    hue: gl.getUniformLocation(program, 'u_layersHue'),
    invert: gl.getUniformLocation(program, 'u_layersInvert'),
    thres: gl.getUniformLocation(program, 'u_layersThres'),
    pixelate: gl.getUniformLocation(program, 'u_layersPixelate'),
  };

  let startTime = performance.now();
  let frameCount = 0;
  let currentSource: any = null;
  let animationCallback: ((t: number, f: number) => void) | null = null;
  let animationId: number | null = null;
  let texture: WebGLTexture | null = null;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  resize();
  window.addEventListener('resize', resize);

  function applyChain(source: Source): LayerData {
    let type = source.type === 'circle' ? 1 : source.type === 'rect' ? 2 : source.type === 'line' ? 3 : source.type === 'noise' ? 4 : source.type === 'gradient' ? 5 : 6;
    let radius = (source.props.radius as number) ?? 0.5;
    let position: [number, number] = [(source.props.x as number) ?? 0.5, (source.props.y as number) ?? 0.5];
    let scale: [number, number] = [source.type === 'rect' ? (source.props.width as number) ?? 1 : 1, source.type === 'rect' ? (source.props.height as number) ?? 1 : 1];
    let rotation = 0;
    let repeat: [number, number] = [1, 1];
    let scroll: [number, number] = [0, 0];
    let brightness = 0;
    let contrast = 1;
    let saturate = 1;
    let hue = 0;
    let invert = 0;
    let threshold = 0;
    let pixelate = 1;

    for (const step of source.chain) {
      switch (step.op) {
        case 'move': [position[0], position[1]] = step.args; break;
        case 'scale':
          if (step.args.length === 1) scale = [step.args[0], step.args[0]];
          else scale = [step.args[0], step.args[1]];
          break;
        case 'rotate': rotation = step.args[0]; break;
        case 'repeat':
          if (step.args.length === 1) repeat = [step.args[0], step.args[0]];
          else repeat = [step.args[0], step.args[1]];
          break;
        case 'scroll': [scroll[0], scroll[1]] = step.args; break;
        case 'brightness': brightness = step.args[0]; break;
        case 'contrast': contrast = step.args[0]; break;
        case 'saturate': saturate = step.args[0]; break;
        case 'hue': hue = step.args[0]; break;
        case 'invert': invert = step.args[0] ? 1 : 0; break;
        case 'thres': threshold = step.args[0]; break;
        case 'pixelate': pixelate = step.args[0]; break;
      }
    }

    return { type, radius, pos: position, scale, rot: rotation, repeat, scroll, brightness, contrast, saturate, hue, invert, thres: threshold, pixelate };
  }

  function render(source: Source) {
    currentSource = source;
    draw();
  }

  function play(callback: (t: number, f: number) => void) {
    animationCallback = callback;
    if (animationId !== null) cancelAnimationFrame(animationId);

    function loop() {
      const t = (performance.now() - startTime) / 1000;
      frameCount++;
      animationCallback?.(t, frameCount);
      draw();
      animationId = requestAnimationFrame(loop);
    }
    animationId = requestAnimationFrame(loop);
  }

  function draw() {
    if (!currentSource) return;

    const t = (performance.now() - startTime) / 1000;
    gl.uniform1f(uTime, t);
    gl.uniform2f(uResolution, canvas.width, canvas.height);

    if (currentSource.layer) {
      const layers = currentSource.layers.map((s: Source) => applyChain(s));
      gl.uniform1i(uLayerType, 1);
      gl.uniform1i(uLayerCount, layers.length);

      const types = new Int32Array(8);
      const radii = new Float32Array(8);
      const positions = new Float32Array(16);
      const scales = new Float32Array(16);
      const rots = new Float32Array(8);
      const repeats = new Float32Array(16);
      const scrolls = new Float32Array(16);
      const brightness = new Float32Array(8);
      const contrasts = new Float32Array(8);
      const saturates = new Float32Array(8);
      const hues = new Float32Array(8);
      const inverts = new Int32Array(8);
      const thresholds = new Float32Array(8);
      const pixelates = new Float32Array(8);

      layers.forEach((l: LayerData, i: number) => {
        types[i] = l.type;
        radii[i] = l.radius;
        positions[i * 2] = l.pos[0];
        positions[i * 2 + 1] = l.pos[1];
        scales[i * 2] = l.scale[0];
        scales[i * 2 + 1] = l.scale[1];
        rots[i] = l.rot;
        repeats[i * 2] = l.repeat[0];
        repeats[i * 2 + 1] = l.repeat[1];
        scrolls[i * 2] = l.scroll[0];
        scrolls[i * 2 + 1] = l.scroll[1];
        brightness[i] = l.brightness;
        contrasts[i] = l.contrast;
        saturates[i] = l.saturate;
        hues[i] = l.hue;
        inverts[i] = l.invert;
        thresholds[i] = l.thres;
        pixelates[i] = l.pixelate;
      });

      gl.uniform1iv(layerLocs.type!, types);
      gl.uniform1fv(layerLocs.radius!, radii);
      gl.uniform2fv(layerLocs.pos!, positions);
      gl.uniform2fv(layerLocs.scale!, scales);
      gl.uniform1fv(layerLocs.rot!, rots);
      gl.uniform2fv(layerLocs.repeat!, repeats);
      gl.uniform2fv(layerLocs.scroll!, scrolls);
      gl.uniform1fv(layerLocs.brightness!, brightness);
      gl.uniform1fv(layerLocs.contrast!, contrasts);
      gl.uniform1fv(layerLocs.saturate!, saturates);
      gl.uniform1fv(layerLocs.hue!, hues);
      gl.uniform1iv(layerLocs.invert!, inverts);
      gl.uniform1fv(layerLocs.thres!, thresholds);
      gl.uniform1fv(layerLocs.pixelate!, pixelates);
    } else {
      const layerData = applyChain(currentSource);
      gl.uniform1i(uLayerType, 0);
      gl.uniform1i(uSourceType, layerData.type);
      gl.uniform1f(uRadius, currentSource.props.radius ?? 0.5);
      gl.uniform2f(uPosition, layerData.pos[0], layerData.pos[1]);
      gl.uniform2f(uScale, layerData.scale[0], layerData.scale[1]);
      gl.uniform1f(uRotation, layerData.rot);
      gl.uniform2f(uRepeat, layerData.repeat[0], layerData.repeat[1]);
      gl.uniform2f(uScroll, layerData.scroll[0], layerData.scroll[1]);
      gl.uniform1f(uBrightness, layerData.brightness);
      gl.uniform1f(uContrast, layerData.contrast);
      gl.uniform1f(uSaturate, layerData.saturate);
      gl.uniform1f(uHue, layerData.hue);
      gl.uniform1i(uInvert, layerData.invert);
      gl.uniform1f(uThreshold, layerData.thres);
      gl.uniform1f(uPixelate, layerData.pixelate);
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  return { render, play, width: canvas.width, height: canvas.height };
}

function createSource(type: string, props: Record<string, any> = {}): Source {
  const source: Source = { type, props, chain: [] };

  const chain = {
    move(x: number, y: number) { source.chain.push({ op: 'move', args: [x, y] }); return chain; },
    scale(x: number, y?: number) { source.chain.push({ op: 'scale', args: y !== undefined ? [x, y] : [x] }); return chain; },
    rotate(r: number) { source.chain.push({ op: 'rotate', args: [r] }); return chain; },
    repeat(x: number, y?: number) { source.chain.push({ op: 'repeat', args: y !== undefined ? [x, y] : [x] }); return chain; },
    scroll(x: number, y: number) { source.chain.push({ op: 'scroll', args: [x, y] }); return chain; },
    brightness(v: number) { source.chain.push({ op: 'brightness', args: [v] }); return chain; },
    contrast(v: number) { source.chain.push({ op: 'contrast', args: [v] }); return chain; },
    saturate(v: number) { source.chain.push({ op: 'saturate', args: [v] }); return chain; },
    hue(v: number) { source.chain.push({ op: 'hue', args: [v] }); return chain; },
    invert(v = true) { source.chain.push({ op: 'invert', args: [v ? 1 : 0] }); return chain; },
    thres(v: number) { source.chain.push({ op: 'thres', args: [v] }); return chain; },
    pixelate(v: number) { source.chain.push({ op: 'pixelate', args: [v] }); return chain; },
    out() { return source; },
  };

  return chain as unknown as Source;
}

export const geo = {
  circle(radius = 0.5, x?: number, y?: number) {
    return createSource('circle', { radius, x, y });
  },
  rect(width = 0.5, height = 0.5, x?: number, y?: number) {
    return createSource('rect', { width, height, x, y });
  },
  line(x1 = 0, y1 = 0, x2 = 1, y2 = 1) {
    return createSource('line', { x1, y1, x2, y2 });
  },
};

export function noise() {
  return createSource('noise');
}

export function gradient() {
  return createSource('gradient');
}

export function image(img: HTMLImageElement | string) {
  return createSource('image', { image: img });
}

export function video(url: string) {
  return createSource('video', { video: url });
}

export function layer(...sources: Source[]) {
  return { layer: true, layers: sources };
}