/* conway.js
 * By: Carson Riker
 * Play's conway's game of life with the GPU
 * Without any weird js-library bloat
 */

// Constants
const canvasId = 'conwayCanvas';
const width = 256;
const height = 64;
const fps = 10;

window.addEventListener('load', function initwebgl(event) {
    window.removeEventListener(event.type, initwebgl);
    const canvas = document.getElementById(canvasId);
    const gl = canvas.getContext('webgl2');
    if (gl == null) {
        fail();
        return;
    }
    // Create programs
    const stepProg = loadProgram(gl, gl.VERTEX_SHADER, stepShaderSource);
    const renderProg = loadProgram(gl, gl.VERTEX_SHADER, renderShaderSource);
    if (stepProg == null || renderProg == null) {
        fail();
        return;
    }
    // Initialize framebuffers
    const buffers = [gl.createFramebuffer(), gl.createFramebuffer()];
    gl.bindFrameBuffer(gl.FRAMEBUFFER, buffers[0]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                            gl.TEXTURE_2D, texture0, 0);
    gl.bindFrameBuffer(gl.FRAMEBUFFER, buffers[1]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                            gl.TEXTURE_2D, texture1, 0);
    // Draw initial frame
    let frame = 0;
    // TODO: Add mouse click support
    // Draw loop
    window.setInterval(() => {
        let index = frame++ % 2;
        // Calculate the step
        gl.bindFramebuffer(gl.FRAMEBUFFER, buffers[index]);
        gl.useProgram(stepProg);
        gl.enableVertexAttribArray(stepperProgCoordLoc);
        gl.uniform1i(stepperProgPreviousStateLoc, (1 - index));
        gl.drawElements(gl.TRIANGLE_FAN, 4, gl.UNSIGNED_BYTE, 0);
        // Now draw it
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(renderProg);
        gl.uniform1i(displayProgStateLoc, index);
        gl.drawElements(gl.TRIANGLE_FAN, 4, gl.UNSIGNED_BYTE, 0);
    }, 1000/fps);
});

function fail() {
    alert('Your browser ran into some problems displaying webgl');
}

function loadProgram(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders:',
            gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, shader);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program:',
            gl.getProgramInfoLog(prog));
        gl.deleteShader(shader);
        return null;
    }
    return prog;
}


const calcShaderSource = `
precision mediump float;

uniform sampler2D state;
varying vec2 vTextureCoord;

int get(vec2 coord) {
    if (coord.x < 0.0 || 1.0 < coord.x ||
        coord.y < 0.0 || 1.0 < coord.y)
        return 0;
    vec4 px = texture2D(state, coord);
    return px.r < 0.1 ? 1 : 0;
}

    
void main(void) {
    int sum = 0;
    vTextureCoord.y += 1 / ${height}.0;
    sum += get(vTextureCoord);
    vTextureCoord.x -= 1 / ${width}.0; 
    sum += get(vTextureCoord);
    vTextureCoord.y -= 1 / ${height}.0;
    sum += get(vTextureCoord);
    vTextureCoord.y -= 1 / ${height}.0;
    sum += get(vTextureCoord);
    vTextureCoord.x += 1 / ${width}.0;
    sum += get(vTextureCoord);
    vTextureCoord.x += 1 / ${width}.0;
    sum += get(vTextureCoord);
    vTextureCoord.y += 1 / ${height}.0;
    sum += get(vTextureCoord);
    vTextureCoord.y += 1 / ${height}.0;
    sum += get(vTextureCoord);
    if (sum == 3) {
        gl_FragColor = vec4(0.,0.,0.,1.);
    } else if (sum != 2) {
        gl_FragColor = vec4(1.,1.,1.,1.);
    } else {
        vTextureCoord.x -= 1 / ${width}.0;
        vTextureCoord.x -= 1 / ${height}.0;
        if (get(vTextureCoord) == 1) {
            gl_FragColor = vec4(1.,1.,1.,1.);
        } else {
            gl_FragColor = vec4(0.,0.,0.,1.);
        }
    }
}
`;
const renderShaderSource = `
precision mediump float;

uniform sampler2D state;
varying vec2 vTextureCoord;

void main(void) {
    gl_FragColor = texture2D(state, vTextureCoord);
}
`
function get_init_pixel(x, y) { return init_frame[y].charAt(x) != ' '; }
/* TODO: Binary pack the frame. Using a text string is ineffecient
 * While I'm thinking about it, 256x64x1 bit = 16384 bits = 2048 bytes = 2 kb
 * Meanwhile, the current string: 257x64x8 bits = 16384 bytes = 16 kb
 * It is all kb tho
 * Also.. rle? Maybe? Think about it.
 */
