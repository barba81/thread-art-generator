import { Renderer, Program, Mesh, Camera, Geometry,  NormalProgram, Triangle } from 'ogl';

import Stats from 'stats-gl';

const vertex = /* glsl */ `
                attribute vec2 position;

                uniform mat4 modelMatrix;
                uniform mat4 viewMatrix;
                uniform mat4 projectionMatrix;
                uniform float uTime;


                void main() {

                    // positions are 0->1, so make -1->1
                    vec3 pos = vec3(position, 0.0);

                    vec4 mPos = modelMatrix * vec4(pos, 1.0);

                    // add some movement in world space
                 
                    vec4 mvPos = viewMatrix * mPos;
                    gl_PointSize = 3.0 ;
                    gl_Position = projectionMatrix * mvPos;
                }
            `;

const fragment = /* glsl */ `
                precision highp float;


                void main() {
                    vec2 uv = gl_PointCoord.xy;

                    float circle = smoothstep(0.5, 0.40, length(uv - 0.5));

                    gl_FragColor.rgb = vec3(0.8);
                    gl_FragColor.a = circle;
                }
            `;

         

        const vertex2:string = /* glsl */ `
                attribute vec3 position;

                uniform mat4 modelViewMatrix;
                uniform mat4 projectionMatrix;


                void main() {

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

                    // gl_PointSize only applicable for gl.POINTS draw mode
                    gl_PointSize = 50.0;
                }
            `;

            const fragment2:string = /* glsl */ `
                precision highp float;

                uniform float uTime;


                void main() {
                    gl_FragColor.rgb = 0.5 + 0.3  + vec3(0.2, 0.0, 0.1);

                    gl_FragColor.a = 1.0;
                }
            `;

        
          
            const bacgounrVertext = /* glsl */ `
                attribute vec2 uv;
                attribute vec2 position;

                varying vec2 vUv;

                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 0, 1);
                }
            `;

            const backgroundFragment = /* glsl */ `
                precision highp float;

                uniform float uAspect;
                varying vec2 vUv;

                void main() {
                   vec2 correctedUv = vUv;
    correctedUv.x *= uAspect;

    // 2. Scale the grid (using a smaller number for visibility)
    vec2 gridUv = fract(50.0 * correctedUv);
    
    // 3. Calculate distance from center of the "cell"
    float d = distance(gridUv, vec2(0.5));
    
    // 4. Draw the dot
    float mask = smoothstep(0.1, 0.05, d);
    
    gl_FragColor = vec4(vec3(mask), 1.0);
                }
            `;


export class RenderingEngine {
    constructor(canvas: HTMLCanvasElement) {
        const stats = new Stats({ trackGPU: true, trackHz: true, mode: 2, horizontal: false });
        stats.init(canvas);
        document.body.appendChild(stats.dom);

        const renderer = new Renderer({ canvas: canvas });
        const gl = renderer.gl;
        gl.clearColor(1, 1, 1, 1);
        const camera = new Camera(gl, { fov: 15 });
        camera.position.z = 10;
         const backgroundGeometry = new Triangle(gl);
        const bacgrondProgram = new Program(gl, { vertex: bacgounrVertext, fragment: backgroundFragment,
  uniforms: {
                        uAspect: { value: 0 },
                    },


        })
        const bacgounr = new Mesh(gl ,{geometry: backgroundGeometry, program:bacgrondProgram });

        function resize() {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
            bacgrondProgram.uniforms.uAspect.value = gl.canvas.width / gl.canvas.height;
        }
        window.addEventListener('resize', resize, false);
        resize();

        const num = 3;
        const position = new Float32Array(num * 2);

        for (let i = 0; i < num; i++) {
            const angle = 2*i*Math.PI/num
            position.set([Math.cos(angle), Math.sin(angle)], i * 2);
        }
        
        const linesIndx = new Uint16Array(num*num );
        
        let p = 0;
        for (let i = 0; i < num-1; i+=1){
            for (let j = i+1; j < num; j+=1){

                linesIndx.set([i,j],  p);
                p+=2;
            }
        }

        const geometry = new Geometry(gl, {
            position: { size: 2, data: position },
        });

        const program = new Program(gl, {
            vertex,
            fragment,
            uniforms: {
                uTime: { value: 0 },
            },
            transparent: true,
            depthTest: false,
        });

        const program2= new Program(gl, {
            vertex:vertex2,
            fragment:fragment2,
            transparent: true,
            depthTest: false,
            uniforms: {
                uTime: { value: 0 },
            },
        });


        const geometryLines = new Geometry(gl, {
            position: { size: 2, data: position },
            index : {data: linesIndx}
        });


        // Make sure mode is gl.POINTS
        const nodes = new Mesh(gl, { mode: gl.POINTS, geometry, program });
        const linesMesh = new Mesh(gl, { mode: gl.LINES, geometry: geometryLines, program:program2 });

       
        requestAnimationFrame(update);
        function update(t: number) {
                        stats.begin();

            requestAnimationFrame(update);


            program.uniforms.uTime.value = t * 0.001;
            program2.uniforms.uTime.value = t * 0.001;
             gl.clearColor(1, 1, 1, 1);
            renderer.render({ scene: bacgounr,clear: false });
            renderer.render({ scene: linesMesh, camera,clear: false });
            renderer.render({ scene: nodes, camera,clear: false });
             stats.end();
            stats.update();
        }
    }


}


// Rukujem se za svojim mrakom
// Vuce me ka sebi
// Pobjedit ce znam
// I sve zvjezde su se prolile za njega