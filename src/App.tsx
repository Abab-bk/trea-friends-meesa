import { Component, onMount, createSignal, Show, For } from 'solid-js';
import { createMeesa, geo, noise, gradient, layer, type Source } from './meesa';

type Demo = {
  name: string;
  render: (m: ReturnType<typeof createMeesa>) => void;
};

const demos: Demo[] = [
  {
    name: 'Pulsing Rainbow Circle',
    render: (m) => {
      m.play((t) => {
        m.render(
          geo.circle(Math.sin(t) * 0.2 + 0.3)
            .move(Math.sin(t) * 0.5, Math.cos(t) * 0.3)
            .hue(t * 60)
            .saturate(2)
            .brightness(0.3 + Math.sin(t * 2) * 0.2)
            .out()
        );
      });
    },
  },
  {
    name: 'Trippy Noise',
    render: (m) => {
      m.play((t) => {
        m.render(
          noise()
            .scale(2 + Math.sin(t) * 0.5)
            .rotate(t * 0.2)
            .hue(t * 45)
            .saturate(1.8)
            .brightness(0.8 + Math.sin(t * 2) * 0.2)
            .out()
        );
      });
    },
  },
  {
    name: 'Colorful Gradient',
    render: (m) => {
      m.play((t) => {
        m.render(
          gradient()
            .hue(t * 30)
            .saturate(1.5)
            .out()
        );
      });
    },
  },
  {
    name: 'Psychedelic Layers',
    render: (m) => {
      m.play((t) => {
        m.render(
          layer(
            geo.rect(0.8, 0.8).rotate(t * 0.1).hue(t * 20).saturate(1.5).out(),
            geo.circle(0.4).move(Math.sin(t) * 0.3, Math.cos(t) * 0.3).hue(t * 30 + 180).saturate(2).out(),
            noise().pixelate(4).hue(t * 60).saturate(1.2).out()
          )
        );
      });
    },
  },
  {
    name: 'Rotating Color Rect',
    render: (m) => {
      m.play((t) => {
        m.render(
          geo.rect(0.3, 0.3)
            .rotate(t)
            .move(0.5, 0.5)
            .hue(t * 90)
            .saturate(2)
            .brightness(0.3)
            .out()
        );
      });
    },
  },
  {
    name: 'Scaled Rainbow Shapes',
    render: (m) => {
      m.play((t) => {
        m.render(
          geo.circle(0.2)
            .scale(1 + Math.sin(t) * 0.5, 1 + Math.cos(t) * 0.5)
            .hue(t * 60)
            .saturate(2)
            .out()
        );
      });
    },
  },
  {
    name: 'Colorful Grid Pattern',
    render: (m) => {
      m.play((t) => {
        m.render(
          geo.circle(0.15)
            .repeat(4, 3)
            .hue(t * 30)
            .saturate(1.8)
            .out()
        );
      });
    },
  },
  {
    name: 'Rainbow Scrolling Noise',
    render: (m) => {
      m.play((t) => {
        m.render(
          noise()
            .scroll(t * 0.1, t * 0.05)
            .hue(t * 45)
            .saturate(1.5)
            .out()
        );
      });
    },
  },
  {
    name: 'Intense Color Wave',
    render: (m) => {
      m.play((t) => {
        m.render(
          noise()
            .hue(t * 60)
            .saturate(2)
            .contrast(1.5)
            .brightness(0.2 + Math.sin(t * 2) * 0.1)
            .out()
        );
      });
    },
  },
  {
    name: 'Trippy Pixelation',
    render: (m) => {
      m.play((t) => {
        m.render(
          noise()
            .thres(Math.sin(t) * 0.3 + 0.5)
            .pixelate(8 + Math.sin(t) * 4)
            .hue(t * 30)
            .saturate(1.8)
            .out()
        );
      });
    },
  },
  {
    name: 'Colorful Pulse',
    render: (m) => {
      m.play((t) => {
        m.render(
          geo.rect(0.5, 0.5)
            .move(0.5, 0.5)
            .brightness(Math.sin(t * 2) * 0.5)
            .hue(t * 60)
            .saturate(2)
            .out()
        );
      });
    },
  },
  {
    name: 'Psychedelic Inversion',
    render: (m) => {
      m.play((t) => {
        m.render(
          noise()
            .invert(Math.sin(t) > 0)
            .hue(t * 45)
            .saturate(1.5)
            .out()
        );
      });
    },
  },
  {
    name: 'Rainbow Kaleidoscope',
    render: (m) => {
      m.play((t) => {
        m.render(
          layer(
            geo.circle(0.15).move(0.3, 0.3).hue(t * 60).saturate(2).out(),
            geo.circle(0.15).move(0.7, 0.3).hue(t * 60 + 60).saturate(2).out(),
            geo.circle(0.15).move(0.3, 0.7).hue(t * 60 + 120).saturate(2).out(),
            geo.circle(0.15).move(0.7, 0.7).hue(t * 60 + 180).saturate(2).out(),
            geo.circle(0.2).move(0.5, 0.5).hue(t * 60 + 240).saturate(2).out()
          )
        );
      });
    },
  },
  {
    name: 'Colorful Fractal Noise',
    render: (m) => {
      m.play((t) => {
        m.render(
          noise()
            .scale(3 + Math.sin(t) * 0.5)
            .scroll(t * 0.05, t * 0.03)
            .hue(t * 30)
            .saturate(1.8)
            .contrast(1.3)
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

// Psychedelic animated pattern
m.play((t) => {
  m.render(
    layer(
      noise()
        .scale(2 + Math.sin(t * 0.5) * 0.3)
        .hue(t * 45)
        .saturate(1.5)
        .brightness(0.3)
        .out(),
      geo.circle(0.2)
        .move(0.5 + Math.sin(t * 0.3) * 0.2, 0.5 + Math.cos(t * 0.3) * 0.2)
        .scale(1 + Math.sin(t) * 0.3)
        .rotate(t * 0.1)
        .hue(t * 60)
        .saturate(2)
        .out(),
      geo.rect(0.15, 0.15)
        .move(0.3 + Math.sin(t * 0.4) * 0.1, 0.3 + Math.cos(t * 0.4) * 0.1)
        .rotate(t * 0.2)
        .hue(t * 60 + 60)
        .saturate(2)
        .out(),
      geo.rect(0.15, 0.15)
        .move(0.7 + Math.sin(t * 0.5) * 0.1, 0.7 + Math.cos(t * 0.5) * 0.1)
        .rotate(t * -0.2)
        .hue(t * 60 + 120)
        .saturate(2)
        .out(),
      geo.circle(0.05)
        .move(0.5, 0.5)
        .hue(t * 60 + 180)
        .saturate(2)
        .brightness(0.5)
        .out()
    )
  );
});`;


const App: Component = () => {
  let canvasRef: HTMLCanvasElement | undefined;
  let meesa: ReturnType<typeof createMeesa> | undefined;
  const [currentDemo, setCurrentDemo] = createSignal(0);
  const [isEditor, setIsEditor] = createSignal(false);
  const [code, setCode] = createSignal(defaultCode);
  const [error, setError] = createSignal('');

  onMount(() => {
    // Wait for next tick to ensure canvasRef is available
    setTimeout(() => {
      if (canvasRef) {
        meesa = createMeesa(canvasRef);
        demos[currentDemo()].render(meesa);
      }
    }, 100);
  });

  function selectDemo(index: number) {
    setIsEditor(false);
    setCurrentDemo(index);
    setError('');
    // Re-initialize meesa with the new canvas element
    setTimeout(() => {
      if (canvasRef) {
        meesa = createMeesa(canvasRef);
        demos[index].render(meesa);
      }
    }, 100);
  }

  function openEditor() {
    setIsEditor(true);
    setError('');
    // Re-initialize meesa with the new canvas element
    setTimeout(() => {
      if (canvasRef) {
        meesa = createMeesa(canvasRef);
        runCode();
      }
    }, 100);
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

        <main class="flex-1 flex flex-col p-8 bg-neutral-900">
          <Show when={isEditor()}>
            <div class="w-full max-w-6xl flex flex-col gap-4">
              <div class="flex gap-2">
                <button
                  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-sm font-medium transition-colors"
                  onClick={runCode}
                >
                  ▶ Run
                </button>
              </div>
              <div class="flex flex-col md:flex-row gap-4 flex-1">
                <div class="w-full md:w-1/2">
                  <textarea
                    class="w-full h-full min-h-[300px] p-4 bg-neutral-800 border border-neutral-600 rounded font-mono text-sm text-green-400 resize-none focus:outline-none focus:border-emerald-500"
                    value={code()}
                    onInput={(e) => setCode(e.currentTarget.value)}
                    spellcheck={false}
                  />
                  <Show when={error()}>
                    <div class="mt-2 text-red-400 text-sm bg-red-900/30 border border-red-800 rounded p-2">
                      {error()}
                    </div>
                  </Show>
                </div>
                <div class="w-full md:w-1/2">
                  <div class="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-neutral-700">
                    <canvas ref={canvasRef} class="w-full h-full" />
                  </div>
                  <div class="mt-4 text-center">
                    <span class="text-emerald-400 font-medium">Editor Preview</span>
                  </div>
                </div>
              </div>
            </div>
          </Show>

          <Show when={!isEditor()}>
            <div class="flex-1 flex flex-col items-center justify-center">
              <div class="w-full max-w-3xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-neutral-700">
                <canvas ref={canvasRef} class="w-full h-full" />
              </div>
              <div class="mt-6 text-center">
                <span class="text-emerald-400 font-medium">{demos[currentDemo()].name}</span>
                <p class="text-neutral-500 text-sm mt-1">
                  Demo {currentDemo() + 1} of {demos.length}
                </p>
              </div>
            </div>
          </Show>
        </main>
      </div>
    </div>
  );
};

export default App;