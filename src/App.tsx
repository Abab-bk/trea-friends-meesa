import { Component, onMount, createSignal } from 'solid-js';
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

const App: Component = () => {
  let canvasRef: HTMLCanvasElement | undefined;
  let meesa: ReturnType<typeof createMeesa> | undefined;
  const [currentDemo, setCurrentDemo] = createSignal(0);

  onMount(() => {
    if (canvasRef) {
      meesa = createMeesa(canvasRef);
      demos[currentDemo()].render(meesa);
    }
  });

  function selectDemo(index: number) {
    setCurrentDemo(index);
    if (meesa) {
      demos[index].render(meesa);
    }
  }

  return (
    <div class="min-h-screen bg-neutral-900 text-white flex flex-col">
      <header class="p-4 border-b border-neutral-700">
        <h1 class="text-2xl font-bold text-center">Meesa — Simple Video Synthesizer</h1>
        <p class="text-neutral-400 text-center text-sm mt-1">WebGL-powered generative visuals</p>
      </header>

      <div class="flex flex-1 overflow-hidden">
        <aside class="w-64 bg-neutral-800 p-4 overflow-y-auto border-r border-neutral-700">
          <h2 class="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">Demos</h2>
          <nav class="space-y-1">
            {demos.map((demo, index) => (
              <button
                class={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  currentDemo() === index
                    ? 'bg-emerald-600 text-white'
                    : 'text-neutral-300 hover:bg-neutral-700'
                }`}
                onClick={() => selectDemo(index)}
              >
                {index + 1}. {demo.name}
              </button>
            ))}
          </nav>
        </aside>

        <main class="flex-1 flex flex-col items-center justify-center p-8 bg-neutral-900">
          <div class="w-full max-w-3xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-neutral-700">
            <canvas ref={canvasRef} class="w-full h-full" />
          </div>
          <div class="mt-6 text-center">
            <span class="text-emerald-400 font-medium">{demos[currentDemo()].name}</span>
            <p class="text-neutral-500 text-sm mt-1">
              Demo {currentDemo() + 1} of {demos.length}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;