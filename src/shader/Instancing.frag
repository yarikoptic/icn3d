$NGL_shaderTextHash['Instancing.frag'] = ["precision highp float;",
"",
"uniform float time;",
"",
"varying vec3 vNormal;",
"varying vec3 vColor;",
"",
"void main() {",
"//	gl_FragColor = vec4(vNormal, 1.0);",
"	gl_FragColor = vec4(vColor, 1.0);",
"}"
].join("\n");