const init_frame = [
    '██    ███  ██   ██ ██    █████ █████     █ █ █ █   █  █ █ ██  ██ ███     █      ████ █  ████  █ ██  ███       ████  █  ██ █  ██ █   ███  █ █ █ █ █ ███  ███    ██ █  ██  ██   ████  ████  ██ ███████ ██ ██ █  █ █  ██ ██     ████ █ ███   ████  █  █ █   ██  █  ',
    '  ██ ██     ██ ████████ █ █ ███ █  ██    ██ █    █ ██  █  █   ████████ ███ ███   █ ██ ██ ██  ███   █ █  ██  ████  ███   ███ ███ ██  ██    █       █  █ █ █ ██ ██ ███ ██  ██  ████ █ █  █     █  █ ██ █   ██ █    ██ █████  █  █ █ █   █ ███  ███   ████ █  █  █ ',
    '█ ████ ███ ██ █ ██ ███  █  ███  █     ██    ███  ██████ █ █ █ █  ██ █ ███  █ █ ███ █ █ ██    ██   █    █   ██████  █ █ ███ █ █ █ ██   ████               █ █ █ █  █   ██   ██  █  ██ ██ █    █   ██     █   ███  █████  ██ █  █  ██  █   █ ███  █   ███ █    █  ',
    '█ █ ████  ██  █████ █ █  █    ███ ██ █    █ ██  ███ ██  █ █  ████  ██ ██ █  █  ███   ██ ██ █  ██   ██████ █  █████ █ █ █   ████ ██    █ █  █        █   █ █           ████ ██    █  █  █   █  ██ ██ █  ████        █ █ █ ██  ██  █ ██     ██ ████████   █  █  █ ',
    '███  ██ █ ██ █  ██   █ █ ██    ███ ██ █    █  █   ███ ██  █      ██    ████   █   █   ██ ███   ██ ██       █ █ █  █  █ █    █ ██████         ████  ██ ██  █    ██ ██  █████  ████ ██  █ █   █   █  ██ █    █   █ █     █  ██  █ ██  ████████   █  █ ███ ████ █  ',
    '  ██   ████ █ █   █  ████ █  ██ ███ █ █ ███  ████  ████    █ ██  ██████ ██ █  ██ ███████ █████  █  ███   █  ██  █  ███  █      ██  ███ █ ███  ██     ███  █ █████ █ █   █ ██ █ █████  ████ ████     █ ██   ███ █ █ █ █     █ █ ██ ███ █   ████  ██  █ ███ █  █ █',
    ' ██  ██ ██ ████  █  █  █  ██  ███ █     █  █ █ ███ ████   █ █ █ ██ ██  ██ █  ███   █ ████ ██ █   ██   █ █   █████ █ ██ █ █████ ████    █ █   █ ████ █ ██ █████ ██ █████     ████ ██  █ ██ ████   █    ██ █   ██   ██ █ █ █ ██  █   ██ █   █ █ ██   ███ ██  ████ ',
    '█   ██   ██  ███   █ █     ███ ██  █       █ ██ █  █ █ █  ███ █████ █████         █ ██ █ █   █ █ █  █ █   ██ ██ █ █ ███    █ █ █████   █  █ █         █ █ ██ █ ██ ███ ██ ███ ██     ███ █ ██  █████  █████ █    █   █ █ ████  █       █  █  █    █ █ █ █  ██████',
    '██   ██  ██ █ █ █  █        █  ██ █   █   █  █ █  █ ████  ██████ ██   ████ ████  ███   █  ██ ██  █ ██  █ █  █     ██    █████ █ █████ ████      ██  █    █ █    ██   █ █ █ █ ██ █ ██ █  █████ █ █ █ █ █ █ █ █  █    █ ████  █  █ █ ██  █ ██  █  ██ █ █ ███   █  ',
    ' ██ ███   ████      █████   █   █     █  ██  ████  █ █ ██ ██████     █   ██      ██ ███       █   ██  █ █ ███████ █ █████ ██ ██  ████ █  ██ ██  █   █   ████ █  █ ██ ████ █    █  ██    █   ██ █ █ █  █████ ████  ███ ███ ██  ██   █  ███  █  ███ ██ █  ██ ███  ',
    '█████ █  █ ███    ██  ███ ██ ██ █ █ █   █   ██ ██ █  ███ █  ██ █  █ ██████  █  █  ███    ██ █  █ █    █  █ ████ █ ██    █ █ ███ █ ██ █ █ ███ ██ █ █ █ █ ██ █ ██  ██████   █      ██ ██   █  █ ██ █ █  ███ ███ █████         █ █  ██████   ██ █      █   █ ███  █',
    '███    █████ █ ██ █  ███ ████      █   █  ██  █ ███ █████ ██ █ █ █ ██ █ ████ ██ ██████   █████  █ █ ██ █ █    ██ ███████ ██ ███   █    █  ████ ████    █ █ ███  ███ ██ ██   ██       █   █ ███  █  ███ █  ███ █   ██     ██  █ █     █  █████ █ ██  █ ███  █ ██ ',
    ' █   ████████    █ ██ █ █  █ ███  ███  █ ███ ██ ██  █ █  █ █    █ ██  ████ ████ █ █ █████   ██   ██ ███  █ ██████  ███ █ █  ████ █   █ ████████    █  ██████ █  █    █    █ █ █     ███  █ █ █ ██  ██ ██ ██ █    ██      ██   █ █  █                ██ ██ ████  ',
    '█  █ █ ██   █   ██ ████ █  █ ██    █   ██  ███ ███    ██ █  █    █ ██  █ ██ ███   ██     ██ ███ █   █ █   ██ ███ ██ █   █  █████   █████ ████   █████ ██ █   █ █   ██ █ █ ███ █ ████ █    █ ██ █   █ ████ █ █ ██  ███ █  ██ ██  ██ ██████  ██ █    █  ███ █████ ',
    '█ █  █ █  ████  ████ ████ █ █    ██ ██ █ ███ █ ████ ██    █  █    ██ █    ██████   ██  ██    █  █   ████  █  █  █ █ ██    ███  █       █  █ ██ ███    ██ █     █ ██ █  █ ███ ███  █ █ █   █  ███   ██ ██  █ █ █    █ █  █ ██ █ ██    █ ███████    ██ ██ █ ██   █',
    '█  ███  █  █ █      █  █   ████ █  █   ███   █  █ █ ██ █ ███    █ ██    ██   ██   ██ ███  ██ █ █    ██  █ █ █ █   ██  ███ █  █ █    █ █ █   █  █  █ ██    █ █    ███   █ ██  █  █ ██  ███  ████ ██ █    ██   ██  █  █    █  ██ █ ███ █ ███ █   █ ████  █  ██    ',
    '   ████  █████ █  ██       ██  █  █    █████ █   ████████ █████ ███   █████ ██   █ ████ ███  ██ ███ ██ ████ ████ ██ █  █  ██ █ █ █ █ ██    █ ███  ██ ██  ██ ████ ███  █  ██ █ █ ██ ████     █ █  █   ███ ███  ██        █ ███ █ █ ██    █  █    █  █ █     ██  █',
    '█     █  ██ ██    █  ██   █  █  █ █ █  ██ █    █  █ ██   █ █ █ ██    █ █  ███  █  ██  ███  ██  █ █ ██ █  █ █ █ ████  █████     █  █ ██ █ █████    █ ██ █ █ ██ ██ ██    █ ██    █  █ █ ██   █  ███     █    ███ ██  ██  ██ ██    █   ███  ██ ██ █  ███   ███    █',
    '  ██ █  █ █ ██ █   █ █    ██ ██       █     ███    ███  ███   ████ █ ███ █████ █████   █ █  █ ████     ███  █  █ ███  ██  █ ███ █  █   ██ █ █████████ █     █   ██       ████   █ █   █ █████ █  █  ███ █ ██   ███ ██ █  █  ████    ██ █████ █ █   █ ██   ██████',
    '   ██ █ ███ ████   █ █ █  ████ █  ██ █ █   █  ██  █ █████ █ ███ ███    █  ██ █  █    ████ ████  █  ███ ██    ███ ██ █  ███   ███   ██ █   ███ █  █    ██  █   █████████  █  █ █ █  █   █████ █ ██ ████ █ ████  ██   ████  █  █  █ █   ███ ██ ██   ████ █ █      ',
    '     █  █ █ ███ ██ ███ ██ ██   ███    ████ ███ █ ███   ██ ████ █ ███ █  █ ██ ██   █ █  ██ ██ ██   ██ ██  █ █ █████      █ ██   ██  █ █ ███ ██ ██ █ █████ ██ █   █    █  █  ██ ██ ██ █ █ ██     █       █   █    ██ ██   █   █ █     █   █ █ █   █  █ █   ████ █ ',
    '██ █ ██ ███   ████ █ ██ ██  █████ █    ██ █  █ █ █   ████  █  █ █ ███    ████   ██ █ ██  ██  ██  █ █    █ █ ███   █  █ ████   ███ █     █ ██  ████ ██  █ █  █   ██ ████  █ █ ██████ ███   ██   ██ ██   █ █ █ █ █ █ █████   █ ██ █ ███    █ █ ██   ██     ███  █ ',
    ' ███ ████   █ █ ██    █   █ █ ████████  ███  ██ █ █  ██      █ ██ ███     ██  ██  █ ██   █  █ ██ ███ █  ███ █ █ █   ██ ██      █ ██ █  ██       ████████  ██████   █   ███ █ █  █  ██    █ █████ ████ ██   █       ████ █ █  ███ █   ██   █    █   █  ███ █  █  ',
    '   ███ █ █  █ █   ██   ███    █████  ██ █ ███ ████ ███  █    ██ █ ██████ █ ████  █  █       █ ██ █     ██ ████ ██   █ █ █   █ █ ████  █  ███ █     ███  ███████  ██ ████    ██ ███   █  █ █     ███  █ ██   █   ██   █ ██████     ████  ██ █████    █  ██    ███',
    '██    ███   █  █  ██ █  ██ ██       █  █  █     █  █   █ █ █ ████ ██ ████  █ ██   ██  ████   █ ██ █  ██   █ ████████       █ ██ ███   █        ███  █   ███ ██   █     █ █  █  ██ ███  █  █  █ █████████      ██ ██  ███ █ █    ██  ██ █   ██ █ ██  ███ ██    █ ',
    ' █  █ ██  █ █ ███ █ ██ █   █  ███   █  █   █   ██   ██  ██████ ██ █   █   █  █████ █  ███ ██   ███    █  █  █  █    ███   ██  ███ █ ████  █ █    █  ███ ██████  ███ █    ██ ███  █████ ███     █ ██   █    █ ██       ██    ██ █  ████████ █ █  ██  ██ █ █ █████',
    ' █ ███    ███   ██   █    █████    █ ██ █ ██ ██ ██ █  ██ █   █  █ █████████ █  █   █  █  █     ██ ██   █  █  ██  █ ██  ███  ██ ██ ██  ███ ████ █ █ █ ██ ██ █ ██  █  ████    ██ █ ████   █ ██ ████ ██   ███  █          █ ███████  █ █ █ █ █        ██  ████ ████',
    '██ █ ██  █ █ █ ██  ██  ████ ███    █ █       ██  ███ ████ █ █   █    █ █    █  █ █ █ ██ ███████   ██ █ █ ████  █  ███  ███████  █████  █  ███ █ ████ █ ███  ████   █ ████  ██ █   █ ███ █ ██    ██ █   █   ███ █ █ █  ██  ██ █  █   █ █ █    █ ██  █████  ██ ███',
    '█    ███   ██    ██      ███ ███  █     █  █ █  █  ██ █  █  ██   ██  ██ ███ █ █    █  █ ██   ██   ██  █   █   █ █    ███ ██ ████   █ █   █ ████ ████  █    █  █ ██████████  ████  ██ ██ █   █ ████ ██ ████ ██ ███  ███  ███     ██   ███ ███ ██  █ █ ██████ █  █',
    '  ██  █████ ██ ██  █   ██████ ██ █ █ ███    █  ████ ██ █  █     █ █    █ █  █████  █  ██ █     █ █  ████   █ █  █   ██ ██     █  █   ███   ███  █  █ ██████ ██ █  ██ ███      ██    █ █ █   █   ██ █  █  ████ █  ██ ██  ██   █ ██  █  █  ████  ██ █ ███    ██   ',
    '███ ███   █  ███████ █      █   █  █████ █ █ █████    █ ██ ███ ███ █ █ █      ██  █████ █ ███ ██ ██  ███ ██ ██ █ ███ ████████ █ █    █   █  ██ █     ███   █  █ ███████ ██  █ █ █  ██    ██   ██ █  █████ █  ██ █ █ ██ ██   ██  █ ███  █ █ █ █ ██  ███ ███ █  ██',
    '████ █   █ █    ██ █   █   ███ █   ██   ███ ██    ██████     ██ █████ ██  ███ ██  █ ██████ █ ██ █   ██ █ █  █  █    █ █    █████  █ █ ██ █ ██   ██   █     ██    ██ █  ██ █ █   █████  ████ ██   █           ██████  █ █   █████ ██████   ██ █ ████     █ ███ █ ',
    '     █  ███ ██ ██    █ ██   █   █    █  ███ ███ ███  █ █  █ ███ ██    ██ ██ ██ █ ████ ██  █  ███ ███ █ ██████    █   ███   █████ ██  █    ██ █   █ ██ ███████  ██ █  █   █   ███   █ █  █   █ ██  ██    ██  █  █  █████  █   █    █ █ ██   ██  ██ █  █ ███      ',
    ' █    █ ████ █   ██████  █   ██     ██ █       ███ ██     █       █    ██  █ ██     █████ █   ██  █  ██ ███ █  ██ ██ ██ ██ █   █ ███ █ ██  ██ ██ ███     █ █  █ ██ █ ██  ████  █    ██    █ ███ ███ ████  █ █  ██ █ █    ███████████    █ █ ███ ██ █   █ ██ █ ██',
    '   █ ██ ███    ███ ███████   ██ ███ ██ ██ ██ █  █ █     █ █ ███  █████  ███ █    ████      █ █  █ █      █   █ █ █ ████ ██  █ █ ██ █ █  █    █ █ ███   █ █ ██ ██   █ ███ █  █  ███ █  █   ██ ██████   █ █   █████  █  █    ██   ███ ██ █   ████  █ ██  █    ████',
    ' ███ █    ██ █ ██    ██  █ ████    █ ██ █  ██    ████  ██ ███ █ ██  █ █  █ █  █     ███ █   █ █ ██   █ █ █   █   █   █  ██    ███  █ ██  ██ █ ███ █  █    █    ██████████  █   █  ██ █ ███ ██ ██ ████ █ ██  ██ █ ███   █ █  ████  ████  ██  █ ██  ████    ███ ██',
    '███ █  █ █    █   █  ██ █   ███    █ █████  ████  █  ██      █ █ ██ █ ███ ███  █  █  █ █████ █     ██  ████████████ █ █  █  ██  ███ ██ ██    ███ ████  ██ █████   ███ █████ █  █  █   ██ ███  █████        ██ ███  ██ █     █████ ██ ██ █    █  █ █    █     ██ ',
    '█ ███ ███   █ ███ █  ████ █ ████ █  █ █  ███  █ ███ █  █ █      █ █ █   ████ █   █ █ █      █ █ ██    █ █     ██ █  █   ██   █ ██  ████              █     ███ ██  █ █  █ ██ █ █ █  █  ███  ██████ ██ █ █    █ █  ████ ████  █ ████  ██    ███  █   █ █ █████ █ ',
    '  █  ██ ██    ██    █   ██  ████  █ █ ██  █ █  █ ███   ████  ███ ███ █   █  ██ █  ██  █ █  ███ ██  ██ ██ ███     ██  █ █ █      ██████ ███ █ █ ███  ███   ███  ███  ████ █  ███  █     ██ █ ██ █ ███ █  ████  █   ███ ██ █ ███ ██    █  ███    ██ ██ ████  ███  ',
    '████     █ █ ████ █  █      ██ █ ██ ██ ██████ ██ █████   █ █████ █ █ ███ █  ████   ██ ██    ██ █  ██ ███  ██     ███ ███  ███ ██ ██████   █  ██           ███ █████ █           █  █ ██  ██ █   █ ██       ██  ███  █ █ ████      ██  █  ████ █ █ █  ██    █ █  ',
    '  ███   ██ █ █ ███   █   █ █ █ █ █  █████ █   ████  ██  █  █ ███████ ████ █  ██ ██  █    █ █ ████     █      █ ███   █   ██ ██  █      ███   ███   █  █ ████ █████  █ █ █ █   ██████    ██ █ ███ █ █ █  █  █  █ █  █    ████    ████████ █  █    █  █ █  ████   ',
    ' ██ ██   ████    █   ████ ███  █ █ ███         ███   █ █ █ █ ███    ███  ██  █   ██ █████ █ ███    ██ ██ █ ██  █ ██   ███ █ █   █         ███ ████  ███ █   █ █ █ █     █  █ ██ ██  ██  ██ ██████  █  █  █      ██  █  ██   ██      ███   █ ███ ██  ██ █████  ██',
    ' █  ██ █  █   █ █ ██ █ █    █  █  █  █  ██ █ █ ██ ██    ██  ██  ███   ███   ███   █ ███  ██ █ █ ███ ████  ████    ██ █  █   ██ ███ █ ██  ████ █  ██   ██    █  █  █     █      █   █     █ █   ██ █  ███ ██ █ █ ██   ███  █  █        ██    ██ █████ ██ ██ █   █',
    '██ ██  █ █  █ ████   ██████ █ █ ███   █ ████  █ ████ ██ █   ███ █    ██ █ █ █    ███████   ██ ███ ██   ██ █ ██   ███    █ ███ █ ██  ██  █  █   █   █ ██   ███    █  ██     ██  █ █  ███  █      ██ ██ █ █  ████  ███ █    █    ████████   █  ██  █    █ █████ █ ',
    '   █   ████ ██ █ █ ████ ██    █  █  ████    ███ █ ████ ████   ██ █ █    ██       █ █ ██    ██ █   ████ ███ █ ██  ██  ██  █ ███ ██           ███ █  ██    █  █   ██   ████   █ █  █            █████ █  ███ ██  █ ██████   ██    █ █████   █ █    █████ █ ███████',
    '███  █ ██ ██ █   ████ █  ██  ████ █   ██ ██ █  █ █████  ███  ██    ██ ██ █  █ ██ █ ██ █   ██  █     █        ███ █ ████   ██ ████    ████   ██ █████ █ █  █    █    █ ██  █ ███  █  ██  ██ █  ██  █ █ █ █    █  █  █   █    █ █ █ ██ ███    █ █ █ █████ ██████  ',
    '████ ████ ██  ███ ██  ███ █ █      █ ██ █ ████ █ █ ██ ██ █     █  █ █   ██  ████     █████ ██ ██ ██ █     █ █  ██    █  █  ██         █ ███ ███    █████ █ ████  █   █  █ ██ █  ███   █ ████   ██████   █████    █ █ ██ ██ ████ ███  █ █  ████  █  █      ███   ',
    '     ████ ██ █ ██ █ █ ████ ██ █████ █  █████ ██  █ ██  ████  █  ███ █  ███ ██ ███  █ ███    █ █  █ ██   █ ████ ██     █   ██   █  ███ ███ █ ██  █ ██ █    ███ █   █  ██ ██ █    █  █ █    █  ██   █  █ █   ██  ██████   ██    █  █  █ █ █ █  █ ██  █ ██ █ ██  ██',
    ' ██████    █████████████  █ █ █ █  █  █████  █████ █ █   █   ███████  ████ █ █ ██ █ ████     █      █   █    █   █    ██ ████ █    █  █ █     ██ ████   █  █ █  █ ██ █ █         ███ ███    ██  █  ███    █ █ █ █     █ █ █   ██   ██ █ ██ █    ██ █ █  █ █   ██',
    '  ███ █   █  █ ███  ██  ██ █ ████   █ █ █  █   █  ███ ██ █████ █  ██████   ██ █  █  ███  █   █      █ █ ██ █ █ ███ █ █ ██  ██  █████ ███   █ █ █ ██ ████ ██  ██ ████ ██ █   █  ████  █  ████ █ █ █ ██████ █ ███      █ █ █     ████ ██ █ ███  █ ██  █ █ ████    ',
    '██   ██ █    ██ ██  ██   █  ██   █ █  ██ █ ██ █   █ █  █ ███ ██ █   █ █  █    █ ████     ████     ████    █  █ █     █  ███ █ █ ██  █ █  ██     █ █ ███ ███████ █ █  ██ █ █  █  ██ █████ ███ █  █ █ ███   █ ███████   █ ██ █ █  ██ █ ███ ████  ██ ██ █████ █████',
    ' █  ████  █ █   █ ███ ██   ██  █     █   █  ██  ██ ███ █   █  █  █  ██ ██ █    ██  ███ █   █████ █ █ ████  ██████ ███    ███ ██   ███  ███   ██ ████ ██ █  ██████  █ █ █   █ █ █       █    ██   █  ████ █ ██ ██     ███  ████ █  ████ ███████ ███  ██  ██  ████',
    ' ██ █  ███     █ █  █     █  █   █  █ █ █ █  ██ ██ █   █      ███████ █████  █  ████  █  ███████ █ █████    ██ █ ███  █    ██ █  ███ ████   █  █ █   █  █   █ █  ██  █ █████ █ ████  ██  ██ ██  █ █ █    █ █ █  ██ █  ██  ██  █  █    █ ████ ██   █    ████ ██  ',
    '█ ███  █ ███ ███   █   █ █ ██ ██     █ █  █  ██  █ ██  ██   █  █ ████ ███   ██ █     █ █ █ █ █ ██ █   ██ █ █ █  ███ ███  █  ██ ███   █ ███ ████  █ █ ██ ██  █ █ █  ███ █     ███  ██  █ ███  █   ███  █ █ █  ██ █ ██ ██   █   ███   █ █    █  ████ ███ ██   ███ ',
    '██   █ █  ██  ██ ███████   █ ████  ██  ██    █ ████   ██ █   ████ ███ █ █   ██ ███   █  █ █ ███   █    ██ █  █ ███     ███    █  █   █  █ █ █  █  █ ██ ████ █ █  ██  █   █ █     ██ █ █  ██ ██  ██████   █ █  ██████  █ █ ██ ████  ██     █ █  ███   █ █  ██ █  ',
    '█ █ █ ██    ██ ███ █    █ ██ █████     █ █  █ █  █  ████   ███ █ █  █ █ █ █ ██  █ █   ████ █  ███  ██ ███ ███    █  █ ██████ ██ ██   █    ██  ████    ██ █ ██ █       █████  █ ████   ██ █ █   █  ███  ██   █   ███    ████ █ █   ██ █  █   █ █████  ███ ██ █  █',
    ' ██   █ ██  █ █ █  ████ █   █ ██ ██   █          █████ █  ██  ███  █ █ ███    █  █  █ ██   ██ ██ ██  ███ ██ ███████ █  ███  ██   █ █ ██   █ █      ████   █  ██    █   █ █████ █ ███   █ █   ██ ████  ██ ████   █  █ ██ █ ██  ██   █    ██ ██  ███ █ ████   ███ ',
    '█  ██ ███ ██ ██ █ █  ██ █  █ █ █ █████ █   ████  █ █ █  █████ █ █   █  █ ██ █  █ ██ ████  ██████  ██  █  ██ █ █ █    █  █ █   █ █  ██    ███ █ █ ██████  ██ ██  █████ █ ██ █    █    █ ██ █ ████  ██  █ █      ████ █ ████  ██ █ █████ ███     ██ ███████████  █',
    '█ █████ ████████     ██ █  █ ██ █      ██████ █ █ ██  ████ █ █ ███ ████ ██ ████  █      █ █     ██ █████  ██     █   █ █  █  █ ██  ██     ██  ███ █     █████  ███ ██    ███████   ███ █ ██ ██  ██ █     ███   ███  ██ ██ ██ ████ ██    ██ █ ███ ██ ██      ████',
    ' █    ██    ██  █  █  ████   █ ██      ██    █ ██  ██     ██   ███    █   █  ███ █    █████  █ ██ █ ██   ███   ██   ██   ██ █  █  ██  █  ██  █ █ █     █ ███ █    █  █ ████  █████   ██    ██████       ██ █  ███ █ █ ██   ██ ██ █████   ███   ██  █   █████ ███',
    '█ ███  █ █  ███    ███  █ █   ████ █ █    ██ █ █   █  █       ██ ██    ███ ████  █  ██  █ █   ██ ██  █ █ ████   █   █ ███  ████ ███ █  █   ██ ██ █████ █   █ █  █   ██   █ █████ █  █  ██  █ ███ █ ███ ████████ ██ █ █    ██████ █     ██████████  █ █ █ █   ███',
    '███ ███ █    █ █ ██ ██ ██ ████   █  ██ █ █ █████████  █   █     ███ ███ ██  █  ██ █ ██ █ █ █  ████ █  ████ ███ ██ ██   ██ █    █  ██ █  ██  █   █   █ █   █  █     █  █ █ ██  ███  ██ █   ██       █████  ██      ██ ██  █ ███ █ █     ██  ████ ███ █  ███ ████ ',
    '█  █ ██   █ █ ██ █   █████ █ █      █    █ █  ██  ███ ██ ███  ████ █ █  █ █    ███  ██   ███   █ ███          █ █     ██ █   ██ █   █ ████ █ █ █ █ ███ █   █████ ██    █ █ █  █ ██  █  █  ████   ██ █ ███ ██████ ██ █ █ ███ █ ██ █   █████  █  ██ █ ██ ████ █  █',
    '█  █ █   ██████ ██    ██ █ █     ████ █████  ████  █    █ ████  █  █ █ ███ █ █  █   █ █   █ ██ ███  █  ██  ██   █ █ ██   ██████  █  ██ █  ███ █████  █ ██  █ ███  █ █ █    ████    ██ █ ██  █  █    █ ██  ███ █ █████ ██ █ ██ ██ ████ ███  █ █ █ ██   █  █      '
];
