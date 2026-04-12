import { Renderer, Program, Color, Mesh, Triangle } from 'ogl';
import Stats from 'stats-gl';


const vertex = /* glsl */ `
                attribute vec2 uv;
                attribute vec2 position;

                varying vec2 vUv;

                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 0, 1);
                }
            `;

const fragment = /* glsl */ `
                precision highp float;

                uniform float uTime;
                uniform vec3 uColor;

                varying vec2 vUv;

                void main() {
                    gl_FragColor.rgb = 0.5 + 0.3 * cos(vUv.xyx + uTime) + uColor;
                    gl_FragColor.a = 1.0;
                }
            `;


export class RenderingEngine {

    constructor(canvas: HTMLCanvasElement) {
        const stats = new Stats({ trackGPU: true, trackHz: true, mode:2, horizontal: false });
        stats.init(canvas);
        document.body.appendChild(stats.dom);

        const renderer = new Renderer({ canvas: canvas });
        const gl = renderer.gl;
        gl.clearColor(1, 1, 1, 1);

        function resize() {
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
        window.addEventListener('resize', resize, false);
        resize();


        const geometry = new Triangle(gl);

        const program = new Program(gl, {
            vertex,
            fragment,
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new Color(0.3, 0.2, 0.5) },
            },
        });

        const mesh = new Mesh(gl, { geometry, program });

        requestAnimationFrame(update);
        function update(t: number) {
            stats.begin();

            requestAnimationFrame(update);

            program.uniforms.uTime.value = t * 0.001;

            // Don't need a camera if camera uniforms aren't required
            renderer.render({ scene: mesh });
            stats.end();
            stats.update();
        }
    }

}