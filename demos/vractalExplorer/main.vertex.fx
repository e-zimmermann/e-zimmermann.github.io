precision highp float;

// Attributes
attribute vec3 position;

// Uniforms
uniform mat4 worldViewProjection;
uniform mat4 world;

// Varying
out vec4 fragPosWorld;

void main(void) {
    // Assign screen position
    gl_Position = worldViewProjection * vec4(position, 1.0);

    // Here we get world coordinates of our plane
    fragPosWorld = world * vec4(position, 1.0);
}