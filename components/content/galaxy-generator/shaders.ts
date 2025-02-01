export const vertexShader = `
uniform float uSize;
uniform float uTime;
uniform float uSpeed;

attribute float aScale;
attribute vec3 aRandomness;

varying vec3 vColor;
varying float vDistance;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    //Spin
    float angle = atan(modelPosition.x, modelPosition.z);
    float distanceToCenter = length(modelPosition.xz);
    float angleOffset = (1.0 / distanceToCenter) * uTime * uSpeed;
    angle += angleOffset;

    modelPosition.x = distanceToCenter * cos(angle);
    modelPosition.z = distanceToCenter * sin(angle);

    // Randomness 
    modelPosition.xyz += aRandomness;

    // Calculate distance to center for black hole effect
    vDistance = length(modelPosition.xyz);

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Increase size of particles near black hole
    float blackHoleProximity = 1.0 - smoothstep(0.0, 0.8, vDistance);
    float sizeMultiplier = mix(1.0, 3.0, blackHoleProximity);
    gl_PointSize = uSize * aScale * sizeMultiplier;

    // Size attenuation
    gl_PointSize *= ( 1.0 / - viewPosition.z);

    // Color
    vColor = color;
}
`;

export const fragmentShader = `
uniform vec3 uEdgeColor;
uniform vec3 uDustColor;
uniform float uBlackHoleSize;
uniform float uRadius;

varying vec3 vColor;
varying float vDistance;

void main()
{
    // Disc
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;
    strength = pow(strength, 5.0);

    // Black hole effect
    float normalizedDistance = vDistance / uRadius;
    float blackHoleRadius = 0.3 * uBlackHoleSize;  // Base size adjusted by parameter
    float blackHoleEdge = blackHoleRadius + 0.1;   // Edge slightly larger than hole
    float dustRadius = blackHoleRadius + 0.6;      // Dust extends further

    // Create intense glow at black hole edge
    float edgeGlow = smoothstep(blackHoleRadius, blackHoleEdge, normalizedDistance);
    edgeGlow *= (1.0 - smoothstep(blackHoleEdge, blackHoleEdge + 0.1, normalizedDistance));
    edgeGlow = pow(edgeGlow, 0.5);
    
    // Dust effect
    float dustStrength = smoothstep(blackHoleEdge, dustRadius, normalizedDistance);
    dustStrength *= (1.0 - smoothstep(dustRadius - 0.2, dustRadius + 0.2, normalizedDistance));

    // Edge glow color (bright purple/blue)
    vec3 edgeColor = uEdgeColor;
    
    // Dust color (more subtle)
    vec3 dustColor = uDustColor;
    
    // Combine effects
    vec3 finalColor = vColor;
    
    // Add edge glow
    finalColor = mix(finalColor, edgeColor, edgeGlow * 1.5);
    
    // Add dust
    finalColor = mix(finalColor, dustColor, dustStrength * 0.5);
    
    // Darken center of black hole
    float visibility = smoothstep(0.0, blackHoleRadius, vDistance);
    
    // Enhance the glow intensity near the black hole
    float glowIntensity = (1.0 - visibility) * 2.0;
    
    // Final color with enhanced glow
    vec3 color = mix(vec3(0.0), finalColor, strength * (visibility + edgeGlow));
    float alpha = strength * (visibility + edgeGlow * 1.5 + dustStrength * 0.5);
    
    gl_FragColor = vec4(color, alpha);
}
`;