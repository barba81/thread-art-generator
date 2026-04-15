import { Renderer, Program, Mesh, Camera, Geometry,  NormalProgram, Triangle, Vec3 } from 'ogl';

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
                    vUv = 2.0*uv-1.0;
                    gl_Position = vec4(position, 0, 1);
                }
            `;

             const backgroundFragment = /* glsl */ `
precision highp float;

uniform float uAspect;
uniform float uZoom;
uniform vec3 uOffset; // Camera position

varying vec2 vUv;

void main() {
    // 1. Start with NDC (-1 to 1)
    vec2 st = vUv;

    // 2. Adjust for Aspect Ratio
    st.x *= uAspect;

    // 3. Apply Camera Zoom and Position
    // We divide by uZoom to make dots stay the same world size
    // We add uOffset to 'slide' the grid as the camera moves
    vec2 worldSt = (st / uZoom) + uOffset.xy;

    // 4. Define density (how many dots in one world unit)
    float density = 5.0; 
    vec2 gridUv = fract(worldSt * density + 0.5);
    
    // 5. Draw the dot
    float d = distance(gridUv, vec2(0.5));
    
    // Make dot size stay consistent even when zooming
    // We use fwidth for perfect antialiasing regardless of zoom level
    float dotRadius = 0.05;
    float antialias =0.0012; 
    float mask = smoothstep(dotRadius, dotRadius - antialias, d);
    
    // Dim the dots slightly so they aren't distracting
    gl_FragColor = vec4(vec3(0.15) * mask, 1.0);
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
        const camera = new Camera(gl);
        camera.position.z = 10;
  // NEW: Define your 2D camera state
        let zoom = 1;
        const viewHeight = 5; // This means your screen will show 10 world units vertically at 1x zoom
         const backgroundGeometry = new Triangle(gl);
const bacgrondProgram = new Program(gl, { 
    vertex: bacgounrVertext, 
    fragment: backgroundFragment,
    uniforms: {
        uAspect: { value: 0 },
        uOffset: { value: new Vec3(0, 0, 0) }, // Camera position
        uZoom: { value: 1.0 },               // Current zoom level
    },
});

        
        const bacgounr = new Mesh(gl ,{geometry: backgroundGeometry, program:bacgrondProgram });

     function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    const aspect = gl.canvas.width / gl.canvas.height;
    const viewWidth = viewHeight * aspect;

    // Apply zoom to the orthographic bounds
    camera.orthographic({
        left: (-viewWidth / 2) / zoom,
        right: (viewWidth / 2) / zoom,
        top: (viewHeight / 2) / zoom,
        bottom: (-viewHeight / 2) / zoom,
        near: 0.1,
        far: 100
    });

    bacgrondProgram.uniforms.uAspect.value = aspect;
}
window.addEventListener('resize', resize, false);
resize();
        const num = 32;
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

        const speed = 0.05;
       addEventListener('mousemove', (event) => {
    if (event.buttons !== 4) return; // Middle click

    // Calculate how many world units one screen pixel represents
    const unitsPerPixel = (viewHeight / zoom) / window.innerHeight;

    camera.position.x -= event.movementX * unitsPerPixel;
    camera.position.y += event.movementY * unitsPerPixel;
    
    camera.updateMatrixWorld(); // Sync immediately
});
const zoomSensitivity = 0.001;

window.addEventListener('wheel', (event) => {
    event.preventDefault();

    // 1. Get Mouse NDC (-1 to 1)
    const mouseNDC = new Vec3(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
        0
    );

    // 2. Get World position before zoom
    // OGL modifies the vector passed into unproject()
    const preZoomWorld = new Vec3().copy(mouseNDC);
    camera.unproject(preZoomWorld);

    // 3. Update Zoom
    const delta = event.deltaY * zoomSensitivity;
    zoom *= (1 - delta); 
    zoom = Math.max(0.1, Math.min(zoom, 100)); // Clamp zoom so you don't invert or zoom infinitely

    // 4. Update the camera projection matrix with the new zoom
    resize();
    camera.updateMatrixWorld();

    // 5. Get World position after zoom
    const postZoomWorld = new Vec3().copy(mouseNDC);
    camera.unproject(postZoomWorld);

    // 6. Shift camera to keep mouse pinned
    camera.position.x += (preZoomWorld.x - postZoomWorld.x);
    camera.position.y += (preZoomWorld.y - postZoomWorld.y);
    
    camera.updateMatrixWorld(); // Final sync
}, { passive: false });
        addEventListener('keydown', (event) => {
            console.log(event.key);
            const pos = camera.position;
            if (event.key === 'a'){
                pos.x +=1.0*speed;
            }
            if (event.key === 'd'){
                pos.x -=1.0*speed;
            }
             if (event.key === 'w'){
                pos.y -=1.0*speed;
            }
              if (event.key === 's'){
                pos.y +=1.0*speed;
            }
        })
       
        requestAnimationFrame(update);
       function update(t: number) {
    stats.begin();
    requestAnimationFrame(update);

    // Update background uniforms to match camera
    bacgrondProgram.uniforms.uOffset.value.copy(camera.position);
    bacgrondProgram.uniforms.uZoom.value = zoom * 0.1; // Multiplier to taste

    program.uniforms.uTime.value = t * 0.001;
    program2.uniforms.uTime.value = t * 0.001;

    renderer.render({ scene: bacgounr }); 
    renderer.render({ scene: linesMesh, camera, clear: false });
    renderer.render({ scene: nodes, camera, clear: false });
    
    stats.end();
    stats.update();
}
    }


}
