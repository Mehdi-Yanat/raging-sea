uniform vec3 uDepthColor;
uniform vec3 uSurfaceColor;
uniform sampler2D envMap;
uniform vec3 fogColor; // Added fog color

varying float vElevation;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying float vFogFactor; // Added

void main() {

    float fogFactor = vFogFactor;

    // Base color blend for water and foam
    vec3 foamColor = vec3(0.8, 0.9, 0.9);
    vec3 colorMix = mix(uDepthColor, uSurfaceColor, vElevation * 5.0 + 0.2);

    // Foam effect
    float foamFactor = smoothstep(0.1, 0.2, vElevation);
    colorMix = mix(colorMix, foamColor, foamFactor);

    // Reflection calculation
    vec3 viewDir = normalize(cameraPosition - vWorldPosition); // Use the built-in cameraPosition
    vec3 reflectDir = reflect(viewDir, normalize(vNormal));

    // Sample environment map with reflection direction
    vec4 envColor = texture2D(envMap, reflectDir.xy * 0.15 + 0.5); // Convert reflectDir from -1..1 to 0..1

    // Blend reflection with water color
    float reflectivity = 0.3; // Adjust reflectivity strength
    vec3 finalColor = mix(colorMix, envColor.rgb, reflectivity);

    // Apply fog effect
    finalColor = mix(fogColor, finalColor, fogFactor); // Blend fog with the final color

    gl_FragColor = vec4(finalColor, 1.0);
}
