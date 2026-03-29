import { Component, onMount, createSignal, Show, For } from 'solid-js';
import { createMeesa, geo, noise, gradient, layer, type Source } from './meesa';

type Demo = {
  name: string;
  render: (m: ReturnType<typeof createMeesa>) => void;
};

const demos: Demo[] = [
  {
    name: 'Pulsing Circle',
    render: (m) => {
      m.play((t) => {
        m.render(
          geo.circle(Math.sin(t) * 0.2 + 0.3)
            .move(Math.sin(t) * 0.5, 0)
            .out()
        );
      });
    },
  },
  {
    name: 'Animated Noise',
    render: (m) => {
      m.play((t) => {
        m.render(
          noise()
            .scale(2 + Math.sin(t) * 0.5)
            .rotate(t * 0.2)
            .brightness(0.8 + Math.sin(t * 2) * 0.2)
            .out()
        );
      });
    },
  },
  {
    name: 'Gradient',
    render: (m) => {
      m.render(gradient().out());
    },
  },
  {
    name: 'Geometric Layers',
    render: (m) => {
      m.play((t) => {
        m.render(
          layer(
            geo.rect(0.8, 0.8).rotate(t * 0.1).out(),
            geo.circle(0.4).move(Math.sin(t) * 0.3, 0).out(),
            noise().pixelate(4).out()
          )
        );
      });
    },
  },
  {
    name: 'Rotated Rect',
    render: (m) => {
      m.play((t) => {
        m.render(
          geo.rect(0.3, 0.3)
            .rotate(t)
            .move(0.5, 0.5)
            .out()
        );
      });
    },
  },
  {
    name: 'Scaled Shapes',
    render: (m) => {
      m.play((t) => {
        m.render(
          geo.circle(0.2)
            .scale(1 + Math.sin(t) * 0.5, 1 + Math.cos(t) * 0.5)
            .out()
        );
      });
    },
  },
  {
    name: 'Repeated Pattern',
    render: (m) => {
      m.render(
        geo.circle(0.15)
          .repeat(4, 3)
          .out()
      );
    },
  },
  {
    name: 'Scrolling UV',
    render: (m) => {
      m.play((t) => {
        m.render(
          noise()
            .scroll(t * 0.1, t * 0.05)
            .out()
        );
      });
    },
  },
  {
    name: 'Color Adjustments',
    render: (m) => {
      m.play((t) => {
        m.render(
          noise()
            .hue(t * 30)
            .saturate(1.5)
            .contrast(1.2)
            .out()
        );
      });
    },
  },
  {
    name: 'Threshold & Pixelate',
    render: (m) => {
      m.play((t) => {
        m.render(
          noise()
            .thres(Math.sin(t) * 0.3 + 0.5)
            .pixelate(8 + Math.sin(t) * 4)
            .out()
        );
      });
    },
  },
  {
    name: 'Brightness Pulse',
    render: (m) => {
      m.play((t) => {
        m.render(
          geo.rect(0.5, 0.5)
            .move(0.5, 0.5)
            .brightness(Math.sin(t * 2) * 0.5)
            .out()
        );
      });
    },
  },
  {
    name: 'Invert Effect',
    render: (m) => {
      m.play((t) => {
        m.render(
          noise()
            .invert(Math.sin(t) > 0)
            .out()
        );
      });
    },
  },
];

const defaultCode = `// Available: geo, noise, gradient, layer, m
// Examples:
//  m.render(geo.circle(0.3).out());
//  m.render(gradient().out());
//  m.play((t) => {
//    m.render(noise().rotate(t).out());
//  });

m.render(geo.circle(0.3).out());`;

const App: Component = () => {
  let canvasRef: HTMLCanvasElement | undefined;
  let meesa: ReturnType<typeof createMeesa> | undefined;
  const [currentDemo, setCurrentDemo] = createSignal(0);
  const [isEditor, setIsEditor] = createSignal(false);
  const [code, setCode] = createSignal(defaultCode);
  const [error, setError] = createSignal('');

  onMount(() => {
    if (canvasRef) {
      meesa = createMeesa(canvasRef);
      demos[currentDemo()].render(meesa);
    }
  });

  function selectDemo(index: number) {
    setIsEditor(false);
    setCurrentDemo(index);
    setError('');
    if (meesa) {
      demos[index].render(meesa);
    }
  }

  function openEditor() {
    setIsEditor(true);
    setError('');
  }

  function runCode() {
    if (!meesa) return;
    setError('');
    try {
      const fn = new Function('m', 'geo', 'noise', 'gradient', 'layer', code());
      fn(meesa, geo, noise, gradient, layer);
    } catch (e: any) {
      setError(e.message || 'Code error');
    }
  }

  return (
    <div class="min-h-screen bg-neutral-900 text-white flex flex-col">
      <header class="p-4 border-b border-neutral-700">
        <h1 class="text-2xl font-bold text-center">Meesa — Simple Video Synthesizer</h1>
        <p class="text-neutral-400 text-center text-sm mt-1">WebGL-powered generative visuals</p>
      </header>

      <div class="flex flex-1 overflow-hidden">
        <aside class="w-64 bg-neutral-800 p-4 overflow-y-auto border-r border-neutral-700 flex flex-col">
          <button
            class={`w-full text-left px-3 py-2 rounded text-sm transition-colors mb-2 ${
              isEditor()
                ? 'bg-emerald-600 text-white'
                : 'text-neutral-300 hover:bg-neutral-700'
            }`}
            onClick={openEditor}
          >
            ✏️ Editor
          </button>

          <h2 class="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">Demos</h2>
          <nav class="space-y-1 flex-1">
            <For each={demos}>
              {(demo, index) => (
                <button
                  class={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    !isEditor() && currentDemo() === index()
                      ? 'bg-emerald-600 text-white'
                      : 'text-neutral-300 hover:bg-neutral-700'
                  }`}
                  onClick={() => selectDemo(index())}
                >
                  {index() + 1}. {demo.name}
                </button>
              )}
            </For>
          </nav>
        </aside>

        <main class="flex-1 flex flex-col items-center justify-center p-8 bg-neutral-900">
          <Show when={isEditor()}>
            <div class="w-full max-w-4xl flex flex-col gap-4">
              <div class="flex gap-2">
                <button
                  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-sm font-medium transition-colors"
                  onClick={runCode}
                >
                  ▶ Run
                </button>
              </div>
              <textarea
                class="w-full h-64 p-4 bg-neutral-800 border border-neutral-600 rounded font-mono text-sm text-green-400 resize-none focus:outline-none focus:border-emerald-500"
                value={code()}
                onInput={(e) => setCode(e.currentTarget.value)}
                spellcheck={false}
              />
              <Show when={error()}>
                <div class="text-red-400 text-sm bg-red-900/30 border border-red-800 rounded p-2">
                  {error()}
                </div>
              </Show>
            </div>
          </Show>

          <Show when={!isEditor()}>
            <div class="w-full max-w-3xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-neutral-700">
              <canvas ref={canvasRef} class="w-full h-full" />
            </div>
            <div class="mt-6 text-center">
              <span class="text-emerald-400 font-medium">{demos[currentDemo()].name}</span>
              <p class="text-neutral-500 text-sm mt-1">
                Demo {currentDemo() + 1} of {demos.length}
              </p>
            </div>
          </Show>
        </main>
      </div>
    </div>
  );
};

export default App;