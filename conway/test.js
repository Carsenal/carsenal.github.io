/* conway.js
 * By: Carson Riker c@rson.riker.me
 * A web-gl based game of game of life
 * haha see what I did there
 * 'game of game of'
 * I'm hilarious
 */

// Constants
const canvasId = 'conwayCanvas';
const width = 256;
const height = 64;
const fps = 10;

// Initialize function
window.addEventListener('load', function initwebgl(event) {
    // Remove event listener
    window.removeEventListener(event.type, initwebgl);
    const canvas = document.getElementById(canvasId);
    const gl = canvas.getContext('webgl2');
    // Verify webgl support
    if (gl == null) {
        alert(
            'It appears your browser does not support webgl. ' +
            'The way this page appears might be effected');
        return;
        // TODO fallback to static image
    }
    // Create programs
    const stepProg = loadProgram(gl, gl.VERTEX_SHADER, stepShaderSource);
    const renderProg = loadProgram(gl, gl.VERTEX_SHADER, renderShaderSource);
    if (stepProg == null || renderProg == null) {
        alert(
            'It appears your browser does not support webgl. ' +
            'The way this page appears might be effected');
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
    // Add mouse click support
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

function fallback() {
    // Implement a fall back option
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

function loadStart(context) {
    // TODO impl
}

// Shader scripts
const stepShaderSource = `
precision mediump float;
uniform sampler2D state;

int get(vec2 coord) {
    if (coord.x < 0.0 || ${width}.0 < coord.x ||
        coord.y < 0.0 || ${height}.0 < coord.y)
        return 0;
    vec4 px = texture2D(state, coord / vec2(${width}.0, ${height}.0));
    return px.r < 0.1 ? 1 : 0;
}

void main(void) {
    vec2 loc = vec2(gl_FragCoord.xy);
    int sum =
        get(loc+vec2(-1., -1.)) +
        get(loc+vec2(-1.,  0.)) +
        get(loc+vec2(-1.,  1.)) +
        get(loc+vec2( 0., -1.)) +
        get(loc+vec2( 0.,  1.)) +
        get(loc+vec2( 1., -1.)) +
        get(loc+vec2( 1.,  0.)) +
        get(loc+vec2( 1.,  1.));
    if (sum == 3) {
        gl_FragColor = vec4(0.,0.,0.,1.);
    } else if (sum == 2 && get(loc) == 1) {
        gl_FragColor = vec4(0.,0.,0.,1.);
    } else {
        gl_FragColor = vec4(1.,1.,1.,1.);
    }
}
`;
const renderShaderSource = `
precision mediump float;
uniform sampler2D state;
void main(void) {
    vec2 coord = gl_FragCoord.xy / vec2(${width}.0, ${height}.0);
    gl_FragColor = texture2D(state, coord);
}
`;
function get_init_pixel(x, y) { return init_frame[y].charAt(x) != ' '; }
// TODO: Binary pack the frame. Using a text string is ineffecient
// While I'm thinking about it, 256x64x1 bit = 16384 bits = 2048 bytes = 2 kb
// Meanwhile, the current string: 257x64x8 bits = 16384 bytes = 16 kb
// It is all kb tho
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
