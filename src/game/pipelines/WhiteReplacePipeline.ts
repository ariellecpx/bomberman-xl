import Phaser from 'phaser';

export default class WhiteReplacePipeline extends Phaser.Renderer.WebGL.Pipelines.PreFXPipeline {
    static KEY = 'WhiteReplacePipeline';

    private _r: number = 1;
    private _g: number = 1;
    private _b: number = 1;

    constructor(game: Phaser.Game) {
        super({
            game,
            fragShader: `
                precision mediump float;
                varying vec2 outTexCoord;
                uniform sampler2D uMainSampler;
                uniform vec3 uTargetColor;

                void main() {
                    vec4 color = texture2D(uMainSampler, outTexCoord);
                    
                    // Calculate brightness and color variance (saturation-ish)
                    float brightness = (color.r + color.g + color.b) / 3.0;
                    float diff = abs(color.r - color.g) + abs(color.g - color.b) + abs(color.b - color.r);

                    // Soften the mask using smoothstep for anti-aliased transitions
                    // We want bright (brightness > 0.4) and neutral (diff < 0.3) areas
                    float brightnessMask = smoothstep(0.35, 0.55, brightness);
                    float neutralMask = 1.0 - smoothstep(0.1, 0.35, diff);
                    float whiteMask = brightnessMask * neutralMask;

                    // Preserve the alpha and blend smoothly
                    vec3 tinted = uTargetColor * brightness;
                    gl_FragColor = vec4(mix(color.rgb, tinted, whiteMask * color.a), color.a);
                }
            `
        });
    }

    onDraw(renderTarget: Phaser.Renderer.WebGL.RenderTarget) {
        this.set3f('uTargetColor', this._r, this._g, this._b);
        super.onDraw(renderTarget);
    }

    setTargetColor(color: number) {
        this._r = ((color >> 16) & 0xFF) / 255;
        this._g = ((color >> 8) & 0xFF) / 255;
        this._b = (color & 0xFF) / 255;
    }
}
